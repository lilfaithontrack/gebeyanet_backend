const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Chat = sequelize.define(
  'Chat',
  {
    sender_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    receiver_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    sender_role: {
      type: DataTypes.ENUM('admin', 'shopper', 'delivery'),
      allowNull: false,
    },
    receiver_role: {
      type: DataTypes.ENUM('admin', 'shopper', 'delivery'),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'Chats',
    timestamps: true,
    paranoid: true, // Enables soft deletion
    indexes: [
      {
        fields: ['sender_id'],
      },
      {
        fields: ['receiver_id'],
      },
      {
        fields: ['is_read'],
      },
    ],
    hooks: {
      afterCreate: (chat, options) => {
        console.log(`New message sent from ${chat.sender_id} to ${chat.receiver_id}`);
      },
    },
  }
);

// Define associations (if you have User, Admin, or DeliveryPerson models)
// Chat.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
// Chat.belongsTo(User, { foreignKey: 'receiver_id', as: 'Receiver' });

module.exports = Chat;
