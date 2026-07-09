const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const { Survey } = require('../models');

// POST /api/survey/sync  — receive array from mobile, upsert by uuid
router.post('/sync', async (req, res) => {
  try {
    const surveys = Array.isArray(req.body) ? req.body : [req.body];
    if (!surveys.length) return res.status(400).json({ error: 'Empty payload' });

    const synced = [];
    const errors = [];

    for (const s of surveys) {
      try {
        if (!s.uuid) throw new Error('Missing uuid');
        await Survey.upsert({ ...s, syncedAt: new Date() });
        synced.push(s.uuid);
      } catch (err) {
        errors.push({ uuid: s.uuid, error: err.message });
      }
    }

    res.status(201).json({ message: `Processed ${surveys.length} surveys`, synced, errors });
  } catch (err) {
    console.error('Survey sync error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Backward compat
router.post('/submit', async (req, res) => {
  const surveys = Array.isArray(req.body) ? req.body : [req.body];
  const synced = [];
  const errors = [];
  for (const s of surveys) {
    try {
      await Survey.upsert({ ...s, syncedAt: new Date() });
      synced.push(s.uuid);
    } catch (err) {
      errors.push({ uuid: s.uuid, error: err.message });
    }
  }
  res.status(201).json({ message: `Processed ${surveys.length} surveys`, synced, errors });
});

// GET /api/survey/list — with optional filters
router.get('/list', async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const surveys = await Survey.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/survey/count — quick stats for admin
router.get('/count', async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const total = await Survey.count({ where });
    const synced = await Survey.count({ where: { ...where, surveyDone: 'YES' } });
    const draft  = await Survey.count({ where: { ...where, surveyDone: 'DRAFT' } });
    res.json({ total, synced, draft });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/survey/export — Filtered + professionally styled ExcelJS
router.get('/export', async (req, res) => {
  try {
    const where = buildWhere(req.query);
    const surveys = await Survey.findAll({ where, order: [['createdAt', 'DESC']] });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'GP Survey App';
    const ws = wb.addWorksheet('GP Survey Data', {
      views: [{ state: 'frozen', ySplit: 2, xSplit: 0 }]
    });

    // ── Columns Definition ──────────────────────────────────────────────────
    ws.columns = [
      { header: 'Sr. No.', key: 'srNo', width: 8 },
      { header: 'State/UT', key: 'stateName', width: 16 },
      { header: 'District', key: 'districtName', width: 18 },
      { header: 'Block', key: 'blockName', width: 18 },
      { header: 'Gram Panchayat Code', key: 'gramPanchayatCode', width: 22 },
      { header: 'Gram Panchayat', key: 'gramPanchayatName', width: 28 },
      { header: 'Block Code', key: 'blockCode', width: 14 },
      { header: 'GP Covered', key: 'phase', width: 14 },
      { header: 'Survey vendor Name', key: 'surveyVendor', width: 22 },
      { header: 'Survey Date', key: 'surveyDate', width: 16 },
      { header: 'GP survey done (Yes/No)', key: 'surveyDone', width: 24 },
      { header: 'Remarks', key: 'remarks', width: 35 },
      
      { header: 'GP Original Location(GP Bhawan/School/Others)', key: 'origLocationType', width: 40 },
      { header: 'Infra Status of Original Location', key: 'origInfraStatus', width: 30 },
      { header: 'GP Original Location Electrict_Supply_Availability', key: 'origElectricity', width: 40 },
      { header: 'GP Original Location Availability_Of_Power_Supply_Hours', key: 'origPowerHours', width: 40 },
      { header: 'GP Original Location Solar available Y/N', key: 'origSolar', width: 35 },
      { header: 'GP Original Location Earthing available Y/N', key: 'origEarthing', width: 35 },
      { header: 'GP Original Location lat. Long.', key: 'origLatLong', width: 30 },
      
      { header: 'Current Location', key: 'currentLocation', width: 30 },
      { header: 'Permanent or Temporary', key: 'currentPermTemp', width: 25 },
      { header: 'GP Current Location lat. Long.', key: 'currentLatLong', width: 30 },
      
      { header: 'GP Bhawan available(in case of Equipment not installed in GP) (Y/N)', key: 'gpBhawanAvailable', width: 60 },
      { header: 'Infra status of GP Bhawan', key: 'gpBhawanInfraStatus', width: 30 },
      { header: 'Energy_Meter_Installed In GP Bhawan(Y/N)', key: 'gpBhawanEnergyMeter', width: 35 },
      { header: 'Earthing available Y/N', key: 'gpBhawanEarthing', width: 25 },
      { header: 'Solar available Y/N', key: 'gpBhawanSolar', width: 20 },
      { header: 'GP Bhawan Location Lat/Long.', key: 'gpBhawanLatLong', width: 30 },
      
      { header: 'New Proposed Building(School, GP Bhawan etc.) In Case of Original Location Not Applicable For Equipments Installation', key: 'proposedBuilding', width: 80 },
      { header: 'Rack_Space_Available', key: 'proposedRackSpace', width: 22 },
      { header: 'New Proposed Building Lat/Long', key: 'proposedLatLong', width: 35 },
      { header: 'Energy_Meter_Installed In GP Bhawan(Y/N).1', key: 'proposedEnergyMeter', width: 40 },
      { header: 'Earthing available Y/N.1', key: 'proposedEarthing', width: 25 },
      { header: 'Solar available Y/N.1', key: 'proposedSolar', width: 22 },
      { header: 'POLE LENGTH', key: 'proposedPoleLength', width: 16 },
      { header: 'POLE LATLONG', key: 'proposedPoleLatLong', width: 30 },
      { header: 'Remarks(New Proposed Building)', key: 'proposedRemarks', width: 35 },
      
      { header: 'Sarpanch Name', key: 'sarpanchName', width: 25 },
      { header: 'Sarpanch Contact Number', key: 'sarpanchContact', width: 25 }
    ];

    // ── Super Header (Row 1) ────────────────────────────────────────────────
    ws.spliceRows(1, 0, []);
    ws.mergeCells('A1:L1'); ws.getCell('A1').value = 'GENERAL INFORMATION';
    ws.mergeCells('M1:S1'); ws.getCell('M1').value = 'ORIGINAL LOCATION';
    ws.mergeCells('T1:V1'); ws.getCell('T1').value = 'CURRENT LOCATION';
    ws.mergeCells('W1:AB1'); ws.getCell('W1').value = 'GP BHAWAN DETAILS (IF APPLICABLE)';
    ws.mergeCells('AC1:AK1'); ws.getCell('AC1').value = 'NEW PROPOSED BUILDING (IF APPLICABLE)';
    ws.mergeCells('AL1:AM1'); ws.getCell('AL1').value = 'SARPANCH CONTACT INFO';

    const getCategoryColor = (colIdx) => {
      if (colIdx <= 12) return 'FF1E3A8A'; // Blue
      if (colIdx <= 19) return 'FF14532D'; // Green
      if (colIdx <= 22) return 'FF581C87'; // Purple
      if (colIdx <= 28) return 'FF7C2D12'; // Orange
      if (colIdx <= 37) return 'FF134E4A'; // Teal
      return 'FF312E81'; // Indigo
    };

    ws.getRow(1).height = 30;
    ws.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: getCategoryColor(colNumber) } };
      cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF475569' } }, bottom: { style: 'thin', color: { argb: 'FF475569' } },
        left: { style: 'thin', color: { argb: 'FF475569' } }, right: { style: 'thin', color: { argb: 'FF475569' } }
      };
    });

    // ── Sub Header Styling (Row 2) ──────────────────────────────────────────
    ws.getRow(2).height = 40;
    ws.getRow(2).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: getCategoryColor(colNumber) }
      };
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' } // White
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFAAAAAA' } },
        bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
        left: { style: 'thin', color: { argb: 'FFAAAAAA' } },
        right: { style: 'thin', color: { argb: 'FFAAAAAA' } }
      };
    });

    // ── Add Data ────────────────────────────────────────────────────────────
    surveys.forEach((s, i) => {
      const row = ws.addRow({
        srNo: i + 1,
        stateName: s.stateName || '',
        districtName: s.districtName || '',
        blockName: s.blockName || '',
        gramPanchayatCode: s.gramPanchayatCode || '',
        gramPanchayatName: s.gramPanchayatName || '',
        blockCode: '',
        phase: s.phase || '',
        surveyVendor: s.surveyVendor || '',
        surveyDate: s.surveyDate || '',
        surveyDone: s.surveyDone === 'DRAFT' ? 'DRAFT' : (s.surveyDone || ''),
        remarks: s.remarks || '',
        
        origLocationType: s.origLocationType || '',
        origInfraStatus: s.origInfraStatus || '',
        origElectricity: s.origElectricity || '',
        origPowerHours: s.origPowerHours || '',
        origSolar: s.origSolar || '',
        origEarthing: s.origEarthing || '',
        origLatLong: s.origLat && s.origLong ? `${s.origLat} ${s.origLong}` : '',
        
        currentLocation: s.currentLocation || '',
        currentPermTemp: s.currentPermTemp || '',
        currentLatLong: s.currentLat && s.currentLong ? `${s.currentLat} ${s.currentLong}` : '',
        
        gpBhawanAvailable: s.gpBhawanAvailable || '',
        gpBhawanInfraStatus: s.gpBhawanInfraStatus || '',
        gpBhawanEnergyMeter: s.gpBhawanEnergyMeter || '',
        gpBhawanEarthing: s.gpBhawanEarthing || '',
        gpBhawanSolar: s.gpBhawanSolar || '',
        gpBhawanLatLong: s.gpBhawanLat && s.gpBhawanLong ? `${s.gpBhawanLat} ${s.gpBhawanLong}` : '',
        
        proposedBuilding: s.proposedBuilding || '',
        proposedRackSpace: s.proposedRackSpace || '',
        proposedLatLong: s.proposedLat && s.proposedLong ? `${s.proposedLat} ${s.proposedLong}` : '',
        proposedEnergyMeter: s.proposedEnergyMeter || '',
        proposedEarthing: s.proposedEarthing || '',
        proposedSolar: s.proposedSolar || '',
        proposedPoleLength: s.proposedPoleLength || '',
        proposedPoleLatLong: s.proposedPoleLat && s.proposedPoleLong ? `${s.proposedPoleLat} ${s.proposedPoleLong}` : '',
        proposedRemarks: s.proposedRemarks || '',
        
        sarpanchName: s.sarpanchName || '',
        sarpanchContact: s.sarpanchContact || ''
      });

      // Style row cells
      row.height = 25;
      const isEven = (i % 2 === 0);
      row.eachCell((cell, colNumber) => {
        // Base fill (alternating rows)
        let fillArg = isEven ? 'FFEBF3FB' : 'FFFFFFFF'; // Light blue : White
        
        // Status highlighting
        if (colNumber === 11) { // 'surveyDone' is column 11
          const val = String(cell.value || '').toUpperCase();
          if (val === 'YES') fillArg = 'FFD4EDDA'; // Green
          if (val === 'DRAFT') fillArg = 'FFFFF3CD'; // Yellow
          if (val === 'NO') fillArg = 'FFF8D7DA'; // Red
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
        } else {
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
        }

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArg } };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFAAAAAA' } },
          bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
          left: { style: 'thin', color: { argb: 'FFAAAAAA' } },
          right: { style: 'thin', color: { argb: 'FFAAAAAA' } }
        };
      });
    });

    const filename = `GP_Survey_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('X-Row-Count', surveys.length);
    
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Survey export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildWhere(query) {
  const where = {};
  if (query.stateId)    where.stateId    = query.stateId;
  if (query.districtId) where.districtId = query.districtId;
  if (query.blockId)    where.blockId    = query.blockId;
  if (query.surveyDone) where.surveyDone = query.surveyDone;
  if (query.dateFrom || query.dateTo) {
    where.surveyDate = {};
    if (query.dateFrom) where.surveyDate[Op.gte] = query.dateFrom;
    if (query.dateTo)   where.surveyDate[Op.lte] = query.dateTo;
  }
  return where;
}

module.exports = router;
