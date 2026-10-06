const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// Optional auth middleware for public product endpoints to identify admin or owner
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (err) {
      // Ignore token errors on public endpoints
    }
  }
  next();
};

// Public Product Routes
router.get('/', optionalAuth, getProducts);

// Private Artisan Products Route (Must be mounted before /:id)
router.get('/my', protect, authorize('artisan'), getMyProducts);

// Public Product Detail Route
router.get('/:id', optionalAuth, getProductById);

// Protected Artisan/Admin Product Management Routes
router.post('/', protect, authorize('artisan', 'admin'), createProduct);
router.put('/:id', protect, authorize('artisan', 'admin'), updateProduct);
router.patch('/:id/status', protect, authorize('artisan', 'admin'), updateProductStatus);
router.delete('/:id', protect, authorize('artisan', 'admin'), deleteProduct);

module.exports = router;
