const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin.js');

const ADMIN_ROLES = ['superadmin', 'admin', 'manager'];

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    const token = authHeader.replace('Bearer ', '');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found.' });
    }

    if (!ADMIN_ROLES.includes(admin.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Restrict to specific roles — usage: requireRole('superadmin', 'admin')
const requireRole = (...roles) => async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.id);

    if (!admin || !roles.includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${roles.join(' or ')}.`,
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

module.exports = adminAuth;
module.exports.requireRole = requireRole;
