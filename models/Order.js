const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  region: {
    type: DataTypes.STRING,
    allowNull: false,
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
    allowNull: false,
  },
  payment: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_uploaded: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  total_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  shipment: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  service_payment: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  total_pay: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  ordered_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal("convert_tz(utc_timestamp(),'+00:00','+03:00')"),
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'canceled'),
    defaultValue: 'pending',
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  liyu_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sub_city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  national_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  deliveryman: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'orders',
});

module.exports = Order;
