const express = require('express');
const {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductsByLocation, getMyProducts, updateProductStatus,
  upload
} = require('../controllers/addProductController.js');
const { verifyUser } = require('../middlewares/verifyUser.js');
const adminAuth = require('../middlewares/adminMiddleware.js');

const router = express.Router();

// --- PUBLIC ROUTES (anyone can browse products) ---

// GET /api/prod/ -> Gets all products, with optional filters
// Query params: subcat, product_type, seller_level, status (default: approved)
router.get('/', getAllProducts);

// GET /api/prod/location -> Gets products based on a geographic radius search
router.get('/location', getProductsByLocation);

// GET /api/prod/my-products -> Gets products for the authenticated seller
router.get('/my-products', verifyUser, getMyProducts);

// GET /api/prod/:id -> Gets a single product by its unique ID
router.get('/:id', getProductById);

// --- PROTECTED ROUTES (must be logged in) ---

// POST /api/prod/ -> Creates a new product (seller_id set from req.user)
router.post('/', verifyUser, upload, createProduct);

// PUT /api/prod/:id -> Updates an existing product
router.put('/:id', verifyUser, upload, updateProduct);

// DELETE /api/prod/:id -> Deletes a product
router.delete('/:id', verifyUser, deleteProduct);

// --- ADMIN ROUTES ---

// PUT /api/prod/:id/status -> Approve / reject a product
router.put('/:id/status', adminAuth, updateProductStatus);

module.exports = router;
