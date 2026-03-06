const express = require('express');
const { sendMessage, getChatHistory, markAsRead } = require('../controllers/chatController.js');

const router = express.Router();

// Route to send a message
router.post('/send', sendMessage);

// Route to get chat history between two users
router.get('/history', getChatHistory);

// Route to mark messages as read
router.put('/mark-read', markAsRead);

module.exports = router;
