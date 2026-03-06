const express = require('express');
const { createSellerProduct, approveSellerProduct, getSellerProducts, getPendingSellerProducts, deleteSellerProduct, updateSellerProduct, getApprovedSellerProducts, getApprovedSellerProductById, updateSellerProductStatus, getAllSellerProducts, upload } = require('../controllers/sellerProductController.js');

const router = express.Router();

// Create Seller Product (Always Pending)
router.post('/add', upload.array('image', 10), createSellerProduct);

// Approve a Seller Product (Admin Only)
router.put('/approve/:id', approveSellerProduct);
// update Seller Product status 

router.put('/updatestatus/:id', updateSellerProductStatus);

//get all the seller products 

router.get('/', getAllSellerProducts);

//get the approve products 
router.get('/approved', getApprovedSellerProducts);

router.get('/approved/:id', getApprovedSellerProductById);

//update the seller product 
router.put('/update/:id', upload.array('image', 10), updateSellerProduct);

// Get All Pending Seller Products (Admin)
router.get('/pending', getPendingSellerProducts);

// Get Products by Seller Email
router.get('/seller/:seller_email', getSellerProducts);

// Delete Seller Product
router.delete('/:id', deleteSellerProduct);

module.exports = router;
