/**
 * Fix Foreign Key Issues and Import All Products
 * Handles the uoms table FK constraint issue
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function fixAndImport() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet',
    multipleStatements: true
  });

  try {
    console.log('🔧 Fixing foreign key issues and importing products...\n');

    // Step 1: Disable foreign key checks
    console.log('📋 Step 1: Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Foreign key checks disabled\n');

    // Step 2: Drop problematic FK constraint from uoms table
    console.log('📋 Step 2: Fixing uoms table constraint...');
    try {
      await connection.query('ALTER TABLE uoms DROP FOREIGN KEY uoms_ibfk_1');
      console.log('✅ Removed problematic FK constraint\n');
    } catch (error) {
      console.log('⚠️  FK constraint already removed or doesn\'t exist\n');
    }

    // Step 3: Add productfor column temporarily
    console.log('📋 Step 3: Adding productfor column...');
    try {
      await connection.query(`
        ALTER TABLE products 
        ADD COLUMN productfor ENUM('for_seller','for_user') NOT NULL DEFAULT 'for_user' 
        AFTER stock
      `);
      console.log('✅ productfor added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  productfor already exists\n');
      }
    }

    // Step 4: Read and import SQL file
    const sqlFilePath = path.join(__dirname, 'products.sql');
    console.log('📋 Step 4: Reading products.sql...');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    console.log(`✅ File loaded (${(sqlContent.length / 1024).toFixed(2)} KB)\n`);

    // Step 5: Extract INSERT statements
    console.log('📋 Step 5: Extracting and importing products...');
    const insertRegex = /INSERT INTO `products`[^;]+;/gi;
    const insertStatements = sqlContent.match(insertRegex);
    
    if (!insertStatements) {
      throw new Error('No INSERT statements found');
    }
    
    console.log(`✅ Found ${insertStatements.length} INSERT statement(s)`);
    console.log('⏳ Importing... (this may take 1-2 minutes)\n');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < insertStatements.length; i++) {
      try {
        const result = await connection.query(insertStatements[i]);
        const affectedRows = Array.isArray(result[0]) ? result[0].affectedRows : result[0].affectedRows || 0;
        imported += affectedRows;
        
        if ((i + 1) % 3 === 0 || i === insertStatements.length - 1) {
          console.log(`  ✓ Batch ${i + 1}/${insertStatements.length}: ${imported} products imported`);
        }
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          skipped++;
        } else {
          errors++;
          if (errors <= 3) {
            console.log(`  ⚠️  Error: ${error.message.substring(0, 60)}...`);
          }
        }
      }
    }

    console.log(`\n✅ Import completed!`);
    console.log(`   Imported: ${imported} products`);
    console.log(`   Skipped: ${skipped} duplicates`);
    if (errors > 0) console.log(`   Errors: ${errors}\n`);

    // Step 6: Check total count
    const [count] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`📊 Total products in database: ${count[0].total}\n`);

    // Step 7: Apply quantity limits
    console.log('📋 Step 6: Applying quantity limits...');
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
          ELSE 'kg'
        END,
        seller_id = 1
      WHERE id > 0
    `);
    console.log('✅ Quantity limits applied\n');

    // Step 8: Remove productfor
    console.log('📋 Step 7: Removing productfor column...');
    await connection.query('ALTER TABLE products DROP COLUMN IF EXISTS productfor');
    console.log('✅ productfor removed\n');

    // Step 9: Re-enable foreign key checks
    console.log('📋 Step 8: Re-enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign key checks enabled\n');

    // Step 10: Show results
    const [sample] = await connection.query(`
      SELECT id, title, min_order_qty, max_order_qty, sell_unit, price, stock
      FROM products
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log('📋 Latest 10 products:\n');
    console.table(sample.map(p => ({
      ID: p.id,
      Title: p.title.substring(0, 35),
      'Min': p.min_order_qty.toFixed(2),
      'Max': p.max_order_qty ? p.max_order_qty.toFixed(0) : 'N/A',
      Unit: p.sell_unit,
      Price: p.price,
      Stock: p.stock
    })));

    const [finalCount] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`\n🎉 SUCCESS! ${finalCount[0].total} products ready in database!`);
    console.log('\n📤 Export command:');
    console.log('   mysqldump -u root -p gebyanet products > products_migrated.sql\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixAndImport();
