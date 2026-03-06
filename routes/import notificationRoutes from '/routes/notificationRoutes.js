const express = require('express');
const { createNotification, getNotifications, updateNotificationStatus } = require('../controllers/notificationController.js');

const router = express.Router();

// Route to create a new notification
router.post('/create', createNotification);

// Route to get notifications for a user or guest
router.get('/notifications', getNotifications);

// Route to update the notification status (read/unread)
router.put('/notifications/:notification_id', updateNotificationStatus);

module.exports = router;
