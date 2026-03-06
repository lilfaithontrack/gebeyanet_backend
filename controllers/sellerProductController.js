const SellerProduct = require('../models/SellerProduct.js');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type.'), false);
    }
  },
});

// Create Seller Product (Always Pending)
const createSellerProduct = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Files:", req.files);

    const {
      title,
      sku,
      color,
      size,
      brand,
      price,
      description,
      catItems,
      subcat,
      seller_email,
      bank,
      account_number,
      unit_of_measurement,
      stock,
      location_prices,
      location_stock,
      location_name,
      coordinates,
      location_radius,
    } = req.body;

    const images = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const optimizedPath = path.join(__dirname, '../uploads', `${Date.now()}-${file.originalname}.webp`);

        // Ensure uploads directory exists
        const uploadDir = path.join(__dirname, '../uploads');
        await fs.promises.mkdir(uploadDir, { recursive: true });

        await sharp(file.buffer)
          .resize(800)
          .webp({ quality: 80 })
          .toFile(optimizedPath);

        images.push(`/uploads/${path.basename(optimizedPath)}`);
      }
    }

    // Parse fields if they are JSON strings
    const parsedLocationPrices = typeof location_prices === 'string' ? JSON.parse(location_prices) : location_prices;
    const parsedLocationStock = typeof location_stock === 'string' ? JSON.parse(location_stock) : location_stock;
    const parsedCoordinates = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;

    console.log("Parsed location_prices:", parsedLocationPrices);
    console.log("Parsed location_stock:", parsedLocationStock);
    console.log("Parsed coordinates:", parsedCoordinates);

    const newProduct = await SellerProduct.create({
      title,
      sku,
      color,
      size,
      brand,
      price,
      description,
      catItems,
      subcat,
      seller_email,
      bank,
      account_number,
      stock,
      unit_of_measurement,
      status: 'pending',
      image: images,

      // Location-based data
      location_prices: parsedLocationPrices || {},
      location_stock: parsedLocationStock || { "Addis Ababa": "in_stock" },
      location_name: location_name || 'Addis Ababa',
      coordinates: parsedCoordinates || { type: 'Point', coordinates: [38.74, 9.03] },
      location_radius: location_radius || 10,
    });

    res.status(201).json({
      message: 'Product uploaded successfully, awaiting approval.',
      product: newProduct,
    });
  } catch (error) {
    console.error('❌ Error uploading seller product:', error);
    res.status(500).json({
      message: 'Failed to upload seller product',
      error,
    });
  }
};

// update the seller prodcuct 
// Update Seller Product
const updateSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, sku, color, size, brand, price, description,
      catItems, subcat, seller_email, bank, account_number,
      stock, unit_of_measurement, status, existingImages,
      location_prices, location_stock, location_name, coordinates, location_radius
    } = req.body;

    console.log("Update request received for product ID:", id);
    // Keep logging req.body to see the raw input
    // console.log("Request body:", req.body);
    // console.log("Files received:", req.files);

    const product = await SellerProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // --- PARSE JSON STRINGS ---
    let parsedCoordinates;
    let parsedLocationPrices;
    let parsedLocationStock;

    try {
      // Use the incoming value if it's a string, otherwise use it directly (or default to existing)
      parsedCoordinates = typeof coordinates === 'string'
        ? JSON.parse(coordinates)
        : (coordinates || product.coordinates); // Keep existing if null/undefined

      parsedLocationPrices = typeof location_prices === 'string'
        ? JSON.parse(location_prices)
        : (location_prices || product.location_prices); // Keep existing if null/undefined

      parsedLocationStock = typeof location_stock === 'string'
        ? JSON.parse(location_stock)
        : (location_stock || product.location_stock); // Keep existing if null/undefined

      console.log("Parsed update coordinates:", parsedCoordinates);
      console.log("Parsed update location_prices:", parsedLocationPrices);
      console.log("Parsed update location_stock:", parsedLocationStock);

    } catch (e) {
      console.error('Error parsing JSON fields during update:', e);
      // Decide if this is a fatal error or if you can proceed without the parsed field
      return res.status(400).json({ message: 'Invalid format for coordinates, location_prices, or location_stock' });
    }
    // --- END PARSING ---


    // Handle existing images
    let images = [];
    if (existingImages) {
      try {
        images = JSON.parse(existingImages);
        // console.log("Parsed existing images:", images);
      } catch (e) {
        console.error('Error parsing existingImages:', e);
        return res.status(400).json({ message: 'Invalid existingImages format' });
      }
    } else {
      // If existingImages is not sent, assume we keep the current ones (or start fresh if none)
      images = product.image || [];
    }


    // Process new images if any
    if (req.files && req.files.length > 0) {
      console.log("Processing new images:", req.files.length);
      const uploadDir = path.join(__dirname, '../uploads');
      await fs.promises.mkdir(uploadDir, { recursive: true }); // Ensure dir exists

      for (const file of req.files) {
        const optimizedPath = path.join(uploadDir, `${Date.now()}-${file.originalname}.webp`);

        await sharp(file.buffer)
          .resize(800)
          .webp({ quality: 80 })
          .toFile(optimizedPath);

        const imagePath = `/uploads/${path.basename(optimizedPath)}`;
        images.push(imagePath);
        console.log("Added new image:", imagePath);
      }
    }

    console.log("Final image array for update:", images);

    // Update product fields using PARSED values
    await product.update({
      title,
      sku,
      color,
      size,
      brand,
      price,
      description,
      catItems,
      subcat,
      seller_email,
      bank,
      account_number,
      stock,
      unit_of_measurement,
      status, // Make sure status is included if it can be updated here
      image: images, // Use the combined images array

      // Use the PARSED values or default to existing if parsing wasn't needed/possible
      location_prices: parsedLocationPrices,
      location_stock: parsedLocationStock,
      location_name: location_name || product.location_name, // Keep existing if not provided
      coordinates: parsedCoordinates,
      location_radius: location_radius || product.location_radius // Keep existing if not provided
    });

    // Fetch the updated product to ensure the response includes fresh data
    const updatedProduct = await SellerProduct.findByPk(id);

    res.status(200).json({
      message: 'Seller product updated successfully!',
      product: updatedProduct // Send back the updated product
    });
  } catch (error) {
    console.error('Error updating seller product:', error);
    // Send back the specific error message if available
    res.status(500).json({ message: 'Failed to update seller product.', error: error.message });
  }
};
// Approve Seller Product
const approveSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await SellerProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (product.status === 'approved') {
      return res.status(400).json({ message: 'Product is already approved.' });
    }

    product.status = 'approved';
    await product.save();

    res.status(200).json({ message: 'Product approved successfully!', product });
  } catch (error) {
    console.error('Error approving seller product:', error);
    res.status(500).json({ message: 'Failed to approve seller product', error });
  }
};
// decline products 
const getApprovedSellerProductById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const product = await SellerProduct.findOne({
      where: { id, status: 'approved' }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or not approved.' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching Approved seller product by ID:', error);
    res.status(500).json({ message: 'Failed to fetch Approved seller product.' });
  }
};

// update the  seller product status    
 const updateSellerProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'decline'

    if (!['approve', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "decline".' });
    }

    const product = await SellerProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    if (action === 'approve' && product.status === 'approved') {
      return res.status(400).json({ message: 'Product is already approved.' });
    }

    if (action === 'decline' && product.status === 'declined') {
      return res.status(400).json({ message: 'Product is already declined.' });
    }

    // Update the status based on the action
    product.status = action === 'approve' ? 'approved' : 'declined';
    await product.save();

    res.status(200).json({ 
      message: `Product ${action}d successfully!`, 
      product 
    });
  } catch (error) {
    console.error(`Error ${action}ing seller product:`, error);
    res.status(500).json({ message: `Failed to ${action} seller product.`, error });
  }
};
 // Get All Seller Products
const getAllSellerProducts = async (req, res) => {
  try {
    const products = await SellerProduct.findAll();

    if (products.length === 0) {
      return res.status(404).json({ message: 'No seller products found.' });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching all seller products:', error);
    res.status(500).json({ message: 'Failed to fetch seller products.' });
  }
};

       
// Get Seller Products by Email
const getSellerProducts = async (req, res) => {
  try {
    const { seller_email } = req.params;
    const products = await SellerProduct.findAll({ where: { seller_email } });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found for this seller.' });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ message: 'Failed to fetch seller products.' });
  }
};

// Get All Pending Seller Products
const getPendingSellerProducts = async (req, res) => {
  try {
    const products = await SellerProduct.findAll({ where: { status: 'pending' } });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching pending seller products:', error);
    res.status(500).json({ message: 'Failed to fetch pending seller products.' });
  }
};
// get all approved approved products
const getApprovedSellerProducts = async (req, res) => {
  try {
    const products = await SellerProduct.findAll({ where: { status: 'approved' } });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching Approved seller products:', error);
    res.status(500).json({ message: 'Failed to fetch Appeoved seller products.' });
  }
};
// Get All approved seller Products


// Delete Seller Product
const deleteSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await SellerProduct.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    for (const imagePath of product.image) {
      const filePath = path.join(__dirname, '..', imagePath);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting file:', filePath, err);
      }
    }

    await product.destroy();
    res.status(200).json({ message: 'Seller product deleted successfully!' });
  } catch (error) {
    console.error('Error deleting seller product:', error);
    res.status(500).json({ message: 'Failed to delete seller product.' });
  }
};

module.exports = { upload, createSellerProduct, updateSellerProduct, approveSellerProduct, getApprovedSellerProductById, updateSellerProductStatus, getAllSellerProducts, getSellerProducts, getPendingSellerProducts, getApprovedSellerProducts, deleteSellerProduct };
