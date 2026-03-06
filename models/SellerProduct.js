const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const SellerProduct = sequelize.define('SellerProduct', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  catItems: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subcat: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  productfor: {
  type: DataTypes.STRING,
  allowNull: false,
  defaultValue: 'for_user'
},
  seller_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
   image: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  unit_of_measurement: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stock: {
    type: DataTypes.ENUM('out_of_stock','in_stock','limited_stock'),
    allowNull: true,
  },
  bank: {
    type: DataTypes.STRING,
    allowNull: true, // Optional
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: true, // Optional
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved' , 'declined'),
    allowNull: false,
    defaultValue: 'pending', // Always starts as 'pending'
  },
  location_prices: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      return this.getDataValue('location_prices') || {};
    },
    set(value) {
      let prices = typeof value === 'object' ? value : {};
      // If the default value for 'Addis Ababa' is not set by the user, fallback to the product price
      if (!prices['Addis Ababa']) {
        prices['Addis Ababa'] = this.getDataValue('price') || 0;
      }
      this.setDataValue('location_prices', prices);
    }
  },
  location_stock: {
    type: DataTypes.JSON,
    defaultValue: { "Addis Ababa": "in_stock" },
    get() {
      return this.getDataValue('location_stock') || { "Addis Ababa": "in_stock" };
    },
    set(value) {
      const validated = {};
      for (const [loc, status] of Object.entries(value || {})) {
        validated[loc] = ['in_stock', 'out_of_stock', 'limited_stock'].includes(status) 
          ? status 
          : 'in_stock';
      }
      if (!validated['Addis Ababa']) {
        validated['Addis Ababa'] = 'in_stock';
      }
      this.setDataValue('location_stock', validated);
    }
  },
  location_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'Addis Ababa' // Default is set, but it can be edited
  },
  coordinates: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true,
    defaultValue: () => ({ type: 'Point', coordinates: [38.74, 9.03] }), // Default is set but editable
  },
  location_radius: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 10 // Default value is set, but it can be updated
  }
}, {
  tableName: 'seller_products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SellerProduct;
