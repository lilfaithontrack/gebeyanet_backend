const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '123456789',
  database: 'gebyanet',
  multipleStatements: true
};

async function importSubcats() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected\n');

    // Read the subcats SQL file from Downloads
    const sqlPath = 'C:\\Users\\kalu4\\Downloads\\subcats.sql';
    console.log('📖 Reading SQL file:', sqlPath);
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error('subcats.sql not found in Downloads folder');
    }
    
    let sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Clear existing subcats
    console.log('🗑️  Clearing existing subcats...');
    await connection.query('DELETE FROM subcats');
    console.log('✅ Cleared\n');
    
    // Import subcats
    console.log('📥 Importing subcats...');
    await connection.query(sql);
    
    // Check count
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM subcats');
    console.log(`✅ Imported ${rows[0].count} subcategories\n`);
    
    // Show sample
    const [samples] = await connection.query('SELECT id, name, image FROM subcats LIMIT 5');
    console.log('📋 Sample subcategories:');
    samples.forEach(s => {
      console.log(`  - ${s.name} (ID: ${s.id}, Image: ${s.image})`);
    });
    
    console.log('\n✅ Import complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importSubcats();
