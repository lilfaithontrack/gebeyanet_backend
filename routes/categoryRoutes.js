const express = require('express');
const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require('../controllers/categoryController.js');
const adminAuth = require('../middlewares/adminMiddleware.js'); // Admin authentication middleware

const router = express.Router();

/**
 * @route   POST /api/categories/create
 * @desc    Create a new category with subcategories and an optional image
 * @access  Admin only
 */
router.post('/create',  createCategory);

/**
 * @route   GET /api/categories
 * @desc    Fetch all categories with their subcategories
 * @access  Public
 */
router.get('/', getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Fetch category by ID with its subcategories
 * @access  Public
 */
router.get('/:id', getCategoryById);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category and its subcategories, including image
 * @access  Admin only
 */
router.put('/:id', adminAuth, updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category and its subcategories
 * @access  Admin only
 */
router.delete('/:id', adminAuth, deleteCategory);

module.exports = router;

