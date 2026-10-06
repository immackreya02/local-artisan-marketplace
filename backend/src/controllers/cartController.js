const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

// Helper to check stock availability rules
const validateStockLimit = (product, requestedQty) => {
  const stockCappedTypes = ['Ready-to-Ship', 'Limited Edition'];
  if (stockCappedTypes.includes(product.availability)) {
    if (requestedQty > product.stock) {
      throw new Error(`Requested quantity (${requestedQty}) exceeds available stock (${product.stock})`);
    }
  }
};

/**
 * @desc    Get current customer's cart
 * @route   GET /api/cart
 * @access  Private/Customer
 */
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price images stock status availability category categorySlug'
      })
      .populate({
        path: 'items.shop',
        select: 'name status location'
      });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Process items & calculate subtotal dynamically from current database prices
    let subtotal = 0;
    let validCount = 0;

    const formattedItems = cart.items.map((item) => {
      const product = item.product;
      const shop = item.shop;

      const isProductActive = product && product.status === 'Active';
      const isShopActive = shop && shop.status === 'Active';
      const isPurchasable = isProductActive && isShopActive;

      // Price used is always the live DB price
      const currentPrice = product ? product.price : item.price;
      const itemSubtotal = currentPrice * item.quantity;

      if (isPurchasable) {
        subtotal += itemSubtotal;
        validCount += item.quantity;
      }

      return {
        _id: item._id,
        productId: product ? product._id : null,
        productName: product ? product.name : 'Unavailable Product',
        images: product ? product.images : [],
        shopId: shop ? shop._id : null,
        shopName: shop ? shop.name : 'Unknown Shop',
        quantity: item.quantity,
        unitPrice: currentPrice,
        itemSubtotal,
        stock: product ? product.stock : 0,
        availability: product ? product.availability : 'Unknown',
        isPurchasable,
        statusNote: !isPurchasable
          ? (!isProductActive ? 'Product is no longer active' : 'Shop is currently inactive')
          : 'Available'
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        cartId: cart._id,
        items: formattedItems,
        subtotal,
        validCount,
        itemCount: formattedItems.length
      }
    });
  } catch (error) {
    console.error('getCart Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving cart'
    });
  }
};

/**
 * @desc    Add item to cart (or increment quantity if already present)
 * @route   POST /api/cart/items
 * @access  Private/Customer
 */
const addCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // 1. Input validation
    const numQty = Number(quantity);
    if (!productId || isNaN(numQty) || !Number.isInteger(numQty) || numQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid product ID and integer quantity of at least 1'
      });
    }

    // 2. Validate product existence in MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // 3. Validate product status
    if (product.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Cannot add product to cart: Product is currently '${product.status}'`
      });
    }

    // 4. Validate shop status
    const shop = await Shop.findById(product.shop);
    if (!shop || shop.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add product to cart: The shop is not active'
      });
    }

    // 5. Find or create user's cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // 6. Check if product is already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    let newQuantity = numQty;
    if (existingItemIndex > -1) {
      newQuantity += cart.items[existingItemIndex].quantity;
    }

    // 7. Validate stock limits against total new quantity
    validateStockLimit(product, newQuantity);

    // 8. Update cart items using live DB price
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price; // Update to live price
    } else {
      cart.items.push({
        product: product._id,
        shop: product.shop,
        quantity: numQty,
        price: product.price
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Server error adding item to cart'
    });
  }
};

/**
 * @desc    Update quantity of an existing cart item
 * @route   PUT /api/cart/items/:productId
 * @access  Private/Customer
 */
const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const numQty = Number(quantity);
    if (isNaN(numQty) || !Number.isInteger(numQty) || numQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer of at least 1'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in your cart'
      });
    }

    // Validate product stock for new quantity
    const product = await Product.findById(productId);
    if (product) {
      validateStockLimit(product, numQty);
      cart.items[itemIndex].price = product.price; // Refresh price
    }

    cart.items[itemIndex].quantity = numQty;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Cart item quantity updated successfully',
      data: cart
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Server error updating cart item quantity'
    });
  }
};

/**
 * @desc    Remove single item from cart
 * @route   DELETE /api/cart/items/:productId
 * @access  Private/Customer
 */
const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('removeCartItem Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error removing item from cart'
    });
  }
};

/**
 * @desc    Clear all items in cart
 * @route   DELETE /api/cart
 * @access  Private/Customer
 */
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('clearCart Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error clearing cart'
    });
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
};
