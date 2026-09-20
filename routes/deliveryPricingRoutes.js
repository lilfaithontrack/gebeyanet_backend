const express = require('express');
const { router: deliveryPricingRouter } = require('../controllers/deliveryPricingController.js');

const router = express.Router();

router.use('/', deliveryPricingRouter);

module.exports = router;
