const express = require('express');
const { loginDelivery } = require('../controllers/deliveryController.js'); // Import your authentication middleware

const router = express.Router();

// Routes for delivery user management
 // Register a new delivery user
router.post('/login', loginDelivery); 

module.exports = router;
