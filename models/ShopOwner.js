const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js'); // Adjust the path if necessary

const ShopOwner = sequelize.define('ShopOwner', {
  nationalId: {
    // Represents the national identification number
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: { args: [4, 20], msg: 'National ID must be between 4 and 20 characters.' },
    },
  },
  fullName: {
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
  idFile: {
    // Field for file upload (e.g., scanned copy of the ID)
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'ID file path is required.' },
    },
  },
}, {
  tableName: 'shop_owners',
  timestamps: true, // Adds createdAt and updatedAt fields automatically
});

module.exports = ShopOwner;
