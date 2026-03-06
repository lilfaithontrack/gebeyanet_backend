const Shopper = require('../models/Shopper.js');
const Delivery = require('../models/Delivery.js');
const Admin = require('../models/Admin.js');
const Chat = require('../models/Chat.js'); // Import the Chat model
const { Op } = require('sequelize');
// Send a new message
const sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, sender_role, receiver_role, message } = req.body;

    // Validate required fields
    if (!sender_id || !receiver_id || !sender_role || !receiver_role || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a new chat message
    const newMessage = await Chat.create({
      sender_id,
      receiver_id,
      sender_role,
      receiver_role,
      message,
    });

    res.status(201).json({ message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// Fetch chat history between two users
const getChatHistory = async (req, res) => {
  try {
    const { sender_id, sender_role, receiver_id, receiver_role } = req.params;

    // Validate required fields
    if (!sender_id || !sender_role || !receiver_id || !receiver_role) {
      return res.status(400).json({ message: 'Sender ID, Sender Role, Receiver ID, and Receiver Role are required' });
    }

    // Fetch chat history, ensuring role matching
    const chatHistory = await Chat.findAll({
      where: {
        [Op.or]: [
          { sender_id, sender_role, receiver_id, receiver_role },
          { sender_id: receiver_id, sender_role: receiver_role, receiver_id: sender_id, receiver_role: sender_role },
        ],
      },
      order: [['createdAt', 'ASC']], // Order by creation time (oldest first)
    });

    res.status(200).json({ message: 'Chat history fetched successfully', data: chatHistory });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history', error: error.message });
  }
};


// Mark a message as read
const markAsRead = async (req, res) => {
  try {
    const { message_id } = req.params;

    // Validate required fields
    if (!message_id) {
      return res.status(400).json({ message: 'Message ID is required' });
    }

    // Update the message's is_read status
    const updatedMessage = await Chat.update(
      { is_read: true },
      {
        where: { id: message_id },
        returning: true, // Return the updated message
      }
    );

    if (updatedMessage[0] === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Message marked as read', data: updatedMessage[1][0] });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to mark message as read', error: error.message });
  }
};

// Delete a message (soft delete)
const deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;

    // Validate required fields
    if (!message_id) {
      return res.status(400).json({ message: 'Message ID is required' });
    }

    // Soft delete the message
    const deletedMessage = await Chat.destroy({
      where: { id: message_id },
    });

    if (deletedMessage === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
};

// Fetch unread messages for a user
const getUnreadMessages = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate required fields
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Fetch unread messages
    const unreadMessages = await Chat.findAll({
      where: {
        receiver_id: user_id,
        is_read: false,
      },
    });

    res.status(200).json({ message: 'Unread messages fetched successfully', data: unreadMessages });
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    res.status(500).json({ message: 'Failed to fetch unread messages', error: error.message });
  }
};

module.exports = { sendMessage, getChatHistory, markAsRead, deleteMessage, getUnreadMessages };
