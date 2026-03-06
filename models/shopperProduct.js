const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js'); // Make sure this path is correct for your project

/**
 * Defines the ShopperProduct model, representing a product listed by a shopper.
 */
const ShopperProduct = sequelize.define('ShopperProduct', {
  // --- Core Attributes ---
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  shopper_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'shoppers', // Assumes your Shopper model's table is named 'shoppers'
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },

  // --- Basic Product Details ---
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Product title cannot be empty.' },
      len: { args: [2, 255], msg: 'Title must be between 2 and 255 characters.' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Description cannot be empty.' }
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), // Best data type for currency
    allowNull: false,
    validate: {
      isDecimal: true,
      min: { args: [0], msg: 'Price must be a non-negative value.' }
    }
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // --- Categorization ---
  catItems: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'category_items',
    validate: {
      notEmpty: { msg: 'Category is required.' }
    },
  },
  subcat: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'subcategory',
    validate: {
      notEmpty: { msg: 'Subcategory is required.' }
    },
  },

  // --- Inventory and Status ---
  stock: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'limited_stock'),
    allowNull: false,
    defaultValue: 'in_stock',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  productfor: {
    type: DataTypes.ENUM('for_seller', 'for_user'),
    allowNull: false,
    defaultValue: 'for_user',
  },

  // --- Rich Content (JSON Fields) ---
  image: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'An array of URLs for the general product image gallery.'
  },
  color_options: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'An array of objects, e.g., [{ color_name: "Red", images: [...] }].'
  },
  variations: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [], // Default to an empty JSON array string
    comment: 'e.g., [{ size: "M", color: "Blue", price: 15.99, stock: "in_stock" }]'
  },

  // --- Location-Based Fields ---
  location_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'Addis Ababa'
  },
  location_prices: {
    type: DataTypes.JSON,
    defaultValue: '{}',
    comment: 'Object mapping location names to prices, e.g., { "Addis Ababa": 100, "Adama": 110 }'
  },
  location_stock: {
    type: DataTypes.JSON,
    defaultValue: '{}',
    comment: 'Object mapping location names to stock status.'
  },
  coordinates: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true,
    comment: 'Stores the geographic point for location-based searches.'
    // Note: Default value for GEOMETRY is often handled at the database level or via hooks
  },
  location_radius: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 10,
    comment: 'Service radius in kilometers from the coordinates.'
  }
}, {
  // --- Model Configuration Options ---
  tableName: 'shopper_products',
  sequelize, // Pass the sequelize instance
  timestamps: true, // Enable automatic handling of createdAt and updatedAt
  createdAt: 'created_at', // Map createdAt to a 'created_at' column
  updatedAt: 'updated_at', // Map updatedAt to an 'updated_at' column
  hooks: {
    // A hook to handle specific data manipulations before validation occurs.
    beforeValidate: (product, options) => {
      // Set default location price based on the main price if not already set
      const prices = (typeof product.location_prices === 'string')
        ? JSON.parse(product.location_prices)
        : (product.location_prices || {});

      if (!prices[product.location_name]) {
        prices[product.location_name] = product.price;
        product.location_prices = prices; // Sequelize will stringify this JSON object
      }

       // Set default location stock status if not already set
       const stock = (typeof product.location_stock === 'string')
       ? JSON.parse(product.location_stock)
       : (product.location_stock || {});

     if (!stock[product.location_name]) {
       stock[product.location_name] = product.stock;
       product.location_stock = stock; // Sequelize will stringify this JSON object
     }
    }
  }
});

module.exports = ShopperProduct;

