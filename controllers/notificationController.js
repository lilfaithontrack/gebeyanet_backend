
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
      order: [['createdAt', 'DESC']], // Sort by newest first
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

module.exports = { createNotification, getNotifications, updateNotificationStatus };
