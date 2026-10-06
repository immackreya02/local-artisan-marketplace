const express = require('express');
const router = express.Router();
const { register, login, getMe, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public Auth Routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Private/Protected Auth Routes
router.get('/me', protect, getMe);

module.exports = router;

