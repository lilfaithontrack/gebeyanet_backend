const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const Shop = require('../models/Shop.js');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the uploads directory
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage }).single('licenseFile');

/**
 * Register a new shop
 */
const registerShop = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed.', details: err.message });
    }

    try {
      const { name, address, email, phone, latitude, longitude } = req.body;

      // Validate required fields
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and Longitude are required.' });
      }

      // Create shop
      const shop = await Shop.create({
        name,
        address,
        email,
        phone,
        licenseFile: req.file ? req.file.filename : null,
        latitude,
        longitude,
      });

      return res.status(201).json({ message: 'Shop registered successfully.', shop });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to register shop.', details: error.message });
    }
  });
};

/**
 * Get all shops
 */
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.findAll();
    return res.status(200).json(shops);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch shops.', details: error.message });
  }
};

/**
 * Get shop by ID
 */
const getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findByPk(id);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found.' });
    }

    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch shop.', details: error.message });
  }
};

/**
 * Update shop
 */
const updateShop = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed.', details: err.message });
    }

    try {
      const { id } = req.params;
      const { name, address, email, phone, latitude, longitude } = req.body;

      const shop = await Shop.findByPk(id);

      if (!shop) {
        return res.status(404).json({ error: 'Shop not found.' });
      }

      // Update shop details
      shop.name = name || shop.name;
      shop.address = address || shop.address;
      shop.email = email || shop.email;
      shop.phone = phone || shop.phone;
      shop.latitude = latitude || shop.latitude;
      shop.longitude = longitude || shop.longitude;

      if (req.file) {
        shop.licenseFile = req.file.filename;
      }

      await shop.save();

      return res.status(200).json({ message: 'Shop updated successfully.', shop });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update shop.', details: error.message });
    }
  });
};

/**
 * Delete shop
 */
const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findByPk(id);

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found.' });
    }

    await shop.destroy();
    return res.status(200).json({ message: 'Shop deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete shop.', details: error.message });
  }
};

/**
 * Find nearby shops
 */
const findNearbyShops = async (req, res) => {
  const { latitude, longitude, radius = 10 } = req.query; // Radius in kilometers

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and Longitude are required for nearby search.' });
  }

  try {
    // Convert radius to degrees (Earth's circumference ≈ 40,075 km)
    const radiusInDegrees = radius / 111.32;

    const nearbyShops = await Shop.findAll({
      where: {
        latitude: {
          [Op.between]: [latitude - radiusInDegrees, latitude + radiusInDegrees],
        },
        longitude: {
          [Op.between]: [longitude - radiusInDegrees, longitude + radiusInDegrees],
        },
      },
    });

    return res.status(200).json(nearbyShops);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to find nearby shops.', details: error.message });
  }
};
const loginShopper = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the shop exists
    const shop = await Shop.findOne({ where: { email } });

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, shop.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: shop.id, email: shop.email }, 'your_jwt_secret', { expiresIn: '7d' });

    return res.status(200).json({ message: 'Login successful.', token, shop });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed.', details: error.message });
  }
};

module.exports = { registerShop, getAllShops, getShopById, updateShop, deleteShop, findNearbyShops, loginShopper };
