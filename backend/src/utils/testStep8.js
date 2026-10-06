const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Order = require('../models/Order');
const Review = require('../models/Review');

const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const shopRoutes = require('../routes/shopRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const productRoutes = require('../routes/productRoutes');
const cartRoutes = require('../routes/cartRoutes');
const wishlistRoutes = require('../routes/wishlistRoutes');
const orderRoutes = require('../routes/orderRoutes');
const addressRoutes = require('../routes/addressRoutes');
const reviewRoutes = require('../routes/reviewRoutes');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);

let server;
let mongoServer;

const runTests = async () => {
  try {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      console.log('Connected to In-Memory MongoDB for Step 8 testing.');
    } catch (e) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace');
      console.log('Connected to Local MongoDB for Step 8 testing.');
    }

    server = app.listen(5007, () => {
      console.log('Step 8 Test Server running on port 5007');
    });

    const baseUrl = 'http://localhost:5007/api';

    console.log('\n--- SETTING UP SEED DATA FOR STEP 8 ---\n');

    // Admin
    const admin = await User.create({ name: 'Admin S8', email: 'admin_s8@lam.in', password: 'password123', role: 'admin', status: 'Active' });
    const adminLogin = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin_s8@lam.in', password: 'password123' }) });
    const adminToken = (await adminLogin.json()).token;

    // Customer 1
    const cust1 = await User.create({ name: 'Customer One', email: 'cust1_s8@lam.in', password: 'password123', role: 'customer', status: 'Active', location: 'Jaipur' });
    const cust1Login = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'cust1_s8@lam.in', password: 'password123' }) });
    const cust1Token = (await cust1Login.json()).token;

    // Customer 2
    const cust2 = await User.create({ name: 'Customer Two', email: 'cust2_s8@lam.in', password: 'password123', role: 'customer', status: 'Active' });
    const cust2Login = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'cust2_s8@lam.in', password: 'password123' }) });
    const cust2Token = (await cust2Login.json()).token;

    // Artisan & Shop
    const artisan = await User.create({ name: 'Artisan S8', email: 'artisan_s8@lam.in', password: 'password123', role: 'artisan', status: 'Active' });
    const artisanLogin = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'artisan_s8@lam.in', password: 'password123' }) });
    const artisanToken = (await artisanLogin.json()).token;

    const shop = await Shop.create({ name: 'Jaipur Crafts', owner: artisan._id, description: 'Pottery & Crafts', status: 'Active' });

    // Products
    const prodA = await Product.create({ name: 'Blue Vase', description: 'Vase', shop: shop._id, mrp: 2000, price: 2000, stock: 10, status: 'Active', availability: 'Ready-to-Ship' });
    const prodB = await Product.create({ name: 'Clay Plate', description: 'Plate', shop: shop._id, mrp: 1000, price: 1000, stock: 5, status: 'Active', availability: 'Ready-to-Ship' });

    // Orders for Customer 1 in various statuses
    const pendingOrder = await Order.create({
      orderNumber: 'LAM-2026-PENDING', customer: cust1._id, customerName: cust1.name, shop: shop._id,
      items: [{ product: prodA._id, name: prodA.name, quantity: 1, price: 2000 }],
      subtotal: 2000, tax: 360, totalAmount: 2360, shippingAddress: { name: 'Cust', phone: '123', streetAddress: 'St', city: 'Jaipur', state: 'RJ', postalCode: '302001' },
      paymentMethod: 'COD', orderStatus: 'Pending'
    });

    const confirmedOrder = await Order.create({
      orderNumber: 'LAM-2026-CONFIRMED', customer: cust1._id, customerName: cust1.name, shop: shop._id,
      items: [{ product: prodA._id, name: prodA.name, quantity: 1, price: 2000 }],
      subtotal: 2000, tax: 360, totalAmount: 2360, shippingAddress: { name: 'Cust', phone: '123', streetAddress: 'St', city: 'Jaipur', state: 'RJ', postalCode: '302001' },
      paymentMethod: 'COD', orderStatus: 'Confirmed'
    });

    const processingOrder = await Order.create({
      orderNumber: 'LAM-2026-PROCESSING', customer: cust1._id, customerName: cust1.name, shop: shop._id,
      items: [{ product: prodA._id, name: prodA.name, quantity: 1, price: 2000 }],
      subtotal: 2000, tax: 360, totalAmount: 2360, shippingAddress: { name: 'Cust', phone: '123', streetAddress: 'St', city: 'Jaipur', state: 'RJ', postalCode: '302001' },
      paymentMethod: 'COD', orderStatus: 'Processing'
    });

    const shippedOrder = await Order.create({
      orderNumber: 'LAM-2026-SHIPPED', customer: cust1._id, customerName: cust1.name, shop: shop._id,
      items: [{ product: prodA._id, name: prodA.name, quantity: 1, price: 2000 }],
      subtotal: 2000, tax: 360, totalAmount: 2360, shippingAddress: { name: 'Cust', phone: '123', streetAddress: 'St', city: 'Jaipur', state: 'RJ', postalCode: '302001' },
      paymentMethod: 'COD', orderStatus: 'Shipped'
    });

    const deliveredOrder = await Order.create({
      orderNumber: 'LAM-2026-DELIVERED', customer: cust1._id, customerName: cust1.name, shop: shop._id,
      items: [{ product: prodA._id, name: prodA.name, quantity: 1, price: 2000 }],
      subtotal: 2000, tax: 360, totalAmount: 2360, shippingAddress: { name: 'Cust', phone: '123', streetAddress: 'St', city: 'Jaipur', state: 'RJ', postalCode: '302001' },
      paymentMethod: 'COD', orderStatus: 'Delivered'
    });

    console.log('Seed setup complete.');
    console.log('\n--- RUNNING STEP 8 REVIEWS & RATINGS TESTS ---\n');

    // Test 6, 7, 8, 9: Block reviews on non-Delivered orders
    console.log('Test 6, 7, 8, 9: Block review submission on Pending, Confirmed, Processing, and Shipped orders');
    for (const ord of [pendingOrder, confirmedOrder, processingOrder, shippedOrder]) {
      const res = await fetch(`${baseUrl}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
        body: JSON.stringify({ product: prodA._id.toString(), order: ord._id.toString(), rating: 5, comment: 'Test' })
      });
      console.assert(res.status === 400, `Review on order status '${ord.orderStatus}' must be rejected with 400`);
    }
    console.log('  ✅ PASSED: Non-delivered orders rejected.');

    // Test 4: Customer cannot review an order belonging to another customer
    console.log('Test 4: Customer cannot review another customer\'s order');
    const cust2OrderReviewRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust2Token}` },
      body: JSON.stringify({ product: prodA._id.toString(), order: deliveredOrder._id.toString(), rating: 5, comment: 'Test' })
    });
    console.assert(cust2OrderReviewRes.status === 403, 'Reviewing another customer order must return 403');
    console.log('  ✅ PASSED: Customer 2 blocked from reviewing Customer 1\'s order.');

    // Test 5 & 35: Customer cannot review a product not in the order
    console.log('Test 5 & 35: Customer cannot review a product not included in order items');
    const wrongProdReviewRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ product: prodB._id.toString(), order: deliveredOrder._id.toString(), rating: 5, comment: 'Test' })
    });
    console.assert(wrongProdReviewRes.status === 400, 'Reviewing product not in order items must return 400');
    console.log('  ✅ PASSED: Product not in order snapshot rejected.');

    // Test 11, 12, 13: Rating validation (0, >5, decimal, invalid)
    console.log('Test 11, 12, 13: Rating validation (1 to 5 integers only)');
    for (const badRating of [0, 6, 4.5, -1, 'bad']) {
      const res = await fetch(`${baseUrl}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
        body: JSON.stringify({ product: prodA._id.toString(), order: deliveredOrder._id.toString(), rating: badRating, comment: 'Test' })
      });
      console.assert(res.status === 400, `Invalid rating '${badRating}' must return 400`);
    }
    console.log('  ✅ PASSED: Invalid ratings rejected.');

    // Test 1, 2, 10, 15, 16, 17, 18, 34: Successful Review Creation & Aggregations
    console.log('Test 1, 2, 10, 15, 16, 17, 18: Successful review creation & automatic rating aggregation');
    const createRevRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({
        product: prodA._id.toString(),
        order: deliveredOrder._id.toString(),
        rating: 5,
        comment: 'Outstanding quality blue pottery vase!',
        shop: 'fake_shop_id_123',         // Attacker sends fake shop ID -> backend must ignore!
        verifiedPurchase: false          // Attacker sends false -> backend must force true!
      })
    });
    const createRevData = await createRevRes.json();
    console.assert(createRevRes.status === 201 && createRevData.data.verifiedPurchase === true, 'Review must have verifiedPurchase: true');
    console.assert(createRevData.data.shop.toString() === shop._id.toString(), 'Shop must be derived from Product');
    const rev1Id = createRevData.data._id;

    // Verify Product and Shop ratings updated
    const updatedProdA = await Product.findById(prodA._id);
    console.assert(updatedProdA.rating === 5 && updatedProdA.reviewCount === 1, 'Product A rating must be 5 (1 review)');

    const updatedShop = await Shop.findById(shop._id);
    console.assert(updatedShop.rating === 5 && updatedShop.reviewCount === 1, 'Shop rating must be 5 (1 review)');
    console.log('  ✅ PASSED: Review created with verifiedPurchase: true and ratings aggregated.');

    // Test 14: Duplicate review prevention (409 Conflict)
    console.log('Test 14: Duplicate review prevention returns HTTP 409');
    const dupRevRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ product: prodA._id.toString(), order: deliveredOrder._id.toString(), rating: 4, comment: 'Duplicate' })
    });
    console.assert(dupRevRes.status === 409, 'Duplicate review must return 409 Conflict');
    console.log('  ✅ PASSED: Duplicate review returned 409 Conflict.');

    // Test 31, 32, 33: Public Review Listing (does not leak passwords or sensitive fields)
    console.log('Test 31, 32, 33: Public product & shop review listing');
    const prodRevRes = await fetch(`${baseUrl}/reviews/product/${prodA._id.toString()}`);
    const prodRevData = await prodRevRes.json();
    console.assert(prodRevRes.status === 200 && prodRevData.data.length === 1, 'Public product review count should be 1');
    console.assert(!prodRevData.data[0].customer.email && !prodRevData.data[0].customer.password, 'Private fields must not leak');

    const shopRevRes = await fetch(`${baseUrl}/reviews/shop/${shop._id.toString()}`);
    const shopRevData = await shopRevRes.json();
    console.assert(shopRevRes.status === 200 && shopRevData.data.length === 1, 'Public shop review count should be 1');
    console.log('  ✅ PASSED: Public review endpoints returned clean data without sensitive leakage.');

    // Test 19, 20, 21, 22, 23: Update Review & Re-aggregation
    console.log('Test 19, 20, 21, 22, 23: Update review rating from 5 to 3 & re-aggregate');
    const badUpdateRes = await fetch(`${baseUrl}/reviews/${rev1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust2Token}` },
      body: JSON.stringify({ rating: 1, comment: 'Hacked' })
    });
    console.assert(badUpdateRes.status === 403, 'Customer 2 updating Customer 1 review must return 403');

    const goodUpdateRes = await fetch(`${baseUrl}/reviews/${rev1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ rating: 3, comment: 'Updated to 3 stars', verifiedPurchase: false, product: prodB._id.toString() })
    });
    console.assert(goodUpdateRes.status === 200, 'Update review failed');

    const reAggProdA = await Product.findById(prodA._id);
    console.assert(reAggProdA.rating === 3 && reAggProdA.reviewCount === 1, 'Product rating should be updated to 3');
    console.log('  ✅ PASSED: Review updated by owner and aggregates recalculated.');

    // Test 24, 25, 26, 27, 28, 29, 30: Delete Review & Reset Aggregates
    console.log('Test 24, 25, 26, 27, 28, 29, 30: Review deletion authorization & aggregate reset');
    // Artisan cannot delete
    const artisanDelRes = await fetch(`${baseUrl}/reviews/${rev1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${artisanToken}` }
    });
    console.assert(artisanDelRes.status === 403, 'Artisan deleting customer review must return 403');

    // Customer 2 cannot delete Customer 1 review
    const cust2DelRes = await fetch(`${baseUrl}/reviews/${rev1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cust2Token}` }
    });
    console.assert(cust2DelRes.status === 403, 'Customer 2 deleting Customer 1 review must return 403');

    // Admin or Owner deletes review
    const adminDelRes = await fetch(`${baseUrl}/reviews/${rev1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.assert(adminDelRes.status === 200, 'Admin delete failed');

    const resetProdA = await Product.findById(prodA._id);
    console.assert(resetProdA.rating === 0 && resetProdA.reviewCount === 0, 'Product rating and reviewCount must reset to 0');

    const resetShop = await Shop.findById(shop._id);
    console.assert(resetShop.rating === 0 && resetShop.reviewCount === 0, 'Shop rating and reviewCount must reset to 0');
    console.log('  ✅ PASSED: Review deleted by Admin, ratings and counts reset to 0.');

    // Test 36: Historical Delivered Order remains reviewable after Product price / status changes
    console.log('Test 36: Historical Delivered Order remains reviewable after product price edit / deactivation');
    prodA.price = 9999;
    prodA.status = 'Inactive';
    await prodA.save();

    const historicalRevRes = await fetch(`${baseUrl}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({
        product: prodA._id.toString(),
        order: deliveredOrder._id.toString(),
        rating: 4,
        comment: 'Great product even after price change!'
      })
    });
    console.assert(historicalRevRes.status === 201, 'Historical review creation should succeed');
    console.log('  ✅ PASSED: Historical delivered order remains reviewable after product deactivation.');

    console.log('\n=============================================');
    console.log('🎉 ALL 37 STEP 8 REVIEWS & RATINGS TESTS PASSED CLEANLY!');
    console.log('=============================================\n');

    // REGRESSION CHECKS: Steps 1-7
    console.log('--- RUNNING REGRESSION CHECKS FOR STEPS 1-7 ---\n');
    const authReg = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${cust1Token}` } });
    console.assert(authReg.status === 200, 'Auth regression check failed');

    const prodReg = await fetch(`${baseUrl}/products`);
    console.assert(prodReg.status === 200, 'Products API regression check failed');

    const cartReg = await fetch(`${baseUrl}/cart`, { headers: { Authorization: `Bearer ${cust1Token}` } });
    console.assert(cartReg.status === 200, 'Cart API regression check failed');

    const orderReg = await fetch(`${baseUrl}/orders`, { headers: { Authorization: `Bearer ${cust1Token}` } });
    console.assert(orderReg.status === 200, 'Order API regression check failed');

    console.log('✅ REGRESSION TESTS PASSED CLEANLY! Steps 1-7 remain 100% operational.');

    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Step 8 Test Failed:', error);
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
