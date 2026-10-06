/**
 * WhatsApp Service for Local Artisan Marketplace
 * Supports Client Deep Linking (wa.me) & Production WhatsApp Cloud API / Twilio WhatsApp.
 */

/**
 * Format phone number to international standard without symbols (e.g. 919876543210)
 */
const formatInternationalPhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  // Default to India country code 91 if 10 digits
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
};

/**
 * Generate client-side instant WhatsApp deep link for buyer-to-artisan chats
 */
const generateWhatsAppChatLink = ({ phone, text }) => {
  const formattedPhone = formatInternationalPhone(phone);
  const encodedText = encodeURIComponent(text || 'Hi! I am interested in your handcrafted items on Local Artisan Marketplace.');
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
};

/**
 * Send WhatsApp Message via API (Meta WhatsApp Cloud API or Twilio WhatsApp API)
 */
const sendWhatsAppMessage = async ({ phone, text }) => {
  const formattedPhone = formatInternationalPhone(phone);

  if (!formattedPhone) {
    console.warn('[WhatsApp Service] Skipped: No phone number provided');
    return { success: false, reason: 'No phone number provided' };
  }

  // 1. Meta WhatsApp Cloud API Integration Check
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: text }
        })
      });
      const data = await response.json();
      console.log(`[WhatsApp API Meta] Sent to ${formattedPhone}:`, data);
      return { success: true, provider: 'meta_cloud_api', response: data };
    } catch (error) {
      console.error(`[WhatsApp API Meta Error]: ${error.message}`);
    }
  }

  // 2. Twilio WhatsApp Integration Check
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
    try {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const res = await twilio.messages.create({
        body: text,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:+${formattedPhone}`
      });
      console.log(`[WhatsApp API Twilio] Sent to +${formattedPhone}, SID: ${res.sid}`);
      return { success: true, sid: res.sid, provider: 'twilio_whatsapp' };
    } catch (error) {
      console.error(`[WhatsApp API Twilio Error]: ${error.message}`);
    }
  }

  // 3. Development Mode Fallback Logger
  const deepLink = generateWhatsAppChatLink({ phone: formattedPhone, text });
  console.log(`\n=================== [ WHATSAPP DEV LOG ] ===================`);
  console.log(`📱 TO: +${formattedPhone}`);
  console.log(`💬 MESSAGE: ${text}`);
  console.log(`🔗 INSTANT LINK: ${deepLink}`);
  console.log(`============================================================\n`);

  return {
    success: true,
    provider: 'dev_simulation',
    deepLink,
    message: 'WhatsApp notification logged & deep link generated'
  };
};

/**
 * Send WhatsApp Order Notification
 */
const sendWhatsAppOrderNotification = async ({ phone, orderId, status, totalAmount }) => {
  const text = `🛍️ *Local Artisan Marketplace Update*\n\nYour order *#${orderId}* status is now: *${status.toUpperCase()}*.\nAmount: ₹${Number(totalAmount || 0).toLocaleString()}\n\nThank you for supporting authentic handcrafted art! 🌿`;
  return sendWhatsAppMessage({ phone, text });
};

module.exports = {
  formatInternationalPhone,
  generateWhatsAppChatLink,
  sendWhatsAppMessage,
  sendWhatsAppOrderNotification
};
