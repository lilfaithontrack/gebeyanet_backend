const Delivery = require('../models/Delivery.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register Delivery
const registerDelivery = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if delivery already exists
    const existingDelivery = await Delivery.findOne({ where: { email } });
    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery user already exists with this email.',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const delivery = await Delivery.create({
      username,
      email,
      password: hashedPassword,
      image: req.body.image || 'admin1.jpg',
    });

    res.status(201).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delivery login
const loginDelivery = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find delivery user by email
    const delivery = await Delivery.findOne({ where: { email } });
    if (!delivery) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, delivery.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: delivery.id }, process.env.JWT_SECRET, {
      expiresIn: '1y', // Token expiration time
    });

    res.status(200).json({
      success: true,
      token,
      data: {
        id: delivery.id,
        username: delivery.username,
        email: delivery.email,
        image: delivery.image,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all delivery users
const getAllDelivery = async (req, res) => {
  try {
    const deliveries = await Delivery.findAll();
    res.status(200).json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get delivery user by ID
const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery user not found',
      });
    }

    res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update delivery user details
const updateDelivery = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery user not found',
      });
    }

    const updatedDelivery = await delivery.update({
      username: username || delivery.username,
      email: email || delivery.email,
      password: password ? await bcrypt.hash(password, 10) : delivery.password,
      image: req.body.image || delivery.image,
    });

    res.status(200).json({
      success: true,
      data: updatedDelivery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete delivery user
const deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery user not found',
      });
    }

    await delivery.destroy();
    res.status(200).json({
      success: true,
      message: 'Delivery user deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { registerDelivery, loginDelivery, getAllDelivery, getDeliveryById, updateDelivery, deleteDelivery };
