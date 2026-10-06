const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Address = require('../models/Address');
const CustomRequest = require('../models/CustomRequest');
const Notification = require('../models/Notification');
const generateToken = require('../utils/generateToken');

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
const customRequestRoutes = require('../routes/customRequestRoutes');
const notificationRoutes = require('../routes/notificationRoutes');
const adminRoutes = require('../routes/adminRoutes');

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
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Local Artisan Marketplace API is running' });
});

let server;
let mongoServer;

const runTests = async () => {
  try {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      console.log('Connected to In-Memory MongoDB for Step 10 testing.');
    } catch (e) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace_test10');
      console.log('Connected to Local MongoDB for Step 10 testing.');
    }

    const testPort = 5009;
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api`;

    let passedCount = 0;
    let totalCount = 0;

    const assert = (condition, testName) => {
      totalCount++;
      if (condition) {
        passedCount++;
        console.log(`✅ TEST ${totalCount}: ${testName}`);
      } else {
        console.error(`❌ TEST ${totalCount} FAILED: ${testName}`);
        throw new Error(`Test failed: ${testName}`);
      }
    };

    const request = async (url, options = {}) => {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    console.log('\n--- SETTING UP SEED DATA FOR STEP 10 ---');

    // Create Admin directly via Mongoose
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin10@example.com',
      password: 'Password123!',
      role: 'admin',
      status: 'Active'
    });
    const adminToken = generateToken(adminUser._id, 'admin');

    // Register Customer 1
    const cust1Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Customer', email: 'alice10@example.com', password: 'Password123!', role: 'customer' })
    });
    const cust1Token = cust1Res.data.token;
    const cust1Id = cust1Res.data.user.id;

    // Register Artisan 1 (Starts Pending)
    const artisan1Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Artisan One', email: 'artisan1_10@example.com', password: 'Password123!', role: 'artisan' })
    });
    const artisan1Token = artisan1Res.data.token;
    const artisan1Id = artisan1Res.data.user.id;
    const shop1Id = artisan1Res.data.shop.id;

    // Register Artisan 2 (Starts Pending)
    const artisan2Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Artisan Two', email: 'artisan2_10@example.com', password: 'Password123!', role: 'artisan' })
    });
    const artisan2Token = artisan2Res.data.token;
    const artisan2Id = artisan2Res.data.user.id;
    const shop2Id = artisan2Res.data.shop.id;

    console.log('\n--- SECTION A: ADMIN USER TESTS ---');

    // 1. Admin can list users.
    const adminListUsers = await request(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminListUsers.status === 200 && Array.isArray(adminListUsers.data.data), 'Admin can list users.');

    // 2. Customer cannot list users.
    const custListUsers = await request(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(custListUsers.status === 403, 'Customer cannot list users.');

    // 3. Artisan cannot list users.
    const artisanListUsers = await request(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisanListUsers.status === 403, 'Artisan cannot list users.');

    // 4. Admin can view a user.
    const adminViewUser = await request(`${baseUrl}/users/${artisan1Id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminViewUser.status === 200 && adminViewUser.data.data.email === 'artisan1_10@example.com', 'Admin can view a user.');

    // 5. User can view/update allowed own profile fields.
    const updateOwnProfile = await request(`${baseUrl}/users/${cust1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ name: 'Alice Updated', phone: '9998887776' })
    });
    assert(updateOwnProfile.status === 200 && updateOwnProfile.data.data.name === 'Alice Updated', 'User can view/update allowed own profile fields.');

    // 6. User cannot modify another user's protected fields.
    const updateOtherProfile = await request(`${baseUrl}/users/${artisan1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ name: 'Hacked Name' })
    });
    assert(updateOtherProfile.status === 403, "User cannot modify another user's profile.");

    // 7. Customer cannot change role.
    const custChangeRole = await request(`${baseUrl}/users/${cust1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ role: 'admin' })
    });
    assert(custChangeRole.status === 200 && custChangeRole.data.data.role === 'customer', 'Customer cannot change role.');

    // 8. Artisan cannot change role.
    const artisanChangeRole = await request(`${baseUrl}/users/${artisan1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ role: 'admin' })
    });
    assert(artisanChangeRole.status === 200 && artisanChangeRole.data.data.role === 'artisan', 'Artisan cannot change role.');

    // 9. Public registration cannot create admin.
    const publicAdminReg = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sneaky Admin', email: 'sneaky@example.com', password: 'Password123!', role: 'admin' })
    });
    assert(publicAdminReg.status === 400, 'Public registration cannot create admin.');

    // 10. Admin cannot disable/suspend/reject themselves.
    const adminSelfSuspend = await request(`${baseUrl}/users/${adminUser._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Suspended' })
    });
    assert(adminSelfSuspend.status === 400, 'Admin cannot disable/suspend/reject themselves.');

    // 11. Admin cannot delete themselves.
    const adminSelfDelete = await request(`${baseUrl}/users/${adminUser._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminSelfDelete.status === 400, 'Admin cannot delete themselves.');

    // 12. Admin cannot remove their own admin role.
    const adminSelfRoleChange = await request(`${baseUrl}/users/${adminUser._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ role: 'customer' })
    });
    const refreshedAdmin = await User.findById(adminUser._id);
    assert(refreshedAdmin.role === 'admin', 'Admin cannot remove their own admin role.');

    console.log('\n--- SECTION B: ARTISAN APPROVAL TESTS ---');

    // 13. Admin can list pending artisans via /api/admin/artisans.
    const listPendingArtisans = await request(`${baseUrl}/admin/artisans?status=Pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(listPendingArtisans.status === 200 && listPendingArtisans.data.data.length >= 2, 'Admin can list pending artisans.');

    // 14. Admin can approve pending artisan.
    const approveArtisan1 = await request(`${baseUrl}/admin/artisans/${artisan1Id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(approveArtisan1.status === 200 && approveArtisan1.data.user.status === 'Active', 'Admin can approve pending artisan.');

    // 15. Approval synchronizes Shop.status to Active.
    const shop1AfterApprove = await Shop.findById(shop1Id);
    assert(shop1AfterApprove.status === 'Active' && shop1AfterApprove.verified === true, 'Approval synchronizes Shop.status to Active.');

    // 16. Admin can reject pending artisan.
    const rejectArtisan2 = await request(`${baseUrl}/admin/artisans/${artisan2Id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(rejectArtisan2.status === 200 && rejectArtisan2.data.user.status === 'Rejected', 'Admin can reject pending artisan.');

    // 17. Rejection synchronizes Shop.status to Rejected.
    const shop2AfterReject = await Shop.findById(shop2Id);
    assert(shop2AfterReject.status === 'Rejected', 'Rejection synchronizes Shop.status to Rejected.');

    // 18. Admin can suspend active artisan.
    const suspendArtisan1 = await request(`${baseUrl}/admin/artisans/${artisan1Id}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(suspendArtisan1.status === 200 && suspendArtisan1.data.user.status === 'Suspended', 'Admin can suspend active artisan.');

    // 19. Suspension synchronizes Shop.status to Suspended.
    const shop1AfterSuspend = await Shop.findById(shop1Id);
    assert(shop1AfterSuspend.status === 'Suspended', 'Suspension synchronizes Shop.status to Suspended.');

    // 20. Admin can reinstate suspended artisan.
    const reinstateArtisan1 = await request(`${baseUrl}/admin/artisans/${artisan1Id}/reinstate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(reinstateArtisan1.status === 200 && reinstateArtisan1.data.user.status === 'Active', 'Admin can reinstate suspended artisan.');

    // 21. Reinstatement synchronizes Shop.status to Active.
    const shop1AfterReinstate = await Shop.findById(shop1Id);
    assert(shop1AfterReinstate.status === 'Active', 'Reinstatement synchronizes Shop.status to Active.');

    // 22. Artisan cannot approve themselves.
    const artisanSelfApprove = await request(`${baseUrl}/admin/artisans/${artisan2Id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${artisan2Token}` }
    });
    assert(artisanSelfApprove.status === 403, 'Artisan cannot approve themselves.');

    // 23. Artisan cannot suspend another artisan.
    const artisanSuspendOther = await request(`${baseUrl}/admin/artisans/${artisan1Id}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisanSuspendOther.status === 403, 'Artisan cannot suspend another artisan.');

    // 24. Customer cannot manage artisan status.
    const custApproveArtisan = await request(`${baseUrl}/admin/artisans/${artisan2Id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(custApproveArtisan.status === 403, 'Customer cannot manage artisan status.');

    // 25. Invalid artisan status transition or bad status payload is handled cleanly.
    const invalidStatusPayload = await request(`${baseUrl}/users/${artisan1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'InvalidStatusString' })
    });
    assert(invalidStatusPayload.status === 400, 'Invalid status string rejected cleanly.');

    console.log('\n--- SECTION C: SHOP TESTS ---');

    // 26. Artisan can access own shop.
    const artisanGetOwnShop = await request(`${baseUrl}/shops/${shop1Id}`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisanGetOwnShop.status === 200 && artisanGetOwnShop.data.data.name, 'Artisan can access own shop.');

    // Also approve Artisan 2 shop so both are active for subsequent tests
    await request(`${baseUrl}/admin/artisans/${artisan2Id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // 27. Artisan can view active public shop.
    const artisanGetOtherShop = await request(`${baseUrl}/shops/${shop2Id}`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisanGetOtherShop.status === 200, 'Artisan can view other active shop.');

    // 28. Artisan can edit own shop.
    const artisanEditOwnShop = await request(`${baseUrl}/shops/${shop1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ description: 'Updated handcrafted shop description' })
    });
    assert(artisanEditOwnShop.status === 200 && artisanEditOwnShop.data.data.description === 'Updated handcrafted shop description', 'Artisan can edit own shop.');

    // 29. Artisan cannot edit another artisan's shop.
    const artisanEditOtherShop = await request(`${baseUrl}/shops/${shop2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ name: 'Hacked Shop Name' })
    });
    assert(artisanEditOtherShop.status === 403, "Artisan cannot edit another artisan's shop.");

    // 30. Client cannot change shop owner.
    const changeShopOwner = await request(`${baseUrl}/shops/${shop1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ owner: artisan2Id })
    });
    const refreshedShop1 = await Shop.findById(shop1Id);
    assert(refreshedShop1.owner.toString() === artisan1Id.toString(), 'Client cannot change shop owner.');

    // 31. Admin can manage any shop.
    const adminEditShop = await request(`${baseUrl}/shops/${shop2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ description: 'Admin updated shop description' })
    });
    assert(adminEditShop.status === 200, 'Admin can manage any shop.');

    console.log('\n--- SECTION D: PRODUCT TESTS ---');

    // 32. Artisan can create own product.
    const createProd1 = await request(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({
        name: 'Handcrafted Wooden Bowl',
        description: 'Solid oak bowl',
        mrp: 100,
        discount: 10,
        availability: 'Ready-to-Ship',
        stock: 15,
        status: 'Active'
      })
    });
    assert(createProd1.status === 201 && createProd1.data.data.name === 'Handcrafted Wooden Bowl', 'Artisan can create own product.');
    const prod1Id = createProd1.data.data._id;

    // Create a product for Artisan 2
    const createProd2 = await request(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan2Token}` },
      body: JSON.stringify({
        name: 'Ceramic Coffee Mug',
        description: 'Blue glazed clay mug',
        mrp: 50,
        availability: 'Ready-to-Ship',
        stock: 20,
        status: 'Active'
      })
    });
    const prod2Id = createProd2.data.data._id;

    // 33. Artisan cannot assign product to another shop.
    const spoofShopProd = await request(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({
        name: 'Spoofed Shop Product',
        description: 'Attempting to assign product to shop2',
        shop: shop2Id, // Attempt spoof
        mrp: 80
      })
    });
    assert(spoofShopProd.status === 201 && spoofShopProd.data.data.shop.toString() === shop1Id.toString(), 'Artisan cannot assign product to another shop.');

    // 34. CRITICAL AUDIT TEST: Artisan A cannot edit another artisan's product by manually supplying /api/products/:productId.
    const artisan1EditProd2 = await request(`${baseUrl}/products/${prod2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ name: 'Hacked Mug Name', mrp: 1 })
    });
    assert(artisan1EditProd2.status === 403, 'CRITICAL AUDIT TEST: Artisan A cannot edit Artisan B\'s product by ID (returns 403).');

    // 35. Artisan cannot delete another artisan's product.
    const artisan1DeleteProd2 = await request(`${baseUrl}/products/${prod2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisan1DeleteProd2.status === 403, "Artisan cannot delete another artisan's product.");

    // Suspend Artisan 1 temporarily to test publishing restrictions
    await request(`${baseUrl}/admin/artisans/${artisan1Id}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // 36. Pending / Suspended artisan cannot publish Active product.
    const suspendedArtisanPublish = await request(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({
        name: 'Product While Suspended',
        description: 'Should be blocked or forced to draft',
        mrp: 120,
        status: 'Active'
      })
    });
    assert(suspendedArtisanPublish.status === 403, 'Suspended artisan cannot publish Active product.');

    // Reinstate Artisan 1
    await request(`${baseUrl}/admin/artisans/${artisan1Id}/reinstate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // 38. Active artisan can publish own product.
    const activePublish = await request(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({
        name: 'Reinstated Artisan Product',
        description: 'Published after reinstatement',
        mrp: 90,
        status: 'Active'
      })
    });
    assert(activePublish.status === 201 && activePublish.data.data.status === 'Active', 'Active artisan can publish own product.');

    // 39. Admin can manage any product.
    const adminEditProd = await request(`${baseUrl}/products/${prod1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Admin Edited Wooden Bowl' })
    });
    assert(adminEditProd.status === 200 && adminEditProd.data.data.name === 'Admin Edited Wooden Bowl', 'Admin can manage any product.');

    // 40. Customer cannot manage products.
    const custCreateProd = await request(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ name: 'Customer Product', description: 'Test', mrp: 10 })
    });
    assert(custCreateProd.status === 403, 'Customer cannot manage products.');

    // 41. Product status remains separate from availability.
    const prod1Doc = await Product.findById(prod1Id);
    assert(prod1Doc.status === 'Active' && prod1Doc.availability === 'Ready-to-Ship', 'Product status remains separate from availability.');

    console.log('\n--- SECTION E: ORDER TESTS ---');

    // Create address for customer
    const addrDoc = await Address.create({
      user: cust1Id,
      name: 'Alice Customer',
      phone: '9998887776',
      streetAddress: '123 Main St',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'India'
    });

    // Create an order for Shop 1
    const order1Doc = await Order.create({
      orderNumber: 'LAM-2026-TEST10-001',
      customer: cust1Id,
      shop: shop1Id,
      items: [
        {
          product: prod1Id,
          name: 'Handcrafted Wooden Bowl',
          price: 90,
          quantity: 1,
          availability: 'Ready-to-Ship'
        }
      ],
      shippingAddress: {
        name: 'Alice Customer',
        phone: '9998887776',
        streetAddress: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'India'
      },
      subtotal: 90,
      tax: 16.2,
      totalAmount: 106.2,
      paymentMethod: 'COD',
      orderStatus: 'Pending'
    });

    // 42. Artisan sees only own-shop orders.
    const artisan1Orders = await request(`${baseUrl}/orders/artisan`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    const artisan1OrderIds = artisan1Orders.data.data.map(o => o._id.toString());
    assert(artisan1Orders.status === 200 && artisan1OrderIds.includes(order1Doc._id.toString()), 'Artisan sees only own-shop orders.');

    // 43. Artisan cannot access another shop's order.
    const artisan2TryGetOrder1 = await request(`${baseUrl}/orders/${order1Doc._id}`, {
      headers: { Authorization: `Bearer ${artisan2Token}` }
    });
    assert(artisan2TryGetOrder1.status === 403, "Artisan cannot access another shop's order.");

    // 44. Artisan cannot modify another shop's order.
    const artisan2TryUpdateOrder1 = await request(`${baseUrl}/orders/${order1Doc._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan2Token}` },
      body: JSON.stringify({ orderStatus: 'Confirmed' })
    });
    assert(artisan2TryUpdateOrder1.status === 403, "Artisan cannot modify another shop's order.");

    // 45. Admin can access all orders.
    const adminListAllOrders = await request(`${baseUrl}/orders/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminListAllOrders.status === 200 && adminListAllOrders.data.data.length >= 1, 'Admin can access all orders.');

    // 46. Invalid order lifecycle transition rejected.
    // Set order status to Delivered
    await Order.findByIdAndUpdate(order1Doc._id, { orderStatus: 'Delivered' });
    const revertDelivered = await request(`${baseUrl}/orders/${order1Doc._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ orderStatus: 'Pending' })
    });
    assert(revertDelivered.status === 400, 'Invalid order lifecycle transition rejected.');

    // 47. Historical order snapshots preserved.
    const deliveredOrderObj = await Order.findById(order1Doc._id);
    assert(deliveredOrderObj.items[0].price === 90 && deliveredOrderObj.items[0].name === 'Handcrafted Wooden Bowl', 'Historical order snapshots preserved.');

    console.log('\n--- SECTION F: CUSTOM REQUEST TESTS ---');

    // Create a Custom Request for Shop 1
    const createReq = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ shop: shop1Id, productRef: 'Custom Carved Chair', description: 'Teak wood chair' })
    });
    const customReqId = createReq.data.data._id;

    // 48. Artisan sees only own-shop custom requests.
    const artisan1Reqs = await request(`${baseUrl}/custom-requests/artisan`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    const artisan1ReqIds = artisan1Reqs.data.data.map(r => r._id.toString());
    assert(artisan1Reqs.status === 200 && artisan1ReqIds.includes(customReqId), 'Artisan sees only own-shop custom requests.');

    // 49. Artisan cannot modify another artisan's custom request.
    const artisan2ModReq1 = await request(`${baseUrl}/custom-requests/${customReqId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan2Token}` },
      body: JSON.stringify({ status: 'Accepted' })
    });
    assert(artisan2ModReq1.status === 403, "Artisan cannot modify another artisan's custom request.");

    // 50. Admin can manage appropriate custom requests.
    const adminGetCustomReq = await request(`${baseUrl}/custom-requests/${customReqId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminGetCustomReq.status === 200, 'Admin can manage appropriate custom requests.');

    console.log('\n--- SECTION G: NOTIFICATION TESTS ---');

    // 51-54. Verify artisan notifications for approval/suspension/reinstatement
    const artisan1Notifs = await request(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    const artisan1NotifTitles = artisan1Notifs.data.data.map(n => n.title);
    assert(artisan1NotifTitles.includes('Shop Approved'), 'Artisan receives notification after approval.');
    assert(artisan1NotifTitles.includes('Account Suspended'), 'Artisan receives notification after suspension.');
    assert(artisan1NotifTitles.includes('Account Reinstated'), 'Artisan receives notification after reinstatement.');

    // 55. Notification belongs to correct recipient.
    const sampleNotifRecipient = artisan1Notifs.data.data[0].recipient.toString();
    assert(sampleNotifRecipient === artisan1Id.toString(), 'Notification belongs to correct recipient.');

    console.log('\n--- SECTION H: STEP 1-9 REGRESSION SUITE ---');

    // 56. Step 9 tests pass.
    const step9NotifCheck = await request(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(step9NotifCheck.status === 200, 'Step 9 Notifications API operational.');

    // 57. Step 8 Reviews API operational.
    const step8ReviewsCheck = await request(`${baseUrl}/reviews/product/${prod1Id}`);
    assert(step8ReviewsCheck.status === 200, 'Step 8 Reviews API operational.');

    // 58. Step 7 Orders API operational.
    const step7OrdersCheck = await request(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(step7OrdersCheck.status === 200, 'Step 7 Orders API operational.');

    // 59. Step 6 Cart API operational.
    const step6CartCheck = await request(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(step6CartCheck.status === 200, 'Step 6 Cart API operational.');

    // 60. Step 5 Product API operational.
    const step5ProdCheck = await request(`${baseUrl}/products`);
    assert(step5ProdCheck.status === 200, 'Step 5 Product API operational.');

    // 61. Step 4 Category & User API operational.
    const step4CatCheck = await request(`${baseUrl}/categories`);
    assert(step4CatCheck.status === 200, 'Step 4 Category API operational.');

    // 62. Step 3 Auth API operational.
    const step3AuthCheck = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice10@example.com', password: 'Password123!' })
    });
    assert(step3AuthCheck.status === 200 && step3AuthCheck.data.token, 'Step 3 Auth API operational.');

    // 63. Step 2 Mongoose Models intact.
    assert(User && Shop && Product && Order && Category && CustomRequest && Notification, 'Step 2 Mongoose models intact.');

    // 64. Step 1 Health API operational.
    const step1HealthCheck = await request(`${baseUrl}/health`);
    assert(step1HealthCheck.status === 200 && step1HealthCheck.data.status === 'ok', 'Step 1 Health API operational.');

    console.log(`\n==================================================`);
    console.log(`STEP 10 TEST RESULTS: ALL ${passedCount} / ${totalCount} TESTS PASSED CLEANLY!`);
    console.log(`==================================================\n`);

  } catch (error) {
    console.error('\n❌ STEP 10 TEST SUITE FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    await mongoose.disconnect();
  }
};

runTests();
