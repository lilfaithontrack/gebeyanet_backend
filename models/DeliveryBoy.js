const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const DeliveryBoy = sequelize.define(
  'DeliveryBoy',
  {
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Full name is required.' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please enter a valid email address.' },
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Location is required.' },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required.' },
      },
    },
  },
  {
    tableName: 'delivery_boys',
    timestamps: true,
  }
);



module.exports = DeliveryBoy;
