const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check user role
    const role = user.role;

    // Create JWT with role, set to expire in 1 year
    const token = jwt.sign(
      { userId: user.id, role: user.role }, // Include user role in the token
      process.env.JWT_SECRET,
      { expiresIn: '1y' } // Token expires in 1 year
    );

    // Send the role and token back
    res.status(200).json({
      token,
      role, // Send back the user role to the frontend
      message: `Login successful as ${role}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
