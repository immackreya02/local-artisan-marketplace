const Notification = require('../models/Notification');

/**
 * Creates a notification document in the database.
 * @param {Object} params
 * @param {String|ObjectId} params.recipient - User ID of recipient
 * @param {String} params.title - Title of notification
 * @param {String} params.message - Body text of notification
 * @param {String} [params.type='CustomRequest'] - Notification category enum
 * @param {String|ObjectId} [params.relatedId] - Referenced document ID (e.g. custom request ID)
 */
const createNotification = async ({ recipient, title, message, type = 'CustomRequest', relatedId = null }) => {
  try {
    if (!recipient || !title || !message) {
      return null;
    }
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedId: relatedId || undefined,
      read: false
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};
