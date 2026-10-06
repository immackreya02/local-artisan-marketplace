const Notification = require('../models/Notification');
const emailService = require('./emailService');
const smsService = require('./smsService');
const whatsappService = require('./whatsappService');

/**
 * Dispatch notification across user-enabled channels (In-App DB, Email, SMS, WhatsApp)
 */
const dispatchMultiChannelNotification = async ({
  recipientUser,
  title,
  message,
  type = 'General',
  relatedId = null,
  orderData = null,
  customRequestData = null,
  otpCode = null
}) => {
  if (!recipientUser) {
    console.warn('[Communication Hub] Skipped: No recipient user provided');
    return { success: false, reason: 'No recipient provided' };
  }

  const prefs = recipientUser.notificationPreferences || { email: true, sms: true, whatsapp: true };
  const channelsUsed = ['in_app'];
  const dispatchResults = {};

  // 1. Create In-App Notification Record in Database
  try {
    const notificationDoc = await Notification.create({
      recipient: recipientUser._id,
      title,
      message,
      type,
      relatedId
    });
    dispatchResults.in_app = { success: true, notificationId: notificationDoc._id };
  } catch (err) {
    console.error('[Communication Hub] In-App Notification Error:', err.message);
  }

  // 2. Dispatch Email if enabled and user has valid email
  if (prefs.email !== false && recipientUser.email) {
    channelsUsed.push('email');
    if (type === 'Order' && orderData) {
      dispatchResults.email = await emailService.sendOrderConfirmationEmail({
        user: recipientUser,
        order: orderData
      });
    } else if (otpCode) {
      dispatchResults.email = await emailService.sendOTPEmail({
        user: recipientUser,
        otp: otpCode
      });
    } else {
      dispatchResults.email = await emailService.sendEmail({
        to: recipientUser.email,
        subject: `🔔 ${title} - Local Artisan Marketplace`,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #2A2420;">
                 <h3 style="color: #C1673B;">${title}</h3>
                 <p>${message}</p>
               </div>`
      });
    }
  }

  // 3. Dispatch SMS if enabled and user has phone
  if (prefs.sms !== false && recipientUser.phone) {
    channelsUsed.push('sms');
    if (otpCode) {
      dispatchResults.sms = await smsService.sendOTPSMS({
        phone: recipientUser.phone,
        otp: otpCode
      });
    } else {
      dispatchResults.sms = await smsService.sendSMS({
        phone: recipientUser.phone,
        message: `[Local Artisan Marketplace] ${title}: ${message}`
      });
    }
  }

  // 4. Dispatch WhatsApp if enabled and user has phone
  if (prefs.whatsapp !== false && recipientUser.phone) {
    channelsUsed.push('whatsapp');
    if (type === 'Order' && orderData) {
      dispatchResults.whatsapp = await whatsappService.sendWhatsAppOrderNotification({
        phone: recipientUser.phone,
        orderId: orderData._id || orderData.id,
        status: orderData.orderStatus || orderData.status || 'Processing',
        totalAmount: orderData.totalAmount || orderData.total || 0
      });
    } else {
      dispatchResults.whatsapp = await whatsappService.sendWhatsAppMessage({
        phone: recipientUser.phone,
        text: `📢 *${title}*\n${message}`
      });
    }
  }

  console.log(`[Communication Hub] Dispatched notification to user ${recipientUser._id} via [${channelsUsed.join(', ')}]`);

  return {
    success: true,
    recipient: recipientUser._id,
    channelsUsed,
    dispatchResults
  };
};

module.exports = {
  dispatchMultiChannelNotification
};
