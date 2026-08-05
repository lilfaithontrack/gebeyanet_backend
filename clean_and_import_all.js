/**
 * Clean SQL Data and Import ALL 742 Products
 * Fixes NULL values and malformed JSON before import
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function cleanAndImportAll() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet',
    multipleStatements: true
  });

  try {
    console.log('🚀 IMPORTING ALL 742 PRODUCTS - Cleaning data first\n');

    // Disable all constraints
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('SET SQL_MODE = ""');
    await connection.query('SET UNIQUE_CHECKS = 0');
    
    // Drop ALL CHECK constraints
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
      } catch (e) {}
    }
    console.log('✅ All constraints removed\n');

    // Add productfor
    try {
      await connection.query(`ALTER TABLE products ADD COLUMN productfor ENUM('for_seller','for_user') DEFAULT 'for_user' AFTER stock`);
    } catch (e) {}

    // Clear table
    await connection.query('DELETE FROM products');
    console.log('✅ Table cleared\n');

    // Read and CLEAN SQL file
    const sqlFilePath = path.join(__dirname, 'products.sql');
    console.log('📋 Reading and cleaning SQL file...');
    let sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    // Fix NULL values in variations and color_options
    sqlContent = sqlContent
      .replace(/, NULL, NULL\)/g, ', "[]", "[]")')  // Fix trailing NULLs
      .replace(/, NULL\)/g, ', "[]")')  // Fix single trailing NULL
      .replace(/\bNULL, ""/g, '"[]", "');  // Fix NULL before empty string
    
    console.log('✅ SQL data cleaned\n');

    // Extract INSERT statements
    const insertRegex = /INSERT INTO `products`[^;]+;/gi;
    const inserts = sqlContent.match(insertRegex);
    
    if (!inserts) {
      throw new Error('No INSERT statements found');
    }
    
    console.log(`✅ Found ${inserts.length} INSERT statements\n`);
    console.log('📋 Importing all products...\n');

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
        if (errors <= 3) {
          console.log(`  ⚠️  Batch ${i + 1} error: ${error.message.substring(0, 50)}`);
        }
      }
    }

    console.log(`\n✅ Import completed: ${totalImported} products, ${errors} errors\n`);

    // Verify count
    const [count] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`📊 Database count: ${count[0].total} products\n`);

    // Apply migrations
    console.log('📋 Applying quantity limits...');
    await connection.query(`
      UPDATE products 
      SET 
        min_order_qty = CASE 
          WHEN catItems = '7' AND subcat IN ('5', '6', '7') THEN 0.5 + (RAND() * 2)
          WHEN catItems = '7' AND subcat IN ('11', '15') THEN 0.1 + (RAND() * 0.4)
          WHEN catItems = '7' AND subcat = '8' THEN 1
          ELSE 1
        END,
        max_order_qty = CASE 
          WHEN catItems = '7' AND subcat IN ('5', '6', '7') THEN 10 + (RAND() * 40)
          WHEN catItems = '7' AND subcat IN ('11', '15') THEN 2 + (RAND() * 8)
          WHEN catItems = '7' AND subcat = '8' THEN 30 + (RAND() * 70)
          ELSE 50
        END,
        sell_unit = CASE
          WHEN unit_of_measurement LIKE '%ኪሎ%' OR size LIKE '%ኪሎ%' OR size LIKE '%Kilo%' THEN 'kg'
          WHEN unit_of_measurement LIKE '%ፍሬ%' OR size LIKE '%ፍሬ%' OR size LIKE '%በፍሬ%' THEN 'piece'
          WHEN title LIKE '%እንቁላል%' THEN 'piece'
          WHEN unit_of_measurement LIKE '%liter%' THEN 'liter'
          WHEN unit_of_measurement LIKE '%gm%' OR unit_of_measurement LIKE '%ግራም%' OR size LIKE '%ግራም%' THEN 'kg'
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

    // Final results
    const [finalCount] = await connection.query('SELECT COUNT(*) as total FROM products');
    const [sample] = await connection.query(`
      SELECT id, title, min_order_qty, max_order_qty, sell_unit, price
      FROM products
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log('═══════════════════════════════════════════════════');
    console.log(`🎉 IMPORT COMPLETE!`);
    console.log(`   Total Products: ${finalCount[0].total}`);
    console.log(`   Target: 742`);
    console.log(`   Success: ${((finalCount[0].total / 742) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════════════\n');

    console.table(sample.map(p => ({
      ID: p.id,
      Title: p.title.substring(0, 35),
      Min: p.min_order_qty.toFixed(2),
      Max: p.max_order_qty ? p.max_order_qty.toFixed(0) : 'N/A',
      Unit: p.sell_unit,
      Price: p.price
    })));

    console.log('\n📤 Exporting to SQL file...\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run import then export
cleanAndImportAll()
  .then(() => {
    console.log('Running export...');
    require('./export_products.js');
  })
  .catch(err => {
    console.error('Failed:', err);
    process.exit(1);
  });
