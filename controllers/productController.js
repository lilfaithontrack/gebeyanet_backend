const AddProduct = require('../models/Product.js');
const { uploadProductImages, uploadProductImagesHandler } = require('../utlis/fileUpload.js');

// Add a new product
const addProduct = async (req, res) => {
  uploadProductImages(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      // Extract product details from the request body
      const { title, sku, color, size, brand, price, description, category, subcategory, quantity } = req.body;

      // Handle the uploaded product images
      const productImagePaths = req.files ? await uploadProductImagesHandler(req.files) : [];

      // Create a new product
      const newProduct = await AddProduct.create({
        title,
        sku,
        color,
        size,
        brand,
        price,
        description,
        category,
        subcategory, // Include subcategory
        images: JSON.stringify(productImagePaths), // Store image paths as a JSON array
        quantity,
        seller_email: req.seller.email, // Store seller's email from middleware
      });

      res.status(201).json({
        success: true,
        message: 'Product added successfully.',
        product: newProduct,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error adding product.',
        error: error.message,
      });
    }
  });
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await AddProduct.findAll();
    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products.',
      error: error.message,
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await AddProduct.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }
    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product.',
      error: error.message,
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  uploadProductImages(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const product = await AddProduct.findByPk(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found.',
        });
      }

      // Update the product details
      const { title, sku, color, size, brand, price, description, category, subcategory, quantity } = req.body;

      // Handle the uploaded product images (if provided)
      let updatedImagePaths = JSON.parse(product.images || '[]');
      if (req.files && req.files.length > 0) {
        const newImagePaths = await uploadProductImagesHandler(req.files);
        updatedImagePaths = updatedImagePaths.concat(newImagePaths); // Append new images to the existing ones
      }

      await product.update({
        title,
        sku,
        color,
        size,
        brand,
        price,
        description,
        category,
        subcategory,
        quantity,
        images: JSON.stringify(updatedImagePaths), // Update images
      });

      res.status(200).json({
        success: true,
        message: 'Product updated successfully.',
        product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating product.',
        error: error.message,
      });
    }
  });
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await AddProduct.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    // Delete the product
    await product.destroy();
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product.',
      error: error.message,
    });
  }
};

module.exports = { addProduct, getAllProducts, getProductById, updateProduct, deleteProduct };
