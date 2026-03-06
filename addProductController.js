const multer = require('multer');
const path = require('path');
const AddProduct = require('../models/AddProduct.js');
const CatItem = require('../models/CatItem.js');
const SubCat = require('../models/Subcat.js');

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to save files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Max size: 5MB
});

// Fetch all products
const getAllProducts = async (req, res) => {
  try {
    const products = await AddProduct.findAll({
      include: [
        { model: CatItem, as: 'CatItem', attributes: ['id', 'name'] },
        { model: SubCat, as: 'SubCat', attributes: ['id', 'name'] },
      ],
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
};

// Add a new product
const addProduct = async (req, res) => {
  try {
    const {
      title,
      sku,
      color,
      size,
      brand,
      price,
      description,
      cat_items,
      subcats,
      quantity,
      seller_email,
    } = req.body;

    const image = req.file ? req.file.filename : null;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const newProduct = await AddProduct.create({
      title,
      sku,
      color,
      size,
      brand,
      price,
      description,
      cat_items,
      subcats,
      image,
      quantity: quantity || 30,
      seller_email,
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Error adding product' });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    if (req.file) {
      updatedData.image = req.file.filename;
    }

    const product = await AddProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.update(updatedData);
    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error updating product' });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await AddProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
  }
};

module.exports = { upload, getAllProducts, addProduct, updateProduct, deleteProduct };
