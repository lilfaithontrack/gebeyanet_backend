const Cart = require('../models/Cart.js');
const Order = require('../models/Order.js');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { processPaymentGateway } = require('../services/paymentService.js'); // Payment processing service
const Payment = require('../models/Payment.js'); // Import Payment model if storing separately

// Create a new order from the cart
const createOrder = async (req, res) => {
  const { userId, paymentMethod, shippingAddress, servicePayment } = req.body;

  if (!userId || !paymentMethod || !shippingAddress) {
    return res.status(400).json({
      success: false,
      message: 'Missing required order details: userId, paymentMethod, or shippingAddress.',
    });
  }

  try {
    const cartItems = await Cart.findAll({ where: { userId } });
    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const totalPrice = cartItems.reduce((total, item) => total + parseFloat(item.price), 0);
    const totalPay = totalPrice + (servicePayment || 0);

    const newOrder = await Order.create({
      userId,
      address: shippingAddress,
      payment: paymentMethod,
      total_price: totalPrice,
      total_pay: totalPay,
      service_payment: servicePayment,
      ordered_at: new Date(),
      status: 'pending', // Initial status is pending
      payment_status: 'pending', // Add payment status field (pending)
    });

    // Clear the cart after creating the order
    await Cart.destroy({ where: { userId } });

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      order: newOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating the order.',
      error: error.message,
    });
  }
};

// Process payment for an order
const processPayment = async (req, res) => {
  const { orderId, paymentDetails } = req.body;

  if (!orderId || !paymentDetails) {
    return res.status(400).json({
      success: false,
      message: 'Order ID and payment details are required.',
    });
  }

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order has already been completed.',
      });
    }

    // Chapa Payment Processing
    if (order.payment === 'chapa') {
      const paymentResult = await processPaymentGateway(paymentDetails, order.total_pay);

      if (paymentResult.success) {
        order.status = 'completed';
        order.payment_status = 'completed'; // Mark payment as completed
        order.payment_transaction_id = paymentResult.transactionId;
        await order.save();

        // Optional: Create a payment record if using a separate Payment model
        await Payment.create({
          orderId: order.id,
          paymentMethod: 'chapa',
          amountPaid: order.total_pay,
          transactionId: paymentResult.transactionId,
          status: 'success',
          paymentDate: new Date(),
        });

        return res.status(200).json({
          success: true,
          message: 'Payment successful and order completed.',
          order,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Payment failed. Please check your payment details.',
          error: paymentResult.error,
        });
      }
    }

    // Screenshot Payment Processing
    if (order.payment === 'screenshot') {
      // You should have logic here to validate the screenshot (e.g., file upload handling)
      if (!paymentDetails.screenshot) {
        return res.status(400).json({
          success: false,
          message: 'Screenshot is required for payment validation.',
        });
      }

      // Validate screenshot file (can be stored on cloud storage or locally)
      const screenshotUrl = await uploadScreenshot(paymentDetails.screenshot); // Add upload logic

      order.status = 'completed';
      order.payment_status = 'completed'; // Mark payment as completed
      order.payment_screenshot_url = screenshotUrl; // Store screenshot URL
      await order.save();

      // Optionally create a payment record if you are storing payment details separately
      await Payment.create({
        orderId: order.id,
        paymentMethod: 'screenshot',
        amountPaid: order.total_pay,
        status: 'success',
        paymentDate: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: 'Screenshot uploaded and order completed.',
        order,
      });
    }

    // Handle unsupported payment method
    return res.status(400).json({
      success: false,
      message: 'Unsupported payment method.',
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment.',
      error: error.message,
    });
  }
};

// Helper function to upload screenshots (You would need to implement this)
async function uploadScreenshot(screenshot) {
  // Example of cloud storage integration or file storage logic
  // For now, this function returns a placeholder URL
  return 'https://example.com/path-to-screenshot.jpg';
}

// Get an order by its ID
const getOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving order.',
      error: error.message,
    });
  }
};

// Get all orders for a specific user
const getAllOrders = async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.findAll({ where: { userId } });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for this user.',
      });
    }

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving orders.',
      error: error.message,
    });
  }
};

// Delete an order by its ID
const deleteOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    await order.destroy();

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order.',
      error: error.message,
    });
  }
};

module.exports = { createOrder, processPayment, getOrder, getAllOrders, deleteOrder };
