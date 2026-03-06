const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin.js'); // Ensure the path is correct

const adminAuth = async (req, res, next) => {
  try {
    // Get token from the headers
    const token = req.header('Authorization').replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied.',
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the admin by ID
    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found, authorization denied.',
      });
    }

    // Check if the user has an admin role
    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to access this resource.',
      });
    }

    // Attach admin information to request
    req.admin = admin;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Invalid token, authorization denied.',
    });
  }
};

module.exports = adminAuth;
