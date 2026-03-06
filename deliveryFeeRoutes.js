const express = require('express');
const { router: deliveryFeeRouter } = require('../controllers/deliveryFeeModelAndController.js');

const router = express.Router();

router.use('/delivery-fee', deliveryFeeRouter);

module.exports = router;
