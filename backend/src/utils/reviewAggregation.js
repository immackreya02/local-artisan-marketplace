const Review = require('../models/Review');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

/**
 * Recalculate average rating and reviewCount for a Product
 * @param {string|ObjectId} productId
 */
const recalculateProductRating = async (productId) => {
  try {
    const reviews = await Review.find({ product: productId });
    const reviewCount = reviews.length;

    let rating = 0;
    if (reviewCount > 0) {
      const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
      rating = Math.round((sum / reviewCount) * 10) / 10; // Rounded to 1 decimal place (e.g. 4.7)
    }

    await Product.findByIdAndUpdate(productId, {
      rating,
      reviewCount
    });

    return { rating, reviewCount };
  } catch (error) {
    console.error('recalculateProductRating Error:', error);
    throw error;
  }
};

/**
 * Recalculate average rating and reviewCount for a Shop
 * @param {string|ObjectId} shopId
 */
const recalculateShopRating = async (shopId) => {
  try {
    const reviews = await Review.find({ shop: shopId });
    const reviewCount = reviews.length;

    let rating = 0;
    if (reviewCount > 0) {
      const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
      rating = Math.round((sum / reviewCount) * 10) / 10; // Rounded to 1 decimal place
    }

    await Shop.findByIdAndUpdate(shopId, {
      rating,
      reviewCount
    });

    return { rating, reviewCount };
  } catch (error) {
    console.error('recalculateShopRating Error:', error);
    throw error;
  }
};

module.exports = {
  recalculateProductRating,
  recalculateShopRating
};
