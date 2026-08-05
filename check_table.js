const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet'
  });

  console.log('Current table structure:\n');
  const [columns] = await connection.query('DESCRIBE products');
  console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Default: c.Default })));
  
  await connection.end();
}

checkTable().catch(console.error);
