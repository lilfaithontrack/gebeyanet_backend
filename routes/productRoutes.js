// routes/productRoutes.js
const express = require('express');
const { addProduct, getAllProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController.js'); // Adjust the path as necessary
const adminAuth = require('../middlewares/adminMiddleware.js'); // Adjust the path as necessary
const { authenticateSeller } = require('../middlewares/sellerMiddleware.js'); // Adjust the path as necessary

const router = express.Router();

// Route to add a new product (protected by adminAuth and authenticateSeller)
router.post('/add', adminAuth, addProduct);

// Route to get all products (could be public)
router.get('/', getAllProducts);

// Route to get a single product by ID (could be public)
router.get('/:id', getProductById);

// Route to update a product (protected by adminAuth)
router.put('/products/:id', adminAuth, updateProduct);

// Route to delete a product (protected by adminAuth)
router.delete('/products/:id', adminAuth, deleteProduct);

module.exports = router;
