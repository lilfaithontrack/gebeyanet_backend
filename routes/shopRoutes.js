const express = require('express');
const { registerShop, getAllShops, getShopById, updateShop, deleteShop, findNearbyShops } = require('../controllers/shopController.js');

const router = express.Router();

router.post('/register', registerShop);
router.get('/nearby', findNearbyShops); // Specific routes must come before /:id
router.get('/', getAllShops);
router.get('/:id', getShopById);
router.put('/:id', updateShop);
router.delete('/:id', deleteShop);

module.exports = router;
