const express = require('express');
const { registerShop, getAllShops, getShopById, updateShop, deleteShop, findNearbyShops } = require('../controllers/shopController.js');

const router = express.Router();

router.post('/register', registerShop);
router.get('/', getAllShops);
router.get('/:id', getShopById);
router.put('/:id', updateShop);
router.delete('/:id', deleteShop);
router.get('/nearby', findNearbyShops);

module.exports = router;
