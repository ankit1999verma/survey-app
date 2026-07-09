const mysql = require('mysql2/promise');

async function countRecords() {
  const connection = await mysql.createConnection({
    host: 'mydb-prepro.ch4ii2q46u6h.ap-south-1.rds.amazonaws.com',
    user: 'admin',
    password: 'Mumbaidb123',
    database: 'gpsurvey'
  });

  const [states] = await connection.query('SELECT COUNT(*) as count FROM state');
  const [districts] = await connection.query('SELECT COUNT(*) as count FROM district');
  const [blocks] = await connection.query('SELECT COUNT(*) as count FROM block');
  const [gps] = await connection.query('SELECT COUNT(*) as count FROM gram_panchayat');

  console.log(`States: ${states[0].count}`);
  console.log(`Districts: ${districts[0].count}`);
  console.log(`Blocks: ${blocks[0].count}`);
  console.log(`Gram Panchayats: ${gps[0].count}`);
  process.exit(0);
}

countRecords().catch(console.error);
