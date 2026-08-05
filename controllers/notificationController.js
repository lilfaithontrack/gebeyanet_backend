
const Notification = require('../models/Notification.js');
const { Op } = require('sequelize');

// Create a notification for a user
const createNotification = async (req, res) => {
  try {
    const { title, message, user_id, guest_id, order_id } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required.' });
    }

    const notification = await Notification.create({
      title,
      message,
      user_id,
      guest_id,
      order_id,
    });

    return res.status(201).json({
      message: 'Notification created successfully.',
      notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get notifications for a user (user_id or guest_id)
const getNotifications = async (req, res) => {
  try {
    const { user_id, guest_id } = req.query;

    if (!user_id && !guest_id) {
      return res.status(400).json({ message: 'User ID or Guest ID is required.' });
    }

    const whereClause = user_id
      ? { user_id }
      : { guest_id };

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']], // Sort by newest first
    });

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'No notifications found.' });
    }

    res.status(200).json({
      message: 'Notifications retrieved successfully.',
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update notification status (mark as read)
const updateNotificationStatus = async (req, res) => {
  try {
    const { notification_id } = req.params;
    const { status } = req.body;

    if (status !== 'read' && status !== 'unread') {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const notification = await Notification.findByPk(notification_id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    notification.status = status;
    await notification.save();

    res.status(200).json({
      message: 'Notification status updated successfully.',
      notification,
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ============================
//  AUTHENTICATED: Get my notifications
// ============================
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching my notifications:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  AUTHENTICATED: Mark one of my notifications as read
// ============================
const markMyNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await notification.update({ status: 'read' });

    res.status(200).json({ success: true, message: 'Marked as read.', notification });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================
//  AUTHENTICATED: Mark all my notifications as read
// ============================
const markAllMyNotificationsRead = async (req, res) => {
  try {
    await Notification.update(
      { status: 'read' },
      { where: { user_id: req.user.id, status: 'unread' } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  updateNotificationStatus,
  getMyNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
};
