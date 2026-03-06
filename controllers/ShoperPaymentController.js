// controllers/paymentController.js
const ShopperPaymentAccount = require('../models/ShopperPaymentAccount.js');

// Add a new payment account
const addPaymentAccount = async (req, res) => {
  try {
    const { type, accountName, accountNumber, provider, isDefault } = req.body;

    if (isDefault) {
      // unset previous default for this shopper
      await ShopperPaymentAccount.update(
        { isDefault: false },
        { where: { shopperId: req.user.id } }
      );
    }

    const account = await ShopperPaymentAccount.create({
      shopperId: req.user.id,
      type,
      accountName,
      accountNumber,
      provider,
      isDefault,
    });

    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all payment accounts for the logged-in shopper
const getMyPaymentAccounts = async (req, res) => {
  try {
    const accounts = await ShopperPaymentAccount.findAll({
      where: { shopperId: req.user.id },
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update payment account
const updatePaymentAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, accountName, accountNumber, provider, isDefault } = req.body;

    const account = await ShopperPaymentAccount.findOne({
      where: { id, shopperId: req.user.id },
    });

    if (!account) {
      return res.status(404).json({ message: "Payment account not found" });
    }

    if (isDefault) {
      await ShopperPaymentAccount.update(
        { isDefault: false },
        { where: { shopperId: req.user.id } }
      );
    }

    await account.update({
      type,
      accountName,
      accountNumber,
      provider,
      isDefault,
    });

    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete payment account
const deletePaymentAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await ShopperPaymentAccount.findOne({
      where: { id, shopperId: req.user.id },
    });

    if (!account) {
      return res.status(404).json({ message: "Payment account not found" });
    }

    await account.destroy();
    res.json({ message: "Payment account deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addPaymentAccount, getMyPaymentAccounts, updatePaymentAccount, deletePaymentAccount };
