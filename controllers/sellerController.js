const Seller = require('../models/Seller.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer'); // For file uploadsu
const path = require('path');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// **Hardcoded Email Credentials (Not Recommended)**
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Use environment variable for email
    pass: process.env.EMAIL_PASS, // Use environment variable for password
  },
});

// Store OTPs temporarily
const otpStorage = new Map();

// Send OTP
const sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const existingSeller = await Seller.findOne({ where: { email } });
    if (existingSeller) {
      return res.status(400).json({ success: false, message: 'Seller already exists with this email.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(email, { otp, expiresAt: Date.now() + 300000 }); // Expires in 5 minutes

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Registration',
      text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'OTP sent to email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpEntry = otpStorage.get(email);
    if (!otpEntry) {
      return res.status(400).json({ success: false, message: 'No OTP sent for this email.' });
    }

    if (otpEntry.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (otpEntry.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    // OTP is valid
    res.status(200).json({ success: true, message: 'OTP verified successfully.' });

    otpStorage.delete(email); // Clear the OTP after successful verification
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Register a new seller
const registerSeller = async (req, res) => {
  const { email, password, name } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  try {
    const existingSeller = await Seller.findOne({ where: { email } });
    if (existingSeller) {
      return res.status(400).json({ success: false, message: 'Seller already exists with this email.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new seller with optional fields not filled
    const newSeller = await Seller.create({ email, password: hashedPassword, name });

    // Generate JWT token with email included in the payload
    const token = jwt.sign({ id: newSeller.id, email: newSeller.email }, process.env.JWT_SECRET, { expiresIn: '1y' });

    res.status(201).json({
      success: true,
      token,
      data: {
        id: newSeller.id,
        email: newSeller.email,
        name: newSeller.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Seller login
const loginSeller = async (req, res) => {
  const { email, password } = req.body;

  try {
    const seller = await Seller.findOne({ where: { email } });
    if (!seller) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, seller.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token with email included in the payload
    const token = jwt.sign({ id: seller.id, email: seller.email,status: seller.status }, process.env.JWT_SECRET, { expiresIn: '1y' });

    res.status(200).json({
      success: true,
      token,
      data: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        image: seller.image,
        license_file: seller.license_file,
        bank: seller.bank,
        account_number: seller.account_number,
        status: seller.status, // Send the status
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update seller details
// Update seller details
const generateToken = (seller) => {
  return jwt.sign(
    { id: seller.id, email: seller.email, status: seller.status },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Token valid for 15 minutes
  );
};

const updateSeller = async (req, res) => {
  const { name, email, phone, password, bank, account_number, status, code, address } = req.body;

  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    let newToken = null;
    const previousStatus = seller.status;

    // Prepare updated data
    const updatedData = {
      name: name || seller.name,
      email: email || seller.email,
      phone: phone || seller.phone,
      password: password ? await bcrypt.hash(password, 10) : seller.password,
      bank: bank || seller.bank,
      account_number: account_number || seller.account_number,
      status: status || seller.status,
      code: code || seller.code,
      address: address || seller.address,
    };

    // Handle image upload (if provided)
    if (req.files?.image) {
      updatedData.image = req.files.image[0].path;
    }

    // Handle license file upload (if provided)
    if (req.files?.license_file) {
      updatedData.license_file = req.files.license_file[0].path;
    }

    // Update seller data
    await seller.update(updatedData);

    // Fetch the updated seller data from the database
    const updatedSeller = await Seller.findByPk(req.params.id);

    // If the seller status changes (approved or declined), generate a new token
    if (status && status !== previousStatus) {
      newToken = generateToken(updatedSeller); // Use the updated seller data
    }

    res.status(200).json({
      success: true,
      data: updatedData,
      newAccessToken: newToken, // Send new token if status changed
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a seller
const deleteSeller = async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    await seller.destroy();
    res.status(200).json({ success: true, message: 'Seller deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate a reset password token and send it to the user
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const seller = await Seller.findOne({ where: { email } });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found with that email.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    seller.reset_token = resetToken;
    seller.reset_token_expiry = Date.now() + 3600000; // Token expires in 1 hour
    await seller.save();

    const resetUrl = `http://yourdomain.com/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: seller.email,
      subject: 'Password Reset Request',
      html: `<p>To reset your password, click on the following link:</p>
             <a href="${resetUrl}">Reset Password</a>
             <p>If you didn't request this, please ignore this email.</p>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Failed to send email.' });
      }
      res.status(200).json({ success: true, message: 'Password reset email sent successfully.' });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset password using the token
const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const seller = await Seller.findOne({ where: { reset_token: resetToken } });
    if (!seller || seller.reset_token_expiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    seller.password = hashedPassword;
    seller.reset_token = null;
    seller.reset_token_expiry = null;
    await seller.save();

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all sellers
const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.findAll(); // Fetch all sellers

    res.status(200).json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
//get seller by id 

const getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Generate a fresh token
    const newToken = generateToken(seller);

    res.status(200).json({ success: true, data: seller, newAccessToken: newToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { upload, sendOtp, verifyOtp, registerSeller, loginSeller, updateSeller, deleteSeller, forgotPassword, resetPassword, getAllSellers, getSellerById };
