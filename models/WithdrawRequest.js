const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const WithdrawRequest = sequelize.define('WithdrawRequest', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    defaultValue: 1000,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Declined'),
    defaultValue: 'Pending',
  },
}, {
  timestamps: true,
});

module.exports = WithdrawRequest;
