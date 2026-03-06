const UOM = require('../models/UOM.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==== Multer Configuration (Inline) ====
const uploadPath = 'uploads/uoms';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const uomUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only jpg, png, and webp files are allowed'));
  },
});

// ==== Controller Functions ====

const createUOM = async (req, res) => {
  console.log('--- createUOM ---'); // Log when the function is hit
  try {
    const { product_id, type, value, price, stock } = req.body;
    console.log('req.body (text fields):', req.body);

    if (!product_id || !type || !value || !price || !stock) {
      console.log('Validation failed: Missing required fields.');
      return res.status(400).json({ message: 'All fields are required (product_id, type, value, price, stock).' });
    }

    console.log('req.file (from multer for new image):', req.file);

    // Determine the value for the 'images' field in the database
    // If a file is uploaded, its path will be stored in an array.
    // If no file is uploaded, an empty array will be stored.
    let images_for_db = []; // Default to empty array
    if (req.file && req.file.filename) {
      const imagePath = `/uploads/uoms/${req.file.filename}`; // Path relative to your server's public/uploads access
      images_for_db = [imagePath]; // Store the single uploaded image path in an array
    }
    console.log('Constructed images_for_db (array for database):', images_for_db);

    const uomDataToCreate = {
      product_id,
      type,
      value,
      price,
      stock,
      images: images_for_db, // Using 'images' (plural) and storing an array
    };
    console.log('Data being passed to UOM.create():', JSON.stringify(uomDataToCreate, null, 2));

    const uom = await UOM.create(uomDataToCreate);
    console.log('UOM object created by Sequelize (from DB):', JSON.stringify(uom, null, 2));

    res.status(201).json(uom);
  } catch (err) {
    console.error('--- ERROR in createUOM ---');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack); // Can be verbose, but useful for deep bugs
    
    // Check for Sequelize validation errors specifically
    if (err.name === 'SequelizeValidationError' && err.errors && err.errors.length > 0) {
        console.error('Sequelize Validation Errors:', err.errors.map(e => ({ field: e.path, message: e.message })));
        const validationMessages = err.errors.map(e => `${e.path}: ${e.message}`).join(', ');
        return res.status(400).json({ message: `Validation failed: ${validationMessages}` });
    }
    // Check for other common Sequelize errors like UniqueConstraintError
    if (err.name === 'SequelizeUniqueConstraintError') {
        console.error('Sequelize Unique Constraint Error:', err.errors.map(e => ({ field: e.path, message: e.message })));
        const constraintMessage = err.errors.map(e => `Field '${e.path}' with value '${e.value}' violates a unique constraint.`).join(', ');
        return res.status(409).json({ message: constraintMessage }); // 409 Conflict
    }

    res.status(500).json({ message: 'Server error creating UOM.' });
  }
};
const getUOMsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const uoms = await UOM.findAll({ where: { product_id: productId } });
    res.status(200).json(uoms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching UOMs.' });
  }
};

const updateUOM = async (req, res) => {
  console.log('--- updateUOM ---');
  const { id } = req.params;
  console.log(`Attempting to update UOM with ID: ${id}`);
  console.log('Incoming req.body:', req.body);
  console.log('Incoming req.file (new image from multer):', req.file);

  try {
    const uomToUpdate = await UOM.findByPk(id);

    if (!uomToUpdate) {
      console.log(`UOM with ID: ${id} not found for update.`);
      return res.status(404).json({ message: 'UOM not found.' });
    }
    console.log('Existing UOM data before update:', JSON.stringify(uomToUpdate, null, 2));

    const oldImageDbPath = uomToUpdate.image_url; // Path stored in DB e.g., /uploads/uoms/xyz.jpg
    let finalImageUrlForDb;

    if (req.file) {
      // Case 1: New file is uploaded
      finalImageUrlForDb = `/uploads/uoms/${req.file.filename}`;
      console.log('New image uploaded. Path for DB will be:', finalImageUrlForDb);
    } else {
      // Case 2: No new file uploaded. Check if image_url is being modified via req.body
      if (req.body.hasOwnProperty('image_url')) {
        // Client explicitly sent an image_url value in the body
        // This could be null (to remove the image) or a new string path (if managing URLs manually)
        finalImageUrlForDb = req.body.image_url;
        console.log('No new file uploaded. image_url from req.body will be used:', finalImageUrlForDb);
      } else {
        // Case 3: No new file and image_url not in req.body, so keep the existing one
        finalImageUrlForDb = oldImageDbPath;
        console.log('No new file uploaded and image_url not in req.body. Image path remains:', finalImageUrlForDb);
      }
    }

    // Prepare the data payload for the update
    // Start with everything from req.body, then specifically set image_url based on our logic
    const updatePayload = { ...req.body };
    updatePayload.image_url = finalImageUrlForDb;

    console.log('Data being passed to UOM.update():', JSON.stringify(updatePayload, null, 2));

    const [numberOfAffectedRows] = await UOM.update(updatePayload, {
      where: { id },
    });
    console.log(`UOM.update - Number of rows affected: ${numberOfAffectedRows}`);

    if (numberOfAffectedRows > 0) {
      // Successfully updated. Now, handle old image deletion if necessary.

      // Condition 1: A new image was uploaded, and it's different from the old image.
      if (req.file && oldImageDbPath && oldImageDbPath !== finalImageUrlForDb) {
        const oldImageFilename = path.basename(oldImageDbPath);
        const oldImageServerPath = path.join(uploadPath, oldImageFilename); // e.g., "uploads/uoms/old_image.jpg"
        console.log(`New image uploaded. Attempting to delete old image: ${oldImageServerPath}`);
        fs.unlink(oldImageServerPath, (err) => {
          if (err) {
            console.error(`Failed to delete old image ${oldImageServerPath}:`, err);
            // Don't fail the request, just log the error for image cleanup
          } else {
            console.log(`Successfully deleted old image: ${oldImageServerPath}`);
          }
        });
      }
      // Condition 2: No new file was uploaded, but the image_url was explicitly set to null (image removed), and there was an old image.
      else if (!req.file && finalImageUrlForDb === null && oldImageDbPath) {
        const oldImageFilename = path.basename(oldImageDbPath);
        const oldImageServerPath = path.join(uploadPath, oldImageFilename);
        console.log(`Image explicitly removed. Attempting to delete old image: ${oldImageServerPath}`);
        fs.unlink(oldImageServerPath, (err) => {
          if (err) {
            console.error(`Failed to delete old image ${oldImageServerPath} (on removal):`, err);
          } else {
            console.log(`Successfully deleted old image ${oldImageServerPath} (on removal)`);
          }
        });
      }

      const updatedUOMFromDB = await UOM.findByPk(id); // Fetch the truly updated record
      console.log('Fetched updated UOM from DB:', JSON.stringify(updatedUOMFromDB, null, 2));
      res.status(200).json(updatedUOMFromDB);
    } else {
      // This means UOM.update didn't change any rows.
      // This could happen if the data sent was identical to what's already in the DB,
      // or if the UOM was deleted between the findByPk and update calls (less likely).
      console.log(`UOM with ID: ${id} was found, but update affected 0 rows (data might be unchanged or UOM disappeared).`);
      // Optionally, you could send back the uomToUpdate object if no changes were made
      // or re-fetch to confirm its current state.
      const possiblyUnchangedUOM = await UOM.findByPk(id); // Re-fetch to get current state
      if (possiblyUnchangedUOM) {
        res.status(200).json(possiblyUnchangedUOM);
      } else {
        // This case means the UOM was deleted by another process after our initial findByPk
        console.log(`UOM with ID: ${id} no longer exists after update attempt affected 0 rows.`);
        return res.status(404).json({ message: 'UOM not found after update attempt.' });
      }
    }

  } catch (err) {
    console.error('--- ERROR in updateUOM ---');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    // console.error('Error Stack:', err.stack); // Can be very verbose, enable if needed
    if (err.errors && err.errors.length > 0) { // For Sequelize validation errors
        console.error('Sequelize Validation Errors:', err.errors.map(e => ({ field: e.path, message: e.message })));
    }
    res.status(500).json({ message: 'Server error updating UOM.' });
  }
};
  

const deleteUOM = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UOM.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ message: 'UOM not found.' });

    res.status(200).json({ message: 'UOM deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting UOM.' });
  }
};

module.exports = { uomUpload, createUOM, getUOMsByProduct, updateUOM, deleteUOM };
