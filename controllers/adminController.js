const Admin = require('../models/Admin.js'); // Ensure the path ends with .js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Import JWT for token generation

// Admin registration
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email.',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      image: req.body.image || 'admin1.jpg',
    });

    res.status(201).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin login
// Admin login
const loginAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find admin by email
      const admin = await Admin.findOne({ where: { email } });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }
  
      // Check if the admin was registered with a plain password
      // You can use a flag or condition based on your schema or any specific logic
      if (admin.password === password) {  // Assuming the old passwords are plain text
        // Generate JWT token
        const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, {
          expiresIn: '1h',
        });
  
        return res.status(200).json({
          success: true,
          token,
          data: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            image: admin.image,
          },
        });
      }
  
      // If the password is hashed, compare using bcrypt
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }
  
      // Generate JWT token
      const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
  
      res.status(200).json({
        success: true,
        token,
        data: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          image: admin.image,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  

// Create a new admin (Protected route - Only accessible by authenticated admins)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      image: req.body.image || 'admin1.jpg',
    });

    res.status(201).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll();
    res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get an admin by ID
const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update admin details
const updateAdmin = async (req, res) => {
  try {
    const { name, email, password, image } = req.body;

    const admin = await Admin.findByPk(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    const updatedAdmin = await admin.update({
      name: name || admin.name,
      email: email || admin.email,
      password: password ? await bcrypt.hash(password, 10) : admin.password,
      image: image || admin.image,
    });

    res.status(200).json({
      success: true,
      data: updatedAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete an admin
const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    await admin.destroy();
    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { registerAdmin, loginAdmin, createAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin };
