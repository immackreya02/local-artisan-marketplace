const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Creates a notification document in the database and dispatches across user-enabled channels (Email, SMS, WhatsApp).
 * @param {Object} params
 * @param {String|ObjectId} params.recipient - User ID of recipient
 * @param {String} params.title - Title of notification
 * @param {String} params.message - Body text of notification
 * @param {String} [params.type='CustomRequest'] - Notification category enum
 * @param {String|ObjectId} [params.relatedId] - Referenced document ID
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

    // Trigger Multi-Channel Dispatch (Email, SMS, WhatsApp) in background
    User.findById(recipient).then((recipientUser) => {
      if (recipientUser) {
        const { dispatchMultiChannelNotification } = require('../services/communicationHub');
        dispatchMultiChannelNotification({
          recipientUser,
          title,
          message,
          type,
          relatedId
        }).catch((err) => console.error('[Notification Dispatch Error]:', err.message));
      }
    }).catch((err) => console.error('[User Lookup Error]:', err.message));

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};
