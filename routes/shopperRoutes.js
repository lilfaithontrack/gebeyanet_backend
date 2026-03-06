const express = require('express');
const { createShopper, getAllShoppers, getShopperById, updateShopper, deleteShopper, loginShopper, findNearbyShoppers } = require('../controllers/shopperController.js'); // Import the new function

const router = express.Router();

router.post('/', createShopper);
router.get('/', getAllShoppers);
router.get('/:id', getShopperById);
router.put('/:id', updateShopper);
router.delete('/:id', deleteShopper);
router.post('/login', loginShopper);
router.get('/nearby', findNearbyShoppers); // New route for finding nearby shoppers

module.exports = router;
