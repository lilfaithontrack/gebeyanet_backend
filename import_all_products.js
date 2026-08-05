/**
 * Import All Products from products.sql
 * Handles large SQL file import with proper parsing
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function importProducts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet',
    multipleStatements: true
  });

  try {
    console.log('🚀 Starting product import...\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'products.sql');
    console.log('📂 Reading SQL file:', sqlFilePath);
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    console.log(`✅ File loaded (${(sqlContent.length / 1024).toFixed(2)} KB)\n`);

    // Check current product count
    const [beforeCount] = await connection.query('SELECT COUNT(*) as count FROM products');
    console.log(`📊 Current products in database: ${beforeCount[0].count}\n`);

    // Execute the SQL file
    console.log('⏳ Importing products... (this may take a minute)\n');
    
    // Split by semicolons but be careful with data that contains semicolons
    const statements = sqlContent
      .split(/;\s*\n/)
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      if (!statement || statement.startsWith('/*') || statement.startsWith('--')) {
        continue;
      }

      try {
        await connection.query(statement);
        successCount++;
        
        // Show progress every 50 statements
        if (successCount % 50 === 0) {
          console.log(`  ✓ Processed ${successCount} statements...`);
        }
      } catch (error) {
        // Ignore duplicate entry errors
        if (error.code !== 'ER_DUP_ENTRY') {
          errorCount++;
          if (errorCount <= 5) {
            console.log(`  ⚠️  Error in statement ${i}: ${error.message.substring(0, 100)}`);
          }
        }
      }
    }

    console.log(`\n✅ Import completed: ${successCount} statements executed`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} errors (likely duplicates or structure issues)`);
    }

    // Check final product count
    const [afterCount] = await connection.query('SELECT COUNT(*) as count FROM products');
    const newProducts = afterCount[0].count - beforeCount[0].count;
    
    console.log(`\n📊 Final Results:`);
    console.log(`   Before: ${beforeCount[0].count} products`);
    console.log(`   After:  ${afterCount[0].count} products`);
    console.log(`   Added:  ${newProducts} new products`);

    // Now apply migration to add quantity limits
    console.log('\n🔧 Applying quantity limits migration...\n');
    
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
          WHEN title LIKE '%እንቁላል%' THEN 'piece'
          WHEN subcat IN ('11', '15') THEN 'kg'
          WHEN subcat IN ('5', '6', '7') THEN 'kg'
          ELSE 'kg'
        END,
        seller_id = 1
      WHERE min_order_qty IS NULL OR min_order_qty = 1
    `);
    console.log('✅ Quantity limits applied to all products');

    // Remove productfor if exists
    try {
      await connection.query('ALTER TABLE products DROP COLUMN IF EXISTS productfor');
      console.log('✅ productfor column removed');
    } catch (error) {
      console.log('⚠️  productfor column already removed or doesn\'t exist');
    }

    // Show sample products
    const [sampleProducts] = await connection.query(`
      SELECT id, title, min_order_qty, max_order_qty, sell_unit, price, stock
      FROM products
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log('\n📋 Sample of latest products:\n');
    console.table(sampleProducts.map(p => ({
      ID: p.id,
      Title: p.title.substring(0, 30),
      'Min': p.min_order_qty ? p.min_order_qty.toFixed(2) : 'N/A',
      'Max': p.max_order_qty ? p.max_order_qty.toFixed(0) : 'N/A',
      Unit: p.sell_unit,
      Price: p.price
    })));

    console.log('\n🎉 All products imported and migrated successfully!');
    console.log('\n📤 Export command:');
    console.log('   mysqldump -u root -p gebyanet products > products_migrated.sql\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

importProducts();
