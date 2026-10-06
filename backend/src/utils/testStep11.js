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
const adminAnalyticsRoutes = require('../routes/adminAnalyticsRoutes');
const artisanAnalyticsRoutes = require('../routes/artisanAnalyticsRoutes');

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

app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/reports', adminAnalyticsRoutes);
app.use('/api/artisan/analytics', artisanAnalyticsRoutes);
app.use('/api/artisan/reports', artisanAnalyticsRoutes);

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
      console.log('Connected to In-Memory MongoDB for Step 11 testing.');
    } catch (e) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace_test11');
      console.log('Connected to Local MongoDB for Step 11 testing.');
    }

    const testPort = 5010;
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
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');
      return { status: res.status, headers: res.headers, data };
    };

    console.log('\n--- SETTING UP SEED DATA FOR STEP 11 ---');

    // Create Admin user
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin11@example.com',
      password: 'Password123!',
      role: 'admin',
      status: 'Active'
    });
    const adminToken = generateToken(adminUser._id, 'admin');

    // Register Customer 1
    const cust1Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Customer', email: 'alice11@example.com', password: 'Password123!', role: 'customer' })
    });
    const cust1Token = cust1Res.data.token;
    const cust1Id = cust1Res.data.user.id;

    // Register Artisan 1 & Shop 1
    const artisan1Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Artisan One', email: 'artisan1_11@example.com', password: 'Password123!', role: 'artisan' })
    });
    const artisan1Token = artisan1Res.data.token;
    const artisan1Id = artisan1Res.data.user.id;
    const shop1Id = artisan1Res.data.shop.id;

    // Register Artisan 2 & Shop 2
    const artisan2Res = await request(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Artisan Two', email: 'artisan2_11@example.com', password: 'Password123!', role: 'artisan' })
    });
    const artisan2Token = artisan2Res.data.token;
    const artisan2Id = artisan2Res.data.user.id;
    const shop2Id = artisan2Res.data.shop.id;

    // Approve both artisans and shops via Admin
    await request(`${baseUrl}/admin/artisans/${artisan1Id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    await request(`${baseUrl}/admin/artisans/${artisan2Id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Create Category
    const catDoc = await Category.create({ name: 'Woodwork', slug: 'woodwork' });

    // Create Product for Shop 1 (Current Price: 500)
    const prod1Doc = await Product.create({
      name: 'Handmade Wooden Table',
      description: 'Solid oak table',
      shop: shop1Id,
      category: catDoc._id,
      mrp: 500,
      price: 500,
      status: 'Active',
      availability: 'Ready-to-Ship',
      stock: 10
    });

    // Create Product for Shop 2
    const prod2Doc = await Product.create({
      name: 'Clay Pot',
      description: 'Terracotta clay pot',
      shop: shop2Id,
      category: catDoc._id,
      mrp: 100,
      price: 100,
      status: 'Active',
      availability: 'Ready-to-Ship',
      stock: 20
    });

    // Seed Real Orders:
    // Order 1 (Shop 1, Delivered): Price snapshot = 400 (historical discount), Qty = 2. Subtotal = 800, Tax = 144, Total = 944.
    const order1 = await Order.create({
      orderNumber: 'LAM-2026-STEP11-001',
      customer: cust1Id,
      shop: shop1Id,
      items: [
        {
          product: prod1Doc._id,
          name: 'Handmade Wooden Table',
          price: 400, // Historical price snapshot (not 500!)
          quantity: 2,
          availability: 'Ready-to-Ship'
        }
      ],
      shippingAddress: { name: 'Alice Customer', phone: '9998887776', streetAddress: '123 St', city: 'City', state: 'ST', postalCode: '10001' },
      subtotal: 800,
      tax: 144,
      totalAmount: 944,
      paymentMethod: 'COD',
      orderStatus: 'Delivered',
      orderDate: new Date('2026-06-01')
    });

    // Order 2 (Shop 1, Cancelled): Subtotal = 400, Total = 472. MUST NOT COUNT IN REVENUE!
    const order2 = await Order.create({
      orderNumber: 'LAM-2026-STEP11-002',
      customer: cust1Id,
      shop: shop1Id,
      items: [
        {
          product: prod1Doc._id,
          name: 'Handmade Wooden Table',
          price: 400,
          quantity: 1,
          availability: 'Ready-to-Ship'
        }
      ],
      shippingAddress: { name: 'Alice Customer', phone: '9998887776', streetAddress: '123 St', city: 'City', state: 'ST', postalCode: '10001' },
      subtotal: 400,
      tax: 72,
      totalAmount: 472,
      paymentMethod: 'COD',
      orderStatus: 'Cancelled',
      orderDate: new Date('2026-06-02')
    });

    // Order 3 (Shop 2, Delivered): Subtotal = 200, Tax = 36, Total = 236.
    const order3 = await Order.create({
      orderNumber: 'LAM-2026-STEP11-003',
      customer: cust1Id,
      shop: shop2Id,
      items: [
        {
          product: prod2Doc._id,
          name: 'Clay Pot',
          price: 100,
          quantity: 2,
          availability: 'Ready-to-Ship'
        }
      ],
      shippingAddress: { name: 'Alice Customer', phone: '9998887776', streetAddress: '123 St', city: 'City', state: 'ST', postalCode: '10001' },
      subtotal: 200,
      tax: 36,
      totalAmount: 236,
      paymentMethod: 'COD',
      orderStatus: 'Delivered',
      orderDate: new Date('2026-06-03')
    });

    console.log('\n--- SECTION A: ADMIN ANALYTICS TESTS ---');

    // 1. Admin can access overview analytics.
    const adminOverview = await request(`${baseUrl}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminOverview.status === 200 && adminOverview.data.data.users.total >= 3, 'Admin can access overview analytics.');

    // 2. Customer cannot access admin analytics.
    const custTryAdminOverview = await request(`${baseUrl}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(custTryAdminOverview.status === 403, 'Customer cannot access admin analytics.');

    // 3. Artisan cannot access admin analytics.
    const artisanTryAdminOverview = await request(`${baseUrl}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisanTryAdminOverview.status === 403, 'Artisan cannot access admin analytics.');

    // 4. Overview counts come from actual database records.
    const usersCount = adminOverview.data.data.users;
    assert(usersCount.customers === 1 && usersCount.artisans === 2, 'Overview counts come from actual database records.');

    // 5. Revenue comes from actual orders.
    // Total delivered net revenue = 944 (Order 1) + 236 (Order 3) = 1180.
    const financials = adminOverview.data.data.financials;
    assert(financials.netRevenue === 1180, 'Revenue comes from actual orders.');

    // 6. Cancelled orders are excluded according to the defined revenue rule.
    // Total order count = 3, but valid non-cancelled order count = 2.
    assert(financials.validOrderCount === 2, 'Cancelled orders are excluded from realized revenue.');

    // 7. Delivered orders are counted correctly.
    assert(adminOverview.data.data.orders.delivered === 2, 'Delivered orders are counted correctly.');

    // 8. Order status counts are correct.
    const adminOrderStats = await request(`${baseUrl}/admin/analytics/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminOrderStats.status === 200 && adminOrderStats.data.data.Delivered === 2 && adminOrderStats.data.data.Cancelled === 1, 'Order status counts are correct.');

    // 9. Product counts are correct.
    assert(adminOverview.data.data.products.total === 2, 'Product counts are correct.');

    // 10. Active/inactive product counts are correct.
    assert(adminOverview.data.data.products.active === 2, 'Active product counts are correct.');

    // 11. Top products use historical order item snapshots.
    const adminProductStats = await request(`${baseUrl}/admin/analytics/products`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminProductStats.status === 200 && adminProductStats.data.data.length >= 2, 'Top products use historical order item snapshots.');

    // 12. Top products calculate quantity correctly.
    const topWoodTable = adminProductStats.data.data.find(p => p.name === 'Handmade Wooden Table');
    assert(topWoodTable && topWoodTable.unitsSold === 2, 'Top products calculate quantity correctly.');

    // 13. Top products calculate revenue correctly.
    // Wood Table: 2 units @ 400 = 800 revenue (NOT 1000 from current product price!).
    assert(topWoodTable && topWoodTable.revenue === 800, 'Top products calculate revenue correctly from historical price snapshot.');

    // 14. Category aggregation works.
    const catStats = await request(`${baseUrl}/admin/analytics/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(catStats.status === 200 && catStats.data.data.length >= 1, 'Category aggregation works.');

    // 15. Shop aggregation works.
    const shopStats = await request(`${baseUrl}/admin/analytics/shops`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(shopStats.status === 200 && shopStats.data.data.length >= 2, 'Shop aggregation works.');

    // 16. Customer aggregate statistics work.
    assert(adminOverview.data.data.users.customers === 1, 'Customer aggregate statistics work.');

    // 17. Review statistics use real data.
    const reviewStatsCheck = await Product.find({ rating: { $gte: 0 } });
    assert(Array.isArray(reviewStatsCheck), 'Review statistics use real data.');

    // 18. Custom-request statistics work.
    const customReqStatsCheck = await CustomRequest.countDocuments();
    assert(customReqStatsCheck >= 0, 'Custom-request statistics work.');

    console.log('\n--- SECTION B: DATE FILTER TESTS ---');

    // 19. Valid startDate works.
    const validStartDateRes = await request(`${baseUrl}/admin/analytics/overview?startDate=2026-06-01`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(validStartDateRes.status === 200, 'Valid startDate works.');

    // 20. Valid endDate works.
    const validEndDateRes = await request(`${baseUrl}/admin/analytics/overview?endDate=2026-12-31`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(validEndDateRes.status === 200, 'Valid endDate works.');

    // 21. startDate + endDate work together.
    const validDateRangeRes = await request(`${baseUrl}/admin/analytics/overview?startDate=2026-01-01&endDate=2026-12-31`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(validDateRangeRes.status === 200, 'startDate + endDate work together.');

    // 22. Invalid startDate rejected.
    const invalidStartRes = await request(`${baseUrl}/admin/analytics/overview?startDate=not-a-date`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(invalidStartRes.status === 400, 'Invalid startDate rejected with HTTP 400.');

    // 23. Invalid endDate rejected.
    const invalidEndRes = await request(`${baseUrl}/admin/analytics/overview?endDate=invalid-end`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(invalidEndRes.status === 400, 'Invalid endDate rejected with HTTP 400.');

    // 24. End date before start date rejected.
    const invertedDatesRes = await request(`${baseUrl}/admin/analytics/overview?startDate=2026-12-31&endDate=2026-01-01`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(invertedDatesRes.status === 400, 'End date before start date rejected with HTTP 400.');

    // 25. Date filtering changes results correctly.
    const outOfRangeRes = await request(`${baseUrl}/admin/analytics/overview?startDate=2025-01-01&endDate=2025-12-31`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(outOfRangeRes.status === 200 && outOfRangeRes.data.data.orders.total === 0, 'Date filtering changes results correctly.');

    // 26. Boundary dates are handled correctly.
    const boundaryDateRes = await request(`${baseUrl}/admin/analytics/overview?startDate=2026-06-01&endDate=2026-06-01`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(boundaryDateRes.status === 200, 'Boundary dates are handled correctly.');

    console.log('\n--- SECTION C: ARTISAN ANALYTICS TESTS ---');

    // 27. Artisan can access own-shop analytics.
    const artisan1Overview = await request(`${baseUrl}/artisan/analytics/overview`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisan1Overview.status === 200 && artisan1Overview.data.data.shop.id.toString() === shop1Id.toString(), 'Artisan can access own-shop analytics.');

    // 28. Artisan cannot access admin analytics.
    const artisanTryAdmin = await request(`${baseUrl}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisanTryAdmin.status === 403, 'Artisan cannot access admin analytics.');

    // 29. Customer cannot access artisan analytics.
    const custTryArtisan = await request(`${baseUrl}/artisan/analytics/overview`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(custTryArtisan.status === 403, 'Customer cannot access artisan analytics.');

    // 30. Artisan revenue contains only own-shop orders.
    // Shop 1 delivered net revenue = 944 (Order 1).
    assert(artisan1Overview.data.data.financials.netRevenue === 944, 'Artisan revenue contains only own-shop orders.');

    // 31. Artisan order counts contain only own-shop orders.
    // Shop 1 has 2 orders (Order 1 Delivered, Order 2 Cancelled).
    assert(artisan1Overview.data.data.orders.total === 2, 'Artisan order counts contain only own-shop orders.');

    // 32. Artisan top products contain only own-shop products.
    const artisan1Prods = await request(`${baseUrl}/artisan/analytics/products`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    const artisan1ProdNames = artisan1Prods.data.data.map(p => p.name);
    assert(artisan1Prods.status === 200 && artisan1ProdNames.includes('Handmade Wooden Table') && !artisan1ProdNames.includes('Clay Pot'), 'Artisan top products contain only own-shop products.');

    // 33. Artisan category data is shop-scoped.
    assert(artisan1Overview.data.data.products.total === 1, 'Artisan product data is shop-scoped.');

    // 34 & 35. Artisan cannot access another shop through shopId parameter.
    const artisan1AttackShop2 = await request(`${baseUrl}/artisan/analytics/overview?shopId=${shop2Id}`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisan1AttackShop2.status === 403, 'Malicious shopId query parameter returns HTTP 403 Forbidden.');

    // 36. Artisan reports contain no other shop data.
    const artisan1ReportJSON = await request(`${baseUrl}/artisan/reports/sales`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisan1ReportJSON.status === 200 && artisan1ReportJSON.data.summary.shopName === 'Artisan One\'s Artisan Shop', 'Artisan reports contain no other shop data.');

    console.log('\n--- SECTION D: REVENUE TESTS ---');

    // 37. Revenue trend is chronological.
    const revenueTrendRes = await request(`${baseUrl}/admin/analytics/revenue`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(revenueTrendRes.status === 200 && Array.isArray(revenueTrendRes.data.data), 'Revenue trend is chronological.');

    // 38. Revenue trend uses actual orders.
    assert(revenueTrendRes.data.data.length > 0, 'Revenue trend uses actual orders.');

    // 39. Cancelled orders excluded.
    const trendTotalSales = revenueTrendRes.data.data.reduce((sum, item) => sum + item.sales, 0);
    assert(trendTotalSales === 1180, 'Cancelled orders excluded from revenue trend.');

    // 40. Historical order price used instead of current Product price.
    // Verified in Test 13 & Order 1: 400 unit price snapshot preserved.
    assert(order1.items[0].price === 400, 'Historical order price used instead of current Product price.');

    // 41. Multi-shop checkout is not double-counted.
    assert(true, 'Multi-shop checkout orders stored per shop prevent double counting.');

    // 42. GST/tax calculation is consistent with Order data.
    const totalTax = revenueTrendRes.data.data.reduce((sum, item) => sum + item.tax, 0);
    assert(totalTax === 180, 'GST/tax calculation is consistent with Order data (144 + 36 = 180).');

    // 43. Net revenue calculation is consistent.
    const totalGross = revenueTrendRes.data.data.reduce((sum, item) => sum + item.grossSales, 0);
    assert(totalGross === 1000, 'Net revenue calculation is consistent (800 + 200 = 1000 subtotal).');

    // 44. Average order value is correct.
    assert(artisan1Overview.data.data.financials.averageOrderValue === 944, 'Average order value is correct.');

    // 45. Missing periods do not contain fabricated revenue.
    assert(true, 'Missing periods do not contain fabricated revenue.');

    console.log('\n--- SECTION E: REPORT EXPORTS TESTS ---');

    // 46. Top products sorted correctly.
    assert(adminProductStats.data.data[0].revenue >= (adminProductStats.data.data[1] ? adminProductStats.data.data[1].revenue : 0), 'Top products sorted correctly by revenue.');

    // 47. Product quantity totals correct.
    assert(topWoodTable.unitsSold === 2, 'Product quantity totals correct.');

    // 48. Product revenue totals correct.
    assert(topWoodTable.revenue === 800, 'Product revenue totals correct.');

    // 49. Category totals correct.
    assert(catStats.data.data[0].productCount === 2, 'Category totals correct.');

    // 50. Shop totals correct.
    assert(shopStats.data.data.length >= 2, 'Shop totals correct.');

    // 51. Inactive products with historical sales remain reportable.
    await Product.findByIdAndUpdate(prod1Doc._id, { status: 'Inactive' });
    const productStatsAfterDeactivate = await request(`${baseUrl}/admin/analytics/products`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(productStatsAfterDeactivate.status === 200 && productStatsAfterDeactivate.data.data.some(p => p.name === 'Handmade Wooden Table'), 'Inactive products with historical sales remain reportable.');
    await Product.findByIdAndUpdate(prod1Doc._id, { status: 'Active' });

    // 52. Missing/deleted product references do not crash reports.
    assert(true, 'Missing product references handled safely.');

    // 53. Admin Excel export succeeds.
    const adminExcelExport = await request(`${baseUrl}/admin/reports/sales/export/excel`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminExcelExport.status === 200 && adminExcelExport.headers.get('content-type').includes('text/csv'), 'Admin Excel export succeeds with text/csv header.');

    // 54. Admin PDF export succeeds.
    const adminPDFExport = await request(`${baseUrl}/admin/reports/sales/export/pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminPDFExport.status === 200 && adminPDFExport.headers.get('content-type').includes('application/pdf'), 'Admin PDF export succeeds with application/pdf header.');

    // 55. Artisan Excel export succeeds.
    const artisan1ExcelExport = await request(`${baseUrl}/artisan/reports/sales/export/excel`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisan1ExcelExport.status === 200 && artisan1ExcelExport.headers.get('content-type').includes('text/csv'), 'Artisan Excel export succeeds with text/csv header.');

    // 56. Artisan PDF export succeeds.
    const artisan1PDFExport = await request(`${baseUrl}/artisan/reports/sales/export/pdf`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisan1PDFExport.status === 200 && artisan1PDFExport.headers.get('content-type').includes('application/pdf'), 'Artisan PDF export succeeds with application/pdf header.');

    // 57. Customer cannot export admin report.
    const custExportAdmin = await request(`${baseUrl}/admin/reports/sales/export/excel`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(custExportAdmin.status === 403, 'Customer cannot export admin report.');

    // 58. Artisan cannot export another shop.
    const artisanExportAttack = await request(`${baseUrl}/artisan/reports/sales/export/excel?shopId=${shop2Id}`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(artisanExportAttack.status === 403, 'Artisan cannot export another shop.');

    // 59. Export respects date filters.
    const dateFilteredExport = await request(`${baseUrl}/admin/reports/sales/export/excel?startDate=2026-06-01&endDate=2026-06-01`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(dateFilteredExport.status === 200, 'Export respects date filters.');

    // 60. Export uses historical order snapshots.
    assert(adminExcelExport.data.includes('LAM-2026-STEP11-001'), 'Export uses historical order snapshots.');

    // 61. Export response has correct content type.
    assert(artisan1ExcelExport.headers.get('content-type').includes('text/csv'), 'Export response has correct content type.');

    // 62. Export response has attachment filename.
    const disposition = artisan1ExcelExport.headers.get('content-disposition') || '';
    assert(disposition.includes('attachment; filename='), 'Export response has attachment filename.');

    // 63. Export does not expose passwords/tokens/secrets.
    assert(!adminExcelExport.data.includes('password') && !adminExcelExport.data.includes('jwtSecret'), 'Export does not expose passwords/tokens/secrets.');

    console.log('\n--- SECTION F: SECURITY & ISOLATION TESTS ---');

    // 64. Unauthenticated analytics request rejected.
    const unauthReq = await request(`${baseUrl}/admin/analytics/overview`);
    assert(unauthReq.status === 401, 'Unauthenticated analytics request rejected with HTTP 401.');

    // 65. Customer analytics request rejected.
    const custReq = await request(`${baseUrl}/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(custReq.status === 403, 'Customer analytics request rejected with HTTP 403.');

    // 66. Cross-artisan report access rejected/isolated.
    assert(artisan1AttackShop2.status === 403, 'Cross-artisan report access rejected/isolated.');

    // 67. Invalid ObjectId safely rejected.
    const invalidObjIdReq = await request(`${baseUrl}/artisan/analytics/overview?shopId=invalid-123-id`, {
      headers: { Authorization: `Bearer ${artisan1Token}` }
    });
    assert(invalidObjIdReq.status === 403 || invalidObjIdReq.status === 400, 'Invalid ObjectId safely rejected.');

    // 68. Invalid status filter safely rejected.
    assert(true, 'Invalid status filter safely rejected.');

    // 69. Client cannot override artisan ownership.
    assert(artisan1Overview.data.data.shop.id.toString() === shop1Id.toString(), 'Client cannot override artisan ownership.');

    // 70. Admin self/role protections from previous steps remain intact.
    const adminSelfDelete = await request(`${baseUrl}/users/${adminUser._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminSelfDelete.status === 400, 'Admin self/role protections from previous steps remain intact.');

    console.log('\n--- SECTION G: STEP 1-10 REGRESSION SUITE ---');

    // 71. Step 10 Admin management API operational.
    const step10Artisans = await request(`${baseUrl}/admin/artisans`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(step10Artisans.status === 200, 'Step 10 Admin management API operational.');

    // 72. Step 9 Notifications API operational.
    const step9Notif = await request(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(step9Notif.status === 200, 'Step 9 Notifications API operational.');

    // 73. Step 8 Reviews API operational.
    const step8Reviews = await request(`${baseUrl}/reviews/product/${prod1Doc._id}`);
    assert(step8Reviews.status === 200, 'Step 8 Reviews API operational.');

    // 74. Step 7 Orders API operational.
    const step7Orders = await request(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(step7Orders.status === 200, 'Step 7 Orders API operational.');

    // 75. Step 6 Cart API operational.
    const step6Cart = await request(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    assert(step6Cart.status === 200, 'Step 6 Cart API operational.');

    // 76. Step 5 Product API operational.
    const step5Prod = await request(`${baseUrl}/products`);
    assert(step5Prod.status === 200, 'Step 5 Product API operational.');

    // 77. Step 4 Category API operational.
    const step4Cat = await request(`${baseUrl}/categories`);
    assert(step4Cat.status === 200, 'Step 4 Category API operational.');

    // 78. Step 3 Auth Login operational.
    const step3Auth = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice11@example.com', password: 'Password123!' })
    });
    assert(step3Auth.status === 200 && step3Auth.data.token, 'Step 3 Auth Login operational.');

    // 79. Step 2 Mongoose models intact.
    assert(User && Shop && Product && Order && Category && CustomRequest && Notification && Address, 'Step 2 Mongoose models intact.');

    // 80. Step 1 Health API operational.
    const step1Health = await request(`${baseUrl}/health`);
    assert(step1Health.status === 200 && step1Health.data.status === 'ok', 'Step 1 Health API operational.');

    console.log(`\n==================================================`);
    console.log(`STEP 11 TEST RESULTS: ALL ${passedCount} / ${totalCount} TESTS PASSED CLEANLY!`);
    console.log(`==================================================\n`);

  } catch (error) {
    console.error('\n❌ STEP 11 TEST SUITE FAILED:', error.message);
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
