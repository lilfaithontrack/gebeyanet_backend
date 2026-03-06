const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  color: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  size: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  stock: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'limited_stock'),
    allowNull: false,
    defaultValue: 'in_stock',
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },
  catItems: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },
  subcat: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    },
  },

  // --- Seller Ownership ---
  seller_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'The user (role=seller or buyer) who owns this product',
  },
  seller_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },

  // --- Purchase Limits ---
  min_order_qty: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 0.01 },
    comment: 'Minimum order quantity (e.g., 1 piece, 12 dozen, 100 kg)',
  },
  max_order_qty: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: null,
    comment: 'Optional maximum order quantity per purchase',
  },
  sell_unit: {
    type: DataTypes.ENUM('piece', 'dozen', 'kg', 'quintal', 'box', 'liter', 'meter', 'pack', 'pair'),
    allowNull: false,
    defaultValue: 'piece',
    comment: 'Unit of sale for this product',
  },
  unit_of_measurement: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  sku: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  image: {
    type: DataTypes.JSON,
    allowNull: true, // Optional general image gallery
    get() {
      const value = this.getDataValue('image');
      try {
        return value ? JSON.parse(value) : [];
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('image', JSON.stringify(value || []));
    }
  },
  color_options: {
    type: DataTypes.JSON,
    allowNull: true, // Optional color-specific images, can be null
    get() {
      const value = this.getDataValue('color_options');
      try {
        return value ? JSON.parse(value) : [];
      } catch (e) {
        return [];
      }
    },
    set(value) {
      if (value === null || value === undefined) {
        this.setDataValue('color_options', null);
        return;
      }
      if (!Array.isArray(value)) {
        throw new Error('Color options must be an array of objects.');
      }
      value.forEach(opt => {
        if (!opt.color_name || typeof opt.color_name !== 'string') {
          throw new Error('Each color option must have a valid "color_name".');
        }
        if (!opt.images || !Array.isArray(opt.images)) {
          throw new Error(`The images for color "${opt.color_name}" must be an array.`);
        }
      });
      this.setDataValue('color_options', JSON.stringify(value));
    }
  },
  variations: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    get() {
      const value = this.getDataValue('variations');
      try {
        return value ? JSON.parse(value) : [];
      } catch (e) {
        return [];
      }
    },
    set(value) {
      if (!Array.isArray(value)) {
        throw new Error('Variations must be an array.');
      }
      const validStockValues = ['in_stock', 'out_of_stock', 'limited_stock'];
      value.forEach(v => {
        if (v.price === undefined || v.stock === undefined) {
          throw new Error('Each variation must have a price and stock.');
        }
        if (typeof v.price !== 'number' || v.price < 0) {
          throw new Error('Variation price must be a non-negative number.');
        }
        if (!validStockValues.includes(v.stock)) {
          throw new Error(`Invalid stock value. Must be one of: ${validStockValues.join(', ')}`);
        }
      });
      this.setDataValue('variations', JSON.stringify(value));
    }
  },
  productfor: {
    type: DataTypes.ENUM('for_seller', 'for_user'),
    allowNull: false,
    defaultValue: 'for_user',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  location_prices: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      return this.getDataValue('location_prices') || {};
    },
    set(value) {
      let prices = typeof value === 'object' && value !== null ? value : {};
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
  location_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'region',
    validate: {
      isIn: [['region', 'coordinates', 'hybrid']]
    }
  },
  location_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'Addis Ababa'
  },
  coordinates: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true,
    defaultValue: () => ({ type: 'Point', coordinates: [38.74, 9.03] })
  },
  location_radius: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 10
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Product;
