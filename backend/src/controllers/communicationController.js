const User = require('../models/User');
const { dispatchMultiChannelNotification } = require('../services/communicationHub');
const { generateWhatsAppChatLink } = require('../services/whatsappService');

/**
 * Generate 6-digit numerical OTP code
 */
const generate6DigitOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Send OTP via SMS, Email, and WhatsApp
 * @route   POST /api/communication/send-otp
 * @access  Private
 */
exports.sendOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { phone } = req.body;
    if (phone && typeof phone === 'string' && phone.trim()) {
      user.phone = phone.trim();
    }

    const otpCode = generate6DigitOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    user.otp = {
      code: otpCode,
      expiresAt
    };
    await user.save();

    const dispatchResult = await dispatchMultiChannelNotification({
      recipientUser: user,
      title: 'Security Verification Code',
      message: `Your verification OTP is ${otpCode}. Valid for 10 mins.`,
      type: 'General',
      otpCode
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully across configured channels',
      otpCodeDev: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      channelsUsed: dispatchResult.channelsUsed
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP code
 * @route   POST /api/communication/verify-otp
 * @access  Private
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP code is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.otp || !user.otp.code) {
      return res.status(400).json({ success: false, message: 'No OTP requested or OTP expired' });
    }

    if (user.otp.code !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    // Clear OTP after successful verification
    user.otp = { code: '', expiresAt: null };
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get WhatsApp direct chat link for an artisan or product inquiry
 * @route   GET /api/communication/whatsapp-link
 * @access  Public
 */
exports.getWhatsAppLink = async (req, res, next) => {
  try {
    const { phone, productName, shopName, customMessage } = req.query;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    let defaultText = `Hi! I am browsing on Local Artisan Marketplace.`;
    if (productName) {
      defaultText = `Hi! I'm interested in "${productName}" from your shop on Local Artisan Marketplace. Is it available?`;
    } else if (shopName) {
      defaultText = `Hi! I'm visiting "${shopName}" on Local Artisan Marketplace and have an inquiry.`;
    }

    const link = generateWhatsAppChatLink({
      phone,
      text: customMessage || defaultText
    });

    res.status(200).json({
      success: true,
      whatsappLink: link,
      targetPhone: phone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user notification channel preferences
 * @route   GET /api/communication/preferences
 * @access  Private
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notificationPreferences phone email');
    res.status(200).json({
      success: true,
      preferences: user.notificationPreferences || { email: true, sms: true, whatsapp: true },
      phone: user.phone || '',
      email: user.email || ''
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user notification channel preferences & phone
 * @route   PATCH /api/communication/preferences
 * @access  Private
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const { email, sms, whatsapp, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.notificationPreferences) {
      user.notificationPreferences = { email: true, sms: true, whatsapp: true };
    }

    if (typeof email === 'boolean') user.notificationPreferences.email = email;
    if (typeof sms === 'boolean') user.notificationPreferences.sms = sms;
    if (typeof whatsapp === 'boolean') user.notificationPreferences.whatsapp = whatsapp;
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Communication preferences updated successfully',
      preferences: user.notificationPreferences,
      phone: user.phone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Test send multi-channel notification to authenticated user
 * @route   POST /api/communication/test-dispatch
 * @access  Private
 */
exports.testDispatch = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { title, message } = req.body;

    const dispatchResult = await dispatchMultiChannelNotification({
      recipientUser: user,
      title: title || 'Test Multi-Channel Notification',
      message: message || 'This is a test notification dispatched across Email, SMS, WhatsApp, and In-App Hub.',
      type: 'General'
    });

    res.status(200).json({
      success: true,
      message: 'Test notification dispatched across user-enabled channels',
      result: dispatchResult
    });
  } catch (error) {
    next(error);
  }
};
