const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const Payment = sequelize.define(
  'Payment',
  {
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'banktransfer',
    },
    payment_screenshot: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pending',
    },
    cart_items: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    total_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    service_fee: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    delivery_fee: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    shipping_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    referral_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    guest_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 🆕 Location fields
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    search_radius_km: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 5, // Match MAX_RADIUS_KM
    },

    // 🆕 Shopper IDs (assigned)
    shopper_ids: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // 🆕 QR Code
    qr_code: {
      type: DataTypes.TEXT, // base64 data URLs can be long
      allowNull: true,
    },
  },
  {
    tableName: 'Payments',
    timestamps: true,
  }
);

module.exports = Payment;
