const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure that upload directories exist
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
  return false;
};

// Function to create storage configuration dynamically
const createStorage = (folderName) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const directory = `./uploads/${folderName}`;
      ensureDirectoryExistence(directory);  // Ensure that the folder exists
      cb(null, directory);  // Save file to the folder
    },
    filename: (req, file, cb) => {
      // Generate a unique filename using timestamp and original name
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      cb(null, fileName);
    },
  });
};

// Multer configuration for screenshots (single file upload)
const uploadScreenshot = multer({
  storage: createStorage('screenshots'),
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed for screenshots.'));
    }
  },
}).single('payment_screenshot');  // 'payment_screenshot' is the field name for the screenshot

// Multer configuration for product images (multiple file upload)
const uploadProductImages = multer({
  storage: createStorage('products'),
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB for product images
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed for product images.'));
    }
  },
}).array('productImages', 5);  // 'productImages' is the field name for the product images, max 5 images

// Function to handle uploading screenshot and returning file path
const uploadScreenshotHandler = async (file) => {
  if (!file) {
    throw new Error('No file uploaded.');
  }
  const filePath = `/uploads/screenshots/${file.filename}`;  // Path for screenshot
  return filePath;
};

// Function to handle uploading product images and returning file paths
const uploadProductImagesHandler = async (files) => {
  if (!files || files.length === 0) {
    throw new Error('No files uploaded.');
  }
  const filePaths = files.map(file => `/uploads/products/${file.filename}`);  // Paths for product images
  return filePaths;
};

module.exports = { uploadScreenshot, uploadProductImages };

