const express = require('express');
const { createPayment, updatePaymentStatus, sendOrderToShopperAndDelivery, getOrderHistory, getOrdersByReferralCode, getAllOrders, getPaymentOrderById, assignOrderToNearbyDeliveries, getAvailableOrders, acceptDeliveryOrder } = require('../controllers/paymentController.js');


const router = express.Router();

// Base route for payments
router.post('/create', createPayment);

// Route to update payment status
router.put('/update-status/:payment_id', updatePaymentStatus);
//
router.get('/available', getAvailableOrders);
// Route to fetch order history by customer_email or guest_id
router.get('/orders/history', getOrderHistory);
router.get(
  '/orders/by-referral/:referral_code_from_param', 
  // protect, // General authentication
  // authorizeAgent, // Middleware to check if user is an agent and matches the referral code
  getOrdersByReferralCode
);
// Route to fetch all orders
router.get('/orders', getAllOrders);
//route to fetch the payment order based on the id 
router.get('/orders/:payment_id', getPaymentOrderById);
router.post('/assign-nearby/:payment_id', assignOrderToNearbyDeliveries);

// 2. Delivery user accepts the order
router.post('/accept/:payment_id', acceptDeliveryOrder);


// Route to send order to shopper and delivery (approve and assign)
router.put('/:payment_id/send-order', sendOrderToShopperAndDelivery);

module.exports = router;
