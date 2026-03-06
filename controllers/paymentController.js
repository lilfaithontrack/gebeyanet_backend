const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Joi = require('joi');
const geolib = require('geolib');
const QRCode = require('qrcode');
const Payment = require('../models/Payment.js');
const Shopper = require('../models/Shopper.js'); const User = require('../models/User.js');
// Ensure the uploads directory exists
const uploadDir = 'uploads/screenshots';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype);
    isValid ? cb(null, true) : cb(new Error('Only jpeg, jpg, or png images are allowed.'));
  },
}).single('payment_screenshot');

// Joi schema for request validation
const paymentSchema = Joi.object({
  guest_id: Joi.string().optional(),
  payment_method: Joi.string().default('Bank Transfer'),
  cart_items: Joi.string().required(),
  total_price: Joi.number().required(),
  service_fee: Joi.number().default(0),
  delivery_fee: Joi.number().default(0),
  shipping_address: Joi.string().required(),
  referral_code: Joi.string().optional().allow(''),
  customer_name: Joi.string().required(),
  customer_email: Joi.string().email().required(),
  customer_phone: Joi.string().required(),
});

// Create a new payment
const createPayment = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'Payment screenshot is required.' });

    const { error, value } = paymentSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let parsedCartItems;
    try {
      parsedCartItems = JSON.parse(value.cart_items);
    } catch {
      return res.status(400).json({ message: 'Invalid cart items format.' });
    }

    try {
      const payment = await Payment.create({
        ...value,
        cart_items: parsedCartItems,
        payment_screenshot: req.file.path,
        payment_status: 'Pending',
      });

      return res.status(201).json({ message: 'Payment created successfully.', payment });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
};

// Update payment status (Approve, Decline, Pending, Completed, Failed)
const updatePaymentStatus = async (req, res) => {
  const { payment_id } = req.params;
  const { payment_status } = req.body;

  if (!['Pending', 'Completed', 'Failed', 'Approved', 'Declined'].includes(payment_status)) {
    return res.status(400).json({ message: 'Invalid payment status.' });
  }

  try {
    const payment = await Payment.findByPk(payment_id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    const previousStatus = payment.payment_status;
    payment.payment_status = payment_status;
    await payment.save();

    // 💰 Handle referral bonus on completed status
    if (payment_status === 'Completed' && previousStatus !== 'Completed') {
      if (payment.referral_code) {
        const referrer = await User.findOne({ where: { referral_code: payment.referral_code } });
        if (referrer) {
          const bonusAmount = referrer.is_company ? 10 : 5;

          referrer.wallet_balance = (parseFloat(referrer.wallet_balance) || 0) + bonusAmount;
          await referrer.save();
          console.log(`Referrer ${referrer.id} rewarded with ${bonusAmount} ETB.`);

          // 🎯 2nd Gen Agent Reward
          if (referrer.referred_by) {
            const secondLevelReferrer = await User.findByPk(referrer.referred_by);
            if (secondLevelReferrer && secondLevelReferrer.agent) {
              secondLevelReferrer.wallet_balance = (parseFloat(secondLevelReferrer.wallet_balance) || 0) + 5;
              await secondLevelReferrer.save();
              console.log(`2nd level referrer (agent) ${secondLevelReferrer.id} rewarded with 5 ETB.`);
            }
          }
        }
      }
    }

    return res.status(200).json({ message: 'Payment status updated successfully.', payment });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
const getAvailableOrders = async (req, res) => {
  try {
    const availableOrders = await Payment.findAll({
      where: {
        payment_status: 'Pending Delivery Confirmation',
        delivery_id: null,
      },
      include: [
        { model: Shopper, as: 'Shopper', attributes: ['full_name', 'email'] }
        // Add other associations if needed
      ]
    });

    res.status(200).json({ data: availableOrders });
  } catch (error) {
    console.error('Error fetching available orders:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
// Assign order to shopper/delivery & generate QR code
const sendOrderToShopperAndDelivery = async (req, res) => {
  const { payment_id } = req.params;
  const { shopper_id, delivery_id } = req.body;

  if (!shopper_id || !delivery_id) {
    return res.status(400).json({ message: 'Shopper ID and Delivery ID are required.' });
  }

  try {
    const payment = await Payment.findByPk(payment_id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    if (payment.payment_status !== 'Approved') {
      return res.status(400).json({ message: 'Order must be approved before assigning.' });
    }

    const qrData = JSON.stringify({
      payment_id: payment.id,
      customer_name: payment.customer_name,
      total_price: payment.total_price,
    });
    const qrCode = await QRCode.toDataURL(qrData);

    payment.shopper_id = shopper_id;
    payment.delivery_id = delivery_id;
    payment.qr_code = qrCode;
    payment.payment_status = 'Pending Delivery';
    await payment.save();

    return res.status(200).json({ message: 'Order assigned successfully.', payment });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get order history (by customer_email or guest_id)
const getOrderHistory = async (req, res) => {
  const { customer_email, guest_id } = req.query;

  if (!customer_email && !guest_id) {
    return res.status(400).json({ message: 'Customer email or guest ID is required.' });
  }

  try {
    const orders = await Payment.findAll({
      where: customer_email ? { customer_email } : { guest_id },
      order: [['createdAt', 'DESC']],
    });

    if (!orders.length) return res.status(404).json({ message: 'No orders found.' });

    res.status(200).json({ message: 'Order history retrieved successfully.', orders });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get a single payment order by ID
const getPaymentOrderById = async (req, res) => {
  const { payment_id } = req.params;

  try {
    const payment = await Payment.findByPk(payment_id);
    if (!payment) return res.status(404).json({ message: 'Payment order not found.' });

    let parsedCartItems;
    try {
      parsedCartItems = JSON.parse(payment.cart_items);
    } catch {
      return res.status(500).json({ message: 'Invalid cart items format in database.' });
    }

    return res.status(200).json({
      message: 'Payment order retrieved successfully.',
      payment: { ...payment.toJSON(), cart_items: parsedCartItems },
    });
  } catch (error) {
    console.error('Error fetching payment order:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Fetch all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Payment.findAll({ order: [['createdAt', 'DESC']] });

    if (!orders.length) return res.status(404).json({ message: 'No orders found.' });

    res.status(200).json({ message: 'All orders retrieved successfully.', orders });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
// In ../controllers/paymentController.js
// (Make sure to import your Payment model)

// sending order  to  delivery routes 


const MAX_RADIUS_KM = 5;

const assignOrderToNearbyDeliveries = async (req, res) => {
  const { payment_id } = req.params;
  let { delivery_ids, location } = req.body;

  // Backward compatibility for single delivery_id
  if (!delivery_ids && req.body.delivery_id) delivery_ids = [req.body.delivery_id];

  if (!Array.isArray(delivery_ids) || delivery_ids.length === 0 || !location) {
    console.error('[assignOrderToNearbyDeliveries] Missing delivery_ids or location', { delivery_ids, location });
    return res.status(400).json({ message: 'delivery_ids (array) and location are required.' });
  }

  try {
    const payment = await Payment.findByPk(payment_id);
    if (!payment) {
      console.error(`[assignOrderToNearbyDeliveries] Payment not found: ${payment_id}`);
      return res.status(404).json({ message: 'Payment not found.' });
    }

    if (payment.payment_status !== 'Approved') {
      console.warn(`[assignOrderToNearbyDeliveries] Payment not approved. Current status: ${payment.payment_status}`);
      return res.status(400).json({ message: 'Order must be approved before assigning.' });
    }

    // Find available delivery people within radius
    const allDeliveries = await Delivery.findAll({ where: { is_available: true } });

    const nearbyDeliveries = allDeliveries.filter(del => {
      if (!del.latitude || !del.longitude) return false;
      const distance = geolib.getDistance(
        { latitude: location.lat, longitude: location.lng },
        { latitude: del.latitude, longitude: del.longitude }
      );
      return distance <= MAX_RADIUS_KM * 1000;
    });

    if (nearbyDeliveries.length === 0) {
      console.info(`[assignOrderToNearbyDeliveries] No nearby delivery found for location:`, location);
      return res.status(404).json({ message: 'No nearby delivery found.' });
    }

    // Generate QR code for frontend (if needed)
    const qrData = JSON.stringify({
      payment_id: payment.id,
      customer_name: payment.customer_name,
      total_price: payment.total_price,
      delivery_ids,
    });
    const qrCode = await QRCode.toDataURL(qrData); // Only return — don't store in DB

    // Assign delivery IDs to payment (if you're storing them)
    payment.delivery_ids = delivery_ids; // Make sure model supports this or skip
    payment.payment_status = 'Pending Delivery Confirmation';
    await payment.save();

    console.log(`[assignOrderToNearbyDeliveries] Order ${payment_id} assigned to deliveries:`, delivery_ids);
    console.log(`[assignOrderToNearbyDeliveries] Nearby deliveries:`, nearbyDeliveries.map(d => d.id));

    return res.status(200).json({
      message: 'Order sent to nearby deliveries. Awaiting confirmation.',
      payment,
      delivery_ids,
      qr_code: qrCode,
      nearby_deliveries: nearbyDeliveries.map(d => ({ id: d.id, name: d.name })),
    });
  } catch (error) {
    console.error('[assignOrderToNearbyDeliveries] Error:', {
      error: error.message,
      stack: error.stack,
      payment_id,
      delivery_ids,
      location
    });
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// accepting the orders  from the  route 
const acceptDeliveryOrder = async (req, res) => {
  const { payment_id } = req.params;
  const delivery_id = req.body.delivery_id;

  try {
    const payment = await Payment.findByPk(payment_id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    if (payment.payment_status !== 'Pending Delivery Confirmation') {
      return res.status(400).json({ message: 'Order already taken or invalid status.' });
    }

    // Lock check (optional: use transaction or Redis lock to avoid race condition)
    if (payment.delivery_id) {
      return res.status(409).json({ message: 'Order already accepted by someone else.' });
    }

    payment.delivery_id = delivery_id;
    payment.payment_status = 'Pending Delivery';
    await payment.save();

    // Notify others it was taken (optional)

    return res.status(200).json({ message: 'Order accepted successfully.', payment });
  } catch (error) {
    console.error('Error accepting order:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const getOrdersByReferralCode = async (req, res) => {
  // It's more secure if the referral code is derived from the authenticated user (req.user.referral_code)
  // rather than passed as a URL parameter that could be manipulated,
  // unless this endpoint is also for admins to check any referral code.
  // For this example, we'll take it from the URL params as per the frontend design.
  const { referral_code_from_param } = req.params;

  // You should add validation here:
  // 1. Ensure the user making the request is an agent.
  // 2. Ensure the agent is requesting orders for THEIR OWN referral_code,
  //    e.g., if (req.user.referral_code !== referral_code_from_param && req.user.role !== 'admin') return 403;
  // For simplicity in this example, we assume such checks are in a middleware or handled.

  if (!referral_code_from_param) {
    return res.status(400).json({ success: false, message: 'Referral code parameter is required.' });
  }

  try {
    const orders = await Payment.findAll({
      where: {
        referral_code: referral_code_from_param,
      },
      order: [['createdAt', 'DESC']],
      // Optionally, select specific attributes to send to the client
      // attributes: ['id', 'customer_name', 'customer_email', 'total_price', 'payment_status', 'createdAt', /* any other needed fields */],
    });

    if (!orders.length) {
      return res.status(200).json({ success: true, message: 'No orders found for this referral code.', orders: [] });
    }

    return res.status(200).json({ success: true, message: 'Referred orders retrieved successfully.', orders });
  } catch (error) {
    console.error('Error fetching orders by referral code:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { createPayment, updatePaymentStatus, sendOrderToShopperAndDelivery, getOrderHistory, getOrdersByReferralCode, getAllOrders, getPaymentOrderById, assignOrderToNearbyDeliveries, getAvailableOrders, acceptDeliveryOrder };
