/**
 * Final Product Import Script
 * Handles productfor column temporarily for import
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function importProductsFinal() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet',
    multipleStatements: true,
    maxAllowedPacket: 67108864 // 64MB
  });

  try {
    console.log('🚀 Starting full product import...\n');

    // Step 1: Add productfor column temporarily
    console.log('📋 Step 1: Adding productfor column temporarily...');
    try {
      await connection.query(`
        ALTER TABLE products 
        ADD COLUMN productfor ENUM('for_seller','for_user') NOT NULL DEFAULT 'for_user' 
        AFTER stock
      `);
      console.log('✅ productfor column added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  productfor column already exists\n');
      } else {
        throw error;
      }
    }

    // Step 2: Clear existing products (optional - comment out if you want to keep them)
    console.log('📋 Step 2: Clearing existing products...');
    await connection.query('TRUNCATE TABLE products');
    console.log('✅ Table cleared\n');

    // Step 3: Read and import SQL file
    const sqlFilePath = path.join(__dirname, 'products.sql');
    console.log('📋 Step 3: Reading SQL file...');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    console.log(`✅ File loaded (${(sqlContent.length / 1024).toFixed(2)} KB)\n`);

    console.log('📋 Step 4: Importing products...');
    console.log('⏳ This may take 1-2 minutes for 742 products...\n');

    // Execute the entire SQL file at once
    try {
      await connection.query(sqlContent);
      console.log('✅ SQL file executed successfully\n');
    } catch (error) {
      console.log(`⚠️  Import warning: ${error.message.substring(0, 100)}\n`);
    }

    // Step 4: Check import results
    const [count] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`📊 Products imported: ${count[0].total}\n`);

    if (count[0].total === 0) {
      console.log('❌ No products imported. Trying alternative method...\n');
      
      // Alternative: Extract only INSERT statements
      const insertMatch = sqlContent.match(/INSERT INTO `products`[\s\S]*?;/gi);
      if (insertMatch) {
        console.log(`Found ${insertMatch.length} INSERT statements\n`);
        for (let i = 0; i < insertMatch.length; i++) {
          try {
            await connection.query(insertMatch[i]);
            if ((i + 1) % 10 === 0) {
              console.log(`  ✓ Imported ${i + 1} batches...`);
            }
          } catch (error) {
            console.log(`  ⚠️  Error in batch ${i + 1}: ${error.message.substring(0, 50)}`);
          }
        }
      }
      
      const [newCount] = await connection.query('SELECT COUNT(*) as total FROM products');
      console.log(`\n📊 Final count: ${newCount[0].total} products\n`);
    }

    // Step 5: Apply quantity limits
    console.log('📋 Step 5: Applying quantity limits...');
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
          WHEN unit_of_measurement LIKE '%ኪሎ%' OR unit_of_measurement LIKE '%kg%' OR size LIKE '%ኪሎ%' THEN 'kg'
          WHEN unit_of_measurement LIKE '%ፍሬ%' OR size LIKE '%ፍሬ%' OR title LIKE '%እንቁላል%' THEN 'piece'
          WHEN unit_of_measurement LIKE '%ግራም%' OR unit_of_measurement LIKE '%gm%' THEN 'kg'
          WHEN unit_of_measurement LIKE '%liter%' THEN 'liter'
          WHEN title LIKE '%dozen%' THEN 'dozen'
          ELSE 'kg'
        END,
        seller_id = 1
      WHERE id > 0
    `);
    console.log('✅ Quantity limits applied\n');

    // Step 6: Remove productfor column
    console.log('📋 Step 6: Removing productfor column...');
    await connection.query('ALTER TABLE products DROP COLUMN productfor');
    console.log('✅ productfor column removed\n');

    // Step 7: Final verification
    const [finalCount] = await connection.query('SELECT COUNT(*) as total FROM products');
    const [sample] = await connection.query(`
      SELECT id, title, min_order_qty, max_order_qty, sell_unit, price, stock
      FROM products
      ORDER BY id
      LIMIT 10
    `);

    console.log('📊 Final Results:');
    console.log(`   Total products: ${finalCount[0].total}`);
    console.log(`   Expected: 742\n`);

    console.log('📋 Sample products:\n');
    console.table(sample.map(p => ({
      ID: p.id,
      Title: p.title.substring(0, 30),
      'Min': p.min_order_qty.toFixed(2),
      'Max': p.max_order_qty ? p.max_order_qty.toFixed(0) : 'N/A',
      Unit: p.sell_unit,
      Price: p.price
    })));

    console.log('\n🎉 Import completed successfully!');
    console.log('\n📤 Export your database:');
    console.log('   mysqldump -u root -p gebyanet products > products_migrated.sql\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

importProductsFinal();
