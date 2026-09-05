const Product = require('../models/AddProduct.js'); // CORRECTED: Using your file name 'AddProduct.js'
const sequelize = require('../db/dbConnect.js');   // Required for the raw SQL query in getProductsByLocation
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs/promises');

// Allowed product types per seller level
const ALLOWED_PRODUCT_TYPES = {
  importer:  ['import', 'wholesale', 'retail'],
  exporter:  ['export', 'wholesale', 'retail'],
  reseller:  ['retail', 'wholesale'],
  admin:     ['retail', 'wholesale', 'import', 'export'],
};

/**
 * =================================================================================
 * API USAGE GUIDE (IMPORTANT FOR FRONTEND)
 * =================================================================================
 * This controller expects 'multipart/form-data'.
 *
 * --- For Creating/Updating Products ---
 * * REQUIRED FIELDS IN THE REQUEST BODY:
 * - title, price, brand, description, catItems, subcat, etc.
 * - variations: A JSON STRING of the variations array.
 * e.g., '[{"size":"L", "price":25.99, "stock":"in_stock", "color":"Red"}]'
 *
 * * FOR IMAGE UPLOADS:
 * - All new image files must be sent under a single field name: 'images'.
 * - general_image_count: A number indicating how many of the first uploaded files are for the main 'image' gallery.
 * - color_options: A JSON STRING of the color options array. Each object MUST have an 'image_count'
 * property indicating how many uploaded files belong to that color.
 * e.g., '[{"color_name":"Red", "image_count":2}, {"color_name":"Blue", "image_count":1}]'
 *
 * * The order of files sent in the 'images' field must match: general images first, then images for each color in order.
 * =================================================================================
 */

// Define __dirname for ES Modules
// Configure multer for file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
}).array('images', 20); // Expect all files under the 'images' field name

// CREATE a new product
const createProduct = async (req, res) => {
  try {
    const {
      title, price, description, brand, catItems, subcat, productfor, stock,
      product_type, origin_country, destination_country,
      variations: variationsJSON,
      color_options: colorOptionsJSON,
      general_image_count,
      location_name, coordinates: coordinatesJSON, location_radius,
      min_order_qty, max_order_qty, sell_unit,
    } = req.body;

    // Validate product_type against seller_level
    const sellerLevel = req.user?.seller_level || 'admin';
    const type = product_type || 'retail';

    if (!ALLOWED_PRODUCT_TYPES[sellerLevel]?.includes(type)) {
      return res.status(403).json({
        message: `Seller level '${sellerLevel}' cannot create '${type}' products.`,
      });
    }

    // Validate import/export specific fields
    if (type === 'import' && !origin_country) {
      return res.status(400).json({ message: 'origin_country is required for import products.' });
    }
    if (type === 'export' && !destination_country) {
      return res.status(400).json({ message: 'destination_country is required for export products.' });
    }

    // 1. Process and sort uploaded images
    const allNewImagePaths = await processUploadedImages(req.files);
    const generalImageCount = parseInt(general_image_count, 10) || 0;

    const generalImages = allNewImagePaths.slice(0, generalImageCount);
    // Allow both JSON string (multipart) and already-parsed object/array (JSON body)
    const safeParse = (val, fallback) => {
      if (val === undefined || val === null) return fallback;
      if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
      return val;
    };
    let color_options_data = safeParse(colorOptionsJSON, []);
    let variations = safeParse(variationsJSON, []);
    let geoData = safeParse(coordinatesJSON, null);

    let currentIndex = generalImageCount;
    color_options_data.forEach(option => {
      const imageCountForColor = option.image_count || 0;
      option.images = allNewImagePaths.slice(currentIndex, currentIndex + imageCountForColor);
      currentIndex += imageCountForColor;
    });

    if (geoData && geoData.lat && geoData.lng) {
      geoData = { type: 'Point', coordinates: [geoData.lng, geoData.lat] };
    }

    // 3. Create product with seller_id, seller_level, product_type, and purchase limits
    const product = await Product.create({
      title, price, description, brand, catItems, subcat, productfor, stock,
      product_type: type,
      origin_country: type === 'import' ? origin_country : null,
      destination_country: type === 'export' ? destination_country : null,
      seller_id: req.user ? req.user.id : req.body.seller_id,
      seller_email: req.user ? req.user.email : req.body.seller_email,
      seller_level: sellerLevel,
      min_order_qty: min_order_qty || 1,
      max_order_qty: max_order_qty || null,
      sell_unit: sell_unit || 'piece',
      status: 'pending',
      image: generalImages,
      color_options: color_options_data,
      variations,
      location_name,
      coordinates: geoData,
      location_radius,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};

// UPDATE a product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      existingImages: existingImagesJSON,
      general_image_count,
      color_options: colorOptionsJSON,
      variations: variationsJSON,
      coordinates: coordinatesJSON,
      ...updateData
    } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Allow both JSON string (multipart) and already-parsed object/array (JSON body)
    const safeParse = (val, fallback) => {
      if (val === undefined || val === null) return fallback;
      if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
      return val;
    };

    // FIX: Ensure data from the database is an array before using array methods.
    // This prevents a crash if a product has null for image or color_options.
    const productImages = Array.isArray(product.image) ? product.image : [];
    const productColorOptions = Array.isArray(product.color_options) ? product.color_options : [];

    // 1. Determine which old images to delete
    // FIX: Use the sanitized variables to prevent the crash.
    // Also, add a check inside flatMap for safety.
    const oldImages = [
      ...productImages,
      ...productColorOptions.flatMap(opt => (Array.isArray(opt.images) ? opt.images : []))
    ];

    const existingImagesToKeep = safeParse(existingImagesJSON, []);
    const imagesToDelete = oldImages.filter(img => !existingImagesToKeep.includes(img));

    // Only delete if there are images to delete
    if (imagesToDelete.length > 0) {
      await deleteUploadedImages(imagesToDelete);
    }

    // 2. Process newly uploaded images
    const newImagePaths = await processUploadedImages(req.files);

    // 3. Prepare the final update payload
    const updateFields = { ...updateData };

    // Logic to reconstruct image arrays if new images were uploaded
    if (newImagePaths.length > 0) {
      const generalImageCount = parseInt(general_image_count, 10) || 0;
      const newGeneralImages = newImagePaths.slice(0, generalImageCount);
      const newColorImages = newImagePaths.slice(generalImageCount);

      let color_options_data = safeParse(colorOptionsJSON, []);
      let colorImageIndex = 0;

      color_options_data.forEach(option => {
        const imageCountForColor = option.image_count || 0;
        option.images = newColorImages.slice(colorImageIndex, colorImageIndex + imageCountForColor);
        colorImageIndex += imageCountForColor;
      });

      // Combine kept images with new ones
      updateFields.image = [...existingImagesToKeep.filter(img => productImages.includes(img)), ...newGeneralImages];
      updateFields.color_options = color_options_data;

    } else if (colorOptionsJSON !== undefined) {
      // If no new images, just update the text metadata
      updateFields.color_options = safeParse(colorOptionsJSON, productColorOptions);
    }

    if (variationsJSON !== undefined) {
      updateFields.variations = safeParse(variationsJSON, []);
    }
    if (coordinatesJSON !== undefined) {
      const geoData = safeParse(coordinatesJSON, null);
      if (geoData && geoData.lat && geoData.lng) {
        updateFields.coordinates = { type: 'Point', coordinates: [geoData.lng, geoData.lat] };
      }
    }

    // 4. Update the product in the database
    await product.update(updateFields);
    const updatedProduct = await Product.findByPk(id);
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};
// DELETE a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const productImages = Array.isArray(product.image) ? product.image : [];
    const productColorOptions = Array.isArray(product.color_options) ? product.color_options : [];
    const imagesToDelete = [
      ...productImages,
      ...productColorOptions.flatMap(option => (Array.isArray(option.images) ? option.images : []))
    ];
    if (imagesToDelete.length > 0) {
      await deleteUploadedImages(imagesToDelete);
    }

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully!' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product.' });
  }
};


// --- READ-ONLY AND LOCATION FUNCTIONS ---

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getAllProducts = async (req, res) => {
  try {
    const { subcat, product_type, seller_level, status, seller_only } = req.query;
    const where = {};

    if (subcat) where.subcat = subcat;
    if (product_type) where.product_type = product_type;
    if (seller_level) where.seller_level = seller_level;

    // seller_only=true -> only products submitted by real sellers (not admin-created)
    if (seller_only === 'true' || seller_only === true) {
      where.seller_level = { [require('sequelize').Op.ne]: 'admin' };
    }

    // Default to approved only (for public browsing), but allow status filter
    // status=all -> no status filter (admin use)
    if (status && status !== 'all') {
      where.status = status;
    } else if (!status) {
      where.status = 'approved';
    }

    const products = await Product.findAll({ where });
    res.status(200).json(shuffleArray(products));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const response = product.toJSON();
    if (product.coordinates) {
      response.coordinates = {
        lat: product.coordinates.coordinates[1],
        lng: product.coordinates.coordinates[0]
      };
    }
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Failed to fetch product by ID.' });
  }
};

const getProductsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const products = await sequelize.query(`
      SELECT * FROM products
      WHERE status = 'approved' AND ST_DWithin(
        coordinates,
        ST_MakePoint(?, ?)::geography,
        ?
      )
    `, {
      replacements: [lng, lat, radius * 1000], // distance in meters
      type: sequelize.QueryTypes.SELECT,
      model: Product,
      mapToModel: true
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({ message: 'Failed to search by location' });
  }
};


// --- HELPER FUNCTIONS ---

async function processUploadedImages(files) {
  if (!files || files.length === 0) return [];

  const imageUploadPromises = files.map(file => {
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
    const filepath = path.join(__dirname, '../uploads', filename);

    return sharp(file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filepath)
      .then(() => `/uploads/${filename}`);
  });

  return Promise.all(imageUploadPromises);
}

async function deleteUploadedImages(imagePaths) {
  if (!imagePaths || imagePaths.length === 0) return;

  const deletePromises = imagePaths.map(imagePath => {
    if (!imagePath) return Promise.resolve();
    const fullPath = path.join(__dirname, '..', imagePath);
    return fs.unlink(fullPath).catch(err => console.error(`Failed to delete image: ${fullPath}`, err));
  });

  await Promise.all(deletePromises);
}

// Get products by the authenticated seller (for seller dashboard)
const getMyProducts = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { seller_id: req.user.id };

    if (status) {
      where.status = status;
    }

    const products = await Product.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching my products:', error);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

// ============================
//  ADMIN: Update product status (approve / reject / pending)
// ============================
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'pending', 'approved', or 'rejected'." });
    }

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    await product.update({ status });

    res.status(200).json({ message: 'Product status updated successfully.', product });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ message: 'Failed to update product status.' });
  }
};

module.exports = {
  upload,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductsByLocation,
  getMyProducts,
  updateProductStatus,
};
