const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const { Survey, State, District, Block, GramPanchayat, User } = require('../models');

// Submit surveys (supports bulk array for offline sync)
router.post('/submit', async (req, res) => {
  try {
    const surveys = Array.isArray(req.body) ? req.body : [req.body];
    
    if (surveys.length === 0) {
      return res.status(400).json({ error: 'No surveys provided' });
    }

    const createdSurveys = [];
    const errors = [];

    for (const surveyData of surveys) {
      try {
        // Find existing by uuid to avoid duplicates during sync retries
        let survey = await Survey.findOne({ where: { uuid: surveyData.uuid } });
        
        if (!survey) {
          survey = await Survey.create(surveyData);
        }
        
        createdSurveys.push(survey);
      } catch (err) {
        errors.push({ uuid: surveyData.uuid, error: err.message });
      }
    }

    res.status(201).json({
      message: `Processed ${surveys.length} surveys`,
      successCount: createdSurveys.length,
      errorCount: errors.length,
      errors
    });
  } catch (error) {
    console.error('Survey submit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all surveys
router.get('/list', async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      include: [
        { model: State, attributes: ['name'] },
        { model: District, attributes: ['name'] },
        { model: Block, attributes: ['name'] },
        { model: GramPanchayat, attributes: ['name'] },
        { model: User, attributes: ['name', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(surveys);
  } catch (error) {
    console.error('Survey list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export surveys to Excel
router.get('/export', async (req, res) => {
  try {
    const surveys = await Survey.findAll({
      include: [
        { model: State, attributes: ['name'] },
        { model: District, attributes: ['name'] },
        { model: Block, attributes: ['name'] },
        { model: GramPanchayat, attributes: ['name'] },
        { model: User, attributes: ['name', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Flatten data for Excel
    const data = surveys.map(s => {
      const flat = {
        'Survey ID': s.uuid,
        'Respondent Name': s.respondentName,
        'Age': s.age,
        'Gender': s.gender,
        'Contact': s.contact,
        'State': s.State ? s.State.name : '',
        'District': s.District ? s.District.name : '',
        'Block': s.Block ? s.Block.name : '',
        'Gram Panchayat': s.GramPanchayat ? s.GramPanchayat.name : '',
        'Surveyor': s.User ? s.User.name : '',
        'Latitude': s.latitude,
        'Longitude': s.longitude,
        'Submission Date': s.createdAt,
      };

      // Add dynamic responses if available
      if (s.responses) {
        Object.keys(s.responses).forEach(key => {
          flat[`Resp: ${key}`] = s.responses[key];
        });
      }

      return flat;
    });

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Surveys');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Surveys_Export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Survey export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
