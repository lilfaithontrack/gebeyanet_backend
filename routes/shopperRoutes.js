const express = require('express');
const { createShopper, getAllShoppers, getShopperById, updateShopper, deleteShopper, loginShopper, findNearbyShoppers } = require('../controllers/shopperController.js'); // Import the new function

const router = express.Router();

router.post('/', createShopper);
router.post('/login', loginShopper);
router.get('/nearby', findNearbyShoppers); // Specific routes must come before /:id
router.get('/', getAllShoppers);
router.get('/:id', getShopperById);
router.put('/:id', updateShopper);
router.delete('/:id', deleteShopper);

module.exports = router;
