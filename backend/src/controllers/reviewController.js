const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Order = require('../models/Order');
const { recalculateProductRating, recalculateShopRating } = require('../utils/reviewAggregation');

/**
 * @desc    Create product review for a delivered order
 * @route   POST /api/reviews
 * @access  Private/Customer
 */
const createReview = async (req, res) => {
  try {
    const { product, order, rating, comment } = req.body;

    // 1. Rating validation (Must be integer 1 to 5)
    const numRating = Number(rating);
    if (isNaN(numRating) || !Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // 2. Comment validation
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Review comment is required and cannot be empty'
      });
    }

    // 3. Order validation
    if (!order || !mongoose.Types.ObjectId.isValid(order)) {
      return res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      });
    }

    const orderDoc = await Order.findById(order);
    if (!orderDoc) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Order ownership check
    if (orderDoc.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only submit reviews for your own orders'
      });
    }

    // Order status check (Must be Delivered)
    if (orderDoc.orderStatus !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: `Reviews can only be submitted for Delivered orders. Current order status: '${orderDoc.orderStatus}'`
      });
    }

    // 4. Product validation
    if (!product || !mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required'
      });
    }

    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify product was actually purchased in this order's item snapshot
    const itemInOrder = orderDoc.items.some(
      (item) => item.product && item.product.toString() === productDoc._id.toString()
    );

    if (!itemInOrder) {
      return res.status(400).json({
        success: false,
        message: 'Product was not purchased in this delivered order'
      });
    }

    // 5. Prevent Duplicate Reviews (customer + product + order)
    const duplicateReview = await Review.findOne({
      customer: req.user._id,
      product: productDoc._id,
      order: orderDoc._id
    });

    if (duplicateReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a review for this product on this order'
      });
    }

    // 6. Create Review (verifiedPurchase set to true automatically by backend)
    const review = await Review.create({
      customer: req.user._id,
      customerName: req.user.name,
      customerLocation: req.user.location || '',
      product: productDoc._id,
      shop: productDoc.shop,
      order: orderDoc._id,
      rating: numRating,
      comment: comment.trim(),
      verifiedPurchase: true
    });

    // 7. Recalculate Ratings & Review Counts for Product and Shop
    await recalculateProductRating(productDoc._id);
    await recalculateShopRating(productDoc.shop);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('createReview Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating review'
    });
  }
};

/**
 * @desc    Get reviews for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate('customer', 'name location')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('getProductReviews Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving product reviews'
    });
  }
};

/**
 * @desc    Get reviews for a shop
 * @route   GET /api/reviews/shop/:shopId
 * @access  Public
 */
const getShopReviews = async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shop ID'
      });
    }

    const reviews = await Review.find({ shop: shopId })
      .populate('customer', 'name location')
      .populate('product', 'name images')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('getShopReviews Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving shop reviews'
    });
  }
};

/**
 * @desc    Update a review (Customer owner only)
 * @route   PUT /api/reviews/:id
 * @access  Private/Customer
 */
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Ownership check
    if (review.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit your own reviews'
      });
    }

    const { rating, comment } = req.body;

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || !Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5'
        });
      }
      review.rating = numRating;
    }

    if (comment !== undefined) {
      if (typeof comment !== 'string' || comment.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Review comment cannot be empty'
        });
      }
      review.comment = comment.trim();
    }

    await review.save();

    // Recalculate ratings for product and shop
    await recalculateProductRating(review.product);
    await recalculateShopRating(review.shop);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('updateReview Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating review'
    });
  }
};

/**
 * @desc    Delete a review (Customer owner or Admin)
 * @route   DELETE /api/reviews/:id
 * @access  Private (Customer Owner / Admin)
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const isOwner = review.customer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to delete this review'
      });
    }

    const productId = review.product;
    const shopId = review.shop;

    await Review.findByIdAndDelete(id);

    // Recalculate ratings for product and shop
    await recalculateProductRating(productId);
    await recalculateShopRating(shopId);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('deleteReview Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting review'
    });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getShopReviews,
  updateReview,
  deleteReview
};
