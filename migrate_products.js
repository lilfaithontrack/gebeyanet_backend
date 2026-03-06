/**
 * Product Migration Script - JavaScript Version
 * Applies product schema migration to localhost MySQL database
 * Removes 'productfor' and adds quantity limit fields
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gebya_net',
  multipleStatements: true
};

async function migrateProducts() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);

    // Step 1: Check if products table exists
    console.log('\n📋 Step 1: Checking products table...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'products'");
    if (tables.length === 0) {
      throw new Error('Products table does not exist!');
    }
    console.log('✅ Products table found');

    // Step 2: Add new columns
    console.log('\n📋 Step 2: Adding new columns...');
    try {
      await connection.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS seller_id INT NOT NULL DEFAULT 1 AFTER seller_email,
        ADD COLUMN IF NOT EXISTS min_order_qty FLOAT NOT NULL DEFAULT 1 AFTER seller_id,
        ADD COLUMN IF NOT EXISTS max_order_qty FLOAT DEFAULT NULL AFTER min_order_qty,
        ADD COLUMN IF NOT EXISTS sell_unit ENUM('piece','dozen','kg','quintal','box','liter','meter','pack','pair') NOT NULL DEFAULT 'kg' AFTER max_order_qty
      `);
      console.log('✅ New columns added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Columns already exist, skipping...');
      } else {
        throw error;
      }
    }

    // Step 3: Update products with quantity limitations
    console.log('\n📋 Step 3: Setting quantity limitations...');
    const [updateResult] = await connection.query(`
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
          WHEN unit_of_measurement LIKE '%ኪሎ%' OR unit_of_measurement LIKE '%kg%' OR size LIKE '%ኪሎ%' OR size LIKE '%Kilo%' THEN 'kg'
          WHEN unit_of_measurement LIKE '%ፍሬ%' OR size LIKE '%ፍሬ%' OR title LIKE '%እንቁላል%' THEN 'piece'
          WHEN unit_of_measurement LIKE '%ግራም%' OR unit_of_measurement LIKE '%gm%' THEN 'kg'
          WHEN unit_of_measurement LIKE '%liter%' THEN 'liter'
          WHEN title LIKE '%dozen%' THEN 'dozen'
          ELSE 'kg'
        END,
        seller_id = 1
      WHERE id > 0
    `);
    console.log(`✅ Updated ${updateResult.affectedRows} products with quantity limits`);

    // Step 4: Remove productfor column
    console.log('\n📋 Step 4: Removing productfor column...');
    try {
      await connection.query('ALTER TABLE products DROP COLUMN productfor');
      console.log('✅ productfor column removed');
    } catch (error) {
      if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('⚠️  productfor column already removed');
      } else {
        throw error;
      }
    }

    // Step 5: Clean up data
    console.log('\n📋 Step 5: Cleaning up data...');
    await connection.query(`
      UPDATE products 
      SET unit_of_measurement = sell_unit
      WHERE unit_of_measurement = 'null' OR unit_of_measurement IS NULL
    `);

    await connection.query(`
      UPDATE products 
      SET image = '[]' 
      WHERE image IS NULL OR image = '' OR image = 'null'
    `);

    await connection.query(`
      UPDATE products 
      SET color_options = '[]' 
      WHERE color_options IS NULL OR color_options = '' OR color_options = 'null'
    `);

    await connection.query(`
      UPDATE products 
      SET variations = '[]' 
      WHERE variations IS NULL OR variations = '' OR variations = 'null'
    `);
    console.log('✅ Data cleaned up');

    // Step 6: Add indexes
    console.log('\n📋 Step 6: Adding indexes...');
    const indexes = [
      { name: 'idx_seller_id', column: 'seller_id' },
      { name: 'idx_status', column: 'status' },
      { name: 'idx_stock', column: 'stock' },
      { name: 'idx_category', column: 'catItems, subcat' }
    ];

    for (const index of indexes) {
      try {
        await connection.query(`CREATE INDEX ${index.name} ON products (${index.column})`);
        console.log(`✅ Index ${index.name} created`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Index ${index.name} already exists`);
        } else {
          console.log(`⚠️  Could not create index ${index.name}:`, error.message);
        }
      }
    }

    // Step 7: Verify migration
    console.log('\n📋 Step 7: Verifying migration...');
    const [products] = await connection.query(`
      SELECT 
        id, title, seller_id, min_order_qty, max_order_qty, 
        sell_unit, price, stock, status
      FROM products
      ORDER BY id
      LIMIT 10
    `);

    console.log('\n✅ Sample migrated products:');
    console.table(products.map(p => ({
      ID: p.id,
      Title: p.title.substring(0, 20),
      'Min Qty': p.min_order_qty.toFixed(2),
      'Max Qty': p.max_order_qty ? p.max_order_qty.toFixed(0) : 'N/A',
      Unit: p.sell_unit,
      Price: p.price,
      Stock: p.stock
    })));

    // Get total count
    const [countResult] = await connection.query('SELECT COUNT(*) as total FROM products');
    console.log(`\n✅ Total products migrated: ${countResult[0].total}`);

    // Check table structure
    const [columns] = await connection.query('DESCRIBE products');
    const hasProductFor = columns.some(col => col.Field === 'productfor');
    const hasSellerID = columns.some(col => col.Field === 'seller_id');
    const hasMinQty = columns.some(col => col.Field === 'min_order_qty');
    const hasMaxQty = columns.some(col => col.Field === 'max_order_qty');
    const hasSellUnit = columns.some(col => col.Field === 'sell_unit');

    console.log('\n📊 Migration Status:');
    console.log(`  ${hasProductFor ? '❌' : '✅'} productfor column removed: ${!hasProductFor}`);
    console.log(`  ${hasSellerID ? '✅' : '❌'} seller_id column exists: ${hasSellerID}`);
    console.log(`  ${hasMinQty ? '✅' : '❌'} min_order_qty column exists: ${hasMinQty}`);
    console.log(`  ${hasMaxQty ? '✅' : '❌'} max_order_qty column exists: ${hasMaxQty}`);
    console.log(`  ${hasSellUnit ? '✅' : '❌'} sell_unit column exists: ${hasSellUnit}`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📤 Next steps:');
    console.log('   1. Export database: mysqldump -u root -p gebya_net products > products_migrated.sql');
    console.log('   2. Upload to cPanel via phpMyAdmin');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
console.log('🚀 Starting Product Migration...\n');
migrateProducts();
