// Sync migration: brings the MySQL schema in line with the Sequelize models.
//
// Fixes:
//  1. users  -> add seller_level, referral_earnings, is_referrer; drop legacy is_agent; update role enum to ('buyer','seller')
//  2. products -> add seller_level, product_type, origin_country, destination_country
//  3. checkouts -> change guest_id from INT to VARCHAR (model defines STRING)
//  4. user_notifications -> create new table for the unified user notification system
//     (the existing `notifications` table is owned by the telalaki/delivery system)
//
// Safe to re-run: every ALTER is guarded so it won't error if the column already exists.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ---- 1. users ----
    await addColumnIfMissing(queryInterface, 'users', 'seller_level', {
      type: Sequelize.ENUM('importer', 'exporter', 'reseller'),
      allowNull: true,
      comment: 'Seller sub-level (null for buyers)',
    });
    await addColumnIfMissing(queryInterface, 'users', 'referral_earnings', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Total earnings from referral bonuses',
    });
    await addColumnIfMissing(queryInterface, 'users', 'is_referrer', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this user can refer others',
    });

    // Update role enum: remove 'agent', keep 'buyer','seller'.
    // Backfill any existing 'agent' rows to 'buyer' first.
    await queryInterface.sequelize.query(
      "UPDATE users SET role = 'buyer' WHERE role = 'agent'"
    );
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('buyer', 'seller'),
      allowNull: false,
      defaultValue: 'buyer',
    });

    // Drop legacy column if present
    await dropColumnIfPresent(queryInterface, 'users', 'is_agent');

    // ---- 2. products ----
    await addColumnIfMissing(queryInterface, 'products', 'seller_level', {
      type: Sequelize.ENUM('importer', 'exporter', 'reseller', 'admin'),
      allowNull: true,
      comment: 'Denormalized seller level for quick filtering',
    });
    await addColumnIfMissing(queryInterface, 'products', 'product_type', {
      type: Sequelize.ENUM('retail', 'wholesale', 'import', 'export'),
      allowNull: false,
      defaultValue: 'retail',
      comment: 'Type of product',
    });
    await addColumnIfMissing(queryInterface, 'products', 'origin_country', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Country of origin (for import products)',
    });
    await addColumnIfMissing(queryInterface, 'products', 'destination_country', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Destination country (for export products)',
    });

    // ---- 3. checkouts ----
    // guest_id is STRING in the model but INT in the DB -> change to VARCHAR(255)
    await queryInterface.changeColumn('checkouts', 'guest_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // ---- 4. user_notifications ----
    await queryInterface.createTable('user_notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('unread', 'read'),
        allowNull: false,
        defaultValue: 'unread',
      },
      user_id: { type: Sequelize.INTEGER, allowNull: true },
      guest_id: { type: Sequelize.STRING, allowNull: true },
      order_id: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_notifications');
    await queryInterface.changeColumn('checkouts', 'guest_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.removeColumn('products', 'destination_country');
    await queryInterface.removeColumn('products', 'origin_country');
    await queryInterface.removeColumn('products', 'product_type');
    await queryInterface.removeColumn('products', 'seller_level');
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('buyer', 'seller', 'agent'),
      allowNull: false,
      defaultValue: 'buyer',
    });
    await queryInterface.removeColumn('users', 'is_referrer');
    await queryInterface.removeColumn('users', 'referral_earnings');
    await queryInterface.removeColumn('users', 'seller_level');
  },
};

// ---- helpers (idempotent ALTERs) ----
async function addColumnIfMissing(qi, table, column, options) {
  const [rows] = await qi.sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'`
  );
  if (rows.length === 0) {
    await qi.addColumn(table, column, options);
    console.log(`  + ${table}.${column} added`);
  } else {
    console.log(`  = ${table}.${column} already exists, skipped`);
  }
}

async function dropColumnIfPresent(qi, table, column) {
  const [rows] = await qi.sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${table}' AND COLUMN_NAME = '${column}'`
  );
  if (rows.length > 0) {
    await qi.removeColumn(table, column);
    console.log(`  - ${table}.${column} dropped`);
  } else {
    console.log(`  = ${table}.${column} already absent, skipped`);
  }
}
