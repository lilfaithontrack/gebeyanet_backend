const express = require('express');
const {
  createNotification,
  getNotifications,
  updateNotificationStatus,
  getMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
} = require('../controllers/notificationController.js');
const { verifyUser } = require('../middlewares/verifyUser.js');

const router = express.Router();

// ========================
//  AUTHENTICATED ROUTES (mobile app)
// ========================

// Get my notifications (uses auth token)
router.get('/my', verifyUser, getMyNotifications);

// Mark one of my notifications as read
router.put('/my/:id/read', verifyUser, markMyNotificationRead);

// Mark all my notifications as read
router.put('/my/read-all', verifyUser, markAllMyNotificationsRead);

// ========================
//  LEGACY / ADMIN ROUTES
// ========================

// Create a new notification
router.post('/create', createNotification);

// Get notifications for a user or guest (query params: user_id, guest_id)
router.get('/notifications', getNotifications);

// Update notification status (read/unread)
router.put('/notifications/:notification_id', updateNotificationStatus);

module.exports = router;
