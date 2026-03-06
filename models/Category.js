const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensures no duplicate names
      validate: {
        len: [3, 100], // Name must be between 3 and 100 characters
      },
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: {
        isUrl: true, // Optional: Ensures it's a valid URL
      },
    },
  },
  {
    tableName: 'categories',
    timestamps: false, // Set to true if you need createdAt/updatedAt fields
  }
);

// Hooks for trimming whitespace from name
Category.addHook('beforeValidate', (category) => {
  if (category.name) {
    category.name = category.name.trim();
  }
});

// Define associations
Category.associate = (models) => {
  Category.hasMany(models.Subcategory, {
    foreignKey: 'categoryId',
    as: 'subcategories',
  });
};

module.exports = Category;

