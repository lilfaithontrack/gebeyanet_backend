const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Notification = sequelize.define(
  'UserNotification', // model name kept distinct from Telalaki.js 'Notification' to avoid duplicate define()
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
    tableName: 'user_notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Notification;
