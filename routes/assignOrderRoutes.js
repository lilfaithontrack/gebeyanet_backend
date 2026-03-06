const express = require('express');
const { getAllAssignedOrders, assignOrder, getAssignedOrderByPaymentId, deleteAssignedOrder, getAssignedOrdersForShopper, getAssignedOrdersForDeliveryBoy, updateOrderStatus } = require('../controllers/assignOrderController.js');

const router = express.Router();

// General routes
router.put('/assigned-orders/:payment_id/status', updateOrderStatus);
router.get('/assigned-orders', getAllAssignedOrders); // Get all assigned orders
router.post('/assign', assignOrder); // Assign order to shopper and delivery boy
router.get('/assigned-orders/:payment_id', getAssignedOrderByPaymentId); // Get order by payment_id
router.delete('/assigned-orders/:payment_id', deleteAssignedOrder); // Delete assignment by payment_id

// Routes specific to shoppers and delivery boys
router.get('/assigned-orders/shopper/:shopper_id', getAssignedOrdersForShopper); // Get orders for a specific shopper
router.get('/assigned-orders/deliveryboy/:delivery_id', getAssignedOrdersForDeliveryBoy); // Get orders for a specific delivery boy

module.exports = router;
