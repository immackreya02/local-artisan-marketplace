const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

/**
 * @desc    Get customer's saved wishlist
 * @route   GET /api/wishlist
 * @access  Private/Customer
 */
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products',
      select: 'name price images status availability shop rating reviewCount',
      populate: { path: 'shop', select: 'name status' }
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    return res.status(200).json({
      success: true,
      count: wishlist.products.length,
      data: wishlist
    });
  } catch (error) {
    console.error('getWishlist Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving wishlist'
    });
  }
};

/**
 * @desc    Add product to wishlist (Prevents duplicates)
 * @route   POST /api/wishlist/:productId
 * @access  Private/Customer
 */
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate product existence in MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // 2. Find or create user wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // 3. Check for duplicates
    const alreadyExists = wishlist.products.some(
      (pId) => pId.toString() === productId
    );

    if (alreadyExists) {
      return res.status(200).json({
        success: true,
        message: 'Product is already in your wishlist',
        data: wishlist
      });
    }

    wishlist.products.push(product._id);
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlist
    });
  } catch (error) {
    console.error('addToWishlist Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error adding to wishlist'
    });
  }
};

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/wishlist/:productId
 * @access  Private/Customer
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    wishlist.products = wishlist.products.filter(
      (pId) => pId.toString() !== productId
    );

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: wishlist
    });
  } catch (error) {
    console.error('removeFromWishlist Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error removing from wishlist'
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
