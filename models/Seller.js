const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js'); // Ensure the path is correct and ends with .js

const Seller = sequelize.define('Seller', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true, // Optional profile photo
  },
  license_file: {
    type: DataTypes.TEXT,
    allowNull: true, // Optional license file
  },
  bank: {
    type: DataTypes.TEXT,
    allowNull: true, // Optional bank name
  },
  account_number: {
    type: DataTypes.TEXT,
    allowNull: true, // Optional account number
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending', // Default status set to 'pending'
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
 address:{
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'seller',
  timestamps: false, // Disable automatic timestamps
});

module.exports = Seller;

