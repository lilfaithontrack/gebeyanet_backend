const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');

const VehicleFiles = sequelize.define('VehicleFiles', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },

  // Required Photos
  car_photo: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  car_license_photo: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  commercial_license: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  owner_id_photo: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },

  // Uploaded filled document (Word/PDF)
  filled_document: { 
    type: DataTypes.STRING,  // file path or URL
    allowNull: false 
  },

  // Optional: version of the template used
  template_version: { 
    type: DataTypes.STRING, 
    defaultValue: "v1.0" 
  }

}, { 
  tableName: 'VehicleFiles', 
  timestamps: true 
});

module.exports = VehicleFiles;
