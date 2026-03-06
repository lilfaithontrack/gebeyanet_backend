const express = require('express');
const {
    upload,
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    getUserById,
    getAllUsers,
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

// Register (all roles — role is in req.body)
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

// ========================
//  ADMIN ROUTES
// ========================

// Get all users (optionally filter by ?role=buyer|seller|agent)
router.get('/', adminAuth, getAllUsers);

// Get user by ID
router.get('/:id', adminAuth, getUserById);

// Delete user
router.delete('/:id', adminAuth, deleteUser);

module.exports = router;
