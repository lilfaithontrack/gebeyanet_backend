// ============================================================================
// @deprecated  Legacy Cat routes — NOT registered in server.js.
// Categories are managed via /api/category/* (routes/categoryRoutes.js).
// This file is kept only for historical reference and should NOT be re-registered.
// ============================================================================
const express = require('express');
const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require('../controllers/CatController.js');

const router = express.Router();

router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
