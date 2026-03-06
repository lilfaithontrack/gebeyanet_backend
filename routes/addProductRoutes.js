const express = require('express');
const {
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductsByLocation,
  upload
} = require('../controllers/addProductController.js');
const { verifyUser } = require('../middlewares/verifyUser.js');

const router = express.Router();

// --- PUBLIC ROUTES (anyone can browse products) ---

// GET /api/prod/ -> Gets all products, with optional filters
router.get('/', getAllProducts);

// GET /api/prod/location -> Gets products based on a geographic radius search
router.get('/location', getProductsByLocation);

// GET /api/prod/:id -> Gets a single product by its unique ID
router.get('/:id', getProductById);

// --- PROTECTED ROUTES (must be logged in) ---

// POST /api/prod/ -> Creates a new product (seller_id set from req.user)
router.post('/', verifyUser, upload, createProduct);

// PUT /api/prod/:id -> Updates an existing product
router.put('/:id', verifyUser, upload, updateProduct);

// DELETE /api/prod/:id -> Deletes a product
router.delete('/:id', verifyUser, deleteProduct);

module.exports = router;
