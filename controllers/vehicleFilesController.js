const multer = require('multer');
const path = require('path');
const fs = require('fs');
const VehicleFiles = require('../models/VehicleFiles.js');

// 📂 Ensure uploads folder exists
const uploadDir = 'uploads/vehicles';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 📸 Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname));
  }
});

// ✅ Allowed file types (images + pdf/doc/docx)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format'), false);
  }
};

// 🚀 Multer instance
const uploadFiles = multer({ storage, fileFilter }).fields([
  { name: 'car_photo', maxCount: 1 },
  { name: 'car_license_photo', maxCount: 1 },
  { name: 'commercial_license', maxCount: 1 },
  { name: 'owner_id_photo', maxCount: 1 },
  { name: 'filled_document', maxCount: 1 }
]);

// ==========================
// 📌 CONTROLLERS
// ==========================

// Create new record
const createVehicleFiles = async (req, res) => {
  try {
    const { template_version } = req.body;
    const files = req.files;

    const vehicleFiles = await VehicleFiles.create({
      car_photo: files.car_photo ? files.car_photo[0].path : null,
      car_license_photo: files.car_license_photo ? files.car_license_photo[0].path : null,
      commercial_license: files.commercial_license ? files.commercial_license[0].path : null,
      owner_id_photo: files.owner_id_photo ? files.owner_id_photo[0].path : null,
      filled_document: files.filled_document ? files.filled_document[0].path : null,
      template_version
    });

    res.status(201).json(vehicleFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all records
const getVehicleFiles = async (req, res) => {
  try {
    const files = await VehicleFiles.findAll();
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single record
const getVehicleFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await VehicleFiles.findByPk(id);
    if (!file) return res.status(404).json({ error: 'Record not found' });
    res.status(200).json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update record
const updateVehicleFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files;
    const existing = await VehicleFiles.findByPk(id);

    if (!existing) return res.status(404).json({ error: 'Record not found' });

    const updatedData = {
      ...req.body,
      car_photo: files.car_photo ? files.car_photo[0].path : existing.car_photo,
      car_license_photo: files.car_license_photo ? files.car_license_photo[0].path : existing.car_license_photo,
      commercial_license: files.commercial_license ? files.commercial_license[0].path : existing.commercial_license,
      owner_id_photo: files.owner_id_photo ? files.owner_id_photo[0].path : existing.owner_id_photo,
      filled_document: files.filled_document ? files.filled_document[0].path : existing.filled_document,
    };

    await existing.update(updatedData);
    res.status(200).json(existing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete record
const deleteVehicleFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await VehicleFiles.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ error: 'Record not found' });

    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadFiles, createVehicleFiles, getVehicleFiles, getVehicleFileById, updateVehicleFiles, deleteVehicleFiles };
