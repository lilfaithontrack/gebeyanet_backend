const multer = require('multer');
const path = require('path');

// Set up multer storage and file handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/catimages'); // Upload directory
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    const filename = `${Date.now()}${ext}`; // Use current timestamp as the filename
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, fileFilter });

module.exports = { upload };
