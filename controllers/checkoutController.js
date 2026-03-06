const { v4: uuidv4 } = require('uuid');
// controllers/checkoutController.js
const Checkout = require('../models/Checkout.js');   // Use the exact file path
const Cart = require('../models/Cart.js');  // Use the exact file path
 // Make sure the models are correctly imported from your models directory
const sequelize = require('../db/dbConnect.js'); // Assuming sequelize instance is correctly imported from the appropriate file


const createCheckout = async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    total_price,
    user_id,  // Optional
    cartItems,
  } = req.body;

  // Validate required fields
  if (!customer_name || !customer_email || !customer_phone || !shipping_address || !total_price || !cartItems) {
    return res.status(400).json({
      message: 'All fields (customer details, total price, and cart items) are required.',
    });
  }

  const t = await sequelize.transaction();  // Start a new transaction

  try {
    // Create the checkout entry within the transaction
    const newCheckout = await Checkout.create({
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      total_price,
      payment_status: 'pending',
      order_status: 'pending',
      user_id: user_id || null,  // Optional user_id (set to null if not provided)
      guest_id: uuidv4(),  // Generate a guest ID
      created_at: new Date(),
      updated_at: new Date(),
    }, { transaction: t });  // Include the transaction here

    // Create associated cart items within the same transaction
    const cartData = cartItems.map((item) => ({
      ...item,
      checkout_id: newCheckout.id,  // Associate with the checkout
    }));

    await Cart.bulkCreate(cartData, { transaction: t });  // Include the transaction here

    // Commit the transaction
    await t.commit();

    res.status(201).json({
      message: 'Checkout created successfully.',
      checkout: newCheckout,
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await t.rollback();
    console.error('Error creating checkout:', error);
    res.status(500).json({
      message: 'Error creating checkout.',
      error: error.message,
    });
  }
};

// Fetch checkout by ID with cart items
const getCheckoutById = async (req, res) => {
  const { id } = req.params;

  try {
    const checkout = await Checkout.findByPk(id, {
      include: [Cart], // Include associated cart items in the response
    });

    if (!checkout) {
      return res.status(404).json({
        message: `Checkout with ID ${id} not found.`,
      });
    }

    res.status(200).json(checkout);
  } catch (error) {
    console.error('Error fetching checkout:', error);
    res.status(500).json({
      message: 'Error fetching checkout.',
      error: error.message,
    });
  }
};

module.exports = { createCheckout, getCheckoutById };
