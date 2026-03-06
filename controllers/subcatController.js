const Subcat = require('../models/Subcat.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Define __dirname for ES modules
// Set up multer storage options
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); // Resolve the uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename for each upload
  },
});

// Create the multer instance with the storage configuration
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, and JPG image files are allowed'));
    } else {
      cb(null, true);
    }
  },
});

// Create a new subcategory
const createSubcat = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Subcategory name is required' });
    }

    // Handle the image upload
    let imagePath = null;
    if (req.file) {
      imagePath = path.join('uploads', req.file.filename); // Save the relative path to the database
    }

    // Create the subcategory
    const subcat = await Subcat.create({
      name,
      image: imagePath,
    });

    res.status(201).json({
      message: 'Subcategory created successfully',
      subcategory: subcat,
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({
      message: 'Error creating subcategory',
      error: error.message,
    });
  }
};

// Get all subcategories
const getAllSubcats = async (req, res) => {
  try {
    const subcats = await Subcat.findAll();
    res.status(200).json(subcats);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      message: 'Error fetching subcategories',
      error: error.message,
    });
  }
};

// Get a single subcategory by ID
const getSubcatById = async (req, res) => {
  try {
    const subcat = await Subcat.findByPk(req.params.id);
    if (!subcat) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    res.status(200).json(subcat);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({
      message: 'Error fetching subcategory',
      error: error.message,
    });
  }
};

// Update a subcategory
const updateSubcat = async (req, res) => {
  try {
    const { name } = req.body;
    const subcat = await Subcat.findByPk(req.params.id);

    if (!subcat) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    if (name) {
      subcat.name = name;
    }

    // Handle the image update if a new image is uploaded
    if (req.file) {
      // Delete the old image file from the server if it exists
      if (subcat.image) {
        const oldImagePath = path.join(__dirname, '../', subcat.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      subcat.image = path.join('uploads', req.file.filename);
    }

    await subcat.save();
    res.status(200).json({ message: 'Subcategory updated successfully', subcategory: subcat });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({
      message: 'Error updating subcategory',
      error: error.message,
    });
  }
};

// Delete a subcategory
const deleteSubcat = async (req, res) => {
  try {
    const subcat = await Subcat.findByPk(req.params.id);
    if (!subcat) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    // Delete the image file from the server if it exists
    if (subcat.image) {
      const imagePath = path.join(__dirname, '../', subcat.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await subcat.destroy();
    res.status(200).json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({
      message: 'Error deleting subcategory',
      error: error.message,
    });
  }
};

// Export the controller functions
module.exports = { upload, createSubcat, getAllSubcats, getSubcatById, updateSubcat, deleteSubcat };
