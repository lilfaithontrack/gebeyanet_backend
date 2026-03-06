const express = require('express');
const { sendMessage, getChatHistory, markAsRead, deleteMessage, getUnreadMessages } = require('../controllers/chatController.js'); // Import the controller methods

const router = express.Router();

// Send a new message
router.post('/send', sendMessage);

// Fetch chat history between two users
router.get('/history/:sender_id/:sender_role/:receiver_id/:receiver_role', getChatHistory);


// Mark a message as read
router.put('/mark-as-read/:message_id', markAsRead);

// Delete a message
router.delete('/delete/:message_id', deleteMessage);

// Fetch unread messages for a user
router.get('/unread/:user_id', getUnreadMessages);

module.exports = router;
