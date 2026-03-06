const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const UOM = sequelize.define('UOM', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('size', 'volume', 'weight', 'level'),
    allowNull: false,
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  stock_status: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'limited_stock'),
    defaultValue: 'in_stock',
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const val = this.getDataValue('images');
      return val ? JSON.parse(val) : [];
    },
    set(value) {
      this.setDataValue('images', JSON.stringify(value));
    },
  }
}, {
  tableName: 'uoms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = UOM;
