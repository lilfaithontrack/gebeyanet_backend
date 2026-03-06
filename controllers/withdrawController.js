const WithdrawRequest = require('../models/WithdrawRequest.js');
const User = require('../models/User.js');

const requestWithdraw = async (req, res) => {
  const { user_id } = req.body;

  try {
    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.wallet < 1000) {
      return res.status(400).json({ message: 'You need at least 1000 ETB to request withdrawal.' });
    }

    // Check if there is already a pending withdrawal
    const existingRequest = await WithdrawRequest.findOne({
      where: { user_id, status: 'Pending' },
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending withdrawal request.' });
    }

    // Create withdrawal request
    const withdrawal = await WithdrawRequest.create({ user_id });

    return res.status(201).json({
      message: 'Withdrawal request submitted successfully.',
      withdrawal,
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { requestWithdraw };
