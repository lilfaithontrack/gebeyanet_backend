// controllers/telalakiController.js
// ------------- Unified Controller - INSECURE / OPEN ROUTES -------------

// --- Imports ---
const { Sender, Vehicle, Driver, AdminApproval, DeliveryRequest, Shufer, DynamicPricing, Notification, sequelize, Sequelize } = require('../models/Telalaki.js'); // Sequelize በካፒታል 'S' ለትራንዛክሽን ደረጃዎች
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize'); // እንደ ማጣሪያ/ወሰን ሳጥን ላሉ ውስብስብ ጥያቄዎች ያስፈልጋል
const dotenv = require('dotenv');

dotenv.config(); // JWT_SECRET መጫኑን ያረጋግጡ

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '90d'
const SALT_ROUNDS = 10;
const MAX_ASSIGNMENT_DISTANCE_KM = 50; // ለርቀት ጥበቃ የናሙና ቋሚ

// --- START HELPER FUNCTIONS (Included directly for consolidation) ---

/**
 * ደረጃውን የጠበቀ የስህተት ምላሽ ይልካል።
 * @param {object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - ለደንበኛው የሚታይ የስህተት መልዕክት።
 * @param {object|array|null} [error=null] - አማራጭ የስህተት ዝርዝሮች (Sequelize errors, etc.).
 */
const sendErrorResponse = (res, statusCode, message, error = null) => {
    console.error(`Error ${statusCode}: ${message}`, error ? error.message || error : ''); // ስህተቱን በአገልጋይ በኩል ይመዝግቡ
    let details;
    // ከ Sequelize የተለዩ የማረጋገጫ ስህተቶችን ለማውጣት ይሞክሩ
    if (error && error.name === 'SequelizeValidationError' && Array.isArray(error.errors)) {
        details = error.errors.map(e => ({ field: e.path, message: e.message }));
    } else if (error && Array.isArray(error) && error.length > 0 && error[0]?.message) { // ሌሎች የድርድር ስህተቶችን ያስተናግዱ
        details = error.map(e => ({ field: e.path || 'general', message: e.message }));
    } else if (error && error.message) { // ነጠላ የስህተት ኦብጀክትን ያስተናግዱ
        details = error.message;
    }
    return res.status(statusCode).json({
        message: message,
        error: details || (error ? 'An unexpected error occurred.' : undefined) // ሚስጥራዊ ዝርዝሮችን ከማሳየት ይቆጠቡ
    });
};

/**
 * በዳታቤዝ ውስጥ የኖቲፊኬሽን መዝገብ ይፈጥራል።
 * @param {object} details - የኖቲፊኬሽን ዝርዝሮች (sender_id ወይም driver_id, message, type, etc.).
 * @param {object|null} [transaction=null] - አማራጭ የ Sequelize ትራንዛክሽን ኦብጀክት።
 */
const createNotification = async (details, transaction = null) => {
    try {
        if (!details.message || (!details.sender_id && !details.driver_id)) {
            console.error("Failed to create notification: Missing message or recipient ID", details);
            return; // ወሳኝ ካልሆነ ይመለሱ
        }
        await Notification.create(details, { transaction });
        console.log(`Notification created: ${details.type || 'general'} for ${details.sender_id ? 'Sender' : 'Driver'} ${details.sender_id || details.driver_id}`);
    } catch (notificationError) {
        // ስህተቱን ይመዝግቡ ነገር ግን የኖቲፊኬሽን ስህተት ዋናውን ሂደት እንዳያቆም ያድርጉ
        console.error(`Failed to create notification (${details.type}):`, notificationError.message);
    }
};

/** ዲግሪ ወደ ራዲያን ይቀይራል */
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/** ራዲያን ወደ ዲግሪ ይቀይራል */
function rad2deg(rad) {
    return rad * (180 / Math.PI);
}

/** የሁለት ነጥቦች መካከል ያለውን ትልቅ-ክበብ ርቀት በ Haversine ቀመር ያሰላል። */
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
        !isFinite(lat1) || !isFinite(lon1) || !isFinite(lat2) || !isFinite(lon2)) {
        console.warn("calculateDistance: Invalid or missing coordinates provided.", { lat1, lon1, lat2, lon2 });
        return Infinity; // ማስላት አይቻልም ወይም ልክ ያልሆኑ ግቤቶች
    }
    const R = 6371; // የምድር ራዲየስ በኪሎሜትር
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // ርቀት በኪ.ሜ.
    return distance;
}

/** ለጂኦ-ጥያቄዎች ግምታዊ የወሰን ሳጥን ያሰላል። */
function getBoundingBox(centerLat, centerLng, radiusKm) {
    const R = 6371; // የምድር ራዲየስ በኪ.ሜ.
    const latRad = deg2rad(centerLat);

    // ራዲያን ለላቲቲዩድ ለውጥ
    const latDeltaRad = radiusKm / R;

    const minLat = rad2deg(latRad - latDeltaRad);
    const maxLat = rad2deg(latRad + latDeltaRad);

    let minLng, maxLng;

    // ለዋልታዎች እና ለዳርቻ ሁኔታዎች ጥንቃቄ ያድርጉ
    if (minLat > -90 && maxLat < 90) {
        // ራዲያን ለሎንጊቲዩድ ለውጥ
        const lonDeltaRad = Math.asin(Math.sin(latDeltaRad) / Math.cos(latRad));
        minLng = rad2deg(deg2rad(centerLng) - lonDeltaRad);
        maxLng = rad2deg(deg2rad(centerLng) + lonDeltaRad);
    } else {
        // በዋልታዎች ላይ ወይም ሲያልፍ፣ ሎንጊቲዩድ ሙሉውን ክልል ይሸፍናል
        minLng = -180;
        maxLng = 180;
    }
    return {
        minLat: Math.max(minLat, -90), // ከ -90 በታች እንዳይሆን ያረጋግጡ
        maxLat: Math.min(maxLat, 90),   // ከ 90 በላይ እንዳይሆን ያረጋግጡ
        minLng: minLng,
        maxLng: maxLng
    };
}
// --- END HELPER FUNCTIONS ---


// =============================================
// Authentication Functions
// =============================================

const registerSender = async (req, res) => {
    try {
        const { full_name, phone, pin } = req.body;
        // Validation
        if (!full_name || !phone || !pin) return sendErrorResponse(res, 400, 'Full name, phone number, and 4-digit PIN are required.');
        if (!/^09\d{8}$/.test(phone)) return sendErrorResponse(res, 400, 'Invalid phone number format. Use 09xxxxxxxx format.');
        if (!/^\d{4}$/.test(pin)) return sendErrorResponse(res, 400, 'Sender PIN must be exactly 4 digits.');

        const existingSender = await Sender.findOne({ where: { phone } });
        if (existingSender) return sendErrorResponse(res, 409, 'Phone number is already registered.');

        const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);
        const sender = await Sender.create({ full_name, phone, pin: hashedPin });
        const senderData = { ...sender.toJSON() };
        delete senderData.pin; // ሃሽ መልሰው አይላኩ
        res.status(201).json({ message: 'Sender registered successfully.', sender: senderData });

    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return sendErrorResponse(res, 400, 'Registration failed: Validation or duplicate entry.', error);
        }
        console.error('Sender Registration Error:', error);
        sendErrorResponse(res, 500, 'Sender registration failed due to an internal error.');
    }
};

const loginSender = async (req, res) => {
    const { phone, pin } = req.body;
    // Validation
    if (!phone || !pin) return sendErrorResponse(res, 400, 'Phone number and PIN are required.');
    if (!/^09\d{8}$/.test(phone)) return sendErrorResponse(res, 400, 'Invalid phone number format.');
    if (!/^\d{4}$/.test(pin)) return sendErrorResponse(res, 400, 'Invalid PIN format. Must be 4 digits.');

    try {
        const sender = await Sender.findOne({ where: { phone } });
        if (!sender || !sender.pin) {
            return sendErrorResponse(res, 401, 'Login failed: Invalid phone number or PIN.');
        }

        const isPinValid = await bcrypt.compare(pin, sender.pin);
        if (!isPinValid) {
            return sendErrorResponse(res, 401, 'Login failed: Invalid phone number or PIN.');
        }

        if (!JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined!");
            return sendErrorResponse(res, 500, 'Login failed due to server configuration error.');
        }
        const payload = { id: sender.id, phone: sender.phone, type: 'sender' };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        const senderData = { ...sender.toJSON() };
        delete senderData.pin;

        res.status(200).json({ message: 'Login successful.', accessToken, sender: senderData });
    } catch (err) {
        console.error("Sender Login Error:", err)
        sendErrorResponse(res, 500, 'Login failed due to an internal error.', err);
    }
};

const registerDriver = async (req, res) => {
    const {
        sender_full_name, sender_phone, sender_pin,
        driver_full_name, driver_pin, driver_phone, driver_email, driver_region, driver_zone, driver_district, driver_house_number, driver_license_photo, identification_photo, is_owner,
        owner_full_name, region: vehicle_region, zone: vehicle_zone, district: vehicle_district, house_number: vehicle_house_number, phone: vehicle_phone, email: vehicle_email, car_type, car_name, manufacture_year, cargo_capacity, license_plate, commercial_license, tin_number, car_license_photo, owner_id_photo, car_photo, owner_photo
    } = req.body;

    let transaction;

    if (!sender_full_name || !sender_phone || !sender_pin || !driver_full_name || !driver_pin) return sendErrorResponse(res, 400, 'Sender (name, phone, 4-digit PIN) and Driver (name, 6-digit PIN) required.');
    if (!/^\d{4}$/.test(sender_pin)) return sendErrorResponse(res, 400, 'Sender PIN must be 4 digits.');
    if (!/^\d{6}$/.test(driver_pin)) return sendErrorResponse(res, 400, 'Driver PIN must be 6 digits.');
    if (!/^09\d{8}$/.test(sender_phone)) return sendErrorResponse(res, 400, 'Invalid Sender phone format.');

    const driverIsOwner = is_owner === true || String(is_owner).toLowerCase() === 'true';
    if (!driverIsOwner && (!car_type || !license_plate)) { // አስፈላጊ የተሽከርካሪ መስኮችን ይጨምሩ
        return sendErrorResponse(res, 400, 'Vehicle info required if driver is not owner.');
    }

    try {
        transaction = await sequelize.transaction();

        const existingSender = await Sender.findOne({ where: { phone: sender_phone }, transaction });
        if (existingSender) {
            await transaction.rollback();
            return sendErrorResponse(res, 409, 'Sender phone number already registered.');
        }

        const hashedSenderPin = await bcrypt.hash(sender_pin, SALT_ROUNDS);
        const newSender = await Sender.create({ full_name: sender_full_name, phone: sender_phone, pin: hashedSenderPin }, { transaction });

        const hashedDriverPin = await bcrypt.hash(driver_pin, SALT_ROUNDS);
        const driverData = {
            full_name: driver_full_name, phone: driver_phone, email: driver_email,
            region: driver_region, zone: driver_zone, district: driver_district, house_number: driver_house_number,
            driver_license_photo, identification_photo, is_owner: driverIsOwner, pin: hashedDriverPin,
            sender_id: newSender.id
        };
        const newDriver = await Driver.create(driverData, { transaction });

        let newVehicle = null;
        if (!driverIsOwner) {
            const vehicleData = {
                owner_full_name, region: vehicle_region, zone: vehicle_zone, district: vehicle_district, house_number: vehicle_house_number,
                phone: vehicle_phone, email: vehicle_email, car_type, car_name, manufacture_year, cargo_capacity, license_plate,
                commercial_license, tin_number, car_license_photo, owner_id_photo, car_photo, owner_photo,
                // driver_id: newDriver.id, // በ Vehicle ሞዴል ላይ FK ካከሉ ይህንን ግምት ውስጥ ያስገቡ
            };
            newVehicle = await Vehicle.create(vehicleData, { transaction });
        }

        await AdminApproval.create({ driver_id: newDriver.id, status: 'pending' }, { transaction });

        await createNotification({
            sender_id: newSender.id, message: `Driver registration for ${driver_full_name} submitted, pending approval.`,
            type: 'driver_registration', related_entity_id: newDriver.id, related_entity_type: 'Driver'
        }, transaction);

        await transaction.commit();
        res.status(201).json({
            message: 'Driver registered successfully, pending approval.',
            driverId: newDriver.id, senderId: newSender.id, vehicleId: newVehicle ? newVehicle.id : null
        });

    } catch (err) {
        if (transaction) await transaction.rollback();
        if (err.name === 'SequelizeUniqueConstraintError') return sendErrorResponse(res, 409, `Registration failed: Duplicate value for ${err.errors?.[0]?.path || 'field'}.`, err);
        if (err.name === 'SequelizeValidationError') return sendErrorResponse(res, 400, 'Registration failed: Validation error.', err);
        console.error("Driver Registration Error:", err);
        sendErrorResponse(res, 500, 'Driver registration failed.');
    }
};

const getMyNotifications = async (req, res) => {
    const senderId = req.sender?.id || req.user?.id;
    console.log(`getMyNotifications - Authenticated senderId from middleware: ${senderId}`);

    if (!senderId) {
        console.error("getMyNotifications Error: req.sender.id or req.user.id was not found. Check protectSender middleware.");
        return sendErrorResponse(res, 401, 'Authentication failed: User context not found.');
    }

    const defaultLimit = 20;
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = defaultLimit;
    const offset = (page - 1) * limit;

    try {
        console.log(`Workspaceing notifications for sender ${senderId}, page ${page}, limit ${limit}`);
        const { count, rows } = await Notification.findAndCountAll({
            where: { sender_id: senderId },
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset,
        });
        console.log(`Found ${count} total notifications, returning ${rows.length} for page ${page}.`);
        res.status(200).json({
            message: "Notifications retrieved successfully.",
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit: limit,
            notifications: rows
        });
    } catch (err) {
        console.error(`Database error fetching notifications for sender ${senderId}:`, err);
        sendErrorResponse(res, 500, 'Failed to retrieve notifications due to a server error.', err);
    }
};

const loginDriver = async (req, res) => {
    const { phone, pin } = req.body;
    if (!phone || !pin) return sendErrorResponse(res, 400, 'Driver phone and 6-digit PIN required.');
    if (!/^09\d{8}$/.test(phone)) return sendErrorResponse(res, 400, 'Invalid phone number format.');
    if (!/^\d{6}$/.test(pin)) return sendErrorResponse(res, 400, 'Driver PIN must be 6 digits.');

    try {
        const driver = await Driver.findOne({
            where: { phone },
            include: [{ model: AdminApproval, as: 'approvalStatus', attributes: ['status'] }]
        });

        if (!driver) return sendErrorResponse(res, 401, 'Login failed: Invalid credentials.');
        if (!driver.approvalStatus || driver.approvalStatus.status !== 'approved') {
            const status = driver.approvalStatus ? driver.approvalStatus.status : 'not processed';
            return sendErrorResponse(res, 403, `Login failed: Driver account is currently ${status}.`);
        }
        if (!driver.pin) {
            console.error(`Login Error: Driver ${driver.id} has no PIN hash.`);
            return sendErrorResponse(res, 500, 'Login failed: Server configuration error.');
        }

        const isPinValid = await bcrypt.compare(pin, driver.pin);
        if (!isPinValid) return sendErrorResponse(res, 401, 'Login failed: Invalid credentials.');

        if (!JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined!");
            return sendErrorResponse(res, 500, 'Login failed: Server configuration error.');
        }
        const payload = { id: driver.id, phone: driver.phone, type: 'driver' };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        const driverData = { ...driver.toJSON() };
        delete driverData.pin;

        res.status(200).json({ message: 'Driver login successful.', accessToken, driver: driverData });
    } catch (err) {
        console.error("Driver Login Error:", err);
        sendErrorResponse(res, 500, 'Driver login failed.', err);
    }
};

// =============================================
// Driver Functions
// =============================================

const updateDriverLocation = async (req, res) => {
    const { driverId } = req.params; // !! INSECURE: driverId ከ URL ፓራም ይመጣል !!
    const { latitude, longitude } = req.body;

    const drvId = parseInt(driverId, 10);
    if (isNaN(drvId) || drvId <= 0) return sendErrorResponse(res, 400, 'Invalid Driver ID in URL.');
    if (latitude === undefined || longitude === undefined) return sendErrorResponse(res, 400, 'Latitude and longitude required.');

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (typeof lat !== 'number' || !isFinite(lat) || lat < -90 || lat > 90) {
        return sendErrorResponse(res, 400, `Invalid latitude. Received: '${latitude}'`);
    }
    if (typeof lng !== 'number' || !isFinite(lng) || lng < -180 || lng > 180) {
        return sendErrorResponse(res, 400, `Invalid longitude. Received: '${longitude}'`);
    }

    try {
        const driver = await Driver.findByPk(drvId);
        if (!driver) return sendErrorResponse(res, 404, `Driver with ID ${drvId} not found.`);

        driver.current_lat = lat;
        driver.current_lng = lng;
        driver.last_location_update = new Date();
        await driver.save();
        res.status(204).send();

    } catch (err) {
        console.error(`Error updating location for driver ${drvId}:`, err);
        sendErrorResponse(res, 500, 'Failed to update driver location.', err);
    }
};

// =============================================
// Delivery Request Functions
// =============================================

const createDeliveryRequest = async (req, res) => {
    // 1. ከ req.body እና req.file (ለክፍያ ማረጋገጫ) የሚጠበቁ መስኮችን ማውጣት
    let {
        senderId, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
        weight, size, quantity,
        payment_method, // የክፍያ ዘዴ ከጥያቄው መምጣት አለበት
        bank_account,
        receiver_name,
        receiver_phone,
        // vehicle, // ተሽከርካሪ ከዚህ በፊት ተወግዷል
    } = req.body;

    // paymentProofFile ከ Multer middleware መምጣት አለበት።
    // Multer በራውት (route) ላይ በትክክል ከተዋቀረ እና የፊት-ለፊት (frontend)
    // ፋይሉን በትክክለኛው የመስክ ስም (field name) ከላከ፣ req.file እዚህ ዋጋ ይኖረዋል።
    const paymentProofFile = req.file;
    console.log("[CONTROLLER_DEBUG] Received req.body:", JSON.stringify(req.body, null, 2));
    console.log("[CONTROLLER_DEBUG] Received req.file (paymentProofFile):", paymentProofFile);


    // --- የቁጥር መስኮችን ወደ ቁጥር አይነት መቀየር ---
    const parsedSenderId = parseInt(senderId, 10);
    const parsedPickupLat = parseFloat(pickup_lat);
    const parsedPickupLng = parseFloat(pickup_lng);
    const parsedDropoffLat = parseFloat(dropoff_lat);
    const parsedDropoffLng = parseFloat(dropoff_lng);

    let parsedWeight;
    if (weight !== undefined && weight !== null && String(weight).trim() !== '') {
        parsedWeight = parseFloat(weight);
    }

    let parsedQuantity;
    if (quantity !== undefined && quantity !== null && String(quantity).trim() !== '') {
        parsedQuantity = parseInt(quantity, 10);
    }

    // --- መሰረታዊ የግቤት ማረጋገጫ ---
    if (!Number.isInteger(parsedSenderId) || parsedSenderId <= 0) {
        return sendErrorResponse(res, 400, 'Valid senderId (positive integer) is required.');
    }

    if (pickup_lat === undefined || pickup_lng === undefined || dropoff_lat === undefined || dropoff_lng === undefined) {
        return sendErrorResponse(res, 400, 'Pickup and Dropoff coordinates (latitude, longitude) are required.');
    }

    const validateCoord = (val, coordName, originalVal, range) => {
        if (typeof val !== 'number' || !isFinite(val)) {
            return `${coordName} must be a finite number. Received: '${originalVal}'`;
        }
        if (Math.abs(val) > range) {
            return `${coordName} (${val.toFixed(6)}) is out of valid range (-${range} to ${range}).`;
        }
        return null;
    };

    const latErrorMargin = 90;
    const lngErrorMargin = 180;
    let coordError = validateCoord(parsedPickupLat, 'pickup_lat', pickup_lat, latErrorMargin) ||
        validateCoord(parsedPickupLng, 'pickup_lng', pickup_lng, lngErrorMargin) ||
        validateCoord(parsedDropoffLat, 'dropoff_lat', dropoff_lat, latErrorMargin) ||
        validateCoord(parsedDropoffLng, 'dropoff_lng', dropoff_lng, lngErrorMargin);

    if (coordError) {
        return sendErrorResponse(res, 400, coordError);
    }

    // የተሽከርካሪ ማረጋገጫ ተወግዷል
    // if (!vehicle || typeof vehicle !== 'string' || vehicle.trim() === '') {
    //     return sendErrorResponse(res, 400, 'Vehicle name is required and must be a non-empty string.');
    // }

    // የክፍያ ዘዴ ማረጋገጫ
    const validPaymentMethods = ['screenshot']; // 'cash' ተወግዷል
    // ከሞዴልዎ የ payment_method ነባሪ እሴት ማምጣት (DeliveryRequest ሞዴል መኖሩን በማሰብ)
    const defaultPaymentMethod = DeliveryRequest.rawAttributes.payment_method.defaultValue || 'screenshot';
    const currentPaymentMethod = (payment_method !== undefined && payment_method !== null && String(payment_method).trim() !== '') ? String(payment_method).trim() : defaultPaymentMethod;

    if (currentPaymentMethod !== 'screenshot') { // ብቸኛው አማራጭ 'screenshot' መሆኑን ማረጋገጥ
        // ይህ ስህተት መፈጠር የለበትም፤ ምክንያቱም የፊት-ለፊት (frontend) 'screenshot' ብቻ ነው የሚልከው
        return sendErrorResponse(res, 400, `Invalid payment_method. Only 'screenshot' is accepted. Received: '${currentPaymentMethod}'`);
    }

    // የክፍያ ማረጋገጫ ምስል እና የባንክ አካውንት ማረጋገጫ (ለ 'screenshot' ዘዴ)
    let paymentProofImageString;
    // currentPaymentMethod ሁልጊዜ 'screenshot' ስለሆነ፣ ይህ if ሁልጊዜም true መሆን አለበት
    if (currentPaymentMethod === 'screenshot') {
        // <<<< ወሳኝ ማረጋገጫ >>>>
        // `paymentProofFile` (ማለትም `req.file`) እዚህ ጋ `undefined` ከሆነ፣
        // Multer ፋይሉን በትክክል አላገኘውም ወይም አላዘጋጀውም ማለት ነው።
        // የፊት-ለፊት (frontend) ላይ ያለው የ FormData የመስክ ስም (`payment_proof_file`)
        // በራውት (route) ላይ ካለው የ Multer ውቅር (`uploadPaymentProof.single('payment_proof_file')`) ጋር መመሳሰል አለበት።
        if (!paymentProofFile) {
            console.error("[CONTROLLER_ERROR] paymentProofFile (req.file) is undefined. Check Multer setup and frontend field name.");
            return sendErrorResponse(res, 400, 'Payment proof image is required for screenshot payment method.');
        }
        // የፋይሉን ስም (ወይም ዱካ) ከ paymentProofFile (req.file) እናገኛለን
        paymentProofImageString = paymentProofFile.filename; // Multer በ diskStorage ሲዋቀር filename ይሰጣል
        // ወይም paymentProofFile.path (ሙሉ ዱካ) መጠቀም ይቻላል

        const validBankAccounts = ['Cbe', 'Telebirr', 'Abyssinia'];
        if (bank_account === undefined || bank_account === null || String(bank_account).trim() === '' || !validBankAccounts.includes(String(bank_account).trim())) {
            return sendErrorResponse(res, 400, `A valid bank_account (one of: ${validBankAccounts.join(', ')}) is required for screenshot payment.`);
        }
    }
    // --- የቀሩት የአማራጭ መስኮች ማረጋገጫዎች (ክብደት፣ መጠን፣ ወዘተ.) ---
    // ... (ከዚህ በፊት እንደነበረው ይቀጥላል) ...
    if (weight !== undefined && weight !== null && String(weight).trim() !== '') {
        if (typeof parsedWeight !== 'number' || !isFinite(parsedWeight) || parsedWeight <= 0) {
            return sendErrorResponse(res, 400, `If provided, weight must be a positive finite number. Received: '${weight}'`);
        }
    }
    if (size !== undefined && size !== null) {
        if (typeof size !== 'string' || String(size).trim() === '') {
            return sendErrorResponse(res, 400, 'If provided, size must be a non-empty string.');
        }
        if (String(size).length > 255) {
            return sendErrorResponse(res, 400, 'Size string exceeds maximum length of 255 characters.');
        }
    }
    if (quantity !== undefined && quantity !== null && String(quantity).trim() !== '') {
        if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
            return sendErrorResponse(res, 400, `If provided, quantity must be a positive integer. Received: '${quantity}'`);
        }
    }
    if (receiver_name !== undefined && receiver_name !== null) {
        if (typeof receiver_name !== 'string' || String(receiver_name).trim() === '') {
            return sendErrorResponse(res, 400, 'If provided, receiver_name must be a non-empty string.');
        }
        if (String(receiver_name).length > 255) {
            return sendErrorResponse(res, 400, 'Receiver name exceeds maximum length of 255 characters.');
        }
    }
    if (receiver_phone !== undefined && receiver_phone !== null) {
        if (typeof receiver_phone !== 'string' || String(receiver_phone).trim() === '') {
            return sendErrorResponse(res, 400, 'If provided, receiver_phone must be a non-empty string.');
        }
        if (String(receiver_phone).length > 50) {
            return sendErrorResponse(res, 400, 'Receiver phone exceeds maximum length of 50 characters.');
        }
    }

    // --- የዳታቤዝ ክንውኖች ---
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const senderExists = await Sender.findByPk(parsedSenderId, { transaction });
        if (!senderExists) {
            await transaction.rollback();
            return sendErrorResponse(res, 404, `Sender with ID ${parsedSenderId} not found.`);
        }

        const pricingConfigResult = await DynamicPricing.findByPk(1, { transaction });
        if (!pricingConfigResult || typeof pricingConfigResult.price_per_km !== 'number' || !isFinite(pricingConfigResult.price_per_km) || pricingConfigResult.price_per_km < 0) {
            await transaction.rollback();
            console.warn(`Delivery creation blocked for Sender ${parsedSenderId}: Pricing configuration invalid or missing.`);
            return sendErrorResponse(res, 503, 'Service Unavailable: Pricing configuration error.');
        }
        const pricingConfig = pricingConfigResult.toJSON();

        const distanceKm = calculateDistance(parsedPickupLat, parsedPickupLng, parsedDropoffLat, parsedDropoffLng);
        if (!isFinite(distanceKm)) {
            await transaction.rollback();
            return sendErrorResponse(res, 400, 'Could not calculate distance. Please check coordinates.');
        }

        let calculatedPrice = distanceKm * pricingConfig.price_per_km;
        if (isFinite(parsedWeight) && parsedWeight > 0 && typeof pricingConfig.price_per_kg === 'number' && isFinite(pricingConfig.price_per_kg)) {
            calculatedPrice += parsedWeight * pricingConfig.price_per_kg;
        }
        if (Number.isInteger(parsedQuantity) && parsedQuantity > 0 && typeof pricingConfig.price_per_quantity === 'number' && isFinite(pricingConfig.price_per_quantity)) {
            calculatedPrice += parsedQuantity * pricingConfig.price_per_quantity;
        }
        if (typeof pricingConfig.base_fee === 'number' && isFinite(pricingConfig.base_fee)) {
            calculatedPrice += pricingConfig.base_fee;
        }
        if (typeof pricingConfig.minimum_charge === 'number' && isFinite(pricingConfig.minimum_charge) && calculatedPrice < pricingConfig.minimum_charge) {
            calculatedPrice = pricingConfig.minimum_charge;
        }
        calculatedPrice = Math.max(0, Math.round(calculatedPrice * 100) / 100);

        const deliveryData = {
            sender_id: parsedSenderId,
            pickup_lat: parsedPickupLat,
            pickup_lng: parsedPickupLng,
            dropoff_lat: parsedDropoffLat,
            dropoff_lng: parsedDropoffLng,
            status: 'pending',
            price: calculatedPrice,
            payment_method: currentPaymentMethod,
            bank_account: String(bank_account).trim(), // የባንክ አካውንት ሁልጊዜም ያስፈልጋል
            payment_proof_image: paymentProofImageString, // የክፍያ ማረጋገጫ ፋይል ስም/ዱካ
            // is_payment_approved በሞዴል default ወደ false መሆን አለበት
        };

        if (isFinite(parsedWeight) && parsedWeight > 0) deliveryData.weight = parsedWeight;
        if (size !== undefined && size !== null && String(size).trim() !== '') deliveryData.size = String(size).trim();
        if (Number.isInteger(parsedQuantity) && parsedQuantity > 0) deliveryData.quantity = parsedQuantity;
        if (receiver_name !== undefined && receiver_name !== null && String(receiver_name).trim() !== '') deliveryData.receiver_name = String(receiver_name).trim();
        if (receiver_phone !== undefined && receiver_phone !== null && String(receiver_phone).trim() !== '') deliveryData.receiver_phone = String(receiver_phone).trim();
        // vehicle ከ deliveryData ተወግዷል

        console.log("Attempting to create DeliveryRequest with data:", deliveryData);
        const newDelivery = await DeliveryRequest.create(deliveryData, { transaction });

        let notificationMessage = `Request #${newDelivery.id} created. Price: ${calculatedPrice.toFixed(2)} ETB. Payment proof submitted, pending review. Searching for drivers...`;

        await createNotification({
            sender_id: parsedSenderId,
            message: notificationMessage,
            type: 'delivery_created', related_entity_id: newDelivery.id, related_entity_type: 'DeliveryRequest'
        }, transaction);

        console.log(`INFO: Delivery Request ${newDelivery.id} created by Sender ${parsedSenderId}.`);

        await transaction.commit();
        res.status(201).json(newDelivery);

    } catch (err) {
        if (transaction) {
            try { await transaction.rollback(); }
            catch (rollbackError) { console.error("Error rolling back transaction:", rollbackError); }
        }
        // ጥያቄው ሳይሳካ ከቀረ እና ፋይል ተጭኖ ከነበረ ፋይሉን መሰረዝ (አማራጭ)
        // if (paymentProofFile && paymentProofFile.path) {
        //     try {
        //         fs.unlinkSync(paymentProofFile.path);
        //         console.log("Rolled back transaction, deleted uploaded payment proof:", paymentProofFile.path);
        //     } catch (e) {
        //         console.error("Error deleting uploaded payment proof after failed TX:", e);
        //     }
        // }

        if (err.name === 'SequelizeValidationError') {
            console.error("Sequelize Validation Error details:", err.errors);
            return sendErrorResponse(res, 400, 'Creation failed: Validation error(s).', err);
        }
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            console.error("Foreign Key Constraint Error:", err);
            return sendErrorResponse(res, 400, `Invalid reference provided (e.g., sender ID). Field: ${err.fields ? err.fields.join(', ') : 'unknown'}`, err);
        }
        console.error(`FATAL: Error creating delivery request for sender ${parsedSenderId || senderId || 'unknown'}:`, err);
        sendErrorResponse(res, 500, 'An unexpected error occurred while creating the delivery request.', err);
    }
};



const driverAcceptRequest = async (req, res) => {
    // !! INSECURE: driverId ከ body መምጣት አለበት !! (ወይም ከ authenticated user)
    const { deliveryRequestId, driverId } = req.body;

    const reqId = parseInt(deliveryRequestId, 10);
    const drvId = parseInt(driverId, 10); // ይህ ከ authenticated user መምጣት አለበት
    if (!reqId || !drvId || isNaN(reqId) || isNaN(drvId) || reqId <= 0 || drvId <= 0) return sendErrorResponse(res, 400, 'Valid deliveryRequestId and driverId required.');

    let transaction;
    try {
        transaction = await sequelize.transaction({
            // isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE // ለምሳሌ PostgreSQL
        });
        const lockOption = { transaction, lock: transaction.LOCK.UPDATE }; // ለ PostgreSQL

        const deliveryRequest = await DeliveryRequest.findByPk(reqId, {
            include: [{ model: Sender, as: 'sender', attributes: ['id', 'full_name'] }],
            ...lockOption
        });

        if (!deliveryRequest) {
            await transaction.rollback();
            return sendErrorResponse(res, 404, `Delivery Request #${reqId} not found.`);
        }
        if (deliveryRequest.status !== 'broadcasting') { // 'broadcasting' ወይም 'pending' ሊሆን ይችላል
            await transaction.rollback();
            const msg = deliveryRequest.assigned_driver_id ? `Request #${reqId} already assigned.` : `Request #${reqId} not available (Status: ${deliveryRequest.status}).`;
            return sendErrorResponse(res, 409, msg);
        }

        const driver = await Driver.findByPk(drvId, {
            include: [{ model: AdminApproval, as: 'approvalStatus' }],
            ...lockOption
        });

        if (!driver) { await transaction.rollback(); return sendErrorResponse(res, 404, `Driver ${drvId} not found.`); }
        if (!driver.approvalStatus || driver.approvalStatus.status !== 'approved') { await transaction.rollback(); return sendErrorResponse(res, 403, 'Account not approved.'); }
        if (!driver.is_available_for_new || driver.current_status !== 'idle') { await transaction.rollback(); return sendErrorResponse(res, 409, `Cannot accept: Your status is ${driver.current_status}.`); }

        deliveryRequest.assigned_driver_id = drvId;
        deliveryRequest.status = 'driver_confirmed'; // ወይም 'assigned'
        await deliveryRequest.save({ transaction });

        driver.is_available_for_new = false;
        driver.current_status = 'en_route_pickup';
        await driver.save({ transaction });

        await createNotification({ driver_id: drvId, message: `✅ Accepted Delivery Request #${reqId}. Proceed to pickup.`, type: 'request_accepted_self', related_entity_id: reqId, related_entity_type: 'DeliveryRequest' }, transaction);
        if (deliveryRequest.sender) { await createNotification({ sender_id: deliveryRequest.sender.id, message: `Driver ${driver.full_name} accepted Request #${reqId}!`, type: 'request_accepted_sender', related_entity_id: reqId, related_entity_type: 'DeliveryRequest' }, transaction); }

        await transaction.commit();
        res.status(200).json({ message: `Request #${reqId} accepted successfully.`, deliveryRequest });

    } catch (err) {
        if (transaction) await transaction.rollback();
        if (err.name === 'SequelizeTimeoutError' || (err.original && err.original.message.includes('lock'))) { // ለተለያዩ የDB lock ስህተቶች ማስተካከል
            console.warn(`Lock contention accepting Req ${deliveryRequestId} by Drv ${driverId}:`, err);
            return sendErrorResponse(res, 503, 'Could not process acceptance now. Please try again.');
        }
        console.error(`Error accepting request ${deliveryRequestId} by driver ${driverId}:`, err);
        sendErrorResponse(res, 500, 'Failed to accept delivery request.', err);
    }
};


// =============================================
// Admin Functions (Open Routes - !! ደህንነታቸውን ያረጋግጡ !!)
// =============================================

const updateApproval = async (req, res) => {
    // !! ADMIN ROUTE - ደህንነቱን ያረጋግጡ !!
    const { driver_id, status, reason } = req.body;
    if (!driver_id || !status) return sendErrorResponse(res, 400, 'driver_id and status required.');
    const drvId = parseInt(driver_id, 10);
    if (isNaN(drvId) || drvId <= 0) return sendErrorResponse(res, 400, 'Invalid driver_id.');
    if (!['approved', 'rejected', 'pending'].includes(status)) return sendErrorResponse(res, 400, 'Invalid status. Must be approved, rejected, or pending.');
    if (status === 'rejected' && (!reason || String(reason).trim() === '')) return sendErrorResponse(res, 400, 'Reason required for rejection.');

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const approval = await AdminApproval.findOne({
            where: { driver_id: drvId },
            include: [{ model: Driver, as: 'driver', include: [{ model: Sender, as: 'senderAccount' }] }], // senderAccount ሞዴልዎ ላይ መኖሩን ያረጋግጡ
            transaction
        });
        if (!approval) { await transaction.rollback(); return sendErrorResponse(res, 404, `Approval record not found for driver ${drvId}. Create one if needed.`); }
        if (approval.status === status) { await transaction.rollback(); return res.status(200).json({ message: `Driver status already ${status}.` }); }

        const driver = approval.driver;
        const sender = driver?.senderAccount; // senderAccount በ Driver ሞዴልዎ ላይ መኖር አለበት
        const originalStatus = approval.status;

        approval.status = status;
        approval.approved_at = status === 'approved' ? new Date() : null;
        approval.rejected_reason = status === 'rejected' ? String(reason).trim() : null;
        // approval.approved_by = req.admin.id; // አስተዳዳሪው ከ authenticated request መምጣት አለበት
        await approval.save({ transaction });

        if (driver) {
            driver.current_status = status === 'approved' ? 'idle' : 'offline';
            driver.is_available_for_new = status === 'approved';
            await driver.save({ transaction });
        }
        let notificationMessage = '';
        if (status === 'approved' && originalStatus !== 'approved') notificationMessage = `Driver profile for ${driver?.full_name || 'ID: ' + drvId} approved.`;
        else if (status === 'rejected' && originalStatus !== 'rejected') notificationMessage = `Driver profile for ${driver?.full_name || 'ID: ' + drvId} rejected. Reason: ${String(reason).trim()}`;

        if (notificationMessage && sender) { // sender መኖሩን ያረጋግጡ
            await createNotification({ sender_id: sender.id, message: notificationMessage, type: 'driver_approval_update', related_entity_id: drvId, related_entity_type: 'DriverApproval' }, transaction);
        } else if (notificationMessage && !sender && driver) {
            console.warn(`Could not send approval notification to Sender: Sender not found for Driver ID ${drvId}`);
            // አማራጭ፡ ለአሽከርካሪው በቀጥታ ማሳወቂያ ይላኩ
            await createNotification({ driver_id: drvId, message: notificationMessage, type: 'driver_approval_update_self', related_entity_id: drvId, related_entity_type: 'DriverApproval' }, transaction);
        }


        await transaction.commit();
        res.status(200).json({ message: `Driver ${drvId} status updated to ${status}.` });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error(`Error updating approval for driver ${driver_id}:`, err);
        sendErrorResponse(res, 500, 'Failed to update driver approval.', err);
    }
};

const adminApprovePayment = async (req, res) => {
    // !! ADMIN ROUTE - ደህንነቱን ያረጋግጡ !!
    const { delivery_id } = req.body; // approved_by ከ authenticated admin መምጣት አለበት
    // const adminId = req.admin.id; // ለምሳሌ

    if (!delivery_id) return sendErrorResponse(res, 400, 'Delivery ID required.');
    const reqId = parseInt(delivery_id, 10);
    if (isNaN(reqId) || reqId <= 0) return sendErrorResponse(res, 400, 'Invalid Delivery ID.');

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const delivery = await DeliveryRequest.findByPk(reqId, { include: [{ model: Sender, as: 'sender' }], transaction });
        if (!delivery) { await transaction.rollback(); return sendErrorResponse(res, 404, `Delivery request #${reqId} not found.`); }

        if (delivery.payment_method !== 'screenshot') { await transaction.rollback(); return sendErrorResponse(res, 400, 'Admin approval only applicable for screenshot payments.'); }
        if (!delivery.payment_proof_url) { await transaction.rollback(); return sendErrorResponse(res, 400, 'No payment proof URL found for this delivery.'); }
        if (delivery.is_payment_approved) { await transaction.rollback(); return sendErrorResponse(res, 409, `Payment for #${delivery.id} already approved by ${delivery.approved_by || 'N/A'}.`); }

        delivery.is_payment_approved = true;
        delivery.approved_by = 'admin'; // ወይም adminId ይጠቀሙ
        await delivery.save({ transaction });

        await createNotification({ sender_id: delivery.sender_id, message: `Admin approved payment for delivery #${delivery.id}.`, type: 'payment_approved_admin', related_entity_id: delivery.id, related_entity_type: 'DeliveryRequestPayment' }, transaction);

        await transaction.commit();
        res.status(200).json({ message: `Payment for delivery #${reqId} approved by admin.` });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error(`Error admin approving payment for Req ${delivery_id}:`, err);
        sendErrorResponse(res, 500, 'Failed to approve payment.', err);
    }
};

const getAllDeliveryRequests = async (req, res) => {
    // !! ADMIN ROUTE - ደህንነቱን ያረጋግጡ !!
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (req.query.status) whereClause.status = { [Op.in]: String(req.query.status).split(',').map(s => s.trim()) };
        if (req.query.senderId && !isNaN(parseInt(req.query.senderId, 10))) whereClause.sender_id = parseInt(req.query.senderId, 10);
        if (req.query.driverId && !isNaN(parseInt(req.query.driverId, 10))) whereClause.assigned_driver_id = parseInt(req.query.driverId, 10);
        // TODO: የቀን ክልል ማጣሪያዎችን ወዘተ ይጨምሩ

        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = String(req.query.sortOrder)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const orderClause = [[sortBy, sortOrder]];
        if (sortBy !== 'createdAt') orderClause.push(['createdAt', 'DESC']); // ሁለተኛ ደረጃ መደርደሪያ

        const { count, rows } = await DeliveryRequest.findAndCountAll({
            where: whereClause,
            include: [
                { model: Sender, as: 'sender', attributes: ['id', 'full_name', 'phone'] },
                { model: Driver, as: 'assignedDriver', attributes: ['id', 'full_name', 'phone', 'current_lat', 'current_lng'] }
            ],
            order: orderClause,
            limit: limit,
            offset: offset,
            distinct: true, // ለ include እና limit ትክክለኛ ቆጠራ
        });

        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            message: "Delivery requests retrieved.",
            data: rows,
            pagination: { totalItems: count, totalPages, currentPage: page, limit }
        });
    } catch (err) {
        if (err instanceof TypeError || (err instanceof Error && err.message.includes("parseInt"))) {
            return sendErrorResponse(res, 400, 'Invalid query parameter format.', err);
        }
        console.error("Error fetching delivery requests:", err);
        sendErrorResponse(res, 500, 'Failed to retrieve delivery requests.', err);
    }
};
//  assigning the shufer 


const adminAssignDriver = async (req, res) => {
    // !! ADMIN ROUTE - ደህንነቱን ያረጋግጡ !!
    const { deliveryRequestId, driverId } = req.body;
    if (!deliveryRequestId || !driverId) return sendErrorResponse(res, 400, 'deliveryRequestId and driverId required.');
    const reqId = parseInt(deliveryRequestId, 10);
    const drvId = parseInt(driverId, 10);
    if (isNaN(reqId) || isNaN(drvId) || reqId <= 0 || drvId <= 0) return sendErrorResponse(res, 400, 'Invalid IDs.');

    let transaction;
    try {
        transaction = await sequelize.transaction();

        const deliveryRequest = await DeliveryRequest.findByPk(reqId, { include: [{ model: Sender, as: 'sender' }], transaction });
        if (!deliveryRequest) { await transaction.rollback(); return sendErrorResponse(res, 404, `Request #${reqId} not found.`); }
        // ጥያቄው 'pending' ወይም 'broadcasting' ሊሆን ይችላል፤ 'assigned' ከሆነ ቀድሞ ተመድቧል
        if (!['pending', 'broadcasting'].includes(deliveryRequest.status)) {
            await transaction.rollback();
            return sendErrorResponse(res, 400, `Request #${reqId} status is '${deliveryRequest.status}', cannot manually assign.`);
        }


        const driver = await Driver.findByPk(drvId, { include: [{ model: AdminApproval, as: 'approvalStatus' }], transaction });
        if (!driver) { await transaction.rollback(); return sendErrorResponse(res, 404, `Driver ${drvId} not found.`); }
        if (!driver.approvalStatus || driver.approvalStatus.status !== 'approved') { await transaction.rollback(); return sendErrorResponse(res, 400, `Driver ${drvId} not approved.`); }
        // አስተዳዳሪ በሚመድብበት ጊዜ የአሽከርካሪው 'idle' ወይም 'offline' መሆን ላያስፈልግ ይችላል፤ ነገር ግን ማረጋገጡ ጥሩ ነው
        if (!['idle', 'offline'].includes(driver.current_status) && !driver.is_available_for_new) { // is_available_for_new ንም ያረጋግጡ
            console.warn(`Admin assigning driver ${drvId} who is currently ${driver.current_status} and availability is ${driver.is_available_for_new}`);
            // await transaction.rollback(); return sendErrorResponse(res, 400, `Driver ${drvId} not available (Status: ${driver.current_status}).`);
        }


        if (driver.current_lat != null && driver.current_lng != null && deliveryRequest.pickup_lat != null && deliveryRequest.pickup_lng != null) {
            const distance = calculateDistance(driver.current_lat, driver.current_lng, deliveryRequest.pickup_lat, deliveryRequest.pickup_lng);
            console.log(`AdminAssign: Dist Drv ${drvId} to Req ${reqId} Pickup: ${distance.toFixed(1)}km`);
            if (distance > MAX_ASSIGNMENT_DISTANCE_KM) { // MAX_ASSIGNMENT_DISTANCE_KM ከላይ ይገለጻል
                // await transaction.rollback(); // አስተዳዳሪ ከፈለገ ከርቀት መመደብ ይችላል
                // return sendErrorResponse(res, 400, `Assignment failed safeguard: Driver ${distance.toFixed(1)} km away. Override if necessary.`);
                console.warn(`Admin assigning driver ${drvId} who is ${distance.toFixed(1)}km away (exceeds ${MAX_ASSIGNMENT_DISTANCE_KM}km safeguard).`);
            }
        }

        deliveryRequest.assigned_driver_id = drvId;
        deliveryRequest.status = 'assigned'; // ወይም 'driver_confirmed' እንደ ፍሰትዎ
        await deliveryRequest.save({ transaction });

        driver.is_available_for_new = false; // አዲስ ጥያቄ መቀበል አይችልም
        driver.current_status = 'assigned'; // ወይም 'en_route_pickup'
        await driver.save({ transaction });

        await createNotification({ driver_id: drvId, message: `Admin assigned you Delivery #${reqId}.`, type: 'assignment_admin_self', related_entity_id: reqId, related_entity_type: 'DeliveryRequest' }, transaction);
        if (deliveryRequest.sender) { await createNotification({ sender_id: deliveryRequest.sender.id, message: `Admin assigned Driver ${driver.full_name} to Request #${reqId}.`, type: 'driver_assigned_admin', related_entity_id: reqId, related_entity_type: 'DeliveryRequest' }, transaction); }

        await transaction.commit();
        res.status(200).json({ message: `Driver ${drvId} assigned to Request ${reqId}.`, deliveryRequest });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error(`Error admin assigning driver ${driverId} to request ${deliveryRequestId}:`, err);
        sendErrorResponse(res, 500, 'Failed to assign driver.', err);
    }
};

const adminBroadcastRequest = async (req, res) => {
    // !! ADMIN ROUTE - ደህንነቱን ያረጋግጡ !!
    const { deliveryRequestId, radiusKm } = req.body;
    if (!deliveryRequestId || radiusKm === undefined) return sendErrorResponse(res, 400, 'deliveryRequestId and radiusKm required.');
    const reqId = parseInt(deliveryRequestId, 10);
    const radius = parseFloat(radiusKm);
    if (isNaN(reqId) || isNaN(radius) || reqId <= 0 || radius < 0) return sendErrorResponse(res, 400, 'Invalid ID or radius (must be non-negative).');

    let transaction;
    try {
        transaction = await sequelize.transaction();

        const deliveryRequest = await DeliveryRequest.findByPk(reqId, { transaction });
        if (!deliveryRequest) { await transaction.rollback(); return sendErrorResponse(res, 404, `Request #${reqId} not found.`); }
        // 'pending' ለሆኑ ጥያቄዎች ብቻ ብሮድካስት ያድርጉ
        if (deliveryRequest.status !== 'pending') {
            await transaction.rollback();
            return sendErrorResponse(res, 400, `Cannot broadcast: Request status is '${deliveryRequest.status}'. Must be 'pending'.`);
        }
        if (deliveryRequest.pickup_lat == null || deliveryRequest.pickup_lng == null) { // Use == null to check for both undefined and null
            await transaction.rollback();
            return sendErrorResponse(res, 400, `Request #${reqId} missing pickup coordinates.`);
        }


        const { pickup_lat, pickup_lng } = deliveryRequest;
        const boundingBox = getBoundingBox(pickup_lat, pickup_lng, radius);
        const potentialDrivers = await Driver.findAll({
            where: {
                is_available_for_new: true, current_status: 'idle',
                current_lat: { [Op.between]: [boundingBox.minLat, boundingBox.maxLat] },
                current_lng: { [Op.between]: [boundingBox.minLng, boundingBox.maxLng] },
                // Sequelize.fn('ST_DWithin', ...) // ለበለጠ ትክክለኛ የጂኦ-ስፓሻል ጥያቄዎች PostGIS ከተጠቀሙ
            },
            include: [{ model: AdminApproval, as: 'approvalStatus', where: { status: 'approved' }, required: true }],
            attributes: ['id', 'full_name', 'current_lat', 'current_lng'], // አስፈላጊ የሆኑትን ብቻ ይምረጡ
            transaction
        });

        const driversInRadius = potentialDrivers.filter(driver => {
            if (driver.current_lat == null || driver.current_lng == null) return false;
            const distance = calculateDistance(pickup_lat, pickup_lng, driver.current_lat, driver.current_lng);
            return distance <= radius;
        });

        if (driversInRadius.length === 0) {
            // await transaction.rollback(); // ባይገኝም ጥያቄው 'pending' ሆኖ መቀጠል ይችላል
            return sendErrorResponse(res, 404, `No available drivers found within ${radius} km.`);
        }

        deliveryRequest.status = 'broadcasting';
        await deliveryRequest.save({ transaction });

        const notificationPromises = driversInRadius.map(driver => {
            const distance = calculateDistance(pickup_lat, pickup_lng, driver.current_lat, driver.current_lng);
            return createNotification({
                driver_id: driver.id, message: `New Delivery #${reqId} available approx ${distance.toFixed(1)} km away. Accept Now!`,
                type: 'broadcast_request', related_entity_id: reqId, related_entity_type: 'DeliveryRequest'
            }, transaction);
        });
        await Promise.all(notificationPromises);

        await transaction.commit();
        res.status(200).json({ message: `Request #${reqId} broadcasted to ${driversInRadius.length} drivers.`, broadcastedTo: driversInRadius.map(d => d.id) });

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error(`Error broadcasting request ${deliveryRequestId}:`, err);
        sendErrorResponse(res, 500, 'Failed to broadcast request.', err);
    }
};


// =============================================
// Pricing Functions (Open Routes - !! ደህንነታቸውን ያረጋግጡ !!)
// =============================================

const setOrUpdatePricing = async (req, res) => {
    // !! ADMIN ROUTE - ደህንነቱን ያረጋግጡ !!
    const { price_per_km, price_per_kg, base_fee, minimum_charge, price_per_quantity } = req.body; // price_per_size_unit ተወግዷል
    const updateData = {};

    const parseFloatIfValid = (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && isFinite(num) && num >= 0 ? num : undefined; // አሉታዊ ያልሆኑትን ብቻ ይቀበሉ
    };

    updateData.price_per_km = parseFloatIfValid(price_per_km);
    updateData.price_per_kg = parseFloatIfValid(price_per_kg);
    updateData.base_fee = parseFloatIfValid(base_fee);
    updateData.minimum_charge = parseFloatIfValid(minimum_charge);
    updateData.price_per_quantity = parseFloatIfValid(price_per_quantity);

    // ቢያንስ አንድ ትክክለኛ የዋጋ መለኪያ ያስፈልጋል
    const validUpdateKeys = Object.keys(updateData).filter(key => updateData[key] !== undefined);
    if (validUpdateKeys.length === 0) {
        return sendErrorResponse(res, 400, 'At least one valid non-negative pricing parameter (price_per_km, price_per_kg, base_fee, minimum_charge, price_per_quantity) required.');
    }

    // ትክክለኛ ያልሆኑትን ከ updateData ያስወግዱ
    const finalUpdateData = {};
    validUpdateKeys.forEach(key => finalUpdateData[key] = updateData[key]);


    try {
        // Upsert the single pricing row (ID 1)
        const [pricing, created] = await DynamicPricing.upsert({ id: 1, ...finalUpdateData }, { returning: true });
        res.status(200).json({ message: `Pricing config ${created ? 'created' : 'updated'}.`, pricing });
    } catch (err) {
        if (err.name === 'SequelizeValidationError') return sendErrorResponse(res, 400, 'Pricing update failed: Validation.', err);
        console.error("Error updating pricing:", err);
        sendErrorResponse(res, 500, 'Failed to update pricing.', err);
    }
};

const getPricing = async (req, res) => {
    try {
        const pricing = await DynamicPricing.findByPk(1); // ID 1 ዓለም አቀፍ ውቅር ነው ብለን እናስብ
        if (!pricing) {
            // If no pricing config exists, create a default one
            console.log("No pricing config found, creating default entry.");
            const defaultPricing = { id: 1, price_per_km: 0, base_fee: 0, price_per_kg: 0, price_per_quantity: 0, minimum_charge: 0 };
            const newPricing = await DynamicPricing.create(defaultPricing);
            return res.status(200).json({ message: "Default pricing configuration created.", pricing: newPricing });
        }
        // const pricingData = { ...pricing.toJSON() }; // ወደ plain object ይቀይሩ
        // delete pricingData.id; // የውስጥ መለያን ይደብቁ (አማራጭ)
        res.status(200).json({ message: "Pricing configuration retrieved.", pricing: pricing });
    } catch (err) {
        console.error("Error getting pricing:", err);
        sendErrorResponse(res, 500, 'Failed to retrieve pricing.', err);
    }
};


const registerShufer = async (req, res) => {
    const {
        // Credentials & Core Driver Info
        driver_phone,
        pin,
        driver_full_name,
        driver_email,
        sender_id,

        // Driver Address
        driver_region,
        driver_zone,
        driver_district,
        driver_house_number,

        // Vehicle Details
        license_plate,
        car_type,
        car_name,
        manufacture_year,
        cargo_capacity,
        commercial_license_number,
        vehicle_tin_number,

        // Ownership Details
        is_vehicle_owner,
        actual_owner_full_name,
        actual_owner_phone,
        actual_owner_email,
        actual_owner_region,
        actual_owner_zone,
        actual_owner_district,
        actual_owner_house_number,
    } = req.body;

    // Minimal validation for essential fields
    if (!driver_phone || !pin || !driver_full_name || !license_plate || !car_type || !car_name) {
        return res.status(400).json({
            message: 'Please provide essential fields: driver_phone, pin, driver_full_name, license_plate, car_type, car_name.',
        });
    }

    try {
        // 1. Check if Shufer (driver_phone or license_plate) already exists
        const existingByPhone = await Shufer.findOne({ where: { driver_phone } });
        if (existingByPhone) {
            return res.status(409).json({ message: 'Shufer with this phone number already exists.' });
        }

        const existingByLicense = await Shufer.findOne({ where: { license_plate } });
        if (existingByLicense) {
            return res.status(409).json({ message: 'Shufer with this license plate already exists.' });
        }

        // 2. Hash the PIN
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        // Helper function to get file paths from req.files
        const getFilePath = (field) =>
            req.files && req.files[field] ? req.files[field][0].path : null;

        // 3. Prepare data for new Shufer creation
        const shuferCreationData = {
            driver_phone,
            pin: hashedPin,
            driver_full_name,
            driver_email: driver_email || null,
            sender_id: sender_id || null,

            driver_region: driver_region || null,
            driver_zone: driver_zone || null,
            driver_district: driver_district || null,
            driver_house_number: driver_house_number || null,

            license_plate,
            car_type,
            car_name,
            manufacture_year: manufacture_year || null,
            cargo_capacity: cargo_capacity || null,
            commercial_license_number: commercial_license_number || null,
            vehicle_tin_number: vehicle_tin_number || null,

            driver_license_photo: getFilePath('driver_license_photo'),
            driver_identification_photo: getFilePath('driver_identification_photo'),
            car_license_photo: getFilePath('car_license_photo'),
            car_photo: getFilePath('car_photo'),

            is_vehicle_owner: typeof is_vehicle_owner === 'boolean' ? is_vehicle_owner : true,
        };

        // Add actual owner details only if is_vehicle_owner is false
        if (shuferCreationData.is_vehicle_owner === false) {
            shuferCreationData.actual_owner_full_name = actual_owner_full_name || null;
            shuferCreationData.actual_owner_phone = actual_owner_phone || null;
            shuferCreationData.actual_owner_email = actual_owner_email || null;
            shuferCreationData.actual_owner_region = actual_owner_region || null;
            shuferCreationData.actual_owner_zone = actual_owner_zone || null;
            shuferCreationData.actual_owner_district = actual_owner_district || null;
            shuferCreationData.actual_owner_house_number = actual_owner_house_number || null;
            shuferCreationData.actual_owner_id_photo = getFilePath('actual_owner_id_photo');
            shuferCreationData.actual_owner_photo = getFilePath('actual_owner_photo');
        }

        // 4. Create Shufer
        const newShufer = await Shufer.create(shuferCreationData);

        // 5. Generate JWT token
        const token = jwt.sign(
            {
                shufer: {
                    id: newShufer.id,
                    phone: newShufer.driver_phone,
                    name: newShufer.driver_full_name,
                    approval_status: newShufer.approval_status,
                },
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // 6. Remove sensitive info before sending response
        const shuferData = { ...newShufer.get({ plain: true }) };
        delete shuferData.pin;

        // 7. Send success response with token
        res.status(201).json({
            message: 'Shufer registered successfully. Your application is pending approval.',
            token, // ✅ Token returned here
            shufer: shuferData,
        });

    } catch (error) {
        console.error('Registration Error:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation Error', errors: messages });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};
const loginShufer = async (req, res) => {
    const { driver_phone, pin } = req.body;

    if (!driver_phone || !pin) {
        return res.status(400).json({ message: 'Please provide both phone number and PIN.' });
    }

    try {
        const shufer = await Shufer.findOne({ where: { driver_phone } });

        if (!shufer) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(pin, shufer.pin);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // !!! CRITICAL: Check approval status !!!
        if (shufer.approval_status !== 'approved') {
            let accessDeniedMessage = 'Access denied.';
            if (shufer.approval_status === 'pending') {
                accessDeniedMessage = 'Your account is pending approval. Please wait for an administrator to review your application.';
            } else if (shufer.approval_status === 'rejected') {
                accessDeniedMessage = `Your account application was rejected. ${shufer.approval_admin_notes ? `Reason: ${shufer.approval_admin_notes}` : 'Please contact support for more information.'}`;
            }
            return res.status(403).json({ message: accessDeniedMessage });
        }

        // (Optional) Update Shufer's status upon successful login
        // if (shufer.current_status === 'offline') {
        //   try {
        //     shufer.current_status = 'idle';
        //     shufer.last_location_update = new Date();
        //     await shufer.save();
        //   } catch (updateError) {
        //     console.error('Error updating Shufer status on login:', updateError);
        //   }
        // }

        // Generate JWT (JSON Web Token)
        const payload = {
            shufer: {
                id: shufer.id,
                phone: shufer.driver_phone,
                name: shufer.driver_full_name,
                approval_status: shufer.approval_status, // <<< ADDED THIS LINE
                // At this point, shufer.approval_status will always be 'approved'
                // You could also use a boolean: is_approved: true
            },
        };

        const token = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const shuferData = { ...shufer.get({ plain: true }) };
        delete shuferData.pin;

        res.status(200).json({
            message: 'Login successful.',
            token,
            shufer: shuferData,
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login process.' });
    }
};
const getMyProfile = async (req, res) => {
    try {
        const shuferId = req.shufer?.id;

        if (!shuferId) {
            return res.status(401).json({ message: 'Unauthorized: Missing or invalid token.' });
        }

        const shufer = await Shufer.findByPk(shuferId, {
            attributes: {
                exclude: ['pin'] // Never send PIN back
            }
        });

        if (!shufer) {
            return res.status(404).json({ message: 'Shufer not found.' });
        }

        res.status(200).json({
            message: 'Profile fetched successfully.',
            shufer: shufer
        });

    } catch (error) {
        console.error('Error fetching Shufer profile:', error);
        res.status(500).json({ message: 'Server error while fetching profile.' });
    }
};
// assign the shufer 
const assignDeliveryRequestToShufer = async (req, res) => {
    // Assuming an admin/dispatcher auth middleware has verified the requesting user
    // const adminId = req.admin?.id;
    // if (!adminId) {
    //     return sendErrorResponse(res, 403, 'Forbidden: Only authorized personnel can assign deliveries.');
    // }

    const { deliveryRequestId, shuferId } = req.body;

    // Validate inputs
    const reqId = parseInt(deliveryRequestId, 10);
    const drvId = parseInt(shuferId, 10);

    if (isNaN(reqId) || reqId <= 0) {
        return sendErrorResponse(res, 400, 'A valid deliveryRequestId (positive integer) is required.');
    }
    if (isNaN(drvId) || drvId <= 0) {
        return sendErrorResponse(res, 400, 'A valid shuferId (Driver ID, positive integer) is required to assign the request.');
    }

    let transaction;
    try {
        transaction = await sequelize.transaction();

        // 1. Fetch the Shufer (Driver) to be assigned
        const shuferToAssign = await Driver.findByPk(drvId, {
            attributes: ['id', 'full_name', 'is_available'], // Add other relevant attributes like current_vehicle_id, etc.
            include: [{ model: AdminApproval, as: 'approvalStatus', attributes: ['status'] }],
            transaction
        });

        if (!shuferToAssign) {
            await transaction.rollback();
            return sendErrorResponse(res, 404, `Shufer (Driver) with ID ${drvId} not found.`);
        }
        if (shuferToAssign.approvalStatus?.status !== 'approved') {
            await transaction.rollback();
            return sendErrorResponse(res, 400, `Shufer ${shuferToAssign.full_name} (ID: ${drvId}) is not approved. Current status: ${shuferToAssign.approvalStatus?.status || 'N/A'}.`);
        }
        // Optional: Check if Shufer is available or meets other assignment criteria
        // if (!shuferToAssign.is_available) { // Assuming 'is_available' field
        //     await transaction.rollback();
        //     return sendErrorResponse(res, 409, `Shufer ${shuferToAssign.full_name} is currently marked as unavailable.`);
        // }

        // 2. Fetch the DeliveryRequest to be assigned, with a lock
        const deliveryRequest = await DeliveryRequest.findByPk(reqId, {
            include: [{ model: Sender, as: 'sender', attributes: ['id', 'full_name'] }], // For notifications
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!deliveryRequest) {
            await transaction.rollback();
            return sendErrorResponse(res, 404, `Delivery Request with ID ${reqId} not found.`);
        }

        // 3. Validate the state of the DeliveryRequest for assignment
        if (deliveryRequest.driver_id) {
            await transaction.rollback();
            if (deliveryRequest.driver_id === drvId) {
                return sendErrorResponse(res, 409, `Delivery Request ${reqId} is already assigned to this Shufer (${shuferToAssign.full_name}).`);
            }
            return sendErrorResponse(res, 409, `Delivery Request ${reqId} is already assigned to another Shufer. Unassign first if you wish to reassign.`);
        }

        // Define statuses eligible for assignment (e.g., after payment is confirmed)
        const assignableStatuses = ['payment_approved', 'pending_assignment']; // Adjust as per your workflow
        if (!assignableStatuses.includes(deliveryRequest.status)) {
            await transaction.rollback();
            return sendErrorResponse(res, 409, `Delivery Request ${reqId} cannot be assigned. Current status is '${deliveryRequest.status}'. Expected one of: ${assignableStatuses.join(', ')}.`);
        }
        // Ensure payment is approved before assignment
        if (!deliveryRequest.is_payment_approved) {
            await transaction.rollback();
            return sendErrorResponse(res, 403, `Payment for Delivery Request ${reqId} has not been approved. Cannot assign.`);
        }


        // 4. Assign the request to the Shufer and update its status
        deliveryRequest.driver_id = drvId;
        deliveryRequest.status = 'assigned_to_shufer'; // Or 'pending_shufer_acceptance' if the shufer needs to confirm
        deliveryRequest.assigned_at = new Date(); // Or use a more specific field like 'admin_assigned_at'
        // deliveryRequest.assigned_by_admin_id = adminId; // Optional: if tracking who assigned

        await deliveryRequest.save({ transaction });

        // 5. Optionally, update the Shufer's availability status
        // shuferToAssign.is_available = false; // Or a specific status like 'tasked'
        // await shuferToAssign.save({ transaction });

        // 6. Create notifications
        const senderMessage = `Good news! Your delivery request #${deliveryRequest.id} has been assigned to Shufer ${shuferToAssign.full_name}.`;
        await createNotification({
            sender_id: deliveryRequest.sender_id,
            message: senderMessage,
            type: 'delivery_assigned_by_admin',
            related_entity_id: deliveryRequest.id,
            related_entity_type: 'DeliveryRequest'
        }, transaction);

        const shuferMessage = `You have been assigned a new delivery: Request #${deliveryRequest.id}. Please check your task list and proceed accordingly.`;
        await createNotification({
            driver_id: drvId,
            message: shuferMessage,
            type: 'new_delivery_assignment',
            related_entity_id: deliveryRequest.id,
            related_entity_type: 'DeliveryRequest'
        }, transaction);

        // Commit the transaction
        await transaction.commit();

        res.status(200).json({
            message: `Delivery Request ${reqId} successfully assigned to Shufer ${shuferToAssign.full_name} (ID: ${drvId}).`,
            deliveryRequest: deliveryRequest.toJSON()
        });

    } catch (error) {
        if (transaction) {
            try { await transaction.rollback(); }
            catch (rollbackError) { console.error("Error rolling back transaction:", rollbackError); }
        }
        console.error(`Error assigning delivery request ${reqId} to Shufer ${drvId}:`, error);
        if (error.name === 'SequelizeOptimisticLockError' || error.name === 'SequelizeTimeoutError') {
            return sendErrorResponse(res, 409, 'The delivery request or Shufer details were updated by another process, or the operation timed out. Please try again.');
        }
        return sendErrorResponse(res, 500, 'An unexpected error occurred while assigning the delivery request.', error);
    }
};
// accpet the  admin request from the  admin 
const shuferAcceptRequest = async (req, res) => {
    const { deliveryRequestId } = req.body;
    const shuferId = req.driver?.id; // Authenticated Shufer's ID (from auth middleware)

    // Validate Shufer authentication
    if (!shuferId) {
        return sendErrorResponse(res, 401, 'Authentication required: Shufer ID not found. Please login.');
    }

    // Validate deliveryRequestId
    const reqId = parseInt(deliveryRequestId, 10);
    if (isNaN(reqId) || reqId <= 0) {
        return sendErrorResponse(res, 400, 'A valid deliveryRequestId (positive integer) is required in the request body.');
    }

    let transaction;
    try {
        transaction = await sequelize.transaction({
            // Optional: Set isolation level if specific concurrency issues are anticipated
            // isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
        });

        // 1. Verify the Shufer (Driver)
        const shufer = await Driver.findByPk(shuferId, {
            attributes: ['id', 'full_name', 'is_available', 'current_lat', 'current_lng'], // Add other relevant attributes
            include: [{ model: AdminApproval, as: 'approvalStatus', attributes: ['status'] }],
            transaction
        });

        if (!shufer) {
            await transaction.rollback();
            // This case should ideally be caught by authentication middleware
            return sendErrorResponse(res, 404, `Authenticated Shufer with ID ${shuferId} not found in the system.`);
        }

        if (shufer.approvalStatus?.status !== 'approved') {
            await transaction.rollback();
            return sendErrorResponse(res, 403, `Your account is currently not approved. Status: ${shufer.approvalStatus?.status || 'N/A'}. Please contact support.`);
        }

        // Optional: Check if Shufer is available (e.g., not on another critical task)
        // if (!shufer.is_available) { // Assuming 'is_available' field exists
        //     await transaction.rollback();
        //     return sendErrorResponse(res, 409, 'You are currently marked as unavailable or on another delivery.');
        // }

        // 2. Fetch the DeliveryRequest with a lock to prevent race conditions
        const deliveryRequest = await DeliveryRequest.findByPk(reqId, {
            include: [{ model: Sender, as: 'sender', attributes: ['id', 'full_name'] }], // To notify the sender
            transaction,
            lock: transaction.LOCK.UPDATE // Locks the row for the duration of the transaction (in supported DBs like PostgreSQL, MySQL)
        });

        if (!deliveryRequest) {
            await transaction.rollback();
            return sendErrorResponse(res, 404, `Delivery Request with ID ${reqId} not found.`);
        }

        // 3. Validate the state of the DeliveryRequest
        if (deliveryRequest.driver_id) {
            await transaction.rollback();
            if (deliveryRequest.driver_id === shuferId) {
                return sendErrorResponse(res, 409, `You have already accepted this delivery request (ID: ${reqId}).`);
            }
            return sendErrorResponse(res, 409, `Delivery Request ${reqId} has already been accepted by another Shufer.`);
        }

        // Define statuses eligible for acceptance.
        // This depends on your workflow, e.g., after payment approval or direct assignment.
        const acceptableStatuses = ['pending', 'payment_approved', 'pending_assignment'];
        if (!acceptableStatuses.includes(deliveryRequest.status)) {
            await transaction.rollback();
            return sendErrorResponse(res, 409, `Delivery Request ${reqId} cannot be accepted. Current status is '${deliveryRequest.status}'.`);
        }

        // Crucial: Check if payment is approved, if it's a prerequisite
        if (!deliveryRequest.is_payment_approved) {
            await transaction.rollback();
            return sendErrorResponse(res, 403, `Payment for Delivery Request ${reqId} has not been approved yet. Cannot accept.`);
        }

        // 4. Assign the request to the Shufer and update its status
        deliveryRequest.driver_id = shuferId;
        deliveryRequest.status = 'accepted_by_shufer'; // Or 'en_route_to_pickup', 'assigned', etc.
        deliveryRequest.accepted_at = new Date();
        // deliveryRequest.shufer_assigned_at = new Date(); // If you have a specific field
        await deliveryRequest.save({ transaction });

        // 5. Optionally, update the Shufer's availability status
        // shufer.is_available = false; // Mark Shufer as busy
        // await shufer.save({ transaction });

        // 6. Create notifications
        const senderMessage = `Your delivery request #${deliveryRequest.id} has been accepted by Shufer ${shufer.full_name}. They will proceed to the pickup location.`;
        await createNotification({
            sender_id: deliveryRequest.sender_id,
            message: senderMessage,
            type: 'delivery_accepted', // General type
            related_entity_id: deliveryRequest.id,
            related_entity_type: 'DeliveryRequest'
        }, transaction);

        const shuferMessage = `You have successfully accepted delivery request #${deliveryRequest.id}. Pickup: [Details from request if needed], Dropoff: [Details].`;
        await createNotification({
            driver_id: shuferId, // Target the notification to the Shufer (Driver)
            message: shuferMessage,
            type: 'delivery_assigned_to_you',
            related_entity_id: deliveryRequest.id,
            related_entity_type: 'DeliveryRequest'
        }, transaction);

        // Commit the transaction
        await transaction.commit();

        res.status(200).json({
            message: `Delivery Request ${reqId} accepted successfully.`,
            deliveryRequest: deliveryRequest.toJSON() // Return the updated delivery request
        });

    } catch (error) {
        if (transaction) {
            try { await transaction.rollback(); }
            catch (rollbackError) { console.error("Error rolling back transaction:", rollbackError); }
        }

        console.error(`Error accepting delivery request ${reqId} by Shufer ${shuferId}:`, error);
        if (error.name === 'SequelizeOptimisticLockError' || error.name === 'SequelizeTimeoutError') { // Handle lock contentions
            return sendErrorResponse(res, 409, 'The delivery request was updated by another process or the operation timed out. Please try again.');
        }
        return sendErrorResponse(res, 500, 'An unexpected error occurred while accepting the delivery request.', error);
    }
};

module.exports = { registerSender, loginSender, registerDriver, getMyNotifications, loginDriver, updateDriverLocation, createDeliveryRequest, driverAcceptRequest, updateApproval, adminApprovePayment, getAllDeliveryRequests, adminAssignDriver, adminBroadcastRequest, setOrUpdatePricing, getPricing, registerShufer, loginShufer, getMyProfile, assignDeliveryRequestToShufer, shuferAcceptRequest };
