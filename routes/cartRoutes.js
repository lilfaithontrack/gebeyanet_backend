const express = require('express');
const { addItemToCart, getAllCartItems, getCartItemById, deleteCartItem } = require('../controllers/cartController.js'); // Adjust the path if necessary

const router = express.Router();

// Route to add an item to the cart (no authentication required)
router.post('/add-item', addItemToCart);

// Route to get all cart items (no authentication required)
router.get('/cart-items', getAllCartItems);

// Route to get a cart item by ID (no authentication required)
router.get('/cart-items/:id', getCartItemById);

// Route to delete a cart item (no authentication required)
router.delete('/cart-items/:id', deleteCartItem);

// Export the router as default
module.exports = router;
