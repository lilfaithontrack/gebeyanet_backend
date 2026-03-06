const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');
const Checkout = require('./Checkout.js');

const Receipt = sequelize.define('Receipt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  checkout_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Checkout,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  guest_token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  receipt_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    defaultValue: Sequelize.UUIDV4,
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  issued_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
  total_paid: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'receipts',
});

Receipt.belongsTo(Checkout, { foreignKey: 'checkout_id', as: 'checkout' });

module.exports = Receipt;
