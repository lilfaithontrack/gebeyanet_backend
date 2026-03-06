// middleware/sellerAuth.js
const jwt = require('jsonwebtoken');
const Seller = require('../models/Seller.js'); // Ensure the path is correct

// Middleware to authenticate sellers
const authenticateSeller = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1];

    // Check if the token is provided
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the seller by ID
    const seller = await Seller.findByPk(decoded.id);

    // Check if the seller exists
    if (!seller) {
      return res.status(401).json({ success: false, message: 'Seller not found, authorization denied.' });
    }

    // Attach seller information to request for further processing
    req.seller = seller;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle verification errors
    res.status(403).json({
      success: false,
      message: 'Failed to authenticate token.',
    });
  }
};

module.exports = { authenticateSeller };
