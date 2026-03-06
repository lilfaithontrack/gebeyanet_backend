const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

/**
 * Verify that the request has a valid JWT token and attach the user to req.user.
 * Works for all roles (buyer, seller, agent).
 */
const verifyUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
};

/**
 * Middleware factory to restrict access to specific roles.
 * Usage: requireRole('seller'), requireRole('buyer', 'agent')
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This action requires one of these roles: ${roles.join(', ')}.`,
            });
        }

        next();
    };
};

module.exports = { verifyUser, requireRole };
