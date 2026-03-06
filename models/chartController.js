const Chat = require('../models/Chat.js');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, sender_role, receiver_role, message } = req.body;

    if (!sender_id || !receiver_id || !sender_role || !receiver_role || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const chat = await Chat.create({
      sender_id,
      receiver_id,
      sender_role,
      receiver_role,
      message,
    });

    res.status(201).json({ message: 'Message sent successfully.', chat });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get chat history between two users
const getChatHistory = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.query;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({ message: 'Sender ID and Receiver ID are required.' });
    }

    const chatHistory = await Chat.findAll({
      where: {
        [sequelize.Op.or]: [
          { sender_id, receiver_id },
          { sender_id: receiver_id, receiver_id: sender_id },
        ],
      },
      order: [['createdAt', 'ASC']],
    });

    if (chatHistory.length === 0) {
      return res.status(404).json({ message: 'No chat history found.' });
    }

    res.status(200).json({ message: 'Chat history retrieved successfully.', chatHistory });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({ message: 'Sender ID and Receiver ID are required.' });
    }

    await Chat.update(
      { is_read: true },
      {
        where: {
          receiver_id,
          sender_id,
          is_read: false,
        },
      }
    );

    res.status(200).json({ message: 'Messages marked as read.' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { sendMessage, getChatHistory, markAsRead };
