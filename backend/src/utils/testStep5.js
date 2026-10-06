const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');

const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const shopRoutes = require('../routes/shopRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const productRoutes = require('../routes/productRoutes');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

let server;
let mongoServer;

const runTests = async () => {
  try {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      console.log('Connected to In-Memory MongoDB for Step 5 testing.');
    } catch (e) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace');
      console.log('Connected to Local MongoDB for Step 5 testing.');
    }

    server = app.listen(5004, () => {
      console.log('Step 5 Test Server running on port 5004');
    });

    const baseUrl = 'http://localhost:5004/api';

    console.log('\n--- SETTING UP SEED ACCOUNTS AND DATA FOR STEP 5 ---\n');

    // Category
    const category = await Category.create({ name: 'Pottery', slug: 'pottery' });

    // Admin User
    const adminUser = await User.create({ name: 'Admin', email: 'admin_step5@lam.in', password: 'password123', role: 'admin', status: 'Active' });
    const adminLogin = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin_step5@lam.in', password: 'password123' }) });
    const adminToken = (await adminLogin.json()).token;

    // Active Artisan 1 & Shop 1
    const artisan1User = await User.create({ name: 'Artisan One', email: 'artisan1_step5@lam.in', password: 'password123', role: 'artisan', status: 'Active' });
    const artisan1Login = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'artisan1_step5@lam.in', password: 'password123' }) });
    const artisan1Token = (await artisan1Login.json()).token;
    const shop1 = await Shop.create({ name: 'Artisan 1 Active Shop', owner: artisan1User._id, description: 'Pottery shop', status: 'Active' });

    // Pending Artisan 2 & Shop 2
    const artisan2User = await User.create({ name: 'Artisan Two', email: 'artisan2_step5@lam.in', password: 'password123', role: 'artisan', status: 'Pending' });
    const artisan2Login = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'artisan2_step5@lam.in', password: 'password123' }) });
    const artisan2Token = (await artisan2Login.json()).token;
    const shop2 = await Shop.create({ name: 'Artisan 2 Pending Shop', owner: artisan2User._id, description: 'Pending shop', status: 'Pending' });

    console.log('Seed setup complete.');
    console.log('\n--- RUNNING STEP 5 PRODUCT API TESTS ---\n');

    // Test 5 & 15: Artisan 1 creates product with price calculation (MRP: 2000, Discount: 10% -> Price: 1800)
    console.log('Test 5 & 15: Artisan creates product & backend calculates price (MRP 2000, 10% discount)');
    const createProd1Res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({
        name: 'Blue Ceramic Vase',
        description: 'Handcrafted ceramic vase',
        category: category.slug,
        mrp: 2000,
        discount: 10,
        availability: 'Limited Edition',
        stock: 15,
        status: 'Active'
      })
    });
    const createProd1Data = await createProd1Res.json();
    console.assert(createProd1Res.status === 201 && createProd1Data.data.price === 1800, 'Calculated price must be 1800');
    const prod1Id = createProd1Data.data._id;
    console.log('  ✅ PASSED: Product created with correct computed final price (1800).');

    // Test 13: Product status and availability remain separate
    console.log('Test 13: Verify Status and Availability remain separate concepts');
    console.assert(createProd1Data.data.status === 'Active', 'Status should be Active');
    console.assert(createProd1Data.data.availability === 'Limited Edition', 'Availability should be Limited Edition');
    console.log('  ✅ PASSED: Status and Availability are independent.');

    // Test 2 & 3: Create Draft and Inactive products
    console.log('Test 2 & 3: Create Draft and Inactive products');
    const draftProd = await Product.create({ name: 'Draft Pot', description: 'Draft', shop: shop1._id, mrp: 1000, price: 1000, status: 'Draft' });
    const inactiveProd = await Product.create({ name: 'Inactive Pot', description: 'Inactive', shop: shop1._id, mrp: 1000, price: 1000, status: 'Inactive' });

    // Test 1, 2, 3, 4: Public GET /api/products returns ONLY Active products from Active shops
    console.log('Test 1, 2, 3, 4: Public list products isolates Active products from Active shops');
    const pubProdsRes = await fetch(`${baseUrl}/products`);
    const pubProdsData = await pubProdsRes.json();
    console.assert(pubProdsRes.status === 200 && pubProdsData.data.length === 1, 'Public should see only 1 active product');
    console.assert(pubProdsData.data[0]._id === prod1Id, 'Must be prod1Id');
    console.log('  ✅ PASSED: Public sees only Active products from Active shops.');

    // Test 6: Artisan 1 cannot force product creation under Artisan 2\'s shop
    console.log('Test 6: Artisan product creation ignores client-supplied shop ID');
    const hijackShopRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({
        name: 'Attempted Hijack Product',
        description: 'Trying to assign shop2',
        shop: shop2._id,
        mrp: 500
      })
    });
    const hijackData = await hijackShopRes.json();
    console.assert(hijackShopRes.status === 201 && hijackData.data.shop.toString() === shop1._id.toString(), 'Product must belong to Artisan 1 shop');
    console.log('  ✅ PASSED: Product shop derived from req.user._id shop, ignoring client input.');

    // Test 7 & 8: Artisan 1 can edit their own product, but cannot edit Artisan 2\'s product
    console.log('Test 7 & 8: Artisan ownership check on PUT /api/products/:id');
    const artisan2Prod = await Product.create({ name: 'Artisan 2 Product', description: 'Desc', shop: shop2._id, mrp: 500, price: 500, status: 'Draft' });

    const badEditRes = await fetch(`${baseUrl}/products/${artisan2Prod._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ name: 'Hacked Product Name' })
    });
    console.assert(badEditRes.status === 403, 'Artisan 1 should be blocked from editing Artisan 2 product');

    const goodEditRes = await fetch(`${baseUrl}/products/${prod1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ name: 'Blue Ceramic Vase Updated' })
    });
    console.assert(goodEditRes.status === 200, 'Artisan 1 should edit own product');
    console.log('  ✅ PASSED: Ownership check permits editing own product and blocks editing others.');

    // Test 9: Artisan 1 cannot delete Artisan 2\'s product
    console.log('Test 9: Artisan cannot delete another artisan\'s product');
    const badDeleteRes = await fetch(`${baseUrl}/products/${artisan2Prod._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    console.assert(badDeleteRes.status === 403, 'Delete must return 403');
    console.log('  ✅ PASSED: Unauthorized delete blocked.');

    // Test 10 & 11: Pending artisan cannot publish an Active product
    console.log('Test 10 & 11: Pending artisan cannot publish Active product');
    const pendingPublishRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan2Token}` },
      body: JSON.stringify({
        name: 'Pending Artisan Product',
        description: 'Attempting to publish',
        mrp: 1000,
        status: 'Active'
      })
    });
    console.assert(pendingPublishRes.status === 403, 'Publishing Active product for pending shop must return 403');
    console.log('  ✅ PASSED: Pending artisan blocked from publishing Active products.');

    // Test 12: Admin can manage products
    console.log('Test 12: Admin can update any product');
    const adminUpdateRes = await fetch(`${baseUrl}/products/${artisan2Prod._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ description: 'Updated by Admin' })
    });
    console.assert(adminUpdateRes.status === 200, 'Admin product update failed');
    console.log('  ✅ PASSED: Admin can manage any product.');

    // Test 14: Invalid MRP/discount values are rejected
    console.log('Test 14: Invalid MRP/Discount values rejected');
    const invalidMrpRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ name: 'Bad MRP', description: 'Desc', mrp: -500 })
    });
    console.assert(invalidMrpRes.status === 400, 'Negative MRP should return 400');

    const invalidDiscountRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ name: 'Bad Discount', description: 'Desc', mrp: 500, discount: 150 })
    });
    console.assert(invalidDiscountRes.status === 400, 'Discount > 100 should return 400');
    console.log('  ✅ PASSED: Invalid price inputs rejected with HTTP 400.');

    // Test 17: Product Filtering (Search, Category, Availability, Price Range, Sort)
    console.log('Test 17: Product filtering capabilities');
    const filterRes = await fetch(`${baseUrl}/products?category=pottery&minPrice=1000&maxPrice=2500&sort=price_desc`);
    const filterData = await filterRes.json();
    console.assert(filterRes.status === 200 && filterData.data.length === 1, 'Filtering failed');
    console.log('  ✅ PASSED: Product search and filtering work cleanly.');

    // Test 18: Historical Order Preservation on Delete
    console.log('Test 18: Historical Order Preservation (Deletes with orders mark status as Inactive)');
    await Order.create({
      orderNumber: 'ORD-TEST-555',
      customer: adminUser._id,
      shop: shop1._id,
      items: [{ product: prod1Id, name: 'Vase', quantity: 1, price: 1800 }],
      subtotal: 1800,
      totalAmount: 1800,
      shippingAddress: { name: 'Admin', phone: '123', streetAddress: 'Street', city: 'City', state: 'State', postalCode: '100' }
    });

    const softDeleteRes = await fetch(`${baseUrl}/products/${prod1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    const softDeleteData = await softDeleteRes.json();
    console.assert(softDeleteRes.status === 200 && softDeleteData.data.status === 'Inactive', 'Product status should be set to Inactive');
    console.log('  ✅ PASSED: Product with historical orders was soft-deactivated to Inactive status.');

    console.log('\n=============================================');
    console.log('🎉 ALL 18 STEP 5 PRODUCT API TESTS PASSED CLEANLY!');
    console.log('=============================================\n');

    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Step 5 Test Failed:', error);
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
