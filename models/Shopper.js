const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Shopper = sequelize.define(
  'Shopper',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_lat: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    location_lng: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Shopper',
    tableName: 'shoppers',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Shopper;


