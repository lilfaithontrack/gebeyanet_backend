const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js'); // Adjust the path if necessary
const ShopOwner = require('./ShopOwner.js'); // Import the ShopOwner model

const Shop = sequelize.define('Shop', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Must be a valid email address.' },
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isNumeric: { msg: 'Phone number must contain only digits.' },
    },
  },
  licenseFile: {
    // Field for file upload (e.g., scanned copy of the business license)
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  shopOwnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ShopOwner, // Reference the imported model
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'shops',
  timestamps: true, // Adds createdAt and updatedAt fields automatically
});

// Define associations if not already set elsewhere
Shop.belongsTo(ShopOwner, {
  foreignKey: 'shopOwnerId',
  as: 'shopOwner', // Alias for the relationship
});

module.exports = Shop;

