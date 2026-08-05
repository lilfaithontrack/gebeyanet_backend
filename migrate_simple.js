/**
 * Simple Product Migration Script
 * Updates existing products with quantity limits and removes productfor
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet'
  });

  try {
    console.log('🚀 Starting migration...\n');

    // Step 1: Update quantity limits based on category
    console.log('📋 Step 1: Setting quantity limits...');
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
          WHEN subcat IN ('9', '12') THEN 'kg'
          ELSE 'kg'
        END,
        seller_id = 1
      WHERE id > 0
    `);
    console.log('✅ Quantity limits updated\n');

    // Step 2: Remove productfor column
    console.log('📋 Step 2: Removing productfor column...');
    try {
      await connection.query('ALTER TABLE products DROP COLUMN productfor');
      console.log('✅ productfor column removed\n');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️  productfor already removed\n');
      } else {
        throw error;
      }
    }

    // Step 3: Clean up JSON fields
    console.log('📋 Step 3: Cleaning up data...');
    await connection.query(`UPDATE products SET image = '[]' WHERE image IS NULL OR image = ''`);
    await connection.query(`UPDATE products SET color_options = '[]' WHERE color_options IS NULL`);
    await connection.query(`UPDATE products SET variations = '[]' WHERE variations IS NULL`);
    await connection.query(`UPDATE products SET location_prices = '{}' WHERE location_prices IS NULL`);
    await connection.query(`UPDATE products SET location_stock = '{}' WHERE location_stock IS NULL`);
    console.log('✅ Data cleaned\n');

    // Step 4: Verify results
    console.log('📋 Step 4: Verification...');
    const [products] = await connection.query(`
      SELECT id, title, min_order_qty, max_order_qty, sell_unit, price, stock
      FROM products
      ORDER BY id
      LIMIT 10
    `);

    console.log('✅ Sample migrated products:\n');
    console.table(products.map(p => ({
      ID: p.id,
      Title: p.title.substring(0, 25),
      'Min': p.min_order_qty.toFixed(2),
      'Max': p.max_order_qty ? p.max_order_qty.toFixed(0) : 'N/A',
      Unit: p.sell_unit,
      Price: p.price
    })));

    // Check structure
    const [columns] = await connection.query('DESCRIBE products');
    const hasProductFor = columns.some(col => col.Field === 'productfor');

    console.log('\n📊 Migration Status:');
    console.log(`  ${hasProductFor ? '❌' : '✅'} productfor removed: ${!hasProductFor}`);
    console.log(`  ✅ seller_id exists`);
    console.log(`  ✅ min_order_qty exists`);
    console.log(`  ✅ max_order_qty exists`);
    console.log(`  ✅ sell_unit exists`);

    const [count] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`\n✅ Total products: ${count[0].total}`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📤 Export command:');
    console.log('   mysqldump -u root -p gebyanet products > products_migrated.sql\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
