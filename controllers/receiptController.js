const Receipt = require('../models/Receipt.js');
const Checkout = require('../models/Checkout.js');

// Create a receipt (with guest token support)
const createReceipt = async (req, res) => {
  const { checkout_id, payment_method, payment_status, transaction_reference, total_paid, guest_token } = req.body;

  // Validate required fields
  if (!checkout_id || !payment_method || !total_paid || !guest_token) {
    return res.status(400).json({
      message: 'All fields (checkout_id, payment_method, total_paid, guest_token) are required.',
    });
  }

  try {
    // Ensure the associated checkout exists
    const checkout = await Checkout.findByPk(checkout_id);
    if (!checkout) {
      return res.status(404).json({ message: `Checkout with ID ${checkout_id} not found.` });
    }

    // Create the receipt and associate with guest_token
    const newReceipt = await Receipt.create({
      checkout_id,
      payment_method,
      payment_status: payment_status || 'pending',
      transaction_reference,
      total_paid,
      guest_token, // Save the guest token for non-logged-in users
    });

    res.status(201).json({ message: 'Receipt created successfully', receipt: newReceipt });
  } catch (error) {
    console.error('Error creating receipt:', error);
    res.status(500).json({ message: 'Error creating receipt', error: error.message });
  }
};

// Get all receipts (filter by guest token if provided)
const getAllReceipts = async (req, res) => {
  const { guest_token } = req.query; // Accept guest token as query param

  try {
    // If guest_token is provided, filter receipts by guest token
    const receipts = guest_token
      ? await Receipt.findAll({
          where: { guest_token },
          include: [
            {
              model: Checkout,
              as: 'checkout',
              attributes: ['customer_name', 'customer_email', 'total_price'],
            },
          ],
        })
      : await Receipt.findAll({
          include: [
            {
              model: Checkout,
              as: 'checkout',
              attributes: ['customer_name', 'customer_email', 'total_price'],
            },
          ],
        });

    res.status(200).json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'Error fetching receipts', error: error.message });
  }
};

// Get a specific receipt by ID (with guest token support)
const getReceiptById = async (req, res) => {
  const { id } = req.params;
  const { guest_token } = req.query; // Accept guest token as query param

  try {
    let receipt;
    // Fetch receipt by guest token if provided
    if (guest_token) {
      receipt = await Receipt.findOne({
        where: { id, guest_token },
        include: [
          {
            model: Checkout,
            as: 'checkout',
            attributes: ['customer_name', 'customer_email', 'total_price'],
          },
        ],
      });
    } else {
      // Fetch receipt without guest token
      receipt = await Receipt.findByPk(id, {
        include: [
          {
            model: Checkout,
            as: 'checkout',
            attributes: ['customer_name', 'customer_email', 'total_price'],
          },
        ],
      });
    }

    if (!receipt) {
      return res.status(404).json({ message: `Receipt with ID ${id} not found.` });
    }

    res.status(200).json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ message: 'Error fetching receipt', error: error.message });
  }
};

// Update a receipt (with guest token support)
const updateReceipt = async (req, res) => {
  const { id } = req.params;
  const { payment_method, payment_status, transaction_reference, total_paid, guest_token } = req.body;

  try {
    const receipt = await Receipt.findByPk(id);

    if (!receipt) {
      return res.status(404).json({ message: `Receipt with ID ${id} not found.` });
    }

    // Ensure the guest_token matches, if provided
    if (guest_token && receipt.guest_token !== guest_token) {
      return res.status(403).json({ message: 'Guest token mismatch.' });
    }

    // Update receipt fields
    if (payment_method) receipt.payment_method = payment_method;
    if (payment_status) receipt.payment_status = payment_status;
    if (transaction_reference) receipt.transaction_reference = transaction_reference;
    if (total_paid) receipt.total_paid = total_paid;

    await receipt.save();

    res.status(200).json({ message: 'Receipt updated successfully', receipt });
  } catch (error) {
    console.error('Error updating receipt:', error);
    res.status(500).json({ message: 'Error updating receipt', error: error.message });
  }
};

// Delete a receipt (with guest token support)
const deleteReceipt = async (req, res) => {
  const { id } = req.params;
  const { guest_token } = req.query; // Accept guest token as query param

  try {
    const receipt = await Receipt.findByPk(id);

    if (!receipt) {
      return res.status(404).json({ message: `Receipt with ID ${id} not found.` });
    }

    // Ensure the guest_token matches, if provided
    if (guest_token && receipt.guest_token !== guest_token) {
      return res.status(403).json({ message: 'Guest token mismatch.' });
    }

    await receipt.destroy();

    res.status(200).json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ message: 'Error deleting receipt', error: error.message });
  }
};

module.exports = { createReceipt, getAllReceipts, getReceiptById, updateReceipt, deleteReceipt };
