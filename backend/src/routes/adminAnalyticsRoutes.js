const express = require('express');
const router = express.Router();
const {
  getOverview,
  getRevenueTrend,
  getOrderStats,
  getProductStats,
  getCategoryStats,
  getShopStats,
  getSalesReport,
  exportSalesReportExcel,
  exportSalesReportPDF
} = require('../controllers/adminAnalyticsController');

const { protect, authorize } = require('../middleware/auth');

// Protect all admin analytics and report endpoints
router.use(protect);
router.use(authorize('admin'));

// Analytics Endpoints
router.get('/overview', getOverview);
router.get('/revenue', getRevenueTrend);
router.get('/orders', getOrderStats);
router.get('/products', getProductStats);
router.get('/categories', getCategoryStats);
router.get('/shops', getShopStats);

// Report & Export Endpoints
router.get('/sales', getSalesReport);
router.get('/sales/export/excel', exportSalesReportExcel);
router.get('/sales/export/pdf', exportSalesReportPDF);

module.exports = router;
