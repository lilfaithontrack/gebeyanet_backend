// Example: middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const { Sender } = require('../models/Telalaki.js');
const Shopper = require('../models/Shopper.js'); 
// Adjust path to your models file
// Import your error response helper if you have one
// const { sendErrorResponse } = require('../controllers/helpers.js'); // Adjust path

// Make sure JWT_SECRET is loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function (if not imported)
const sendErrorResponse = (res, statusCode, message) => {
    console.error(`Error ${statusCode}: ${message}`);
    res.status(statusCode).json({ message });
};


const protectSender = async (req, res, next) => {
  let token;
  console.log('>>> Protect Middleware: Checking authentication...'); // Debug log

  // 1. Check for Authorization header and Bearer token format
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
      console.log('>>> Protect Middleware: Token found.'); // Debug log

      // 3. Verify the token using your secret key
      // This checks signature and expiration
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('>>> Protect Middleware: Token verified, decoded payload:', decoded); // Debug log

      // 4. Use ID from token payload to find the sender in the database
      //    The property name in 'decoded' (e.g., 'id', 'senderId') depends on
      //    what you put in the payload when you *created* the token during login.
      //    IMPORTANT: Exclude sensitive fields like the PIN!
      const loggedInSender = await Sender.findByPk(decoded.id, { // Assuming payload has 'id'
        attributes: { exclude: ['pin'] } // Exclude sensitive data
      });

      if (!loggedInSender) {
         console.error('>>> Protect Middleware: Sender not found for ID in token:', decoded.id);
         // Changed from sendErrorResponse to just calling next() without attaching user
         // This allows the controller to potentially handle 'user not found' differently if needed,
         // or you can send the 401 directly here. If sending 401, use 'return'.
         // return sendErrorResponse(res, 401, 'Not authorized, user associated with token not found.');
         // Calling next() without req.sender will cause the controller check to fail with "User context not found"
         return next();
      }

      // 5. Attach the fetched sender object to the request object
      //    Controllers downstream can now access req.sender
      req.sender = loggedInSender;
      console.log('>>> Protect Middleware: Sender context attached to req.sender.'); // Debug log

      next(); // Token is valid, user found, proceed to the next middleware/controller

    } catch (error) {
      // Handle errors during token verification (expired, invalid signature etc.)
      console.error('>>> Protect Middleware: Token verification failed!', error.message);
      return sendErrorResponse(res, 401, 'Not authorized, token failed or expired.');
    }
  }

  // If the header is missing or not in 'Bearer <token>' format
  if (!token) {
    console.log('>>> Protect Middleware: No valid Bearer token found in header.');
    return sendErrorResponse(res, 401, 'Not authorized, no token provided.');
  }
};
const protect = async (req, res, next) => {
  let token;
  console.log('>>> Protect Middleware: Checking authentication...');

  // 1. Check for Authorization header and Bearer token format
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
      console.log('>>> Protect Middleware: Token found.');

      // 3. Verify the token using your secret key
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('>>> Protect Middleware: Token verified, payload:', decoded);

      // 4. Use the ID from the token payload to find the shopper in the database.
      //    The property name in 'decoded' (e.g., 'id') depends on how you created the token.
      //    IMPORTANT: We exclude the password for security.
      const loggedInShopper = await Shopper.findByPk(decoded.id, {
        attributes: { exclude: ['password'] } // CHANGED: Exclude 'password' instead of 'pin'
      });

      // 5. Check if the shopper still exists
      if (!loggedInShopper) {
        // IMPROVEMENT: Fail fast. If user for a valid token doesn't exist, it's a clear authorization failure.
        console.error('>>> Protect Middleware: Shopper not found for ID in token:', decoded.id);
        return res.status(401).json({ message: 'Not authorized, user for this token no longer exists.' });
      }

      // 6. Attach the fetched shopper object to the request object as `req.user`
      //    This matches the usage in your controllers (e.g., req.user.id).
      req.user = loggedInShopper; // CHANGED: Using `req.user` for convention
      console.log('>>> Protect Middleware: Shopper context attached to req.user.');

      // 7. Proceed to the next middleware or controller
      next();

    } catch (error) {
      // Handle errors during token verification (e.g., expired, invalid signature)
      console.error('>>> Protect Middleware: Token verification failed!', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed or expired.' });
    }
  }

  // If the header is missing or not in 'Bearer <token>' format
  if (!token) {
    console.log('>>> Protect Middleware: No valid Bearer token found in header.');
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};

module.exports = { protectSender, protect };
