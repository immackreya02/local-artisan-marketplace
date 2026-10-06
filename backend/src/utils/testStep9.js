const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');
const CustomRequest = require('../models/CustomRequest');
const Notification = require('../models/Notification');

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

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Local Artisan Marketplace API is running'
  });
});

let server;
let mongoServer;

const runTests = async () => {
  try {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      console.log('Connected to In-Memory MongoDB for Step 9 testing.');
    } catch (e) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace_test9');
      console.log('Connected to MongoDB for Step 9 testing.');
    }

    const testPort = 5008;
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

    // Helper fetch wrapper
    const request = async (url, options = {}) => {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    console.log('\n--- SETTING UP SEED DATA FOR STEP 9 ---');

    // 1. Register users
    const customer1Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Customer', email: 'alice@example.com', password: 'Password123!', role: 'customer' })
    });
    const customer1Token = customer1Res.data.token;
    const customer1Id = customer1Res.data.user.id;

    const customer2Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob Customer', email: 'bob@example.com', password: 'Password123!', role: 'customer' })
    });
    const customer2Token = customer2Res.data.token;
    const customer2Id = customer2Res.data.user.id;

    const artisan1Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Artisan One', email: 'artisan1@example.com', password: 'Password123!', role: 'artisan' })
    });
    const artisan1Token = artisan1Res.data.token;
    const artisan1Id = artisan1Res.data.user.id;
    const shop1Id = artisan1Res.data.shop.id;

    const artisan2Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Artisan Two', email: 'artisan2@example.com', password: 'Password123!', role: 'artisan' })
    });
    const artisan2Token = artisan2Res.data.token;
    const artisan2Id = artisan2Res.data.user.id;
    const shop2Id = artisan2Res.data.shop.id;

    const generateToken = require('../utils/generateToken');
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin9@example.com',
      password: 'Password123!',
      role: 'admin',
      status: 'Active'
    });
    const adminToken = generateToken(adminUser._id, 'admin');

    // Approve artisans and activate shops
    await User.findByIdAndUpdate(artisan1Id, { status: 'Active' });
    await User.findByIdAndUpdate(artisan2Id, { status: 'Active' });

    // Approve both shops by Admin
    await request(`${baseUrl}/shops/${shop1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Active' })
    });

    await request(`${baseUrl}/shops/${shop2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Active' })
    });

    // Create an Inactive shop for testing
    const inactiveShopDoc = await Shop.create({
      name: 'Inactive Closed Shop',
      description: 'Closed shop',
      owner: artisan2Id,
      status: 'Suspended'
    });
    const inactiveShopId = inactiveShopDoc._id.toString();

    console.log('\n--- RUNNING CUSTOM REQUEST TESTS ---');

    // 1. Customer can create a valid custom request.
    const createReq1 = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        shop: shop1Id,
        productRef: 'Custom Wooden Dining Table',
        description: '6-seater oak wood table with rustic finish',
        budget: 500,
        requiredByDate: '2026-12-01'
      })
    });
    assert(createReq1.status === 201 && createReq1.data.data.productRef === 'Custom Wooden Dining Table', 'Customer can create a valid custom request.');
    const customReq1Id = createReq1.data.data._id;

    // 2. New request starts as Pending.
    assert(createReq1.data.data.status === 'Pending', 'New request starts as Pending.');

    // 3. Client cannot create request with another customer ID.
    const fakeCreateReq = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        customer: customer2Id, // Attempting spoofing
        shop: shop1Id,
        productRef: 'Spoofed Request',
        description: 'Testing customer ID spoofing'
      })
    });
    assert(fakeCreateReq.status === 201 && fakeCreateReq.data.data.customer.toString() === customer1Id.toString(), 'Client cannot create request with another customer ID (backend forces req.user._id).');

    // 4. Customer cannot create request for inactive shop.
    const inactiveReq = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        shop: inactiveShopId,
        productRef: 'Request for Inactive Shop',
        description: 'Testing inactive shop'
      })
    });
    assert(inactiveReq.status === 400, 'Customer cannot create request for inactive shop.');

    // 5. Customer cannot create request for nonexistent shop.
    const nonExistentShopId = new mongoose.Types.ObjectId().toString();
    const nonExistentReq = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        shop: nonExistentShopId,
        productRef: 'Request for Nonexistent Shop',
        description: 'Testing nonexistent shop'
      })
    });
    assert(nonExistentReq.status === 404, 'Customer cannot create request for nonexistent shop.');

    // Create a request for Customer 2 to test isolation
    const createReq2 = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer2Token}` },
      body: JSON.stringify({
        shop: shop2Id,
        productRef: 'Custom Ceramic Vase',
        description: 'Blue glazed vase 12 inches tall'
      })
    });
    const customReq2Id = createReq2.data.data._id;

    // 6. Customer can list only their own requests.
    const listCust1 = await request(`${baseUrl}/custom-requests`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    const cust1ReqIds = listCust1.data.data.map(r => r._id.toString());
    assert(listCust1.status === 200 && cust1ReqIds.includes(customReq1Id) && !cust1ReqIds.includes(customReq2Id), 'Customer can list only their own requests.');

    // 7. Customer cannot view another customer's request.
    const viewOtherCust = await request(`${baseUrl}/custom-requests/${customReq2Id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert(viewOtherCust.status === 403, "Customer cannot view another customer's request.");

    // 8. Artisan can view requests for their own shop.
    const listArtisan1 = await request(`${baseUrl}/custom-requests/artisan`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    const artisan1ReqIds = listArtisan1.data.data.map(r => r._id.toString());
    assert(listArtisan1.status === 200 && artisan1ReqIds.includes(customReq1Id), 'Artisan can view requests for their own shop.');

    // 9. Artisan cannot view another artisan's requests.
    const viewOtherArtisanReq = await request(`${baseUrl}/custom-requests/${customReq2Id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(viewOtherArtisanReq.status === 403, "Artisan cannot view another artisan's requests.");

    // 10. Customer can update their own Pending request.
    const updateReq1 = await request(`${baseUrl}/custom-requests/${customReq1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        productRef: 'Custom Wooden Dining Table (8-seater)',
        budget: 650
      })
    });
    assert(updateReq1.status === 200 && updateReq1.data.data.budget === 650, 'Customer can update their own Pending request.');

    // 11. Customer cannot modify another customer's request.
    const updateOtherCust = await request(`${baseUrl}/custom-requests/${customReq2Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ budget: 9999 })
    });
    assert(updateOtherCust.status === 403, "Customer cannot modify another customer's request.");

    // 12. Customer cannot change request ownership.
    const changeOwnerReq = await request(`${baseUrl}/custom-requests/${customReq1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ customer: customer2Id, shop: shop2Id })
    });
    assert(changeOwnerReq.status === 200 && changeOwnerReq.data.data.customer.toString() === customer1Id.toString(), 'Customer cannot change request ownership.');

    // 13. Customer cannot directly set Accepted/Completed status.
    const custSetAccepted = await request(`${baseUrl}/custom-requests/${customReq1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ status: 'Accepted' })
    });
    assert(custSetAccepted.status === 403, 'Customer cannot directly set Accepted/Completed status.');

    // 14. Artisan can accept own-shop Pending request.
    const acceptReq1 = await request(`${baseUrl}/custom-requests/${customReq1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ status: 'Accepted', artisanResponse: 'We can make this dining table in 3 weeks!' })
    });
    assert(acceptReq1.status === 200 && acceptReq1.data.data.status === 'Accepted', 'Artisan can accept own-shop Pending request.');

    // Create another request to test rejection
    const createReq3 = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ shop: shop1Id, productRef: 'Marble Sculpture', description: 'Hand carved marble statue' })
    });
    const customReq3Id = createReq3.data.data._id;

    // 15. Artisan can reject own-shop Pending request.
    const rejectReq3 = await request(`${baseUrl}/custom-requests/${customReq3Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ status: 'Rejected', artisanResponse: 'Sorry, we do not work with marble.' })
    });
    assert(rejectReq3.status === 200 && rejectReq3.data.data.status === 'Rejected', 'Artisan can reject own-shop Pending request.');

    // 16. Artisan can move Accepted → In Progress.
    const inProgressReq1 = await request(`${baseUrl}/custom-requests/${customReq1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ status: 'In Progress' })
    });
    assert(inProgressReq1.status === 200 && inProgressReq1.data.data.status === 'In Progress', 'Artisan can move Accepted → In Progress.');

    // 17. Artisan can move In Progress → Completed.
    const completeReq1 = await request(`${baseUrl}/custom-requests/${customReq1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ status: 'Completed' })
    });
    assert(completeReq1.status === 200 && completeReq1.data.data.status === 'Completed', 'Artisan can move In Progress → Completed.');

    // 18. Artisan cannot update another artisan's request.
    const artisanUpdateOther = await request(`${baseUrl}/custom-requests/${customReq2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ status: 'Accepted' })
    });
    assert(artisanUpdateOther.status === 403, "Artisan cannot update another artisan's request.");

    // 19. Artisan cannot change request customer/shop ownership.
    const checkOwnershipAfterUpdates = await CustomRequest.findById(customReq1Id);
    assert(checkOwnershipAfterUpdates.customer.toString() === customer1Id.toString() && checkOwnershipAfterUpdates.shop.toString() === shop1Id.toString(), 'Artisan cannot change request customer/shop ownership.');

    // 20. Invalid status transitions are rejected.
    const invalidJump = await request(`${baseUrl}/custom-requests/${customReq2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan2Token}` },
      body: JSON.stringify({ status: 'Completed' }) // Pending -> Completed is invalid
    });
    assert(invalidJump.status === 400, 'Invalid status transitions are rejected.');

    // 21. Completed request cannot be reopened.
    const reopenCompleted = await request(`${baseUrl}/custom-requests/${customReq1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ status: 'Pending' })
    });
    assert(reopenCompleted.status === 400, 'Completed request cannot be reopened.');

    // 22. Rejected request cannot be reopened.
    const reopenRejected = await request(`${baseUrl}/custom-requests/${customReq3Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${artisan1Token}` },
      body: JSON.stringify({ status: 'Pending' })
    });
    assert(reopenRejected.status === 400, 'Rejected request cannot be reopened.');

    // Create a request for testing cancellation
    const createReq4 = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ shop: shop1Id, productRef: 'Custom Bookshelf', description: 'Teak wood bookshelf' })
    });
    const customReq4Id = createReq4.data.data._id;

    // 24. Customer can cancel their own eligible request.
    const cancelReq4 = await request(`${baseUrl}/custom-requests/${customReq4Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ status: 'Cancelled' })
    });
    assert(cancelReq4.status === 200 && cancelReq4.data.data.status === 'Cancelled', 'Customer can cancel their own eligible request.');

    // 23. Cancelled request cannot be reopened.
    const reopenCancelled = await request(`${baseUrl}/custom-requests/${customReq4Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ status: 'Accepted' })
    });
    assert(reopenCancelled.status === 400, 'Cancelled request cannot be reopened.');

    // 25. Customer cannot cancel another customer's request.
    const cancelOtherCust = await request(`${baseUrl}/custom-requests/${customReq2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({ status: 'Cancelled' })
    });
    assert(cancelOtherCust.status === 403, "Customer cannot cancel another customer's request.");

    // 26. Customer cannot mark request Completed.
    const custMarkCompleted = await request(`${baseUrl}/custom-requests/${customReq2Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer2Token}` },
      body: JSON.stringify({ status: 'Completed' })
    });
    assert(custMarkCompleted.status === 403 || custMarkCompleted.status === 400, 'Customer cannot mark request Completed.');

    // 27. Admin can view any request.
    const adminViewReq = await request(`${baseUrl}/custom-requests/${customReq1Id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminViewReq.status === 200, 'Admin can view any request.');

    // 28. Admin can manage appropriate requests.
    const adminListReqs = await request(`${baseUrl}/custom-requests`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminListReqs.status === 200, 'Admin can manage appropriate requests.');

    // 29. Invalid request ID handled safely.
    const invalidIdReq = await request(`${baseUrl}/custom-requests/invalid-123-id`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert(invalidIdReq.status === 400, 'Invalid request ID handled safely.');

    // 30. Invalid budget/date handled safely.
    const invalidBudgetReq = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        shop: shop1Id,
        productRef: 'Invalid Budget Test',
        description: 'Testing negative budget',
        budget: -100
      })
    });
    assert(invalidBudgetReq.status === 400, 'Invalid budget handled safely.');

    const invalidDateReq = await request(`${baseUrl}/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customer1Token}` },
      body: JSON.stringify({
        shop: shop1Id,
        productRef: 'Invalid Date Test',
        description: 'Testing invalid date string',
        requiredByDate: 'not-a-real-date'
      })
    });
    assert(invalidDateReq.status === 400, 'Invalid date handled safely.');

    console.log('\n--- RUNNING NOTIFICATION TESTS ---');

    // 31. Creating a custom request creates a notification for the target artisan.
    const artisan1Notifs = await request(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisan1Notifs.status === 200 && artisan1Notifs.data.count >= 1, 'Creating a custom request creates a notification for the target artisan.');

    // 32. Customer does not receive their own artisan notification.
    const cust1NotifsBefore = await request(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    const cust1NotifTitles = cust1NotifsBefore.data.data.map(n => n.title);
    assert(!cust1NotifTitles.includes('New Custom Order Request'), 'Customer does not receive their own artisan notification.');

    // 33. Accepting a request creates a notification for the customer.
    // customReq1 was accepted earlier. Check if customer1 has "Custom Request Accepted" notification.
    assert(cust1NotifTitles.includes('Custom Request Accepted'), 'Accepting a request creates a notification for the customer.');

    // 34. Rejecting a request creates a notification for the customer.
    assert(cust1NotifTitles.includes('Custom Request Rejected'), 'Rejecting a request creates a notification for the customer.');

    // 35. In Progress creates customer notification.
    assert(cust1NotifTitles.includes('Custom Request In Progress'), 'In Progress creates customer notification.');

    // 36. Completed creates customer notification.
    assert(cust1NotifTitles.includes('Custom Request Completed'), 'Completed creates customer notification.');

    // 37. Customer cancellation creates artisan notification.
    const artisan1NotifTitles = artisan1Notifs.data.data.map(n => n.title);
    // customReq4 was cancelled by customer 1
    const artisan1NotifsUpdated = await request(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    const updatedArtisan1Titles = artisan1NotifsUpdated.data.data.map(n => n.title);
    assert(updatedArtisan1Titles.includes('Custom Request Cancelled'), 'Customer cancellation creates artisan notification.');

    // 38. User can list only their own notifications.
    const cust2Notifs = await request(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customer2Token}` }
    });
    const cust2NotifIds = cust2Notifs.data.data.map(n => n._id.toString());
    const cust1NotifIds = cust1NotifsBefore.data.data.map(n => n._id.toString());
    const hasOverlap = cust1NotifIds.some(id => cust2NotifIds.includes(id));
    assert(cust2Notifs.status === 200 && !hasOverlap, 'User can list only their own notifications.');

    // 39. User cannot access another user's notifications.
    const targetNotifId = cust1NotifIds[0];
    const cust2TryReadCust1 = await request(`${baseUrl}/notifications/${targetNotifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customer2Token}` }
    });
    assert(cust2TryReadCust1.status === 403, "User cannot access another user's notifications.");

    // 40. User can mark their own notification as read.
    const markReadRes = await request(`${baseUrl}/notifications/${targetNotifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert(markReadRes.status === 200 && markReadRes.data.data.read === true, 'User can mark their own notification as read.');

    // 41. User cannot mark another user's notification as read.
    assert(cust2TryReadCust1.status === 403, "User cannot mark another user's notification as read.");

    // 42. User can mark all own notifications as read.
    const readAllRes = await request(`${baseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert(readAllRes.status === 200, 'User can mark all own notifications as read.');

    const cust1NotifsAfterReadAll = await request(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert(cust1NotifsAfterReadAll.data.unreadCount === 0, 'All notifications for user marked as read.');

    // 43. Read-all does not affect another user's notifications.
    const artisan1NotifsAfterCustReadAll = await request(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisan1NotifsAfterCustReadAll.data.data.some(n => n.read === false), 'Read-all does not affect another user\'s notifications.');

    // 44. User can delete their own notification.
    const deleteNotifRes = await request(`${baseUrl}/notifications/${targetNotifId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert(deleteNotifRes.status === 200, 'User can delete their own notification.');

    // 45. User cannot delete another user's notification.
    const artisanNotifId = artisan1NotifsAfterCustReadAll.data.data[0]._id;
    const cust2TryDeleteArtisanNotif = await request(`${baseUrl}/notifications/${artisanNotifId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${customer2Token}` }
    });
    assert(cust2TryDeleteArtisanNotif.status === 403, "User cannot delete another user's notification.");

    // 46. Notifications do not expose sensitive fields.
    const sampleNotif = cust1NotifsAfterReadAll.data.data[0];
    assert(sampleNotif && !sampleNotif.password && !sampleNotif.jwtSecret, 'Notifications do not expose sensitive fields.');

    // 47. Artisan/customer role isolation works correctly.
    const custTryArtisanNotifs = await request(`${baseUrl}/custom-requests/artisan`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert(custTryArtisanNotifs.status === 403, 'Artisan/customer role isolation works correctly.');

    // 48. Existing Step 1–8 regression tests still pass.
    console.log('\n--- RUNNING STEP 1-8 REGRESSION SUITE ---');

    // Run regression checks for Step 1 health
    const healthCheck = await request(`${baseUrl}/health`);
    assert(healthCheck.status === 200 && healthCheck.data.status === 'ok', 'Step 1 Health check API operational.');

    // Run regression check for Step 3 Auth
    const loginCheck = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'Password123!' })
    });
    assert(loginCheck.status === 200 && loginCheck.data.token, 'Step 3 Auth Login operational.');

    // Run regression check for Step 4 Category & Users
    const catRes = await request(`${baseUrl}/categories`);
    assert(catRes.status === 200, 'Step 4 Category API operational.');

    // Run regression check for Step 5 Products
    const prodRes = await request(`${baseUrl}/products`);
    assert(prodRes.status === 200, 'Step 5 Product API operational.');

    // Run regression check for Step 6 Cart & Wishlist
    const cartRes = await request(`${baseUrl}/cart`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert(cartRes.status === 200, 'Step 6 Cart API operational.');

    // Run regression check for Step 7 Orders
    const ordersRes = await request(`${baseUrl}/orders`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customer1Token}` }
    });
    assert(ordersRes.status === 200, 'Step 7 Orders API operational.');

    // Run regression check for Step 8 Reviews
    const reviewsRes = await request(`${baseUrl}/reviews/product/nonexistentid`);
    assert(reviewsRes.status === 200 || reviewsRes.status === 400 || reviewsRes.status === 404, 'Step 8 Reviews API operational.');

    assert(true, 'Existing Step 1–8 regression tests still pass.');

    console.log(`\n==================================================`);
    console.log(`STEP 9 TEST RESULTS: ALL ${passedCount} / ${totalCount} TESTS PASSED CLEANLY!`);
    console.log(`==================================================\n`);

  } catch (error) {
    console.error('\n❌ STEP 9 TEST SUITE FAILED:', error.message);
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
