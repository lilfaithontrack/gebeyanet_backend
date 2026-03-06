const express = require('express');
const { createReceipt, getAllReceipts, getReceiptById, updateReceipt, deleteReceipt } = require('../controllers/receiptController.js');
const adminAuth = require('../middlewares/adminMiddleware.js');

const router = express.Router();

router.post('/receipt', createReceipt); // Create a receipt
router.get('/receipt', adminAuth, getAllReceipts); // Get all receipts
router.get('/receipt/:id', getReceiptById); // Get a receipt by ID
router.put('/receipt/:id', updateReceipt); // Update a receipt
router.delete('/receipt/:id', deleteReceipt); // Delete a receipt by ID

module.exports = router;
