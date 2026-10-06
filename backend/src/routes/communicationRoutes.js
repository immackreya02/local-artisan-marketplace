const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  getWhatsAppLink,
  getPreferences,
  updatePreferences,
  testDispatch
} = require('../controllers/communicationController');
const { protect } = require('../middleware/auth');

// Public route for generating WhatsApp chat links
router.get('/whatsapp-link', getWhatsAppLink);

// Protected routes
router.use(protect);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);
router.post('/test-dispatch', testDispatch);

module.exports = router;
