const express = require('express');
const { uploadFiles, createVehicleFiles, getVehicleFiles, getVehicleFileById, updateVehicleFiles, deleteVehicleFiles } = require('../controllers/vehicleFilesController.js');

const router = express.Router();

router.post('/', uploadFiles, createVehicleFiles);
router.get('/', getVehicleFiles);
router.get('/:id', getVehicleFileById);
router.put('/:id', uploadFiles, updateVehicleFiles);
router.delete('/:id', deleteVehicleFiles);

module.exports = router;
