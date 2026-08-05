const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ids: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  payment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  file_uploaded: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  total_price: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  shipment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  service_payment: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  total_pay: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  ordered_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal("convert_tz(utc_timestamp(),'+00:00','+03:00')"),
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'canceled'),
    defaultValue: 'pending',
  },
  payment_status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'pending',
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  liyu_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sub_city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  national_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deliveryman: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'orders',
});

module.exports = Order;
