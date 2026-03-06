// routes/paymentRoutes.js
const express = require('express');
const { verifyShopper } = require('../middlewares/verifyShopper.js');
const { addPaymentAccount, getMyPaymentAccounts, updatePaymentAccount, deletePaymentAccount } = require('../controllers/ShoperPaymentController.js');

const router = express.Router();

// Add a new payment account
router.post("/", verifyShopper, addPaymentAccount);

// Get all payment accounts for logged-in shopper
router.get("/", verifyShopper, getMyPaymentAccounts);

// Update a payment account
router.put("/:id", verifyShopper, updatePaymentAccount);

// Delete a payment account
router.delete("/:id", verifyShopper, deletePaymentAccount);

module.exports = router;

