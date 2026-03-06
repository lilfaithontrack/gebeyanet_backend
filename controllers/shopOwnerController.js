const ShopOwner = require('../models/ShopOwner.js');
const upload = require('../middleware/multerConfig.js'); // Import Multer configuration

// Add a new shop owner
const addShopOwner = async (req, res) => {
  try {
    const { fullName, email, phone, nationalId } = req.body;

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ message: 'ID file is required.' });
    }

    const idFile = req.file.path; // Get the file path from Multer

    // Create new shop owner
    const newShopOwner = await ShopOwner.create({
      fullName,
      email,
      phone,
      nationalId,
      idFile,
    });

    res.status(201).json({
      message: 'Shop owner registered successfully.',
      data: newShopOwner,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to register shop owner.',
      error: error.message,
    });
  }
};

// Get all shop owners
const getAllShopOwners = async (req, res) => {
  try {
    const shopOwners = await ShopOwner.findAll();
    res.status(200).json(shopOwners);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch shop owners.',
      error: error.message,
    });
  }
};

// Get shop owner by ID
const getShopOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const shopOwner = await ShopOwner.findByPk(id);

    if (!shopOwner) {
      return res.status(404).json({ message: 'Shop owner not found.' });
    }

    res.status(200).json(shopOwner);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch shop owner.',
      error: error.message,
    });
  }
};

// Update shop owner
const updateShopOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, nationalId } = req.body;

    // Fetch the shop owner
    const shopOwner = await ShopOwner.findByPk(id);
    if (!shopOwner) {
      return res.status(404).json({ message: 'Shop owner not found.' });
    }

    // Update fields
    if (req.file) {
      shopOwner.idFile = req.file.path; // Update the ID file if a new one is uploaded
    }

    shopOwner.fullName = fullName || shopOwner.fullName;
    shopOwner.email = email || shopOwner.email;
    shopOwner.phone = phone || shopOwner.phone;
    shopOwner.nationalId = nationalId || shopOwner.nationalId;

    await shopOwner.save();
    res.status(200).json({
      message: 'Shop owner updated successfully.',
      data: shopOwner,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update shop owner.',
      error: error.message,
    });
  }
};

// Delete shop owner
const deleteShopOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const shopOwner = await ShopOwner.findByPk(id);
    if (!shopOwner) {
      return res.status(404).json({ message: 'Shop owner not found.' });
    }

    await shopOwner.destroy();
    res.status(200).json({ message: 'Shop owner deleted successfully.' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete shop owner.',
      error: error.message,
    });
  }
};

// Middleware for file upload
const uploadIdFile = upload.single('idFile');

module.exports = { addShopOwner, getAllShopOwners, getShopOwnerById, updateShopOwner, deleteShopOwner, uploadIdFile };
