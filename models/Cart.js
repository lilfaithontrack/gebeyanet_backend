const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  checkout_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'checkouts', key: 'id' },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'cart'
});

// Export the model as the default export
module.exports = Cart;
