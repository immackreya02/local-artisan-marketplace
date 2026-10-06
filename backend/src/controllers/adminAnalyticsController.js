const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Review = require('../models/Review');
const CustomRequest = require('../models/CustomRequest');
const { parseDateRange, generateCSVReport, generatePDFReport } = require('../utils/reportHelper');

/**
 * Helper to build Order date filter based on orderDate field
 */
const buildOrderDateFilter = (start, end) => {
  const filter = {};
  if (start || end) {
    filter.orderDate = {};
    if (start) filter.orderDate.$gte = start;
    if (end) filter.orderDate.$lte = end;
  }
  return filter;
};

/**
 * @desc    Get Platform Overview Analytics (Admin only)
 * @route   GET /api/admin/analytics/overview
 * @access  Private/Admin
 */
exports.getOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const orderDateFilter = buildOrderDateFilter(start, end);

    // User counts
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalArtisans = await User.countDocuments({ role: 'artisan' });
    const activeArtisans = await User.countDocuments({ role: 'artisan', status: 'Active' });
    const pendingArtisans = await User.countDocuments({ role: 'artisan', status: 'Pending' });
    const suspendedArtisans = await User.countDocuments({ role: 'artisan', status: 'Suspended' });

    // Shop counts
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ status: 'Active' });

    // Product counts
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'Active' });

    // Order counts
    const totalOrders = await Order.countDocuments(orderDateFilter);
    const deliveredOrders = await Order.countDocuments({ ...orderDateFilter, orderStatus: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ ...orderDateFilter, orderStatus: 'Cancelled' });

    // Revenue calculations (Cancelled orders DO NOT count towards revenue)
    const validOrdersFilter = { ...orderDateFilter, orderStatus: { $ne: 'Cancelled' } };
    const validOrders = await Order.find(validOrdersFilter);

    let grossSales = 0;
    let tax = 0;
    let netRevenue = 0;

    for (const order of validOrders) {
      grossSales += order.subtotal || 0;
      tax += order.tax || 0;
      netRevenue += order.totalAmount || 0;
    }

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          artisans: totalArtisans,
          activeArtisans,
          pendingArtisans,
          suspendedArtisans
        },
        shops: {
          total: totalShops,
          active: activeShops
        },
        products: {
          total: totalProducts,
          active: activeProducts
        },
        orders: {
          total: totalOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        financials: {
          grossSales: Math.round(grossSales * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          netRevenue: Math.round(netRevenue * 100) / 100,
          validOrderCount: validOrders.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Revenue Trends (Admin only)
 * @route   GET /api/admin/analytics/revenue
 * @access  Private/Admin
 */
exports.getRevenueTrend = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const orderDateFilter = buildOrderDateFilter(start, end);
    const validOrdersFilter = { ...orderDateFilter, orderStatus: { $ne: 'Cancelled' } };

    const orders = await Order.find(validOrdersFilter).sort({ orderDate: 1 });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};

    for (const order of orders) {
      const dateObj = order.orderDate ? new Date(order.orderDate) : new Date(order.createdAt);
      let periodKey;
      let label;
      let shortMonth;

      if (groupBy === 'month') {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        periodKey = `${year}-${month}`;
        shortMonth = monthNames[dateObj.getMonth()];
        label = `${shortMonth} ${year}`;
      } else {
        periodKey = dateObj.toISOString().split('T')[0];
        shortMonth = monthNames[dateObj.getMonth()];
        label = periodKey;
      }

      if (!trendMap[periodKey]) {
        trendMap[periodKey] = {
          period: label,
          rawPeriod: periodKey,
          shortMonth,
          orders: 0,
          grossSales: 0,
          tax: 0,
          sales: 0
        };
      }
      trendMap[periodKey].orders += 1;
      trendMap[periodKey].grossSales += order.subtotal || 0;
      trendMap[periodKey].tax += order.tax || 0;
      trendMap[periodKey].sales += order.totalAmount || 0;
    }

    const trend = Object.values(trendMap).map((t) => ({
      period: t.period,
      rawPeriod: t.rawPeriod,
      shortMonth: t.shortMonth,
      orders: t.orders,
      grossSales: Math.round(t.grossSales * 100) / 100,
      tax: Math.round(t.tax * 100) / 100,
      sales: Math.round(t.sales * 100) / 100
    }));

    res.status(200).json({
      success: true,
      count: trend.length,
      data: trend
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Order Status Statistics (Admin only)
 * @route   GET /api/admin/analytics/orders
 * @access  Private/Admin
 */
exports.getOrderStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const orderDateFilter = buildOrderDateFilter(start, end);
    const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    const breakdown = {};
    for (const st of statuses) {
      breakdown[st] = await Order.countDocuments({ ...orderDateFilter, orderStatus: st });
    }

    res.status(200).json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Top Products & Product Analytics (Admin only)
 * @route   GET /api/admin/analytics/products
 * @access  Private/Admin
 */
exports.getProductStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const orderDateFilter = buildOrderDateFilter(start, end);
    const validOrders = await Order.find({ ...orderDateFilter, orderStatus: { $ne: 'Cancelled' } });

    // Aggregate top products using Order.items historical snapshots
    const productSalesMap = {};
    for (const order of validOrders) {
      for (const item of order.items) {
        const prodKey = item.product ? item.product.toString() : item.name;
        if (!productSalesMap[prodKey]) {
          productSalesMap[prodKey] = {
            productId: item.product || null,
            name: item.name,
            unitsSold: 0,
            revenue: 0
          };
        }
        productSalesMap[prodKey].unitsSold += item.quantity || 0;
        productSalesMap[prodKey].revenue += (item.price || 0) * (item.quantity || 0);
      }
    }

    const topProducts = Object.values(productSalesMap)
      .map((p) => ({
        productId: p.productId,
        name: p.name,
        unitsSold: p.unitsSold,
        revenue: Math.round(p.revenue * 100) / 100
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'Active' });

    res.status(200).json({
      success: true,
      summary: { totalProducts, activeProducts },
      count: topProducts.length,
      data: topProducts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Category Performance Analytics (Admin only)
 * @route   GET /api/admin/analytics/categories
 * @access  Private/Admin
 */
exports.getCategoryStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const categories = await Category.find();

    // Calculate product count per category
    const catStats = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id });
        return {
          categoryId: cat._id,
          name: cat.name,
          slug: cat.slug,
          productCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: catStats.length,
      data: catStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Shop Performance Analytics (Admin only)
 * @route   GET /api/admin/analytics/shops
 * @access  Private/Admin
 */
exports.getShopStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const orderDateFilter = buildOrderDateFilter(start, end);
    const validOrders = await Order.find({ ...orderDateFilter, orderStatus: { $ne: 'Cancelled' } }).populate('shop', 'name');

    const shopMap = {};
    for (const order of validOrders) {
      const shopIdStr = order.shop ? order.shop._id.toString() : 'unknown';
      const shopName = order.shop ? order.shop.name : 'Unknown Shop';

      if (!shopMap[shopIdStr]) {
        shopMap[shopIdStr] = {
          shopId: shopIdStr,
          shopName,
          orders: 0,
          grossSales: 0,
          tax: 0,
          netRevenue: 0
        };
      }

      shopMap[shopIdStr].orders += 1;
      shopMap[shopIdStr].grossSales += order.subtotal || 0;
      shopMap[shopIdStr].tax += order.tax || 0;
      shopMap[shopIdStr].netRevenue += order.totalAmount || 0;
    }

    const shopStats = Object.values(shopMap).map((s) => ({
      ...s,
      grossSales: Math.round(s.grossSales * 100) / 100,
      tax: Math.round(s.tax * 100) / 100,
      netRevenue: Math.round(s.netRevenue * 100) / 100
    }));

    res.status(200).json({
      success: true,
      count: shopStats.length,
      data: shopStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Admin Sales Report (JSON)
 * @route   GET /api/admin/reports/sales
 * @access  Private/Admin
 */
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const orderDateFilter = buildOrderDateFilter(start, end);
    const validOrders = await Order.find({ ...orderDateFilter, orderStatus: { $ne: 'Cancelled' } })
      .populate('shop', 'name')
      .populate('customer', 'name email')
      .sort({ orderDate: -1 });

    let grossSales = 0;
    let tax = 0;
    let netRevenue = 0;

    const rows = validOrders.map((order) => {
      grossSales += order.subtotal || 0;
      tax += order.tax || 0;
      netRevenue += order.totalAmount || 0;

      return {
        orderNumber: order.orderNumber,
        date: order.orderDate ? order.orderDate.toISOString().split('T')[0] : '',
        customerName: order.customer ? order.customer.name : order.shippingAddress?.name || 'Customer',
        shopName: order.shop ? order.shop.name : 'Shop',
        orderStatus: order.orderStatus,
        subtotal: order.subtotal,
        tax: order.tax,
        totalAmount: order.totalAmount
      };
    });

    res.status(200).json({
      success: true,
      summary: {
        totalOrders: validOrders.length,
        grossSales: Math.round(grossSales * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100
      },
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export Admin Sales Report as Excel (CSV)
 * @route   GET /api/admin/reports/sales/export/excel
 * @access  Private/Admin
 */
exports.exportSalesReportExcel = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const orderDateFilter = buildOrderDateFilter(start, end);
    const validOrders = await Order.find({ ...orderDateFilter, orderStatus: { $ne: 'Cancelled' } })
      .populate('shop', 'name')
      .populate('customer', 'name email')
      .sort({ orderDate: -1 });

    let grossSales = 0;
    let tax = 0;
    let netRevenue = 0;

    const rows = validOrders.map((order) => {
      grossSales += order.subtotal || 0;
      tax += order.tax || 0;
      netRevenue += order.totalAmount || 0;

      return [
        order.orderNumber,
        order.orderDate ? order.orderDate.toISOString().split('T')[0] : '',
        order.customer ? order.customer.name : order.shippingAddress?.name || 'Customer',
        order.shop ? order.shop.name : 'Shop',
        order.orderStatus,
        order.subtotal,
        order.tax,
        order.totalAmount
      ];
    });

    const csvContent = generateCSVReport({
      title: 'Platform Sales Report (Admin)',
      summary: {
        'Total Orders': validOrders.length,
        'Gross Sales (₹)': Math.round(grossSales * 100) / 100,
        'GST / Tax (₹)': Math.round(tax * 100) / 100,
        'Net Revenue (₹)': Math.round(netRevenue * 100) / 100
      },
      headers: ['Order Number', 'Date', 'Customer', 'Shop', 'Status', 'Subtotal (₹)', 'Tax (₹)', 'Total (₹)'],
      rows
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="admin_sales_report.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export Admin Sales Report as PDF
 * @route   GET /api/admin/reports/sales/export/pdf
 * @access  Private/Admin
 */
exports.exportSalesReportPDF = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const orderDateFilter = buildOrderDateFilter(start, end);
    const validOrders = await Order.find({ ...orderDateFilter, orderStatus: { $ne: 'Cancelled' } })
      .populate('shop', 'name')
      .populate('customer', 'name email')
      .sort({ orderDate: -1 });

    let grossSales = 0;
    let tax = 0;
    let netRevenue = 0;

    const rows = validOrders.map((order) => {
      grossSales += order.subtotal || 0;
      tax += order.tax || 0;
      netRevenue += order.totalAmount || 0;

      return [
        order.orderNumber,
        order.orderDate ? order.orderDate.toISOString().split('T')[0] : '',
        order.customer ? order.customer.name : 'Customer',
        order.shop ? order.shop.name : 'Shop',
        order.orderStatus,
        `Rs. ${order.totalAmount}`
      ];
    });

    const pdfContent = generatePDFReport({
      title: 'Platform Sales Report (Admin)',
      summary: {
        'Total Orders': validOrders.length,
        'Gross Sales': `Rs. ${Math.round(grossSales * 100) / 100}`,
        'Tax': `Rs. ${Math.round(tax * 100) / 100}`,
        'Net Revenue': `Rs. ${Math.round(netRevenue * 100) / 100}`
      },
      headers: ['Order #', 'Date', 'Customer', 'Shop', 'Status', 'Total'],
      rows
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="admin_sales_report.pdf"');
    return res.status(200).send(pdfContent);
  } catch (error) {
    next(error);
  }
};
