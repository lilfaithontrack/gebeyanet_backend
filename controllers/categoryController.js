const { ValidationError } = require('sequelize');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category.js');
const Subcategory = require('../models/Subcategory.js');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only images are allowed!'), false);
    }
    cb(null, true);
  },
}).single('image'); // Expecting a single image field

// Utility function to validate category and subcategory input
const validateCategoryInput = (category, subcategories) => {
  if (!category || typeof category !== 'string') {
    throw new ValidationError('Category name is required and must be a string.');
  }

  if (subcategories && !Array.isArray(subcategories)) {
    throw new ValidationError('Subcategories must be an array.');
  }

  if (subcategories) {
    subcategories.forEach((sub) => {
      if (!sub.name || typeof sub.name !== 'string') {
        throw new ValidationError('Each subcategory must have a valid name.');
      }
    });
  }
};

// Utility function to delete an image file
const deleteImageFile = (imagePath) => {
  try {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } catch (error) {
    console.error('Error deleting image file:', error);
  }
};

// Create a new category with subcategories
const createCategory = async (req, res) => {
  try {
    // Extracting category and subcategories from the request body
    const { category, subcategories } = req.body;

    // Validate the category input
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required and must be a non-empty string.',
      });
    }

    // Handling file upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      // Prepare category data
      const categoryData = {
        name: category.trim(), // Trimming any extra whitespace
        image: req.file ? req.file.filename : null, // Handling file upload
      };

      // Create category in the database
      const newCategory = await Category.create(categoryData);

      // If subcategories are provided, process them
      if (Array.isArray(subcategories) && subcategories.length > 0) {
        const subcategoryPromises = subcategories.map((sub) => {
          if (!sub.name || typeof sub.name !== 'string' || sub.name.trim() === '') {
            throw new ValidationError(`Subcategory name is required and must be a string.`);
          }

          return Subcategory.create({
            name: sub.name.trim(),
            image: sub.image || null,
            categoryId: newCategory.id,
          });
        });

        await Promise.all(subcategoryPromises);
      }

      // Respond with success
      res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        data: newCategory,
      });
    });
  } catch (error) {
    // Handle Sequelize validation errors or unexpected server errors
    const statusCode = error instanceof ValidationError ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};


// Fetch all categories with their subcategories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Subcategory, as: 'subcategories' }],
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch a single category by its ID with subcategories
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [{ model: Subcategory, as: 'subcategories' }],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a category and its subcategories
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, subcategories } = req.body;
    validateCategoryInput(category, subcategories);

    const categoryToUpdate = await Category.findByPk(id);

    if (!categoryToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (req.file && categoryToUpdate.image) {
        deleteImageFile(path.join('uploads', categoryToUpdate.image));
      }

      await categoryToUpdate.update({
        name: category,
        image: req.file ? req.file.filename : categoryToUpdate.image,
      });

      if (subcategories) {
        await Promise.all(
          subcategories.map(async (sub) => {
            if (sub.id) {
              const subcategoryToUpdate = await Subcategory.findByPk(sub.id);
              if (subcategoryToUpdate) {
                await subcategoryToUpdate.update({
                  name: sub.name,
                  image: sub.image || subcategoryToUpdate.image,
                });
              }
            } else {
              await Subcategory.create({
                name: sub.name,
                image: sub.image || null,
                categoryId: categoryToUpdate.id,
              });
            }
          })
        );
      }

      res.status(200).json({
        success: true,
        message: 'Category updated successfully.',
        data: categoryToUpdate,
      });
    });
  } catch (error) {
    const statusCode = error instanceof ValidationError ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// Delete a category and its subcategories
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const categoryToDelete = await Category.findByPk(id, {
      include: [{ model: Subcategory, as: 'subcategories' }],
    });

    if (!categoryToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    if (categoryToDelete.image) {
      deleteImageFile(path.join('uploads', categoryToDelete.image));
    }

    if (categoryToDelete.subcategories) {
      categoryToDelete.subcategories.forEach((sub) => {
        if (sub.image) {
          deleteImageFile(path.join('uploads', sub.image));
        }
      });
    }

    await Subcategory.destroy({ where: { categoryId: id } });
    await categoryToDelete.destroy();

    res.status(200).json({
      success: true,
      message: 'Category and its subcategories deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
