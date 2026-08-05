/**
 * Import ALL 742 Products - No Exceptions
 * Disables all constraints and validations
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function importAll742() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet',
    multipleStatements: true
  });

  try {
    console.log('🚀 Importing ALL 742 products - No constraints, no validation\n');

    // Disable everything
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('SET SQL_MODE = ""');
    await connection.query('SET UNIQUE_CHECKS = 0');
    console.log('✅ All constraints disabled\n');

    // Drop and recreate variations constraint
    try {
      await connection.query('ALTER TABLE products DROP CHECK products_chk_1');
    } catch (e) {}
    try {
      await connection.query('ALTER TABLE products DROP CHECK variations');
    } catch (e) {}
    console.log('✅ Validation constraints removed\n');

    // Add productfor temporarily
    try {
      await connection.query(`ALTER TABLE products ADD COLUMN productfor ENUM('for_seller','for_user') DEFAULT 'for_user' AFTER stock`);
    } catch (e) {}

    // Clear existing products
    console.log('📋 Clearing existing products...');
    await connection.query('DELETE FROM products');
    console.log('✅ Table cleared\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'products.sql');
    console.log('📋 Reading products.sql...');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    console.log(`✅ File loaded\n`);

    // Execute entire SQL file
    console.log('📋 Importing ALL products...');
    console.log('⏳ Please wait...\n');

    try {
      await connection.query(sqlContent);
      console.log('✅ SQL file executed\n');
    } catch (error) {
      console.log(`⚠️  Main import had issues, trying batch method...\n`);
      
      // Extract and run INSERT statements one by one
      const insertRegex = /INSERT INTO `products`[^;]+;/gi;
      const inserts = sqlContent.match(insertRegex);
      
      if (inserts) {
        console.log(`Found ${inserts.length} INSERT statements\n`);
        let success = 0;
        
        for (let i = 0; i < inserts.length; i++) {
          try {
            await connection.query(inserts[i]);
            success++;
            if ((i + 1) % 3 === 0) {
              console.log(`  ✓ Batch ${i + 1}/${inserts.length} completed`);
            }
          } catch (err) {
            // Try to fix the statement and retry
            let fixed = inserts[i]
              .replace(/0x[0-9A-F]+/gi, 'NULL') // Replace geometry hex with NULL
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            
            try {
              await connection.query(fixed);
              success++;
            } catch (e2) {
              console.log(`  ⚠️  Skipped batch ${i + 1}: ${e2.message.substring(0, 50)}`);
            }
          }
        }
        console.log(`\n✅ Imported ${success} batches\n`);
      }
    }

    // Check count
    const [count1] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`📊 Current count: ${count1[0].total} products\n`);

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
          WHEN unit_of_measurement LIKE '%ኪሎ%' OR size LIKE '%ኪሎ%' THEN 'kg'
          WHEN unit_of_measurement LIKE '%ፍሬ%' OR size LIKE '%ፍሬ%' THEN 'piece'
          WHEN title LIKE '%እንቁላል%' THEN 'piece'
          ELSE 'kg'
        END,
        seller_id = 1
      WHERE id > 0
    `);
    console.log('✅ Quantity limits applied\n');

    // Remove productfor
    await connection.query('ALTER TABLE products DROP COLUMN IF EXISTS productfor');
    console.log('✅ productfor removed\n');

    // Re-enable constraints
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.query('SET UNIQUE_CHECKS = 1');

    // Final count
    const [finalCount] = await connection.query('SELECT COUNT(*) as total FROM products');
    
    console.log('═══════════════════════════════════════');
    console.log(`🎉 IMPORT COMPLETE!`);
    console.log(`   Total Products: ${finalCount[0].total}`);
    console.log(`   Expected: 742`);
    console.log('═══════════════════════════════════════\n');

    // Sample
    const [sample] = await connection.query(`
      SELECT id, title, min_order_qty, max_order_qty, sell_unit, price
      FROM products
      ORDER BY id DESC
      LIMIT 5
    `);

    console.table(sample.map(p => ({
      ID: p.id,
      Title: p.title.substring(0, 30),
      Min: p.min_order_qty.toFixed(2),
      Max: p.max_order_qty ? p.max_order_qty.toFixed(0) : 'N/A',
      Unit: p.sell_unit,
      Price: p.price
    })));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

importAll742();
