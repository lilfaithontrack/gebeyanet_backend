const Shopper = require('../models/Shopper.js');
const jwt = require('jsonwebtoken');

/**
 * verifyShopper — Hardened middleware
 * Verifies JWT token AND confirms the shopper exists in the database.
 * Follows the same pattern as verifyUser.js.
 */
const verifyShopper = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('Invalid session:', err.message);
      return res.status(403).json({ message: 'Invalid or expired session' });
    }

    // Look up shopper in the database to ensure they still exist
    const shopper = await Shopper.findByPk(decoded.id || decoded.shopper_id, {
      attributes: { exclude: ['password'] },
    });

    if (!shopper) {
      return res.status(401).json({ message: 'Shopper not found' });
    }

    // Attach the full shopper record (without password) to req
    req.user = shopper;
    req.shopper = shopper;
    next();
  } catch (err) {
    console.error('verifyShopper error:', err.message);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

module.exports = { verifyShopper };
