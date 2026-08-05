const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  // --- Role ---
  role: {
    type: DataTypes.ENUM('buyer', 'seller'),
    allowNull: false,
    defaultValue: 'buyer',
    comment: 'Determines the user type: buyer or seller',
  },

  // --- Seller Level (only relevant when role='seller') ---
  seller_level: {
    type: DataTypes.ENUM('importer', 'exporter', 'reseller'),
    allowNull: true,
    comment: 'Seller sub-level: importer, exporter, or reseller (null for buyers)',
  },

  // --- Core Identity ---
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Profile photo URL',
  },

  // --- Location ---
  location_lat: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  location_lng: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // --- Seller-specific fields ---
  license_file: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Business license file path (sellers only)',
  },
  seller_code: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Unique seller code',
  },

  // --- Financial ---
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  wallet_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
  referral_earnings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    comment: 'Total earnings from referral bonuses',
  },

  // --- Referral (available to ALL users) ---
  is_referrer: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Whether this user can refer others (true for everyone)',
  },
  referral_code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  referred_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },

  // --- Business ---
  is_company: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  // --- Status ---
  status: {
    type: DataTypes.ENUM('pending', 'active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
  },
  lastsignin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = User;
