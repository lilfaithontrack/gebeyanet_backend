const { body, validationResult } = require('express-validator');

const validateSellerRegistration = [
  body('name').notEmpty().withMessage('Name is required.'),
  body('lname').notEmpty().withMessage('Last name is required.'),
  body('email').isEmail().withMessage('Must be a valid email.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('region').notEmpty().withMessage('Region is required.'),
  body('commerce1').notEmpty().withMessage('Commerce1 is required.'),
  body('commerce2').notEmpty().withMessage('Commerce2 is required.'),
  // Add other validations as needed
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateSellerUpdate = [
  body('name').optional().notEmpty().withMessage('Name is required.'),
  body('lname').optional().notEmpty().withMessage('Last name is required.'),
  body('email').optional().isEmail().withMessage('Must be a valid email.'),
  body('phone').optional().notEmpty().withMessage('Phone is required.'),
  body('region').optional().notEmpty().withMessage('Region is required.'),
  // Add other validations as needed
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateSellerRegistration, validateSellerUpdate };
