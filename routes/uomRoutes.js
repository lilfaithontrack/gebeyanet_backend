const express = require('express');
const { createUOM, getUOMsByProduct, updateUOM, deleteUOM, uomUpload } = require('../controllers/uomController.js');

const router = express.Router();

// POST /api/uoms - create with image upload
router.post('/', uomUpload.single('image'), createUOM);

// GET /api/uoms/:productId - get UOMs by product
router.get('/:productId', getUOMsByProduct);

// PUT /api/uoms/:id - update with image upload
router.put('/:id', uomUpload.single('image'), updateUOM);

// DELETE /api/uoms/:id
router.delete('/:id', deleteUOM);

module.exports = router;
