const express = require('express');
const router = express.Router();
const {
  createOrder,
  getCustomerOrders,
  getArtisanOrders,
  getAllOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// All Order routes require authentication
router.use(protect);

// Customer Checkout & List Routes
router.post('/', authorize('customer'), createOrder);
router.get('/', authorize('customer'), getCustomerOrders);

// Artisan & Admin List Routes (Must be declared before /:id)
router.get('/artisan', authorize('artisan'), getArtisanOrders);
router.get('/all', authorize('admin'), getAllOrders);

// Order Detail & Cancellation Routes
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

// Management Status Update Route
router.patch('/:id/status', authorize('artisan', 'admin'), updateOrderStatus);

module.exports = router;
