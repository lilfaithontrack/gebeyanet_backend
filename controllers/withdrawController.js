const WithdrawRequest = require('../models/WithdrawRequest.js');
const User = require('../models/User.js');
const { Op } = require('sequelize');

// Minimum withdrawal amount in ETB
const MIN_WITHDRAWAL = 100;

// ============================
//  USER: Request a withdrawal
// ============================
const requestWithdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ${MIN_WITHDRAWAL} ETB.`,
      });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const balance = parseFloat(user.wallet_balance) || 0;
    if (balance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Available: ${balance.toFixed(2)} ETB.`,
      });
    }

    // Block if there is already a pending withdrawal
    const existing = await WithdrawRequest.findOne({
      where: { user_id: userId, status: 'Pending' },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request.',
      });
    }

    const withdrawal = await WithdrawRequest.create({
      user_id: userId,
      amount: withdrawAmount,
      status: 'Pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      withdrawal,
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ============================
//  USER: Get my withdrawal history
// ============================
const getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await WithdrawRequest.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    console.error('Error fetching my withdrawals:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ============================
//  ADMIN: Get all withdrawal requests
// ============================
const getAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const withdrawals = await WithdrawRequest.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'phone', 'wallet_balance'] }],
      order: [['createdAt', 'DESC']],
    });

    const totalBalance = await User.sum('wallet_balance');
    const pending = await WithdrawRequest.sum('amount', { where: { status: 'Pending' } });
    const approved = await WithdrawRequest.sum('amount', { where: { status: 'Approved' } });

    res.status(200).json({
      success: true,
      stats: {
        total_balance: parseFloat(totalBalance) || 0,
        pending_withdrawals: parseFloat(pending) || 0,
        approved_withdrawals: parseFloat(approved) || 0,
        total_withdrawn: parseFloat(approved) || 0,
      },
      withdrawals,
    });
  } catch (error) {
    console.error('Error fetching all withdrawals:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

// ============================
//  ADMIN: Approve / Decline a withdrawal
// ============================
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Declined', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Must be 'Approved', 'Declined', or 'Pending'." });
    }

    const withdrawal = await WithdrawRequest.findByPk(id);
    if (!withdrawal) return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });

    // Only act on Pending requests to avoid double-processing
    if (withdrawal.status !== 'Pending' && status !== withdrawal.status) {
      return res.status(400).json({ success: false, message: `Withdrawal already ${withdrawal.status}.` });
    }

    // On approval, deduct from user wallet
    if (status === 'Approved' && withdrawal.status === 'Pending') {
      const user = await User.findByPk(withdrawal.user_id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      const balance = parseFloat(user.wallet_balance) || 0;
      if (balance < withdrawal.amount) {
        return res.status(400).json({ success: false, message: 'User has insufficient balance for this withdrawal.' });
      }

      await user.update({ wallet_balance: balance - withdrawal.amount });
    }

    await withdrawal.update({ status });

    res.status(200).json({
      success: true,
      message: `Withdrawal ${status.toLowerCase()} successfully.`,
      withdrawal,
    });
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
};

module.exports = {
  requestWithdraw,
  getMyWithdrawals,
  getAllWithdrawals,
  updateWithdrawalStatus,
};
