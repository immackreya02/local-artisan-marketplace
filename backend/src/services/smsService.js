/**
 * SMS Service for Local Artisan Marketplace
 * Supports Twilio / Fast2SMS API integration with seamless dev logger fallback.
 */

const sendSMS = async ({ phone, message }) => {
  const sanitizedPhone = (phone || '').replace(/\s+/g, '');
  if (!sanitizedPhone) {
    console.warn('[SMS Service] Skipped: No phone number provided');
    return { success: false, reason: 'No phone number provided' };
  }

  // 1. Twilio Production SMS Provider Check
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const res = await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: sanitizedPhone.startsWith('+') ? sanitizedPhone : `+91${sanitizedPhone}`
      });
      console.log(`[SMS Service - Twilio] Sent to ${sanitizedPhone}, SID: ${res.sid}`);
      return { success: true, sid: res.sid, provider: 'twilio' };
    } catch (error) {
      console.error(`[SMS Service - Twilio Error]: ${error.message}`);
      // Fall through to dev logger
    }
  }

  // 2. Fast2SMS / MSG91 API Check
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message,
          language: 'english',
          flash: 0,
          numbers: sanitizedPhone.replace(/\+/g, '')
        })
      });
      const data = await response.json();
      console.log(`[SMS Service - Fast2SMS] Sent to ${sanitizedPhone}:`, data);
      return { success: true, provider: 'fast2sms', response: data };
    } catch (error) {
      console.error(`[SMS Service - Fast2SMS Error]: ${error.message}`);
    }
  }

  // 3. Development Mode Fallback Logger
  console.log(`\n=================== [ SMS DEV LOG ] ===================`);
  console.log(`📲 TO: ${sanitizedPhone}`);
  console.log(`💬 MESSAGE: ${message}`);
  console.log(`=======================================================\n`);

  return {
    success: true,
    provider: 'dev_simulation',
    message: 'SMS logged to dev console'
  };
};

/**
 * Send OTP SMS
 */
const sendOTPSMS = async ({ phone, otp }) => {
  const message = `Your Local Artisan Marketplace verification code is ${otp}. Valid for 10 mins. Do not share code with anyone.`;
  return sendSMS({ phone, message });
};

/**
 * Send Order Status SMS
 */
const sendOrderStatusSMS = async ({ phone, orderId, status }) => {
  const message = `[Local Artisan Marketplace] Order #${orderId} status updated to: ${status.toUpperCase()}. Track your package in dashboard.`;
  return sendSMS({ phone, message });
};

/**
 * Send Delivery Alert SMS
 */
const sendDeliveryAlertSMS = async ({ phone, orderId, trackingNumber }) => {
  const message = `🚚 [Local Artisan Marketplace] Good news! Order #${orderId} is out for delivery! Tracking ID: ${trackingNumber || 'ART-TRACK-2026'}.`;
  return sendSMS({ phone, message });
};

module.exports = {
  sendSMS,
  sendOTPSMS,
  sendOrderStatusSMS,
  sendDeliveryAlertSMS
};
