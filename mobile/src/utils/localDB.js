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

export async function clearMasterData() {
  if (Platform.OS === 'web') {
    await removeWebItem('master_data');
    return;
  }
  const d = await getDB();
  await d.execAsync(`
    DELETE FROM master_states;
    DELETE FROM master_districts;
    DELETE FROM master_blocks;
    DELETE FROM master_gps;
    DELETE FROM master_data;
  `);
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

    -- Normalized master data tables (replaces JSON blob)
    CREATE TABLE IF NOT EXISTS master_states (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS master_districts (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      stateId INTEGER
    );
    CREATE TABLE IF NOT EXISTS master_blocks (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      districtId INTEGER
    );
    CREATE TABLE IF NOT EXISTS master_gps (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      blockId INTEGER
    );

    -- Keep old table for backward compat during migration
    CREATE TABLE IF NOT EXISTS master_data (
      key   TEXT PRIMARY KEY,
      value TEXT,
      updatedAt TEXT DEFAULT (datetime('now'))
    );
  `);
}

// ── Survey CRUD ───────────────────────────────────────────────────────────────

const isWeb = Platform.OS === 'web';

// --- Web IndexedDB Helpers ---
async function getWebDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gp_survey_web', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getWebItem(key) {
  const db = await getWebDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readonly');
    const req = tx.objectStore('data').get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function setWebItem(key, val) {
  const db = await getWebDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    const req = tx.objectStore('data').put(val, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function removeWebItem(key) {
  const db = await getWebDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    const req = tx.objectStore('data').delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
// -----------------------------

export async function insertSurvey(survey) {
  if (isWeb) {
    const dataStr = await getWebItem('surveys');
    const data = dataStr ? JSON.parse(dataStr) : [];
    const existing = data.findIndex(s => s.uuid === survey.uuid);
    survey.createdAt = survey.createdAt || new Date().toISOString();
    if (existing >= 0) data[existing] = survey;
    else data.push(survey);
    await setWebItem('surveys', JSON.stringify(data));
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
    const dataStr = await getWebItem('surveys');
    const data = dataStr ? JSON.parse(dataStr) : [];
    return data.filter(s => s.synced === 0).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  const d = await getDB();
  return d.getAllAsync('SELECT * FROM surveys WHERE synced = 0 ORDER BY createdAt ASC');
}

export async function getAllSurveys() {
  if (isWeb) {
    const dataStr = await getWebItem('surveys');
    const data = dataStr ? JSON.parse(dataStr) : [];
    return data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  const d = await getDB();
  return d.getAllAsync('SELECT * FROM surveys ORDER BY createdAt DESC');
}

export async function markSynced(uuids) {
  if (!uuids.length) return;
  if (isWeb) {
    const dataStr = await getWebItem('surveys');
    const data = dataStr ? JSON.parse(dataStr) : [];
    const now = new Date().toISOString();
    data.forEach(s => {
      if (uuids.includes(s.uuid)) {
        s.synced = 1;
        s.syncedAt = now;
      }
    });
    await setWebItem('surveys', JSON.stringify(data));
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
    const dataStr = await getWebItem('surveys');
    const data = dataStr ? JSON.parse(dataStr) : [];
    return { total: data.length, unsynced: data.filter(s => s.synced === 0).length };
  }
  const d = await getDB();
  const [total, unsynced] = await Promise.all([
    d.getFirstAsync('SELECT COUNT(*) as count FROM surveys'),
    d.getFirstAsync('SELECT COUNT(*) as count FROM surveys WHERE synced = 0'),
  ]);
  return { total: total?.count ?? 0, unsynced: unsynced?.count ?? 0 };
}

export async function getLocalSurveyMaxDate() {
  if (isWeb) {
    const dataStr = await getWebItem('surveys');
    const data = dataStr ? JSON.parse(dataStr) : [];
    if (data.length === 0) return '1970-01-01T00:00:00';
    
    // find max createdAt
    const max = data.reduce((latest, current) => {
      const currentDate = current.createdAt ? new Date(current.createdAt).getTime() : 0;
      return currentDate > latest ? currentDate : latest;
    }, 0);
    return new Date(max).toISOString().split('Z')[0]; // Spring Boot LocalDateTime expects no Z by default
  }
  const d = await getDB();
  const max = await d.getFirstAsync('SELECT MAX(createdAt) as maxDate FROM surveys');
  return max?.maxDate || '1970-01-01T00:00:00';
}

// ── Master data (normalized tables) ──────────────────────────────────────────

/** Returns max IDs present locally — used for incremental sync */
export async function getLocalMasterMaxIds() {
  if (isWeb) {
    const data = await getWebItem('master_data');
    if (!data) return { stateMaxId: 0, districtMaxId: 0, blockMaxId: 0, gpMaxId: 0 };
    const parsed = JSON.parse(data);
    return {
      stateMaxId:    (parsed.states || []).reduce((max, s) => s.id > max ? s.id : max, 0),
      districtMaxId: (parsed.districts || []).reduce((max, d) => d.id > max ? d.id : max, 0),
      blockMaxId:    (parsed.blocks || []).reduce((max, b) => b.id > max ? b.id : max, 0),
      gpMaxId:       (parsed.gramPanchayats || []).reduce((max, g) => g.id > max ? g.id : max, 0),
    };
  }
  const d = await getDB();
  const [s, dist, b, gp] = await Promise.all([
    d.getFirstAsync('SELECT COALESCE(MAX(id),0) as maxId FROM master_states'),
    d.getFirstAsync('SELECT COALESCE(MAX(id),0) as maxId FROM master_districts'),
    d.getFirstAsync('SELECT COALESCE(MAX(id),0) as maxId FROM master_blocks'),
    d.getFirstAsync('SELECT COALESCE(MAX(id),0) as maxId FROM master_gps'),
  ]);
  return {
    stateMaxId:    s?.maxId    ?? 0,
    districtMaxId: dist?.maxId ?? 0,
    blockMaxId:    b?.maxId    ?? 0,
    gpMaxId:       gp?.maxId   ?? 0,
  };
}

// Mutex to prevent concurrent SQLite transactions
let isSavingChunk = false;
const saveQueue = [];

async function processSaveQueue() {
  if (isSavingChunk) return;
  isSavingChunk = true;
  while (saveQueue.length > 0) {
    const task = saveQueue.shift();
    try {
      await executeSaveChunk(task.data);
      task.resolve();
    } catch (e) {
      task.reject(e);
    }
  }
  isSavingChunk = false;
}

export async function saveMasterChunk(data) {
  if (isWeb) {
    return executeSaveChunk(data); // Web uses localStorage, safe to run concurrently
  }
  return new Promise((resolve, reject) => {
    saveQueue.push({ data, resolve, reject });
    processSaveQueue();
  });
}

/** Upsert a chunk of rows into normalized tables (Internal) */
async function executeSaveChunk({ states, districts, blocks, gramPanchayats }) {
  if (isWeb) {
    // Web: keep JSON blob approach for simplicity but use IndexedDB
    const dataStr = await getWebItem('master_data');
    const existing = dataStr ? JSON.parse(dataStr) : {states:[],districts:[],blocks:[],gramPanchayats:[]};
    const merge = (arr, items, key = 'id') => {
      const map = Object.fromEntries(arr.map(i => [i[key], i]));
      items.forEach(i => { map[i[key]] = i; });
      return Object.values(map);
    };
    existing.states         = merge(existing.states || [], states || []);
    existing.districts      = merge(existing.districts || [], districts || []);
    existing.blocks         = merge(existing.blocks || [], blocks || []);
    existing.gramPanchayats = merge(existing.gramPanchayats || [], gramPanchayats || []);
    await setWebItem('master_data', JSON.stringify(existing));
    return;
  }

  const d = await getDB();
  await d.withTransactionAsync(async () => {
    if (states?.length) {
      const stmt = await d.prepareAsync('INSERT OR REPLACE INTO master_states (id, name) VALUES (?,?)');
      try {
        for (const row of states) await stmt.executeAsync([row.id, row.name]);
      } finally { await stmt.finalizeAsync(); }
    }
    
    if (districts?.length) {
      const stmt = await d.prepareAsync('INSERT OR REPLACE INTO master_districts (id, name, stateId) VALUES (?,?,?)');
      try {
        for (const row of districts) await stmt.executeAsync([row.id, row.name, row.state?.id ?? row.stateId]);
      } finally { await stmt.finalizeAsync(); }
    }

    if (blocks?.length) {
      const stmt = await d.prepareAsync('INSERT OR REPLACE INTO master_blocks (id, name, districtId) VALUES (?,?,?)');
      try {
        for (const row of blocks) await stmt.executeAsync([row.id, row.name, row.district?.id ?? row.districtId]);
      } finally { await stmt.finalizeAsync(); }
    }

    if (gramPanchayats?.length) {
      const stmt = await d.prepareAsync('INSERT OR REPLACE INTO master_gps (id, name, code, blockId) VALUES (?,?,?,?)');
      try {
        for (const row of gramPanchayats) await stmt.executeAsync([row.id, row.name, row.code, row.block?.id ?? row.blockId]);
      } finally { await stmt.finalizeAsync(); }
    }
  });
}

/** Load all master data from normalized tables */
export async function loadMasterData() {
  if (isWeb) {
    const data = await getWebItem('master_data');
    return data ? JSON.parse(data) : null;
  }
  const d = await getDB();
  const [states, districts, blocks, gramPanchayats] = await Promise.all([
    d.getAllAsync('SELECT * FROM master_states'),
    d.getAllAsync('SELECT * FROM master_districts'),
    d.getAllAsync('SELECT * FROM master_blocks'),
    d.getAllAsync('SELECT * FROM master_gps'),
  ]);
  if (!states.length && !blocks.length) return null;
  return { states, districts, blocks, gramPanchayats };
}

/** Legacy — kept for backward compat, now delegates to saveMasterChunk */
export async function saveMasterData(data) {
  return saveMasterChunk(data);
}
