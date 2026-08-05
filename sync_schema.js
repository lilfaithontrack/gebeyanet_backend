/**
 * Standalone runner for the schema sync migration.
 *
 * Applies migrations/20260801000000-sync-models-with-db.js against the
 * database configured in .env. Idempotent — safe to re-run.
 *
 * Usage:  node sync_schema.js
 */
const path = require('path');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'gebyanet',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    dialect: 'mysql',
    logging: console.log,
  }
);

// Build a minimal queryInterface shim that the migration expects.
const queryInterface = sequelize.getQueryInterface();

(async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected.\n');

    const migration = require('./migrations/20260801000000-sync-models-with-db.js');
    console.log('Running sync migration (up)...\n');
    await migration.up(queryInterface, Sequelize);
    console.log('\n✅ Sync migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Sync migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
