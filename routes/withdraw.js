const express = require('express');
const {
  requestWithdraw,
  getMyWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus,
} = require('../controllers/withdrawController.js');
const { verifyUser } = require('../middlewares/verifyUser.js');
const adminAuth = require('../middlewares/adminMiddleware.js');

const router = express.Router();

// ========================
//  USER ROUTES (auth required)
// ========================

// Request a withdrawal
router.post('/request', verifyUser, requestWithdraw);

// Get my withdrawal history
router.get('/my', verifyUser, getMyWithdrawals);

// ========================
//  ADMIN ROUTES
// ========================

// Get all withdrawal requests (optional ?status=Pending|Approved|Declined)
router.get('/', adminAuth, getAllWithdrawals);

// Approve / Decline a withdrawal
router.put('/:id/status', adminAuth, updateWithdrawalStatus);

module.exports = router;
