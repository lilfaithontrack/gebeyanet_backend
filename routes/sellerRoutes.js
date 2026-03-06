const express = require('express');
const { registerSeller, loginSeller, updateSeller, getSellerById, deleteSeller, forgotPassword, resetPassword, sendOtp, upload, verifyOtp, getAllSellers } = require('../controllers/sellerController.js');

const router = express.Router();

// Send OTP to email
router.post('/send-otp', sendOtp);

//Verify OTP from Email 

router.post('/verify-otp',verifyOtp);

// Seller registration (with file upload support and OTP verification)
router.post('/register', upload.fields([{ name: 'image' }, { name: 'license_file' }]), registerSeller);

// Seller login
router.post('/login', loginSeller);

// get product by seller email
router.put('/update/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'license_file', maxCount: 1 }]), updateSeller);


// Get seller by ID
router.get('/:id', getSellerById);

// get seller all id 

router.get('/', getAllSellers);

// Delete a seller
router.delete('/:id', deleteSeller);

// Reset password and forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

module.exports = router;
