import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db = null;

export async function getDB() {
  if (Platform.OS === 'web') throw new Error('SQLite not supported on Web');
  if (!db) {
    db = await SQLite.openDatabaseAsync('gp_survey.db');
    await initSchema();
  }
  return db;
}

async function initSchema() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,

      -- Meta / GP Identity
      stateId   INTEGER, stateName   TEXT,
      districtId INTEGER, districtName TEXT,
      blockId   INTEGER, blockName   TEXT,
      gramPanchayatId INTEGER, gramPanchayatName TEXT,
      gramPanchayatCode TEXT,
      phase TEXT,
      surveyVendor TEXT,
      surveyDate TEXT,
      surveyDone TEXT DEFAULT 'YES',
      remarks TEXT,

      -- Section A: Original Location
      origLocationType  TEXT,
      origInfraStatus   TEXT,
      origElectricity   TEXT,
      origPowerHours    TEXT,
      origSolar         TEXT,
      origEarthing      TEXT,
      origLat           REAL,
      origLong          REAL,

      -- Section B: Current Location
      currentLocation   TEXT,
      currentPermTemp   TEXT,
      currentLat        REAL,
      currentLong       REAL,

      -- Section C: GP Bhawan
      gpBhawanAvailable   TEXT,
      gpBhawanInfraStatus TEXT,
      gpBhawanEnergyMeter TEXT,
      gpBhawanEarthing    TEXT,
      gpBhawanSolar       TEXT,
      gpBhawanLat         REAL,
      gpBhawanLong        REAL,

      -- Section D: Proposed Location
      proposedBuilding    TEXT,
      proposedRackSpace   TEXT,
      proposedLat         REAL,
      proposedLong        REAL,
      proposedEnergyMeter TEXT,
      proposedEarthing    TEXT,
      proposedSolar       TEXT,
      proposedPoleLength  TEXT,
      proposedPoleLat     REAL,
      proposedPoleLong    REAL,
      proposedRemarks     TEXT,

      -- Sarpanch
      sarpanchName    TEXT,
      sarpanchContact TEXT,

      -- Photo
      photoBase64     TEXT,

      -- Sync tracking
      synced    INTEGER DEFAULT 0,
      syncedAt  TEXT,
      userId    INTEGER,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS master_data (
      key   TEXT PRIMARY KEY,
      value TEXT,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);
}

// ── Survey CRUD ───────────────────────────────────────────────────────────────

const isWeb = Platform.OS === 'web';

export async function insertSurvey(survey) {
  if (isWeb) {
    const data = JSON.parse(localStorage.getItem('surveys') || '[]');
    const existing = data.findIndex(s => s.uuid === survey.uuid);
    survey.createdAt = survey.createdAt || new Date().toISOString();
    if (existing >= 0) data[existing] = survey;
    else data.push(survey);
    localStorage.setItem('surveys', JSON.stringify(data));
    return;
  }
  const d = await getDB();
  const result = await d.runAsync(
    `INSERT OR REPLACE INTO surveys (
      uuid, stateId, stateName, districtId, districtName, blockId, blockName,
      gramPanchayatId, gramPanchayatName, gramPanchayatCode,
      phase, surveyVendor, surveyDate, surveyDone, remarks,
      origLocationType, origInfraStatus, origElectricity, origPowerHours, origSolar, origEarthing, origLat, origLong,
      currentLocation, currentPermTemp, currentLat, currentLong,
      gpBhawanAvailable, gpBhawanInfraStatus, gpBhawanEnergyMeter, gpBhawanEarthing, gpBhawanSolar, gpBhawanLat, gpBhawanLong,
      proposedBuilding, proposedRackSpace, proposedLat, proposedLong,
      proposedEnergyMeter, proposedEarthing, proposedSolar, proposedPoleLength, proposedPoleLat, proposedPoleLong, proposedRemarks,
      sarpanchName, sarpanchContact, photoBase64, userId
    ) VALUES (
      $uuid, $stateId, $stateName, $districtId, $districtName, $blockId, $blockName,
      $gramPanchayatId, $gramPanchayatName, $gramPanchayatCode,
      $phase, $surveyVendor, $surveyDate, $surveyDone, $remarks,
      $origLocationType, $origInfraStatus, $origElectricity, $origPowerHours, $origSolar, $origEarthing, $origLat, $origLong,
      $currentLocation, $currentPermTemp, $currentLat, $currentLong,
      $gpBhawanAvailable, $gpBhawanInfraStatus, $gpBhawanEnergyMeter, $gpBhawanEarthing, $gpBhawanSolar, $gpBhawanLat, $gpBhawanLong,
      $proposedBuilding, $proposedRackSpace, $proposedLat, $proposedLong,
      $proposedEnergyMeter, $proposedEarthing, $proposedSolar, $proposedPoleLength, $proposedPoleLat, $proposedPoleLong, $proposedRemarks,
      $sarpanchName, $sarpanchContact, $photoBase64, $userId
    )`,
    {
      $uuid: survey.uuid,
      $stateId: survey.stateId ?? null, $stateName: survey.stateName ?? null,
      $districtId: survey.districtId ?? null, $districtName: survey.districtName ?? null,
      $blockId: survey.blockId ?? null, $blockName: survey.blockName ?? null,
      $gramPanchayatId: survey.gramPanchayatId ?? null, $gramPanchayatName: survey.gramPanchayatName ?? null,
      $gramPanchayatCode: survey.gramPanchayatCode ?? null,
      $phase: survey.phase ?? null, $surveyVendor: survey.surveyVendor ?? null,
      $surveyDate: survey.surveyDate ?? null, $surveyDone: survey.surveyDone ?? 'YES',
      $remarks: survey.remarks ?? null,
      $origLocationType: survey.origLocationType ?? null, $origInfraStatus: survey.origInfraStatus ?? null,
      $origElectricity: survey.origElectricity ?? null, $origPowerHours: survey.origPowerHours ?? null,
      $origSolar: survey.origSolar ?? null, $origEarthing: survey.origEarthing ?? null,
      $origLat: survey.origLat ?? null, $origLong: survey.origLong ?? null,
      $currentLocation: survey.currentLocation ?? null, $currentPermTemp: survey.currentPermTemp ?? null,
      $currentLat: survey.currentLat ?? null, $currentLong: survey.currentLong ?? null,
      $gpBhawanAvailable: survey.gpBhawanAvailable ?? null, $gpBhawanInfraStatus: survey.gpBhawanInfraStatus ?? null,
      $gpBhawanEnergyMeter: survey.gpBhawanEnergyMeter ?? null, $gpBhawanEarthing: survey.gpBhawanEarthing ?? null,
      $gpBhawanSolar: survey.gpBhawanSolar ?? null, $gpBhawanLat: survey.gpBhawanLat ?? null,
      $gpBhawanLong: survey.gpBhawanLong ?? null,
      $proposedBuilding: survey.proposedBuilding ?? null, $proposedRackSpace: survey.proposedRackSpace ?? null,
      $proposedLat: survey.proposedLat ?? null, $proposedLong: survey.proposedLong ?? null,
      $proposedEnergyMeter: survey.proposedEnergyMeter ?? null, $proposedEarthing: survey.proposedEarthing ?? null,
      $proposedSolar: survey.proposedSolar ?? null, $proposedPoleLength: survey.proposedPoleLength ?? null,
      $proposedPoleLat: survey.proposedPoleLat ?? null, $proposedPoleLong: survey.proposedPoleLong ?? null,
      $proposedRemarks: survey.proposedRemarks ?? null,
      $sarpanchName: survey.sarpanchName ?? null, $sarpanchContact: survey.sarpanchContact ?? null,
      $photoBase64: survey.photoBase64 ?? null,
      $userId: survey.userId ?? null,
    }
  );
  return result;
}

export async function getUnsyncedSurveys() {
  if (isWeb) {
    const data = JSON.parse(localStorage.getItem('surveys') || '[]');
    return data.filter(s => s.synced === 0).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  const d = await getDB();
  return d.getAllAsync('SELECT * FROM surveys WHERE synced = 0 ORDER BY createdAt ASC');
}

export async function getAllSurveys() {
  if (isWeb) {
    const data = JSON.parse(localStorage.getItem('surveys') || '[]');
    return data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  const d = await getDB();
  return d.getAllAsync('SELECT * FROM surveys ORDER BY createdAt DESC');
}

export async function markSynced(uuids) {
  if (!uuids.length) return;
  if (isWeb) {
    const data = JSON.parse(localStorage.getItem('surveys') || '[]');
    const now = new Date().toISOString();
    data.forEach(s => {
      if (uuids.includes(s.uuid)) {
        s.synced = 1;
        s.syncedAt = now;
      }
    });
    localStorage.setItem('surveys', JSON.stringify(data));
    return;
  }
  const d = await getDB();
  const placeholders = uuids.map(() => '?').join(',');
  await d.runAsync(
    `UPDATE surveys SET synced = 1, syncedAt = datetime('now') WHERE uuid IN (${placeholders})`,
    uuids
  );
}

export async function getSurveyCounts() {
  if (isWeb) {
    const data = JSON.parse(localStorage.getItem('surveys') || '[]');
    return { total: data.length, unsynced: data.filter(s => s.synced === 0).length };
  }
  const d = await getDB();
  const [total, unsynced] = await Promise.all([
    d.getFirstAsync('SELECT COUNT(*) as count FROM surveys'),
    d.getFirstAsync('SELECT COUNT(*) as count FROM surveys WHERE synced = 0'),
  ]);
  return { total: total?.count ?? 0, unsynced: unsynced?.count ?? 0 };
}

// ── Master data ───────────────────────────────────────────────────────────────

export async function saveMasterData(data) {
  if (isWeb) {
    localStorage.setItem('master_data', JSON.stringify(data));
    return;
  }
  const d = await getDB();
  await d.runAsync(
    `INSERT OR REPLACE INTO master_data (key, value, updatedAt) VALUES (?, ?, datetime('now'))`,
    ['master', JSON.stringify(data)]
  );
}

export async function loadMasterData() {
  if (isWeb) {
    const data = localStorage.getItem('master_data');
    return data ? JSON.parse(data) : null;
  }
  const d = await getDB();
  const row = await d.getFirstAsync(`SELECT value FROM master_data WHERE key = 'master'`);
  return row ? JSON.parse(row.value) : null;
}
