const express = require('express');
const { upload, createCatItem, getAllCatItems, updateCatItem } = require('../controllers/CatItemController.js');

const router = express.Router();

// Create a new CatItem
router.post('/create', upload.single('image'), createCatItem);

// Get all CatItems
router.get('/', getAllCatItems);

// Update an existing CatItem
router.put('/update/:id', upload.single('image'), updateCatItem);

module.exports = router;
