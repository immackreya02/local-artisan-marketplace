const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must reference a customer']
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must reference a product']
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Review must reference a shop']
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    customerName: {
      type: String,
      default: ''
    },
    customerLocation: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      required: [true, 'Review text/comment is required'],
      trim: true
    },
    verifiedPurchase: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate reviews from the same customer for the same product and order
reviewSchema.index({ customer: 1, product: 1, order: 1 }, { unique: true, sparse: true });
// Index for fast query of reviews by product or shop
reviewSchema.index({ product: 1 });
reviewSchema.index({ shop: 1 });

module.exports = mongoose.model('Review', reviewSchema);
