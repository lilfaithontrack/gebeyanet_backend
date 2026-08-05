/**
 * Sync migration #3:
 *  - Make VehicleFiles NOT NULL columns nullable
 *  - Add `pin` column to Drivers table (model has it, DB doesn't)
 *  - Sync Drivers.current_status ENUM to match model
 *
 * Idempotent — safe to re-run.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

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

  console.log('Connected. Running sync migration #3...\n');

  // --- VehicleFiles: make NOT NULL columns nullable ---
  for (const col of ['car_photo', 'car_license_photo', 'owner_id_photo', 'filled_document']) {
    if (await columnExists(c, 'VehicleFiles', col)) {
      await c.query(`ALTER TABLE \`VehicleFiles\` MODIFY \`${col}\` VARCHAR(255) NULL`);
      console.log(`  ~ VehicleFiles.${col} -> NULL`);
    }
  }

  // --- Drivers: add pin column ---
  if (!(await columnExists(c, 'Drivers', 'pin'))) {
    await c.query('ALTER TABLE `Drivers` ADD COLUMN `pin` VARCHAR(255) NOT NULL');
    console.log('  + Drivers.pin added');
  } else {
    console.log('  = Drivers.pin already exists');
  }

  // --- Drivers: sync current_status ENUM ---
  // DB has: 'offline','idle','en_route_pickup','en_route_dropoff','busy'
  // Model has: 'offline','idle','assigned','en_route_pickup','at_pickup','en_route_dropoff','at_dropoff','busy'
  if (await columnExists(c, 'Drivers', 'current_status')) {
    await c.query(`ALTER TABLE \`Drivers\` MODIFY \`current_status\` ENUM('offline','idle','assigned','en_route_pickup','at_pickup','en_route_dropoff','at_dropoff','busy') NOT NULL DEFAULT 'offline'`);
    console.log('  ~ Drivers.current_status ENUM synced');
  }

  console.log('\n✅ Sync migration #3 completed.');
  await c.end();
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
