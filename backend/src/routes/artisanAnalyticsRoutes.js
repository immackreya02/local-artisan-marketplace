const express = require('express');
const router = express.Router();
const {
  getOverview,
  getRevenueTrend,
  getOrderStats,
  getProductStats,
  getSalesReport,
  exportSalesReportExcel,
  exportSalesReportPDF
} = require('../controllers/artisanAnalyticsController');

const { protect, authorize } = require('../middleware/auth');

// Protect all artisan analytics & report routes
router.use(protect);
router.use(authorize('artisan'));

// Analytics Endpoints
router.get('/overview', getOverview);
router.get('/revenue', getRevenueTrend);
router.get('/orders', getOrderStats);
router.get('/products', getProductStats);

// Report & Export Endpoints
router.get('/sales', getSalesReport);
router.get('/sales/export/excel', exportSalesReportExcel);
router.get('/sales/export/pdf', exportSalesReportPDF);

module.exports = router;
