const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Subcategory = sequelize.define('Subcategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING, // Store image URL or file path
    allowNull: true, // Nullable if not required
    defaultValue: null, // Default to null if no image is provided
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories', // Reference the Category table
      key: 'id',
    },
  },
}, {
  tableName: 'subcategories',
  timestamps: false,
});

// Define associations
Subcategory.associate = (models) => {
  Subcategory.belongsTo(models.Category, {
    foreignKey: 'categoryId',
    as: 'category',
  });
};

module.exports = Subcategory;
