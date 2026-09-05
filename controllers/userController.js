const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User.js');
const Payment = require('../models/Payment.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = '1y';
const SALT_ROUNDS = 10;

// Valid seller levels and their allowed product types
const VALID_SELLER_LEVELS = ['importer', 'exporter', 'reseller'];

// --- Multer setup for profile/license uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type.'), false);
  },
});

// --- OTP Storage (in-memory, for production use Redis) ---
const otpStore = {};

// ============================
//  REGISTER (all roles)
// ============================
const registerUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, role, seller_level, location_lat, location_lng, address, is_company, referred_by } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'full_name, email, and password are required.' });
    }

    // Validate role
    const validRoles = ['buyer', 'seller'];
    const userRole = validRoles.includes(role) ? role : 'buyer';

    // Validate seller_level if role is seller
    if (userRole === 'seller') {
      if (!VALID_SELLER_LEVELS.includes(seller_level)) {
        return res.status(400).json({ success: false, message: 'Valid seller_level is required: importer, exporter, or reseller.' });
      }
      // Importers and exporters require a license file
      if (['importer', 'exporter'].includes(seller_level) && !req.files?.license_file?.[0]) {
        return res.status(400).json({ success: false, message: 'License file is required for importers and exporters.' });
      }
    }

    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }

    // For sellers, check OTP verification (if provided)
    if (userRole === 'seller' && req.body.otp) {
      const storedOtp = otpStore[email];
      if (!storedOtp || storedOtp.code !== req.body.otp || Date.now() > storedOtp.expires) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
      }
      delete otpStore[email];
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate referral code for ALL users (not just agents)
    const referral_code = `GN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Validate referred_by — look up by referral_code
    let referrerId = null;
    if (referred_by) {
      const referrer = await User.findOne({ where: { referral_code: referred_by } });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const newUser = await User.create({
      full_name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: userRole,
      seller_level: userRole === 'seller' ? seller_level : null,
      location_lat: location_lat || null,
      location_lng: location_lng || null,
      address: address || null,
      is_company: is_company || false,
      is_referrer: true,
      referral_code,
      referred_by: referrerId,
      image: req.files?.image?.[0]?.filename || null,
      license_file: req.files?.license_file?.[0]?.filename || null,
      bank_name: req.body.bank_name || null,
      account_number: req.body.account_number || null,
      status: userRole === 'seller' ? 'pending' : 'active',
    });

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userData } = newUser.toJSON();

    res.status(201).json({
      success: true,
      message: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} registered successfully.`,
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ============================
//  LOGIN (all roles)
// ============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    // Update last sign in
    await user.update({ lastsignin: new Date() });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userData } = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  GET PROFILE (own)
// ============================
const getProfile = async (req, res) => {
  try {
    const { password: _, ...userData } = req.user.toJSON();
    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  UPDATE PROFILE (own)
// ============================
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const updates = {};
    const allowedFields = [
      'full_name', 'phone', 'location_lat', 'location_lng', 'address',
      'bank_name', 'account_number', 'is_company', 'seller_level',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Handle password change
    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    }

    // Handle file uploads
    if (req.files?.image?.[0]) updates.image = req.files.image[0].filename;
    if (req.files?.license_file?.[0]) updates.license_file = req.files.license_file[0].filename;

    await user.update(updates);

    const { password: _, ...userData } = user.toJSON();
    res.status(200).json({ success: true, message: 'Profile updated.', user: userData });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  GET USER BY ID
// ============================
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  GET ALL USERS (admin)
//  Supports: role, seller_level, status, search, is_referrer, page, limit
//  Returns: { success, users, totalCount, page, limit, totalPages, nextPage }
// ============================
const getAllUsers = async (req, res) => {
  try {
    const { role, seller_level, status, search, is_referrer } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 500);
    const offset = (page - 1) * limit;

    const { Op } = require('sequelize');
    const where = {};

    if (role && role !== 'all') where.role = role;
    if (seller_level && seller_level !== 'all') where.seller_level = seller_level;
    if (status && status !== 'all') where.status = status;
    if (is_referrer !== undefined && is_referrer !== 'all') {
      where.is_referrer = is_referrer === 'true' || is_referrer === true;
    }

    // Free-text search across name / email / phone / referral_code
    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      where[Op.or] = [
        { full_name: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
        { referral_code: { [Op.like]: term } },
      ];
    }

    const { rows: users, count: totalCount } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalCount / limit) || 1;
    const nextPage = page < totalPages ? page + 1 : null;

    res.status(200).json({
      success: true,
      users,
      totalCount,
      page,
      limit,
      totalPages,
      nextPage,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ============================
//  DELETE USER
// ============================
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await user.destroy();
    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  SEND OTP (for seller verification)
// ============================
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { code: otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Gebya Net" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Gebya Net Verification Code',
      html: `<h2>Your OTP Code: <b>${otp}</b></h2><p>This code expires in 10 minutes.</p><p>— Gebya Net Team</p>`,
    });

    res.status(200).json({ success: true, message: 'OTP sent to email.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
};

// ============================
//  VERIFY OTP
// ============================
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const stored = otpStore[email];
    if (!stored || stored.code !== otp || Date.now() > stored.expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    delete otpStore[email];
    res.status(200).json({ success: true, message: 'OTP verified.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  FORGOT PASSWORD
// ============================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[`reset_${email}`] = { code: otp, expires: Date.now() + 10 * 60 * 1000 };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Gebya Net" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset - Gebya Net',
      html: `<h2>Reset Code: <b>${otp}</b></h2><p>This code expires in 10 minutes.</p><p>— Gebya Net Team</p>`,
    });

    res.status(200).json({ success: true, message: 'Password reset code sent.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  RESET PASSWORD
// ============================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;
    if (!email || !otp || !new_password) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new_password are required.' });
    }

    const stored = otpStore[`reset_${email}`];
    if (!stored || stored.code !== otp || Date.now() > stored.expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await user.update({ password: await bcrypt.hash(new_password, SALT_ROUNDS) });
    delete otpStore[`reset_${email}`];

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  UPGRADE TO SELLER
// ============================
const upgradeToSeller = async (req, res) => {
  try {
    const { seller_level } = req.body;

    if (!VALID_SELLER_LEVELS.includes(seller_level)) {
      return res.status(400).json({ success: false, message: 'Valid seller_level is required: importer, exporter, or reseller.' });
    }

    // Importers and exporters require a license file
    if (['importer', 'exporter'].includes(seller_level) && !req.files?.license_file?.[0]) {
      return res.status(400).json({ success: false, message: 'License file is required for importers and exporters.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.role === 'seller') {
      return res.status(400).json({ success: false, message: 'You are already a seller.' });
    }

    const updates = {
      role: 'seller',
      seller_level,
      status: ['importer', 'exporter'].includes(seller_level) ? 'pending' : 'active',
    };

    if (req.files?.license_file?.[0]) {
      updates.license_file = req.files.license_file[0].filename;
    }

    await user.update(updates);

    const { password: _, ...userData } = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Upgraded to seller successfully.',
      user: userData,
    });
  } catch (error) {
    console.error('Error upgrading to seller:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ============================
//  ADMIN: UPDATE USER STATUS
// ============================
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'pending', 'suspended', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await user.update({ status });

    const { password: _, ...userData } = user.toJSON();
    res.status(200).json({ success: true, message: 'User status updated.', user: userData });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ============================
//  ADMIN: UPDATE USER (general)
// ============================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const allowedFields = [
      'full_name', 'phone', 'role', 'seller_level', 'status',
      'bank_name', 'account_number', 'is_company', 'is_referrer',
      'wallet_balance', 'referral_earnings',
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    await user.update(updates);

    const { password: _, ...userData } = user.toJSON();
    res.status(200).json({ success: true, message: 'User updated.', user: userData });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ============================
//  ADMIN: REFERRAL STATS (platform-wide)
// ============================
const getAdminReferralStats = async (req, res) => {
  try {
    // All users who have a referral code
    const allUsers = await User.findAll({
      attributes: ['id', 'full_name', 'email', 'role', 'seller_level', 'referral_code', 'wallet_balance', 'referral_earnings', 'is_company', 'status'],
      where: { referral_code: { [require('sequelize').Op.ne]: null } },
      order: [['referral_earnings', 'DESC']],
    });

    // Count referred users per referrer
    const referredCounts = await User.findAll({
      attributes: [
        'referred_by',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'referred_count'],
      ],
      where: { referred_by: { [require('sequelize').Op.ne]: null } },
      group: ['referred_by'],
      raw: true,
    });

    const countMap = {};
    referredCounts.forEach(r => {
      countMap[r.referred_by] = parseInt(r.referred_count, 10);
    });

    // Enrich each referrer with their referred count
    const referrers = allUsers.map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      seller_level: u.seller_level,
      referral_code: u.referral_code,
      wallet_balance: parseFloat(u.wallet_balance) || 0,
      referral_earnings: parseFloat(u.referral_earnings) || 0,
      is_company: u.is_company,
      status: u.status,
      referred_count: countMap[u.id] || 0,
    }));

    const totalReferrers = referrers.filter(r => r.referred_count > 0).length;
    const totalReferred = Object.values(countMap).reduce((a, b) => a + b, 0);
    const totalPayouts = referrers.reduce((sum, r) => sum + r.referral_earnings, 0);

    // Total referral orders (payments with a referral_code)
    const totalReferralOrders = await Payment.count({
      where: { referral_code: { [require('sequelize').Op.ne]: null } },
    });

    res.status(200).json({
      success: true,
      stats: {
        total_referrers: totalReferrers,
        total_referred_users: totalReferred,
        total_referral_orders: totalReferralOrders,
        total_payouts: totalPayouts,
      },
      referrers,
    });
  } catch (error) {
    console.error('Error fetching admin referral stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ============================
//  GET REFERRAL STATS
// ============================
const getReferralStats = async (req, res) => {
  try {
    const user = req.user;

    // Get users referred by this user
    const referredUsers = await User.findAll({
      where: { referred_by: user.id },
      attributes: ['id', 'full_name', 'email', 'role', 'seller_level', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    // Get orders that used this user's referral code
    const referredOrders = await Payment.findAll({
      where: { referral_code: user.referral_code },
      order: [['createdAt', 'DESC']],
    });

    // Calculate total earnings (5 ETB for individuals, 10 for companies per approved/completed order)
    const bonusPerOrder = user.is_company ? 10 : 5;
    const totalEarnings = referredOrders
      .filter(o => ['Approved', 'Completed'].includes(o.payment_status))
      .reduce((sum) => sum + bonusPerOrder, 0);

    res.status(200).json({
      success: true,
      stats: {
        referral_code: user.referral_code,
        referral_link: `https://gebyanet.com/ref/${user.referral_code}`,
        total_referred: referredUsers.length,
        total_orders: referredOrders.length,
        total_earnings: totalEarnings,
        referral_earnings: parseFloat(user.referral_earnings) || 0,
        wallet_balance: parseFloat(user.wallet_balance) || 0,
        referred_users: referredUsers,
        referred_orders: referredOrders.map(o => ({
          id: o.id,
          customer_name: o.customer_name,
          total_price: o.total_price,
          payment_status: o.payment_status,
          created_at: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

module.exports = {
  upload,
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  upgradeToSeller,
  getReferralStats,
  getAdminReferralStats,
  getUserById,
  getAllUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
};
