const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Shopper = require('../models/Shopper.js');

// JWT secret and options
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = '1y'; // adjust as needed

// Haversine formula
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Create shopper
const createShopper = async (req, res) => {
  try {
    const { full_name, email, location_lat, location_lng, password } = req.body;

    if (!full_name || !email || !location_lat || !location_lng || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await Shopper.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already in use.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newShopper = await Shopper.create({
      full_name,
      email,
      location_lat,
      location_lng,
      password: hashedPassword,
    });

    res.status(201).json({
      message: 'Shopper created successfully.',
      shopper: {
        id: newShopper.id,
        full_name,
        email,
        location_lat,
        location_lng,
      },
    });
  } catch (error) {
    console.error('Error creating shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Shopper Login (using JWT)
const loginShopper = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const shopper = await Shopper.findOne({ where: { email } });
    if (!shopper) return res.status(404).json({ message: 'Shopper not found.' });

    const isValid = await bcrypt.compare(password, shopper.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid password.' });

    const token = jwt.sign(
      { id: shopper.id, role: 'shopper' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { id, full_name, location_lat, location_lng } = shopper;
    res.status(200).json({
      message: 'Login successful.',
      token,
      shopper: { id, full_name, email, location_lat, location_lng },
    });
  } catch (error) {
    console.error('Error logging in shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get all shoppers
const getAllShoppers = async (req, res) => {
  try {
    const shoppers = await Shopper.findAll();
    res.status(200).json({ shoppers });
  } catch (error) {
    console.error('Error fetching shoppers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get by ID
const getShopperById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopper = await Shopper.findByPk(id);
    if (!shopper) return res.status(404).json({ message: 'Shopper not found.' });
    res.status(200).json({ shopper });
  } catch (error) {
    console.error('Error fetching shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update
const updateShopper = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, location_lat, location_lng, password } = req.body;

    const shopper = await Shopper.findByPk(id);
    if (!shopper) return res.status(404).json({ message: 'Shopper not found.' });

    const hashedPassword = password ? await bcrypt.hash(password, 10) : shopper.password;

    await shopper.update({
      full_name: full_name || shopper.full_name,
      email: email || shopper.email,
      location_lat: location_lat || shopper.location_lat,
      location_lng: location_lng || shopper.location_lng,
      password: hashedPassword,
    });

    res.status(200).json({ message: 'Shopper updated successfully.', shopper });
  } catch (error) {
    console.error('Error updating shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete
const deleteShopper = async (req, res) => {
  try {
    const { id } = req.params;
    const shopper = await Shopper.findByPk(id);
    if (!shopper) return res.status(404).json({ message: 'Shopper not found.' });

    await shopper.destroy();
    res.status(200).json({ message: 'Shopper deleted successfully.' });
  } catch (error) {
    console.error('Error deleting shopper:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Find nearby shoppers
const findNearbyShoppers = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    const shoppers = await Shopper.findAll();

    const nearbyShoppers = shoppers.filter(shopper => {
      const distance = haversine(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(shopper.location_lat),
        parseFloat(shopper.location_lng)
      );
      return distance <= radius;
    });

    res.status(200).json({ message: `${nearbyShoppers.length} nearby shoppers found.`, nearbyShoppers });
  } catch (error) {
    console.error('Error finding nearby shoppers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { createShopper, loginShopper, getAllShoppers, getShopperById, updateShopper, deleteShopper, findNearbyShoppers };
