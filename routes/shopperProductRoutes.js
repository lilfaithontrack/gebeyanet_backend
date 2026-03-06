const express = require('express');
const { createProduct, updateProduct, getAllPendingProducts, deleteProduct, getAllProducts, getAllApprovedProducts, getProductById, getProductsByLocation, getMyShopApprovedProducts, getMyShopPendingProducts, getAllMyProducts, getApprovedProductDetail, getMyShopProductById, upload, getAllProductDetailById } = require('../controllers/shopperProductController.js');
const { verifyShopper } = require('../middlewares/verifyShopper.js');

const router = express.Router();

// Public Route
router.get('/', getAllProducts);
router.get('/search/location', getProductsByLocation);

// Protected Routes for Shop Owner
router.post('/', verifyShopper, upload, createProduct);
router.get('/pendings', getAllPendingProducts); 
router.put('/:id', upload, updateProduct);
router.delete('/:id', verifyShopper, deleteProduct);
router.get('/my-shop/approved', verifyShopper, getMyShopApprovedProducts);
router.get('/my-shop/pending', verifyShopper, getMyShopPendingProducts);
router.get('/my-shop/:id', verifyShopper, getMyShopProductById);
router.get('/my-products/:shopper_id', verifyShopper, getAllMyProducts);
router.get('/approve', getAllApprovedProducts);
router.get('/approve/:id', getApprovedProductDetail);
router.get('/all-product/:id', verifyShopper,  getAllProductDetailById);


// Public Product Detail
router.get('/:id', getProductById);

module.exports = router;

