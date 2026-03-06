const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js'); // Adjust path to your Sequelize instance

const Cat = sequelize.define('Cat', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Cats',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('category', 'subcategory'),
    allowNull: false,
    defaultValue: 'category',
  },
});

Cat.hasMany(Cat, {
  foreignKey: 'parentId',
  as: 'subcategories',
});

Cat.belongsTo(Cat, {
  foreignKey: 'parentId',
  as: 'parentCategory',
});

module.exports = Cat;
