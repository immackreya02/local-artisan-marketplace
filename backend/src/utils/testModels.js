/**
 * Verification script for Step 2: Mongoose Models Load Test
 * Imports all 12 Mongoose models to verify schemas load cleanly without errors.
 */

try {
  const User = require('../models/User');
  const Shop = require('../models/Shop');
  const Category = require('../models/Category');
  const Product = require('../models/Product');
  const Address = require('../models/Address');
  const Cart = require('../models/Cart');
  const Wishlist = require('../models/Wishlist');
  const Order = require('../models/Order');
  const Review = require('../models/Review');
  const CustomRequest = require('../models/CustomRequest');
  const Payment = require('../models/Payment');
  const Notification = require('../models/Notification');

  console.log('✅ ALL 12 MONGOOSE MODELS LOADED SUCCESSFULLY!');
  console.log('Registered Models:');
  console.log(` - User: ${User.modelName}`);
  console.log(` - Shop: ${Shop.modelName}`);
  console.log(` - Category: ${Category.modelName}`);
  console.log(` - Product: ${Product.modelName}`);
  console.log(` - Address: ${Address.modelName}`);
  console.log(` - Cart: ${Cart.modelName}`);
  console.log(` - Wishlist: ${Wishlist.modelName}`);
  console.log(` - Order: ${Order.modelName}`);
  console.log(` - Review: ${Review.modelName}`);
  console.log(` - CustomRequest: ${CustomRequest.modelName}`);
  console.log(` - Payment: ${Payment.modelName}`);
  console.log(` - Notification: ${Notification.modelName}`);
} catch (err) {
  console.error('❌ ERROR LOADING MONGOOSE MODELS:', err);
  process.exit(1);
}
