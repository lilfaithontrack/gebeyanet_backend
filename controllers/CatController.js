const Cat = require('../models/Cat.js');
const multer = require('multer');
const path = require('path');

// Set up storage for uploaded files (images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // The 'uploads' folder will store the images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Make the file name unique
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only image files are allowed!'), false); // Reject non-image files
  }
};

// Set up multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

// Create a new category or subcategory with image upload
const createCategory = async (req, res) => {
  const { name, parentId, type } = req.body;

  // Multer upload handling
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Image upload failed', details: err.message });
    }

    const image = req.file ? req.file.path : null; // The image URL will be stored here

    try {
      const newCat = await Cat.create({ name, image, parentId, type });
      res.status(201).json({ message: 'Category created successfully', data: newCat });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create category', details: error.message });
    }
  });
};

// Get all categories with their subcategories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Cat.findAll({
      where: { parentId: null },
      include: { model: Cat, as: 'subcategories' },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
};

// Get a single category by ID (with its subcategories)
const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Cat.findByPk(id, {
      include: { model: Cat, as: 'subcategories' },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category', details: error.message });
  }
};

// Update a category (with image upload)
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, parentId, type } = req.body;

  // Multer upload handling
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Image upload failed', details: err.message });
    }

    const image = req.file ? req.file.path : null; // The new image URL

    try {
      const category = await Cat.findByPk(id);
      if (!category) return res.status(404).json({ error: 'Category not found' });

      await category.update({ name, image, parentId, type });
      res.status(200).json({ message: 'Category updated successfully', data: category });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update category', details: error.message });
    }
  });
};

// Delete a category
const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Cat.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.destroy();
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category', details: error.message });
  }
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
