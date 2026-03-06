const { Model, DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js'); // Import your Sequelize instance
const Shopper = require('./Shopper.js');
const DeliveryBoy = require('./DeliveryBoy.js');

class AssignOrder extends Model {}

AssignOrder.init(
  {
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Payments', // References the Payments table
        key: 'id', // Payment ID in the Payments table
      },
      onDelete: 'CASCADE', // If a Payment is deleted, remove related assignments
    },
    shopper_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'shoppers', // References the shoppers table
        key: 'id', // Shopper ID in the shoppers table
      },
      onDelete: 'SET NULL', // Set to NULL if the Shopper is deleted
    },
    delivery_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'delivery_boys', // References the delivery_boys table
        key: 'id', // Delivery Boy ID in the delivery_boys table
      },
      onDelete: 'SET NULL', // Set to NULL if the Delivery Boy is deleted
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Assigned', // Default status is "Assigned"
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Automatically set to the current timestamp
    },
  },
  {
    sequelize, // Pass your Sequelize instance
    modelName: 'AssignOrder', // Model name
    tableName: 'assign_orders', // Table name in the database
    timestamps: true, // Enable createdAt and updatedAt fields
  }
);

// Associations after model initialization
AssignOrder.associate = (models) => {
  AssignOrder.belongsTo(models.Shopper, {
    foreignKey: 'shopper_id',
    as: 'shopper',
  });

  AssignOrder.belongsTo(models.DeliveryBoy, {
    foreignKey: 'delivery_id',
    as: 'deliveryBoy',
  });
};

module.exports = AssignOrder;
