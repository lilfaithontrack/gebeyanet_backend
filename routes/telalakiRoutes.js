const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Controllers
const apiController = require('../controllers/telalakiController.js');

const router = express.Router();

// --- FILE PATH UTILITIES ---
// --- MULTER CONFIGURATION ---

// 1. Payment Proof Uploads (existing)
const paymentProofUploadDir = path.join(__dirname, '../uploads/payment_proofs');
if (!fs.existsSync(paymentProofUploadDir)) {
    fs.mkdirSync(paymentProofUploadDir, { recursive: true });
    console.log(`Created payment proof upload directory: ${paymentProofUploadDir}`);
}

const paymentStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, paymentProofUploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalNameSafe = file.originalname.replace(/\s+/g, '_');
        const ext = path.extname(originalNameSafe);
        cb(null, 'payment_proof_file' + '-' + uniqueSuffix + ext);
    }
});

const paymentFileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'application/pdf'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, PDF allowed.'), false);
    }
};

const uploadPaymentProof = multer({
    storage: paymentStorage,
    fileFilter: paymentFileFilter,
    limits: { fileSize: 1024 * 1024 * 10 } // 10MB
});

// 2. Shufer Registration Uploads (new)
const shuferUploadDir = path.join(__dirname, '../uploads/shufers');
if (!fs.existsSync(shuferUploadDir)) {
    fs.mkdirSync(shuferUploadDir, { recursive: true });
    console.log(`Created Shufer upload directory: ${shuferUploadDir}`);
}

const shuferStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, shuferUploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fieldname = file.fieldname;
        const ext = path.extname(file.originalname);
        cb(null, `${fieldname}-${uniqueSuffix}${ext}`);
    }
});

const shuferFileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'application/pdf'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, PDF allowed.'), false);
    }
};

const uploadShuferFiles = multer({
    storage: shuferStorage,
    fileFilter: shuferFileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB per file
});

// --- ROUTES ---

// Auth Routes
router.post('/auth/register/sender', apiController.registerSender);
router.post('/auth/login/sender', apiController.loginSender);
router.post('/auth/register/driver', apiController.registerDriver);
router.post('/auth/login/driver', apiController.loginDriver);
router.get('/notifications/my', apiController.getMyNotifications); // protect middleware can be added later

// Driver Routes
router.put('/drivers/:driverId/location', apiController.updateDriverLocation);

// Delivery Routes
router.post(
    '/deliveries',
    uploadPaymentProof.single('payment_proof_file'),
    apiController.createDeliveryRequest
);

router.post('/deliveries/accept', apiController.driverAcceptRequest);
router.post('/delivery/accept', apiController.shuferAcceptRequest);

// Admin Routes
router.put('/admin/drivers/approval', apiController.updateApproval);
router.post('/admin/payments/approve', apiController.adminApprovePayment);
router.get('/admin/deliveries', apiController.getAllDeliveryRequests);
router.post('/admin/deliveries/assign', apiController.adminAssignDriver);
router.post('/admin/delivery/assign', apiController.assignDeliveryRequestToShufer);
router.post('/admin/deliveries/broadcast', apiController.adminBroadcastRequest);
router.get('/shufer/me', apiController.getMyProfile);
// Shufer Registration Route (NEW - WITH FILE UPLOADS)
router.post(
    '/register/shufer',
    uploadShuferFiles.fields([
        { name: 'driver_license_photo', maxCount: 1 },
        { name: 'driver_identification_photo', maxCount: 1 },
        { name: 'car_license_photo', maxCount: 1 },
        { name: 'car_photo', maxCount: 1 },
        { name: 'actual_owner_id_photo', maxCount: 1 },
        { name: 'actual_owner_photo', maxCount: 1 },
    ]),
    apiController.registerShufer
);

router.post('/login/shufer', apiController.loginShufer);

// Pricing Routes
router.put('/pricing', apiController.setOrUpdatePricing);
router.get('/pricing', apiController.getPricing);

// --- ERROR HANDLING FOR FILE UPLOADS ---
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error("Multer Error:", err);
        return res.status(400).json({ message: `File upload error: ${err.message}`, error: { field: err.field } });
    } else if (err && err.message && err.message.includes('Invalid file type')) {
        console.error("File Type Error:", err.message);
        return res.status(400).json({ message: err.message });
    } else if (err) {
        console.error("Unknown Middleware Error:", err);
        return res.status(500).json({ message: "An unexpected error occurred." });
    }
    next();
});

module.exports = router;
