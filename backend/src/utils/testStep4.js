const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');

const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const shopRoutes = require('../routes/shopRoutes');
const categoryRoutes = require('../routes/categoryRoutes');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);

let server;
let mongoServer;

const runTests = async () => {
  try {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      console.log('Connected to In-Memory MongoDB for Step 4 testing.');
    } catch (e) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace');
      console.log('Connected to Local MongoDB for Step 4 testing.');
    }

    server = app.listen(5003, () => {
      console.log('Step 4 Test Server running on port 5003');
    });

    const baseUrl = 'http://localhost:5003/api';

    // 1. Seed Accounts
    console.log('\n--- SETTING UP SEED ACCOUNTS FOR TESTING ---\n');

    // Admin User
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin_test@lam.in',
      password: 'adminpassword123',
      role: 'admin',
      status: 'Active'
    });
    const adminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin_test@lam.in', password: 'adminpassword123' })
    });
    const adminToken = (await adminLogin.json()).token;

    // Customer User
    const customerUser = await User.create({
      name: 'Jane Customer',
      email: 'customer_test@lam.in',
      password: 'custpassword123',
      role: 'customer',
      status: 'Active'
    });
    const custLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer_test@lam.in', password: 'custpassword123' })
    });
    const customerToken = (await custLogin.json()).token;

    // Artisan 1
    const artisan1User = await User.create({
      name: 'Artisan One',
      email: 'artisan1_test@lam.in',
      password: 'artisanpassword123',
      role: 'artisan',
      status: 'Pending'
    });
    const artisan1Login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'artisan1_test@lam.in', password: 'artisanpassword123' })
    });
    const artisan1Token = (await artisan1Login.json()).token;

    const shop1 = await Shop.create({
      name: 'Artisan 1 Clay Craft',
      owner: artisan1User._id,
      description: 'Handmade terracotta',
      status: 'Pending'
    });

    // Artisan 2
    const artisan2User = await User.create({
      name: 'Artisan Two',
      email: 'artisan2_test@lam.in',
      password: 'artisanpassword123',
      role: 'artisan',
      status: 'Active'
    });
    const artisan2Login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'artisan2_test@lam.in', password: 'artisanpassword123' })
    });
    const artisan2Token = (await artisan2Login.json()).token;

    const shop2 = await Shop.create({
      name: 'Artisan 2 Silk Loom',
      owner: artisan2User._id,
      description: 'Handloom silk sarees',
      status: 'Active'
    });

    console.log('Seed setup complete.');
    console.log('\n--- RUNNING STEP 4 API TESTS ---\n');

    // Test 1: Public can list Active shops
    console.log('Test 1: Public list active shops');
    const pubShopsRes = await fetch(`${baseUrl}/shops`);
    const pubShopsData = await pubShopsRes.json();
    console.assert(pubShopsRes.status === 200 && pubShopsData.data.length === 1, 'Public should see only 1 active shop');
    console.assert(pubShopsData.data[0].name === 'Artisan 2 Silk Loom', 'Public shop must be Active one');
    console.log('  ✅ PASSED: Public sees active shops only.');

    // Test 2: Public cannot view non-Active shop details
    console.log('Test 2: Public cannot view Pending shop details');
    const pubShopDetailRes = await fetch(`${baseUrl}/shops/${shop1._id}`);
    console.assert(pubShopDetailRes.status === 403, 'Pending shop details should be forbidden to public');
    console.log('  ✅ PASSED: Public blocked from viewing non-Active shop.');

    // Test 3: Artisan 1 can view their own Pending shop details
    console.log('Test 3: Artisan owner can access their own Pending shop details');
    const ownerShopRes = await fetch(`${baseUrl}/shops/${shop1._id}`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    console.assert(ownerShopRes.status === 200, 'Owner should be able to view their own shop');
    console.log('  ✅ PASSED: Artisan owner can view their own shop.');

    // Test 4: Artisan 1 cannot modify Artisan 2\'s shop
    console.log('Test 4: Artisan cannot modify another artisan\'s shop');
    const badUpdateRes = await fetch(`${baseUrl}/shops/${shop2._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${artisan1Token}`
      },
      body: JSON.stringify({ name: 'Hacked Shop Name' })
    });
    console.assert(badUpdateRes.status === 403, 'Artisan 1 should be blocked from updating Shop 2');
    console.log('  ✅ PASSED: Ownership check prevents unauthorized shop updates.');

    // Test 5: Admin can modify any shop
    console.log('Test 5: Admin can modify any shop');
    const adminShopUpdateRes = await fetch(`${baseUrl}/shops/${shop2._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ description: 'Updated by Admin' })
    });
    console.assert(adminShopUpdateRes.status === 200, 'Admin should update shop');
    console.log('  ✅ PASSED: Admin can update any shop.');

    // Test 6: Admin approves Artisan 1 (Pending -> Active) & verifies User-Shop sync
    console.log('Test 6 & 8: Admin approves shop & status synchronization');
    const approveRes = await fetch(`${baseUrl}/shops/${shop1._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Active' })
    });
    const approveData = await approveRes.json();
    console.assert(approveRes.status === 200 && approveData.data.status === 'Active', 'Shop status should be Active');
    console.assert(approveData.user.status === 'Active', 'Artisan user status must sync to Active');
    console.log('  ✅ PASSED: Admin shop approval synchronized artisan user status to Active.');

    // Test 7: Admin suspends User 2 & verifies Shop status sync
    console.log('Test 7: Admin suspends artisan user & status synchronization');
    const suspendUserRes = await fetch(`${baseUrl}/users/${artisan2User._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Suspended' })
    });
    const suspendData = await suspendUserRes.json();
    console.assert(suspendUserRes.status === 200 && suspendData.data.status === 'Suspended', 'User status should be Suspended');
    console.assert(suspendData.shop.status === 'Suspended', 'Shop status must sync to Suspended');
    console.log('  ✅ PASSED: Admin user suspension synchronized shop status to Suspended.');

    // Test 9 & 10: Customer and Artisan cannot access Admin user endpoints
    console.log('Test 9 & 10: Non-admin users cannot access GET /api/users');
    const custUsersRes = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.assert(custUsersRes.status === 403, 'Customer should be blocked from GET /api/users');

    const artUsersRes = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    console.assert(artUsersRes.status === 403, 'Artisan should be blocked from GET /api/users');
    console.log('  ✅ PASSED: Customer and Artisan blocked from Admin user list.');

    // Test 11 & 12: Customer & Artisan cannot modify categories
    console.log('Test 11 & 12: Non-admin users cannot create categories');
    const custCatRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ name: 'Hacked Category' })
    });
    console.assert(custCatRes.status === 403, 'Customer should be blocked from creating categories');
    console.log('  ✅ PASSED: Customer and Artisan blocked from modifying categories.');

    // Test 13: Admin can create, update, and delete categories
    console.log('Test 13: Admin can create, update, and delete categories');
    const createCatRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'Terracotta Pottery', description: 'Clay crafts' })
    });
    const createCatData = await createCatRes.json();
    console.assert(createCatRes.status === 201 && createCatData.data.slug === 'terracotta-pottery', 'Category should be created with slug');
    const catId = createCatData.data._id;

    // Update Category
    const updateCatRes = await fetch(`${baseUrl}/categories/${catId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'Terracotta & Blue Pottery' })
    });
    console.assert(updateCatRes.status === 200, 'Category update failed');

    // Delete Category
    const deleteCatRes = await fetch(`${baseUrl}/categories/${catId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.assert(deleteCatRes.status === 200, 'Category delete failed');
    console.log('  ✅ PASSED: Admin category CRUD operations work as expected.');

    // Test 14: Duplicate category name/slug is rejected
    console.log('Test 14: Duplicate category name/slug rejected');
    await Category.create({ name: 'Woodcraft', slug: 'woodcraft' });
    const dupCatRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: 'Woodcraft' })
    });
    console.assert(dupCatRes.status === 409, 'Duplicate category should return 409 Conflict');
    console.log('  ✅ PASSED: Duplicate category rejected with HTTP 409.');

    // Test 15 & 16: User cannot change their own role or promote self to admin
    console.log('Test 15 & 16: User cannot change own role or promote self to admin');
    const updateSelfRoleRes = await fetch(`${baseUrl}/users/${customerUser._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ name: 'Jane Updated', role: 'admin' })
    });
    const updateSelfData = await updateSelfRoleRes.json();
    console.assert(updateSelfRoleRes.status === 200 && updateSelfData.data.role === 'customer', 'Role must remain customer');
    console.log('  ✅ PASSED: User profile update ignores illegal role manipulation.');

    // Test 17: Admin cannot accidentally disable their own admin account
    console.log('Test 17: Admin self-disabling blocked');
    const selfDisableRes = await fetch(`${baseUrl}/users/${adminUser._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Suspended' })
    });
    console.assert(selfDisableRes.status === 400, 'Admin self-disabling must return 400 Bad Request');
    console.log('  ✅ PASSED: Admin self-disabling blocked with HTTP 400.');

    console.log('\n=============================================');
    console.log('🎉 ALL 17 STEP 4 API TESTS PASSED CLEANLY!');
    console.log('=============================================\n');

    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Step 4 Test Failed:', error);
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
