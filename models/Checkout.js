const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');
const Cart = require('./Cart.js'); // Assuming you have the Cart model defined

const Checkout = sequelize.define('Checkout', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, // Prevent empty name
    },
  },
  customer_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true, // Ensures email is in a valid format
      notEmpty: true, // Prevent empty email
    },
  },
  customer_phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, // Prevent empty phone
    },
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true, // Prevent empty address
    },
  },
  total_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isFloat: true, // Ensures that the price is a float number
      notEmpty: true, // Prevent empty price
      min: 1, // Minimum order of 1 birr
    },
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  order_status: {
    type: DataTypes.ENUM('pending', 'shipped', 'delivered', 'canceled'),
    defaultValue: 'pending',
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Nullable to handle guest checkouts
  },
  guest_id: {
    type: DataTypes.STRING,
    allowNull: true, // Nullable for logged-in users
  },
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  createdAt: 'created_at', // Specify the column name for createdAt
  updatedAt: 'updated_at', // Specify the column name for updatedAt
  tableName: 'checkouts',
});

// Association with Cart (One-to-Many)
Checkout.hasMany(Cart, { foreignKey: 'checkout_id', onDelete: 'CASCADE' });
Cart.belongsTo(Checkout, { foreignKey: 'checkout_id' });

module.exports = Checkout;

