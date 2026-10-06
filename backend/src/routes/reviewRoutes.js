const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getShopReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Public Review Listing Routes
router.get('/product/:productId', getProductReviews);
router.get('/shop/:shopId', getShopReviews);

// Protected Customer Review Creation & Edit Routes
router.post('/', protect, authorize('customer'), createReview);
router.put('/:id', protect, authorize('customer'), updateReview);

// Protected Delete Route (Customer Owner or Admin)
router.delete('/:id', protect, deleteReview);

module.exports = router;
