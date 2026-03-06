const { CatItem, Subcat } = require('../models/Associations.js');
const multer = require('multer');

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Create a new CatItem with associated Subcats
const createCatItem = async (req, res) => {
  try {
    const { name, subcatIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'CatItem name is required' });
    }

    if (!subcatIds || !Array.isArray(subcatIds)) {
      return res.status(400).json({ message: 'Subcategory IDs must be an array' });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Create the CatItem
    const catItem = await CatItem.create({ name, image: imageUrl });

    // Associate the CatItem with the Subcats
    const subcats = await Subcat.findAll({ where: { id: subcatIds } });
    await catItem.setSubcats(subcats);

    res.status(201).json({
      message: 'CatItem created successfully',
      catItem,
    });
  } catch (error) {
    console.error('Error creating CatItem:', error);
    res.status(500).json({
      message: 'Error creating CatItem',
      error: error.message,
    });
  }
};

// Get all CatItems with their associated Subcats
// Get all CatItems with their associated Subcats and Subcat images
const getAllCatItems = async (req, res) => {
  try {
    const catItems = await CatItem.findAll({
      include: {
        model: Subcat,
        as: 'subcats',
        attributes: ['id', 'name', 'image'], // Include the id, name, and image fields for Subcats
        through: { attributes: [] }, // Exclude join table fields
      },
    });

    res.status(200).json(catItems);
  } catch (error) {
    console.error('Error fetching CatItems:', error);
    res.status(500).json({
      message: 'Error fetching CatItems',
      error: error.message,
    });
  }
};


// Other CRUD functions remain mostly similar, updating `setSubcats` for associations
// Update an existing CatItem with optional name, image, and associated Subcats
const updateCatItem = async (req, res) => {
  try {
    const { id } = req.params; // Get CatItem ID from the request parameters
    const { name, subcatIds } = req.body; // Get updated fields from the request body

    // Find the existing CatItem by ID
    const catItem = await CatItem.findByPk(id);

    if (!catItem) {
      return res.status(404).json({ message: 'CatItem not found' });
    }

    // Handle image update
    let imageUrl = catItem.image; // Retain the existing image by default
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`; // Update image if a new one is uploaded
    }

    // Update name and image (if provided)
    if (name) {
      catItem.name = name;
    }
    catItem.image = imageUrl;

    // Update associated Subcats if subcatIds are provided
    if (subcatIds && Array.isArray(subcatIds)) {
      const subcats = await Subcat.findAll({ where: { id: subcatIds } });
      await catItem.setSubcats(subcats); // Update Subcat associations
    }

    // Save the updated CatItem
    await catItem.save();

    res.status(200).json({
      message: 'CatItem updated successfully',
      catItem,
    });
  } catch (error) {
    console.error('Error updating CatItem:', error);
    res.status(500).json({
      message: 'Error updating CatItem',
      error: error.message,
    });
  }
};

module.exports = { upload, createCatItem, getAllCatItems, updateCatItem };


