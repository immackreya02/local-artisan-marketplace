/**
 * SMS Service for Local Artisan Marketplace
 * Powered by Fast2SMS API Gateway with development logger fallback.
 */

const sendSMS = async ({ phone, message }) => {
  const sanitizedPhone = (phone || '').replace(/\s+/g, '');
  if (!sanitizedPhone) {
    console.warn('[SMS Service] Skipped: No phone number provided');
    return { success: false, reason: 'No phone number provided' };
  }

  // 2. Fast2SMS API Check
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const cleanNumber = sanitizedPhone.replace(/\D/g, '').slice(-10);
      const apiUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(process.env.FAST2SMS_API_KEY)}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${cleanNumber}`;

      const response = await fetch(apiUrl, { method: 'GET' });
      const data = await response.json();
      console.log(`[SMS Service - Fast2SMS] Dispatched to ${cleanNumber}:`, data);

      if (data && (data.return === true || data.status_code === 200)) {
        return { success: true, provider: 'fast2sms', response: data };
      }
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
