/**
 * Sync migration #2: aligns orders + cart tables with the Order/Cart models.
 * Idempotent — safe to re-run.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// column -> type definition for MODIFY
const ORDERS_NULLABLE = {
  username: 'VARCHAR(255) NULL',
  address: 'TEXT NULL',
  region: 'VARCHAR(255) NULL',
  quantity: 'INT NULL',
  payment: 'VARCHAR(255) NULL',
  file_uploaded: 'VARCHAR(255) NULL',
  total_price: 'FLOAT NULL',
  shipment: 'VARCHAR(255) NULL',
  total_pay: 'FLOAT NULL',
  price: 'FLOAT NULL',
  liyu_name: 'VARCHAR(255) NULL',
  sub_city: 'VARCHAR(255) NULL',
  national_id: 'VARCHAR(255) NULL',
  deliveryman: 'VARCHAR(255) NULL',
  due_date: 'DATETIME NULL',
};

const CART_NULLABLE = {
  title: 'TEXT NULL',
  image: 'TEXT NULL',
  price: 'TEXT NULL',
};

async function columnExists(c, table, column) {
  const [rows] = await c.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet',
  });

  console.log('Connected. Running sync migration #2...\n');

  // --- orders.userId ---
  if (!(await columnExists(c, 'orders', 'userId'))) {
    await c.query('ALTER TABLE `orders` ADD COLUMN `userId` INT NULL');
    console.log('  + orders.userId added');
  } else {
    console.log('  = orders.userId already exists');
  }

  // --- orders.payment_status ---
  if (!(await columnExists(c, 'orders', 'payment_status'))) {
    await c.query("ALTER TABLE `orders` ADD COLUMN `payment_status` VARCHAR(255) NULL DEFAULT 'pending'");
    console.log('  + orders.payment_status added');
  } else {
    console.log('  = orders.payment_status already exists');
  }

  // --- Relax legacy NOT NULL columns on orders ---
  for (const [col, typeDef] of Object.entries(ORDERS_NULLABLE)) {
    if (await columnExists(c, 'orders', col)) {
      await c.query(`ALTER TABLE \`orders\` MODIFY \`${col}\` ${typeDef}`);
      console.log(`  ~ orders.${col} -> NULL`);
    }
  }

  // --- cart.userId ---
  if (!(await columnExists(c, 'cart', 'userId'))) {
    await c.query('ALTER TABLE `cart` ADD COLUMN `userId` INT NULL');
    console.log('  + cart.userId added');
  } else {
    console.log('  = cart.userId already exists');
  }

  // --- Relax cart NOT NULL columns ---
  for (const [col, typeDef] of Object.entries(CART_NULLABLE)) {
    if (await columnExists(c, 'cart', col)) {
      await c.query(`ALTER TABLE \`cart\` MODIFY \`${col}\` ${typeDef}`);
      console.log(`  ~ cart.${col} -> NULL`);
    }
  }

  console.log('\n✅ Sync migration #2 completed.');
  await c.end();
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
