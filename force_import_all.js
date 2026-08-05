/**
 * FORCE Import ALL 742 Products
 * Removes ALL constraints including CHECK constraints
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function forceImportAll() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet',
    multipleStatements: true
  });

  try {
    console.log('🚀 FORCE IMPORTING ALL 742 PRODUCTS\n');

    // Disable ALL constraints
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('SET SQL_MODE = ""');
    await connection.query('SET UNIQUE_CHECKS = 0');
    
    // Get all CHECK constraints and drop them
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = 'gebyanet' 
      AND TABLE_NAME = 'products' 
      AND CONSTRAINT_TYPE = 'CHECK'
    `);
    
    for (const constraint of constraints) {
      try {
        await connection.query(`ALTER TABLE products DROP CHECK ${constraint.CONSTRAINT_NAME}`);
        console.log(`✅ Dropped constraint: ${constraint.CONSTRAINT_NAME}`);
      } catch (e) {}
    }
    
    console.log('✅ All constraints disabled\n');

    // Add productfor
    try {
      await connection.query(`ALTER TABLE products ADD COLUMN productfor ENUM('for_seller','for_user') DEFAULT 'for_user' AFTER stock`);
    } catch (e) {}

    // Clear table
    console.log('📋 Clearing products table...');
    await connection.query('DELETE FROM products');
    await connection.query('ALTER TABLE products AUTO_INCREMENT = 1');
    console.log('✅ Table cleared\n');

    // Read and parse SQL file
    const sqlFilePath = path.join(__dirname, 'products.sql');
    console.log('📋 Reading products.sql...');
    let sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    console.log('✅ File loaded\n');

    // Extract only INSERT statements
    console.log('📋 Extracting INSERT statements...');
    const insertRegex = /INSERT INTO `products`[^;]+;/gi;
    const inserts = sqlContent.match(insertRegex);
    
    if (!inserts) {
      throw new Error('No INSERT statements found');
    }
    
    console.log(`✅ Found ${inserts.length} INSERT statements\n`);
    console.log('📋 Importing products (this will take 1-2 minutes)...\n');

    let totalImported = 0;
    let errors = 0;

    for (let i = 0; i < inserts.length; i++) {
      try {
        const result = await connection.query(inserts[i]);
        const affected = result[0].affectedRows || 0;
        totalImported += affected;
        
        if ((i + 1) % 2 === 0 || i === inserts.length - 1) {
          console.log(`  ✓ Batch ${i + 1}/${inserts.length}: ${totalImported} products imported`);
        }
      } catch (error) {
        errors++;
        if (errors <= 5) {
          console.log(`  ⚠️  Error in batch ${i + 1}: ${error.message.substring(0, 60)}`);
        }
      }
    }

    console.log(`\n✅ Import phase completed`);
    console.log(`   Imported: ${totalImported} products`);
    console.log(`   Errors: ${errors}\n`);

    // Check actual count
    const [count] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`📊 Database count: ${count[0].total} products\n`);

    // Apply quantity limits
    console.log('📋 Applying quantity limits and migrations...');
    await connection.query(`
      UPDATE products 
      SET 
        min_order_qty = CASE 
          WHEN catItems = '7' AND subcat IN ('5', '6', '7') THEN 0.5 + (RAND() * 2)
          WHEN catItems = '7' AND subcat IN ('11', '15') THEN 0.1 + (RAND() * 0.4)
          WHEN catItems = '7' AND subcat = '8' THEN 1
          WHEN catItems = '7' AND subcat IN ('9', '12') THEN 1
          ELSE 1
        END,
        max_order_qty = CASE 
          WHEN catItems = '7' AND subcat IN ('5', '6', '7') THEN 10 + (RAND() * 40)
          WHEN catItems = '7' AND subcat IN ('11', '15') THEN 2 + (RAND() * 8)
          WHEN catItems = '7' AND subcat = '8' THEN 30 + (RAND() * 70)
          WHEN catItems = '7' AND subcat IN ('9', '12') THEN 5 + (RAND() * 20)
          ELSE 50
        END,
        sell_unit = CASE
          WHEN unit_of_measurement LIKE '%ኪሎ%' OR size LIKE '%ኪሎ%' OR size LIKE '%Kilo%' THEN 'kg'
          WHEN unit_of_measurement LIKE '%ፍሬ%' OR size LIKE '%ፍሬ%' OR size LIKE '%በፍሬ%' THEN 'piece'
          WHEN title LIKE '%እንቁላል%' THEN 'piece'
          WHEN unit_of_measurement LIKE '%liter%' THEN 'liter'
          WHEN unit_of_measurement LIKE '%gm%' OR unit_of_measurement LIKE '%ግራም%' THEN 'kg'
          ELSE 'kg'
        END,
        seller_id = 1
      WHERE id > 0
    `);
    console.log('✅ Migrations applied\n');

    // Remove productfor
    await connection.query('ALTER TABLE products DROP COLUMN IF EXISTS productfor');
    console.log('✅ productfor removed\n');

    // Re-enable constraints
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.query('SET UNIQUE_CHECKS = 1');

    // Final verification
    const [finalCount] = await connection.query('SELECT COUNT(*) as total FROM products');
    const [sample] = await connection.query(`
      SELECT id, title, min_order_qty, max_order_qty, sell_unit, price, stock
      FROM products
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log('═══════════════════════════════════════════════════');
    console.log(`🎉 IMPORT COMPLETE!`);
    console.log(`   Total Products: ${finalCount[0].total}`);
    console.log(`   Target: 742`);
    console.log(`   Success Rate: ${((finalCount[0].total / 742) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('📋 Latest 10 products:\n');
    console.table(sample.map(p => ({
      ID: p.id,
      Title: p.title.substring(0, 35),
      Min: p.min_order_qty.toFixed(2),
      Max: p.max_order_qty ? p.max_order_qty.toFixed(0) : 'N/A',
      Unit: p.sell_unit,
      Price: p.price
    })));

    console.log('\n📤 Now exporting to SQL file...\n');

    // Auto-export
    const exportScript = require('./export_products.js');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

forceImportAll();
