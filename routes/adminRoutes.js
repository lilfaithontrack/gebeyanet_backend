const express = require('express');
const { registerAdmin, loginAdmin, createAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin } = require('../controllers/adminController.js'); 
const { registerDelivery, deleteDelivery } = require('../controllers/deliveryController.js');
const adminAuth = require('../middlewares/adminMiddleware.js'); // Admin middleware

const router = express.Router();

// Admin registration (Public)
router.post('/register', registerAdmin);

// Admin login (Public)
router.post('/login', loginAdmin);

// Create a new admin (Protected, only accessible by authenticated admins)
router.post('/', adminAuth, createAdmin);

// Get all admins (Protected, only accessible by authenticated admins)
router.get('/', getAllAdmins);

// Get an admin by ID (Protected, only accessible by authenticated admins)
router.get('/:id' , getAdminById);

// Update an admin's details (Protected, only accessible by authenticated admins)
router.put('/:id', adminAuth, updateAdmin);

// Delete an admin (Protected, only accessible by authenticated admins)
router.delete('/:id', adminAuth, deleteAdmin);
router.post('/register-delivery', registerDelivery); // Admin registers a delivery account
router.delete('/delete-delivery/:id', deleteDelivery); // Admin deletes a delivery account
module.exports = router;
