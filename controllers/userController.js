const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = '1y';
const SALT_ROUNDS = 10;

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
    const { full_name, email, phone, password, role, location_lat, location_lng, address, is_company } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'full_name, email, and password are required.' });
    }

    // Validate role
    const validRoles = ['buyer', 'seller', 'agent'];
    const userRole = validRoles.includes(role) ? role : 'buyer';

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

    // Generate referral code for agents
    let referral_code = null;
    if (userRole === 'agent' || req.body.is_agent) {
      referral_code = `GN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    const newUser = await User.create({
      full_name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: userRole,
      location_lat: location_lat || null,
      location_lng: location_lng || null,
      address: address || null,
      is_company: is_company || false,
      is_agent: userRole === 'agent',
      referral_code,
      referred_by: req.body.referred_by || null,
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
      'bank_name', 'account_number', 'is_company',
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
// ============================
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const where = {};
    if (role) where.role = role;

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
    });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
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

module.exports = {
  upload,
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getUserById,
  getAllUsers,
  deleteUser,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
};
