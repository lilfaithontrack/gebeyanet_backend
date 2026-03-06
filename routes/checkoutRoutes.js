const express = require('express');
const { createCheckout, getCheckoutById } = require('../controllers/checkoutController.js');

const router = express.Router();

// Create a new checkout
router.post('/create', createCheckout);

// Get a checkout by ID with cart items
router.get('/:id', getCheckoutById);

module.exports = router;

