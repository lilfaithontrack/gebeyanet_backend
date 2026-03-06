// controllers/cartController.js
const Cart = require('../models/Cart.js'); // Adjust the path if necessary

// Add a new item to the cart
const addItemToCart = async (req, res) => {
  const { title, image, price } = req.body;

  try {
    const newItem = await Cart.create({ title, image, price });
    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully.',
      cartItem: newItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding item to cart.',
      error: error.message,
    });
  }
};

// Get all items in the cart
const getAllCartItems = async (req, res) => {
  try {
    const cartItems = await Cart.findAll();
    res.status(200).json({
      success: true,
      cartItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cart items.',
      error: error.message,
    });
  }
};

// Get cart item by ID
const getCartItemById = async (req, res) => {
  try {
    const cartItem = await Cart.findByPk(req.params.id);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }
    res.status(200).json({
      success: true,
      cartItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching cart item.',
      error: error.message,
    });
  }
};

// Delete cart item
const deleteCartItem = async (req, res) => {
  try {
    const cartItem = await Cart.findByPk(req.params.id);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    await cartItem.destroy();
    res.status(200).json({
      success: true,
      message: 'Cart item deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting cart item.',
      error: error.message,
    });
  }
};

module.exports = { addItemToCart, getAllCartItems, getCartItemById, deleteCartItem };
