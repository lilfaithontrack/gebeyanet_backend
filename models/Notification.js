const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Notification = sequelize.define(
  'Notification',
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('unread', 'read'),
      allowNull: false,
      defaultValue: 'unread', // Default to unread
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable in case of guest notifications
    },
    guest_id: {
      type: DataTypes.STRING, // Optional field for guest notifications
      allowNull: true,
    },
    order_id: {
      type: DataTypes.INTEGER, // Link to an order if relevant
      allowNull: true,
    },
  },
  {
    tableName: 'Notifications',
    timestamps: true,
  }
);

module.exports = Notification;
