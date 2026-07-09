const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seed() {
  console.log("Connecting to RDS with connection pool...");
  const connection = mysql.createPool({
    host: 'mydb-prepro.ch4ii2q46u6h.ap-south-1.rds.amazonaws.com',
    user: 'admin',
    password: 'Mumbaidb123',
    database: 'gpsurvey',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });


  const stateMap = {};
  const districtMap = {};
  const blockMap = {};

  // Pre-fill maps from existing DB data (INSERT IGNORE will skip duplicates)
  const [existingStates] = await connection.query('SELECT id, name FROM state');
  for (const r of existingStates) stateMap[r.name.toUpperCase()] = r.id;

  const [existingDistricts] = await connection.query('SELECT d.id, d.name, s.name as state_name FROM district d JOIN state s ON d.state_id=s.id');
  for (const r of existingDistricts) districtMap[`${r.state_name.toUpperCase()}|${r.name.toUpperCase()}`] = r.id;

  const [existingBlocks] = await connection.query('SELECT b.id, b.name, d.name as district_name, s.name as state_name FROM block b JOIN district d ON b.district_id=d.id JOIN state s ON d.state_id=s.id');
  for (const r of existingBlocks) blockMap[`${r.state_name.toUpperCase()}|${r.district_name.toUpperCase()}|${r.name.toUpperCase()}`] = r.id;

  const BATCH_SIZE = 500;
  const blocksCSV = path.join(__dirname, '../data/lgd-blocks.csv');
  const gpsCSV = path.join(__dirname, '../data/lgd-gps.csv');

  async function importFromCSV(filePath, type) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    let count = 0;
    let batch = [];

    const flushBatch = async () => {
      if (batch.length === 0) return;
      if (type === 'blocks') {
        const values = batch.map(b => [b.name, b.distId]);
        await connection.query('INSERT IGNORE INTO block (name, district_id) VALUES ?', [values]);
      } else if (type === 'gps') {
        const values = batch.map(b => [b.name, b.code, b.blockId]);
        await connection.query('INSERT IGNORE INTO gram_panchayat (name, code, block_id) VALUES ?', [values]);
      }
      count += batch.length;
      process.stdout.write(`  ${count} records...\r`);
      batch = [];
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
      const row = {};
      header.forEach((h, idx) => { row[h] = cols[idx]; });

      const stateNameUpper = row.state_name?.toUpperCase();
      const distNameUpper = row.district_name?.toUpperCase();
      const blockNameUpper = row.block_name?.toUpperCase();

      if (!stateNameUpper || !distNameUpper) continue;

      // Ensure state exists
      let stateId = stateMap[stateNameUpper];
      if (!stateId) {
        const [r] = await connection.query('INSERT IGNORE INTO state (name) VALUES (?)', [row.state_name]);
        stateId = r.insertId || await (async () => {
          const [rows] = await connection.query('SELECT id FROM state WHERE name=?', [row.state_name]);
          return rows[0]?.id;
        })();
        stateMap[stateNameUpper] = stateId;
      }

      // Ensure district exists
      const distKey = `${stateNameUpper}|${distNameUpper}`;
      let distId = districtMap[distKey];
      if (!distId) {
        const [r] = await connection.query('INSERT IGNORE INTO district (name, state_id) VALUES (?, ?)', [row.district_name, stateId]);
        distId = r.insertId || await (async () => {
          const [rows] = await connection.query('SELECT id FROM district WHERE name=? AND state_id=?', [row.district_name, stateId]);
          return rows[0]?.id;
        })();
        districtMap[distKey] = distId;
      }

      if (type === 'blocks') {
        if (!blockNameUpper) continue;
        batch.push({ name: row.block_name, distId, key: `${stateNameUpper}|${distNameUpper}|${blockNameUpper}` });
      } else if (type === 'gps') {
        const blockId = blockMap[`${stateNameUpper}|${distNameUpper}|${blockNameUpper}`];
        if (!blockId) continue;
        batch.push({ name: row.gp_name, code: row.gp_code, blockId });
      }

      if (batch.length >= BATCH_SIZE) await flushBatch();
    }
    await flushBatch();
    return count;
  }

  if (!fs.existsSync(blocksCSV)) { console.error('lgd-blocks.csv not found!'); process.exit(1); }
  if (!fs.existsSync(gpsCSV))    { console.error('lgd-gps.csv not found!');    process.exit(1); }

  console.log('\nImporting blocks from CSV (batched 500)...');
  const blockCount = await importFromCSV(blocksCSV, 'blocks');
  console.log(`\nBlocks done: ${blockCount}`);

  // Reload ALL block IDs from DB in one query before GP phase
  console.log('Loading block IDs from DB...');
  const [allBlocks] = await connection.query(
    'SELECT b.id, b.name, d.name as district_name, s.name as state_name FROM block b JOIN district d ON b.district_id=d.id JOIN state s ON d.state_id=s.id'
  );
  for (const r of allBlocks) blockMap[`${r.state_name.toUpperCase()}|${r.district_name.toUpperCase()}|${r.name.toUpperCase()}`] = r.id;
  console.log(`Loaded ${allBlocks.length} blocks into map.`);

  console.log('\nImporting GPs from CSV (batched 500)...');
  const gpCount = await importFromCSV(gpsCSV, 'gps');
  console.log(`\nGPs done: ${gpCount}`);

  console.log('\nDone!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
