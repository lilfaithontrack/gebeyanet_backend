const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');
const { Router } = require('express');

const router = Router();

// ---------- 1. MODEL ----------
const DeliveryFeeSetting = sequelize.define('DeliveryFeeSetting', {
  startup_fee: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 150,
  },
  per_quantity_fee: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 5,
  },
  per_km_fee: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 15,
  },
  weight_threshold: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 100, // kg
  },
  weight_percentage_increase: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 10, // means +10% on per_km_fee
  },
  pickup_lat: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 9.0306, // Default: Figa, Addis Ababa
  },
  pickup_lng: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 38.7613,
  },
}, {
  tableName: 'DeliveryFeeSettings',
  timestamps: true,
});

// Seed default config
const seedConfig = async () => {
  try {
    await DeliveryFeeSetting.findOrCreate({
      where: { id: 1 },
      defaults: {}
    });
  } catch (err) {
    console.error('Error seeding DeliveryFeeSetting:', err);
  }
};
// ---------- 2. HELPERS ----------
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------- 3. CONTROLLER: CALCULATE FEE ----------
router.post('/calculate-fee', async (req, res) => {
  try {
    const { quantity, weight_kg, dropoff_lat, dropoff_lng } = req.body;

    if (!quantity || !weight_kg || !dropoff_lat || !dropoff_lng) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const config = await DeliveryFeeSetting.findByPk(1);
    if (!config) return res.status(500).json({ error: 'Fee config not found' });

    const distanceKm = calculateDistanceKm(
      config.pickup_lat,
      config.pickup_lng,
      dropoff_lat,
      dropoff_lng
    );

    let effectivePerKmFee = config.per_km_fee;

    if (weight_kg > config.weight_threshold) {
      const increase = (config.weight_percentage_increase / 100) * config.per_km_fee;
      effectivePerKmFee += increase;
    }

    const fee =
      config.startup_fee +
      quantity * config.per_quantity_fee +
      distanceKm * effectivePerKmFee;

    res.json({
      delivery_fee: parseFloat(fee.toFixed(2)),
      distance_km: parseFloat(distanceKm.toFixed(2)),
      weight_kg,
      quantity,
      effective_per_km_fee: effectivePerKmFee,
      config_used: config,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error calculating delivery fee' });
  }
});

// ---------- 4. CONTROLLER: UPDATE CONFIG ----------
router.put('/update-fee-config', async (req, res) => {
  try {
    const {
      startup_fee,
      per_quantity_fee,
      per_km_fee,
      weight_threshold,
      weight_percentage_increase,
      pickup_lat,
      pickup_lng,
    } = req.body;

    const updated = await DeliveryFeeSetting.update(
      {
        startup_fee,
        per_quantity_fee,
        per_km_fee,
        weight_threshold,
        weight_percentage_increase,
        pickup_lat,
        pickup_lng,
      },
      { where: { id: 1 } }
    );

    res.json({ message: 'Fee config updated', updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

module.exports = { DeliveryFeeSetting, router, seedConfig };
