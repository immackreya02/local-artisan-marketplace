const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  getShops,
  getShopById,
  getMyShop,
  createShop,
  updateShop,
  updateShopStatus
} = require('../controllers/shopController');
const { protect, authorize } = require('../middleware/auth');

// Optional auth helper middleware for public endpoints that enhance response if user is logged in
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) {
      // Token invalid or expired - ignore for public optional auth
    }
  }
  next();
};

// Protected Artisan Route to fetch own shop (MUST be declared before parametric /:id route)
router.get('/my-shop', protect, authorize('artisan'), getMyShop);

// Public Routes (with optional auth to detect owner/admin)
router.get('/', optionalAuth, getShops);
router.get('/:id', optionalAuth, getShopById);

// Protected Artisan Routes
router.post('/', protect, authorize('artisan'), createShop);

// Protected Artisan Owner or Admin Routes
router.put('/:id', protect, authorize('artisan', 'admin'), updateShop);

// Protected Admin Routes
router.patch('/:id/status', protect, authorize('admin'), updateShopStatus);

module.exports = router;
