/**
 * Add Missing Columns to Products Table
 * Prepares table structure to match products.sql file
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMissingColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet'
  });

  try {
    console.log('🔧 Adding missing columns to products table...\n');

    // Add all missing columns from products.sql schema
    const columnsToAdd = [
      { name: 'color', sql: 'ADD COLUMN color VARCHAR(100) DEFAULT NULL AFTER title' },
      { name: 'size', sql: 'ADD COLUMN size VARCHAR(100) DEFAULT NULL AFTER color' },
      { name: 'seller_email', sql: 'ADD COLUMN seller_email VARCHAR(255) NOT NULL DEFAULT "admin@gebyanet.com" AFTER subcat' },
      { name: 'unit_of_measurement', sql: 'ADD COLUMN unit_of_measurement VARCHAR(50) DEFAULT NULL AFTER updated_at' },
      { name: 'sku', sql: 'ADD COLUMN sku VARCHAR(255) DEFAULT NULL AFTER location_prices' },
      { name: 'location_type', sql: 'ADD COLUMN location_type VARCHAR(20) NOT NULL DEFAULT "region" AFTER sku' }
    ];

    for (const column of columnsToAdd) {
      try {
        await connection.query(`ALTER TABLE products ${column.sql}`);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Column ${column.name} already exists`);
        } else {
          console.log(`❌ Error adding ${column.name}: ${error.message}`);
        }
      }
    }

    console.log('\n📊 Current table structure:\n');
    const [columns] = await connection.query('DESCRIBE products');
    console.table(columns.map(c => ({ 
      Field: c.Field, 
      Type: c.Type.substring(0, 30), 
      Null: c.Null 
    })));

    console.log('\n✅ Table structure updated! Ready to import products.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addMissingColumns();
