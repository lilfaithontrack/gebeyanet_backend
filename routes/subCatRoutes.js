// routes/subcatRoutes.js

const express = require('express');
const { createSubcat, getAllSubcats, getSubcatById, updateSubcat, deleteSubcat, upload } = require('../controllers/subcatController.js');

const router = express.Router();

// Create a new subcategory (with image upload)
router.post('/Create', upload.single('image'), createSubcat);

// Get all subcategories
router.get('/', getAllSubcats);

// Get a single subcategory by ID
router.get('/:id', getSubcatById);

// Update a subcategory (with image upload)
router.put('/:id', upload.single('image'), updateSubcat);

// Delete a subcategory
router.delete('/:id', deleteSubcat);

module.exports = router;
