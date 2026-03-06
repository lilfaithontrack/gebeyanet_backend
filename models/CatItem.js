const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js'); // Adjust path if necessary

const CatItem = sequelize.define('CatItem', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'CatItem name cannot be empty',
      },
    },
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'cat_items',
});

module.exports = CatItem;
