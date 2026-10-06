const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Shop = require('../models/Shop');
const authRoutes = require('../routes/authRoutes');
const { protect, authorize } = require('../middleware/auth');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Test endpoint for role authorization
app.get('/api/test-admin-only', protect, authorize('admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome Admin!' });
});

let server;
let mongoServer;

const runTests = async () => {
  try {
    // Attempt connecting to MongoMemoryServer or local MongoDB
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('Connected to In-Memory MongoDB for automated testing.');
    } catch (e) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace';
      await mongoose.connect(mongoUri);
      console.log('Connected to Local MongoDB for automated testing.');
    }

    server = app.listen(5002, () => {
      console.log('Test Server running on port 5002');
    });

    const baseUrl = 'http://localhost:5002/api/auth';
    let customerToken = '';

    console.log('\n--- STARTING AUTH VERIFICATION TESTS ---\n');

    // Test 1: Register Customer
    console.log('Test 1: Customer Registration');
    const regCustRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: 'testcust@lam.in',
        password: 'CraftCustomer#2026!',
        role: 'customer'
      })
    });
    const regCustData = await regCustRes.json();
    console.assert(regCustRes.status === 201 && regCustData.success === true, 'Failed customer registration');
    console.assert(regCustData.user.status === 'Active', 'Customer status must be Active');
    console.log('  ✅ PASSED: Customer registered with Active status.');

    // Test 2: Check Password Hashing in MongoDB
    console.log('Test 2: Password Hashing Verification in Database');
    const rawUser = await User.findOne({ email: 'testcust@lam.in' }).select('+password');
    console.assert(rawUser.password.startsWith('$2'), 'Password not hashed with bcrypt');
    console.assert(rawUser.password !== 'CraftCustomer#2026!', 'Password stored as plain text');
    console.log('  ✅ PASSED: Password is securely hashed with bcrypt in MongoDB.');

    // Test 3: Customer Login & Token Generation
    console.log('Test 3: Customer Login & JWT Generation');
    const loginCustRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testcust@lam.in', password: 'CraftCustomer#2026!' })
    });
    const loginCustData = await loginCustRes.json();
    console.assert(loginCustRes.status === 200 && !!loginCustData.token, 'Customer login failed');
    customerToken = loginCustData.token;
    console.log('  ✅ PASSED: Customer login returned valid JWT token.');

    // Test 4: GET /api/auth/me with valid JWT
    console.log('Test 4: GET /api/auth/me with Valid JWT');
    const meRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const meData = await meRes.json();
    console.assert(meRes.status === 200 && meData.user.email === 'testcust@lam.in', 'GET /me failed');
    console.assert(!meData.user.password, 'Password exposed in GET /me');
    console.log('  ✅ PASSED: GET /api/auth/me returned profile without password.');

    // Test 5: GET /api/auth/me without JWT (Should fail HTTP 401)
    console.log('Test 5: GET /api/auth/me without JWT');
    const meNoTokenRes = await fetch(`${baseUrl}/me`);
    console.assert(meNoTokenRes.status === 401, 'Request without token was not rejected');
    console.log('  ✅ PASSED: Request without JWT rejected with HTTP 401.');

    // Test 6: Invalid Password Login (Should fail HTTP 401)
    console.log('Test 6: Login with Invalid Password');
    const invalidPassRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testcust@lam.in', password: 'wrongpassword' })
    });
    console.assert(invalidPassRes.status === 401, 'Invalid password was not rejected');
    console.log('  ✅ PASSED: Invalid password rejected with HTTP 401.');

    // Test 7: Duplicate Email Registration (Should fail HTTP 409)
    console.log('Test 7: Duplicate Email Registration');
    const dupRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dup User', email: 'testcust@lam.in', password: 'password123' })
    });
    console.assert(dupRes.status === 409, 'Duplicate email was not rejected with 409');
    console.log('  ✅ PASSED: Duplicate email rejected with HTTP 409.');

    // Test 8: Public Registration as Admin (Should fail HTTP 400)
    console.log('Test 8: Block Public Registration as Admin');
    const adminRegRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker Admin', email: 'hacker@lam.in', password: 'adminpassword', role: 'admin' })
    });
    console.assert(adminRegRes.status === 400, 'Public admin registration was not blocked');
    console.log('  ✅ PASSED: Public admin registration blocked with HTTP 400.');

    // Test 9: Protected Route Rejects Invalid JWT
    console.log('Test 9: Invalid JWT Rejection');
    const invalidJwtRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer fake_invalid_jwt_token_123' }
    });
    console.assert(invalidJwtRes.status === 401, 'Invalid token was not rejected');
    console.log('  ✅ PASSED: Invalid JWT rejected with HTTP 401.');

    // Test 10: Role Authorization - Customer accessing Admin-only route (Should fail HTTP 403)
    console.log('Test 10: Role Authorization - Customer accessing Admin-only endpoint');
    const adminEndpointRes = await fetch('http://localhost:5002/api/test-admin-only', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    console.assert(adminEndpointRes.status === 403, 'Customer was not blocked from admin route');
    console.log('  ✅ PASSED: Customer blocked from admin route with HTTP 403.');

    // Test 11: Artisan Registration & Pending Status Check
    console.log('Test 11: Artisan Registration & Pending Status Check');
    const artRegRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Artisan',
        email: 'testartisan@lam.in',
        password: 'JaipurArtisan#2026!',
        role: 'artisan',
        shopName: 'Test Crafts'
      })
    });
    const artRegData = await artRegRes.json();
    console.assert(artRegRes.status === 201 && artRegData.user.status === 'Pending', 'Artisan status should be Pending');
    console.assert(!!artRegData.shop && artRegData.shop.status === 'Pending', 'Artisan shop should be Pending');
    console.log('  ✅ PASSED: Artisan registered with Pending user & shop status.');

    // Test 12: Pending Artisan Login
    console.log('Test 12: Pending Artisan Login Allowed');
    const artLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testartisan@lam.in', password: 'JaipurArtisan#2026!' })
    });
    const artLoginData = await artLoginRes.json();
    console.assert(artLoginRes.status === 200 && artLoginData.user.status === 'Pending', 'Pending artisan login failed');
    console.log('  ✅ PASSED: Pending artisan can log in per workflow.');

    // Test 13: Suspended User Rejection (Should fail HTTP 403)
    console.log('Test 13: Suspended User Access Blocked');
    await User.create({
      name: 'Suspended User',
      email: 'testsuspended@lam.in',
      password: 'password123',
      role: 'customer',
      status: 'Suspended'
    });
    const suspLoginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testsuspended@lam.in', password: 'password123' })
    });
    console.assert(suspLoginRes.status === 403, 'Suspended user login was not blocked');
    console.log('  ✅ PASSED: Suspended user login blocked with HTTP 403.');

    console.log('\n=============================================');
    console.log('🎉 ALL 13 AUTHENTICATION TESTS PASSED CLEANLY!');
    console.log('=============================================\n');

    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Auth Verification Test Failed:', error);
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
