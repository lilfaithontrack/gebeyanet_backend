const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'cart'
});

// Export the model as the default export
module.exports = Cart;
