const express = require('express');
const { requestWithdraw } = require('../controllers/withdrawController.js');

const router = express.Router();

router.post('/request', requestWithdraw);

module.exports = router;
