const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnect.js');
const { Router } = require('express');
const Product = require('../models/AddProduct.js');

const router = Router();

// ---------- 1. PRICING MATRIX ----------
// total_cost = base_fee + ((weight_kg / 100) * rate_per_100kg * distance_km)
const PRICING_MATRIX = [
  {
    min_distance_km: 1,
    max_distance_km: 20,
    base_fee: 150,
    weight_tiers: [
      { max_weight_kg: 99, rate_per_100kg: 25 },
      { max_weight_kg: 500, rate_per_100kg: 15 },
      { max_weight_kg: 1500, rate_per_100kg: 10 },
      { max_weight_kg: null, rate_per_100kg: 7 },
    ],
  },
  {
    min_distance_km: 21,
    max_distance_km: 50,
    base_fee: 100,
    weight_tiers: [
      { max_weight_kg: 99, rate_per_100kg: 15 },
      { max_weight_kg: 500, rate_per_100kg: 10 },
      { max_weight_kg: 1500, rate_per_100kg: 7 },
      { max_weight_kg: null, rate_per_100kg: 5 },
    ],
  },
  {
    min_distance_km: 51,
    max_distance_km: 100,
    base_fee: 0,
    weight_tiers: [
      { max_weight_kg: 99, rate_per_100kg: 8 },
      { max_weight_kg: 500, rate_per_100kg: 6 },
      { max_weight_kg: 1500, rate_per_100kg: 5 },
      { max_weight_kg: null, rate_per_100kg: 4 },
    ],
  },
];

// Default pickup location (Kotebe, Addis Ababa)
const DEFAULT_PICKUP = { lat: 9.0408, lng: 38.8347 };

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

function getRatePer100kg(weightKg, weightTiers) {
  for (const tier of weightTiers) {
    if (tier.max_weight_kg === null || weightKg <= tier.max_weight_kg) {
      return tier.rate_per_100kg;
    }
  }
  // Fallback to the last tier (heaviest)
  return weightTiers[weightTiers.length - 1].rate_per_100kg;
}

function getDistanceTier(distanceKm) {
  for (const tier of PRICING_MATRIX) {
    if (distanceKm >= tier.min_distance_km && distanceKm <= tier.max_distance_km) {
      return tier;
    }
  }
  // If distance exceeds 100km, use the last tier (51-100km)
  if (distanceKm > 100) return PRICING_MATRIX[PRICING_MATRIX.length - 1];
  // If distance is below 1km, use the first tier
  return PRICING_MATRIX[0];
}

/**
 * Calculate delivery fee using the pricing matrix formula:
 * total_cost = base_fee + ((weight_kg / 100) * rate_per_100kg * distance_km)
 */
function calculateDeliveryFee(weightKg, distanceKm) {
  const distanceTier = getDistanceTier(distanceKm);
  const ratePer100kg = getRatePer100kg(weightKg, distanceTier.weight_tiers);
  const baseFee = distanceTier.base_fee;

  const weightComponent = (weightKg / 100) * ratePer100kg * distanceKm;
  const totalCost = baseFee + weightComponent;

  return {
    total_cost: parseFloat(totalCost.toFixed(2)),
    base_fee: baseFee,
    rate_per_100kg: ratePer100kg,
    weight_kg: weightKg,
    distance_km: parseFloat(distanceKm.toFixed(2)),
    distance_tier: `${distanceTier.min_distance_km}-${distanceTier.max_distance_km} km`,
    breakdown: {
      base_fee: baseFee,
      weight_component: parseFloat(weightComponent.toFixed(2)),
    },
  };
}

// ---------- 3. ENDPOINT: CALCULATE FEE ----------
// POST /api/delivery-pricing/calculate
// Body: { weight_kg, dropoff_lat, dropoff_lng, pickup_lat?, pickup_lng? }
router.post('/calculate', async (req, res) => {
  try {
    const { weight_kg, dropoff_lat, dropoff_lng, pickup_lat, pickup_lng } = req.body;

    if (weight_kg === undefined || weight_kg === null) {
      return res.status(400).json({ error: 'weight_kg is required' });
    }
    if (dropoff_lat === undefined || dropoff_lng === undefined) {
      return res.status(400).json({ error: 'dropoff_lat and dropoff_lng are required' });
    }

    const pickupLat = pickup_lat !== undefined ? pickup_lat : DEFAULT_PICKUP.lat;
    const pickupLng = pickup_lng !== undefined ? pickup_lng : DEFAULT_PICKUP.lng;

    const distanceKm = calculateDistanceKm(pickupLat, pickupLng, dropoff_lat, dropoff_lng);
    const result = calculateDeliveryFee(parseFloat(weight_kg), distanceKm);

    res.json({
      delivery_fee: result.total_cost,
      ...result,
    });
  } catch (err) {
    console.error('Delivery pricing error:', err);
    res.status(500).json({ error: 'Error calculating delivery fee' });
  }
});

// ---------- 4. ENDPOINT: CALCULATE FEE FROM CART ----------
// POST /api/delivery-pricing/calculate-from-cart
// Body: { cart_items: [{ product_id, quantity }], dropoff_lat, dropoff_lng, pickup_lat?, pickup_lng? }
// Looks up product weights from the database and computes total weight.
router.post('/calculate-from-cart', async (req, res) => {
  try {
    const { cart_items, dropoff_lat, dropoff_lng, pickup_lat, pickup_lng } = req.body;

    if (!Array.isArray(cart_items) || cart_items.length === 0) {
      return res.status(400).json({ error: 'cart_items must be a non-empty array' });
    }
    if (dropoff_lat === undefined || dropoff_lng === undefined) {
      return res.status(400).json({ error: 'dropoff_lat and dropoff_lng are required' });
    }

    // Fetch all products in one query
    const productIds = cart_items.map(item => parseInt(item.product_id, 10));
    const products = await Product.findAll({
      where: { id: productIds },
      attributes: ['id', 'weight_kg', 'sell_unit', 'title'],
    });

    // Build a lookup map
    const productMap = new Map(products.map(p => [p.id, p]));

    // Calculate total weight
    let totalWeightKg = 0;
    const itemBreakdown = [];
    for (const item of cart_items) {
      const productId = parseInt(item.product_id, 10);
      const product = productMap.get(productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product_id} not found` });
      }
      const unitWeight = product.weight_kg || 0;
      const itemWeight = unitWeight * item.quantity;
      totalWeightKg += itemWeight;
      itemBreakdown.push({
        product_id: item.product_id,
        title: product.title,
        quantity: item.quantity,
        unit_weight_kg: unitWeight,
        total_weight_kg: parseFloat(itemWeight.toFixed(2)),
      });
    }

    const pickupLat = pickup_lat !== undefined ? pickup_lat : DEFAULT_PICKUP.lat;
    const pickupLng = pickup_lng !== undefined ? pickup_lng : DEFAULT_PICKUP.lng;

    const distanceKm = calculateDistanceKm(pickupLat, pickupLng, dropoff_lat, dropoff_lng);
    const result = calculateDeliveryFee(totalWeightKg, distanceKm);

    res.json({
      delivery_fee: result.total_cost,
      total_weight_kg: parseFloat(totalWeightKg.toFixed(2)),
      ...result,
      items: itemBreakdown,
    });
  } catch (err) {
    console.error('Delivery pricing from cart error:', err);
    res.status(500).json({ error: 'Error calculating delivery fee from cart' });
  }
});

// ---------- 5. ENDPOINT: GET PRICING MATRIX ----------
// GET /api/delivery-pricing/matrix
// Returns the pricing matrix for display in admin/frontend.
router.get('/matrix', (req, res) => {
  res.json({
    formula: 'total_cost = base_fee + ((weight_kg / 100) * rate_per_100kg * distance_km)',
    pricing_matrix: PRICING_MATRIX,
    default_pickup: DEFAULT_PICKUP,
  });
});

module.exports = { router, calculateDeliveryFee, calculateDistanceKm, PRICING_MATRIX };
