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
    },
    shopper_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    delivery_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
