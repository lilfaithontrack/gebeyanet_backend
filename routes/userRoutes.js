const express = require('express');
const {
    upload,
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    upgradeToSeller,
    getReferralStats,
    getAdminReferralStats,
    getUserById,
    getAllUsers,
    updateUser,
    updateUserStatus,
    deleteUser,
    sendOtp,
    verifyOtp,
    forgotPassword,
    resetPassword,
} = require('../controllers/userController.js');
const { verifyUser } = require('../middlewares/verifyUser.js');
const adminAuth = require('../middlewares/adminMiddleware.js');

const router = express.Router();

// ========================
//  PUBLIC ROUTES
// ========================

// Register (all roles — role and seller_level are in req.body)
router.post('/register', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'license_file', maxCount: 1 },
]), registerUser);

// Login (all roles)
router.post('/login', loginUser);

// OTP (for seller verification)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Password recovery
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ========================
//  PROTECTED ROUTES
// ========================

// Get own profile
router.get('/profile', verifyUser, getProfile);

// Update own profile
router.put('/profile', verifyUser, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'license_file', maxCount: 1 },
]), updateProfile);

// Upgrade buyer to seller (with seller_level and optional license_file)
router.post('/upgrade-to-seller', verifyUser, upload.fields([
    { name: 'license_file', maxCount: 1 },
]), upgradeToSeller);

// Get referral stats for the authenticated user
router.get('/referral/stats', verifyUser, getReferralStats);

// ========================
//  ADMIN ROUTES
// ========================

// Admin: platform-wide referral stats
router.get('/referral/admin-stats', adminAuth, getAdminReferralStats);

// Get all users (optionally filter by ?role=buyer|seller)
router.get('/', adminAuth, getAllUsers);

// Get user by ID
router.get('/:id', adminAuth, getUserById);

// Update user (general — admin)
router.put('/:id', adminAuth, updateUser);

// Update user status (admin — activate/suspend/etc.)
router.put('/:id/status', adminAuth, updateUserStatus);

// Delete user
router.delete('/:id', adminAuth, deleteUser);

module.exports = router;
