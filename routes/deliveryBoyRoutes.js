const express = require('express');
const { createDeliveryBoy, loginDeliveryBoy, // Added login controller
  getAllDeliveryBoys, getDeliveryBoyById, updateDeliveryBoy, deleteDeliveryBoy } = require('../controllers/deliveryBoyController.js');

const router = express.Router();

// Routes
router.post('/', createDeliveryBoy);          // Create a new delivery boy
router.post('/login', loginDeliveryBoy);     // Login for delivery boy
router.get('/', getAllDeliveryBoys);          // Get all delivery boys
router.get('/:id', getDeliveryBoyById);      // Get a specific delivery boy by ID
router.put('/:id', updateDeliveryBoy);       // Update a specific delivery boy
router.delete('/:id', deleteDeliveryBoy);    // Delete a delivery boy by ID

module.exports = router;
