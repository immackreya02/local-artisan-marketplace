const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Address = require('../models/Address');
const Payment = require('../models/Payment');
const { dispatchMultiChannelNotification } = require('../services/communicationHub');

let orderCounter = 1000;
const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  orderCounter += 1;
  return `LAM-${year}-${orderCounter}${randomSuffix}`;
};

/**
 * @desc    Checkout customer cart and create order(s)
 * @route   POST /api/orders
 * @access  Private/Customer
 */
const createOrder = async (req, res) => {
  try {
    const { addressId, shippingAddress, paymentMethod } = req.body;

    // 1. Resolve Shipping Address Snapshot
    let addressSnapshot = null;

    if (addressId) {
      const addressDoc = await Address.findById(addressId);
      if (!addressDoc || addressDoc.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or unauthorized shipping address'
        });
      }
      addressSnapshot = {
        name: addressDoc.name,
        phone: addressDoc.phone,
        streetAddress: addressDoc.streetAddress,
        city: addressDoc.city,
        state: addressDoc.state,
        postalCode: addressDoc.postalCode,
        country: addressDoc.country || 'India'
      };
    } else if (shippingAddress && typeof shippingAddress === 'object') {
      const { name, phone, streetAddress, city, state, postalCode, country } = shippingAddress;
      if (!name || !phone || !streetAddress || !city || !state || !postalCode) {
        return res.status(400).json({
          success: false,
          message: 'Please provide complete shipping address details (name, phone, streetAddress, city, state, postalCode)'
        });
      }
      addressSnapshot = {
        name,
        phone,
        streetAddress,
        city,
        state,
        postalCode,
        country: country || 'India'
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required for checkout'
      });
    }

    // 2. Load Customer Cart from MongoDB
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot checkout: Your cart is empty'
      });
    }

    // 3. Re-fetch all products & shops from MongoDB for strict validation
    const itemsToProcess = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Checkout failed: Product with ID '${item.product}' no longer exists`
        });
      }

      if (product.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Checkout failed: Product '${product.name}' is no longer active for purchase`
        });
      }

      const shop = await Shop.findById(product.shop);
      if (!shop || shop.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Checkout failed: Shop for product '${product.name}' is currently not active`
        });
      }

      const stockCappedTypes = ['Ready-to-Ship', 'Limited Edition'];
      if (stockCappedTypes.includes(product.availability)) {
        if (item.quantity > product.stock) {
          return res.status(400).json({
            success: false,
            message: `Checkout failed: Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${item.quantity}`
          });
        }
      }

      itemsToProcess.push({
        cartItem: item,
        product,
        shop
      });
    }

    // 4. Group items by Shop ID for Multi-Shop Order Splitting
    const shopGroups = {};
    for (const entry of itemsToProcess) {
      const shopIdStr = entry.shop._id.toString();
      if (!shopGroups[shopIdStr]) {
        shopGroups[shopIdStr] = {
          shop: entry.shop,
          items: []
        };
      }
      shopGroups[shopIdStr].items.push(entry);
    }

    // 5. Create Order per Shop & Deduct Stock
    const createdOrders = [];
    const validPaymentMethods = ['COD', 'Online', 'UPI', 'Card'];
    const chosenPaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'COD';

    for (const shopIdStr of Object.keys(shopGroups)) {
      const group = shopGroups[shopIdStr];

      let shopSubtotal = 0;
      const orderItemSnapshots = [];

      for (const entry of group.items) {
        const prod = entry.product;
        const qty = entry.cartItem.quantity;
        const livePrice = prod.price; // Always use live DB price

        const itemSubtotal = livePrice * qty;
        shopSubtotal += itemSubtotal;

        orderItemSnapshots.push({
          product: prod._id,
          name: prod.name,
          quantity: qty,
          price: livePrice,
          image: prod.images && prod.images.length > 0 ? prod.images[0] : ''
        });

        // Deduct Stock for stock-capped items
        const stockCappedTypes = ['Ready-to-Ship', 'Limited Edition'];
        if (stockCappedTypes.includes(prod.availability)) {
          prod.stock = Math.max(0, prod.stock - qty);
          await prod.save();
        }
      }

      // Calculate Tax (18% GST) and Total
      const shopTax = Math.round(shopSubtotal * 0.18);
      const shippingFee = 0;
      const totalAmount = shopSubtotal + shopTax + shippingFee;

      const orderNumber = generateOrderNumber();

      const newOrder = await Order.create({
        orderNumber,
        customer: req.user._id,
        customerName: req.user.name,
        shop: group.shop._id,
        items: orderItemSnapshots,
        subtotal: shopSubtotal,
        tax: shopTax,
        shippingFee,
        totalAmount,
        shippingAddress: addressSnapshot,
        paymentMethod: chosenPaymentMethod,
        paymentStatus: 'Pending',
        orderStatus: 'Pending'
      });

      // Log payment record
      await Payment.create({
        order: newOrder._id,
        customer: req.user._id,
        amount: totalAmount,
        paymentMethod: chosenPaymentMethod,
        status: 'Pending',
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      });

      createdOrders.push(newOrder);

      // 1. Dispatch multi-channel notification to Customer
      dispatchMultiChannelNotification({
        recipientUser: req.user,
        title: 'Order Confirmed! 🎉',
        message: `Your order #${newOrder.orderNumber || newOrder._id} has been placed successfully for ₹${newOrder.totalAmount.toLocaleString()}.`,
        type: 'Order',
        relatedId: newOrder._id,
        orderData: newOrder
      }).catch(err => console.error('[Customer Order Notification Error]:', err));

      // 2. Dispatch notification to Artisan Shop Owner
      const artisanId = group?.shop?.owner || group?.shop?.artisan;
      if (artisanId) {
        User.findById(artisanId).then(artisanUser => {
          if (artisanUser) {
            dispatchMultiChannelNotification({
              recipientUser: artisanUser,
              title: 'New Order Received! 🛍️',
              message: `You received new order #${newOrder.orderNumber || newOrder._id} for ₹${newOrder.totalAmount.toLocaleString()} from ${req.user.name || 'Customer'}.`,
              type: 'Order',
              relatedId: newOrder._id,
              orderData: newOrder
            }).catch(err => console.error('[Artisan Order Notification Error]:', err));
          }
        }).catch(err => console.error('[Artisan Lookup Error]:', err));
      }

      // 3. Dispatch notification to Admins for platform monitoring
      User.find({ role: { $in: ['admin', 'Admin'] } }).then(admins => {
        admins.forEach(adminUser => {
          dispatchMultiChannelNotification({
            recipientUser: adminUser,
            title: 'Platform Order Placed 📦',
            message: `New order #${newOrder.orderNumber || newOrder._id} (₹${newOrder.totalAmount.toLocaleString()}) placed by ${req.user.name || 'Customer'}.`,
            type: 'Order',
            relatedId: newOrder._id,
            orderData: newOrder
          }).catch(err => console.error('[Admin Order Notification Error]:', err));
        });
      }).catch(err => console.error('[Admin Lookup Error]:', err));
    }

    // 6. Clear Customer Cart after successful order placement
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      message: `Checkout successful! ${createdOrders.length} order(s) created.`,
      count: createdOrders.length,
      data: createdOrders
    });
  } catch (error) {
    console.error('createOrder Error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Server error during checkout'
    });
  }
};

/**
 * @desc    Get customer's orders
 * @route   GET /api/orders
 * @access  Private/Customer
 */
const getCustomerOrders = async (req, res) => {
  try {
    const { status, sort } = req.query;
    const filter = { customer: req.user._id };

    if (status) filter.orderStatus = status;

    let sortOption = { orderDate: -1 };
    if (sort === 'oldest') sortOption = { orderDate: 1 };

    const orders = await Order.find(filter)
      .populate('shop', 'name location')
      .sort(sortOption);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('getCustomerOrders Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving customer orders'
    });
  }
};

/**
 * @desc    Get artisan's shop orders
 * @route   GET /api/orders/artisan
 * @access  Private/Artisan
 */
const getArtisanOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'No shop registered for this artisan account'
      });
    }

    const { status } = req.query;
    const filter = { shop: shop._id };
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .sort({ orderDate: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      shop: { id: shop._id, name: shop.name },
      data: orders
    });
  } catch (error) {
    console.error('getArtisanOrders Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving artisan orders'
    });
  }
};

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/orders/all
 * @access  Private/Admin
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, shopId } = req.query;
    const filter = {};

    if (status) filter.orderStatus = status;
    if (shopId) filter.shop = shopId;

    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .populate('shop', 'name')
      .sort({ orderDate: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('getAllOrders Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving all orders'
    });
  }
};

/**
 * @desc    Get single order details by ID
 * @route   GET /api/orders/:id
 * @access  Private (Customer Owner / Artisan Owner / Admin)
 */
const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('shop', 'name location phone email')
      .populate('customer', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Authorization checks
    if (req.user.role === 'customer') {
      if (order.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view your own orders'
        });
      }
    } else if (req.user.role === 'artisan') {
      const artisanShop = await Shop.findOne({ owner: req.user._id });
      if (!artisanShop || order.shop._id.toString() !== artisanShop._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view orders for your own shop'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('getOrderById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving order details'
    });
  }
};

/**
 * @desc    Cancel order (Customer / Artisan / Admin)
 * @route   PATCH /api/orders/:id/cancel
 * @access  Private (Customer Owner / Artisan Owner / Admin)
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Ownership Authorization Check
    if (req.user.role === 'customer') {
      if (order.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only cancel your own orders'
        });
      }
    } else if (req.user.role === 'artisan') {
      const artisanShop = await Shop.findOne({ owner: req.user._id });
      if (!artisanShop || order.shop.toString() !== artisanShop._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only cancel orders for your own shop'
        });
      }
    }

    // State restriction check: Shipped, Delivered, or Cancelled orders cannot be cancelled
    const nonCancellableStates = ['Shipped', 'Delivered', 'Cancelled'];
    if (nonCancellableStates.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order: Orders in '${order.orderStatus}' status cannot be cancelled`
      });
    }

    // Restore inventory stock for stock-capped items
    for (const item of order.items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          const stockCappedTypes = ['Ready-to-Ship', 'Limited Edition'];
          if (stockCappedTypes.includes(product.availability)) {
            product.stock += item.quantity;
            await product.save();
          }
        }
      }
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock restored',
      data: order
    });
  } catch (error) {
    console.error('cancelOrder Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error cancelling order'
    });
  }
};

/**
 * @desc    Update order status (Artisan Owner / Admin)
 * @route   PATCH /api/orders/:id/status
 * @access  Private (Artisan Owner / Admin)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (orderStatus && !validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed values: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Ownership check for Artisan
    if (req.user.role === 'artisan') {
      const artisanShop = await Shop.findOne({ owner: req.user._id });
      if (!artisanShop || order.shop.toString() !== artisanShop._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only manage order status for your own shop'
        });
      }
    }

    // Transition Rule Checks
    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled orders cannot be moved back into active processing'
      });
    }

    if (order.orderStatus === 'Delivered' && orderStatus !== 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'Delivered orders are completed and cannot revert status'
      });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
      if (validPaymentStatuses.includes(paymentStatus)) {
        order.paymentStatus = paymentStatus;
      }
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${order.orderStatus}'`,
      data: order
    });
  } catch (error) {
    console.error('updateOrderStatus Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating order status'
    });
  }
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getArtisanOrders,
  getAllOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus
};
