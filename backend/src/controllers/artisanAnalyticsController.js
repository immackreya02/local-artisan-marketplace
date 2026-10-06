const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { parseDateRange, generateCSVReport, generatePDFReport } = require('../utils/reportHelper');

/**
 * Helper to resolve artisan's shop securely
 */
const getArtisanShop = async (userId, requestedShopId) => {
  const shop = await Shop.findOne({ owner: userId });
  if (!shop) {
    return { shop: null, error: null };
  }

  // Security Audit: If client supplied a shopId parameter, verify it matches artisan's owned shop
  if (requestedShopId && requestedShopId.toString() !== shop._id.toString()) {
    return { shop: null, error: 'Forbidden: Access to another shop\'s analytics is denied', statusCode: 403 };
  }

  return { shop, error: null };
};

/**
 * Helper to build Order date filter for specific shop
 */
const buildShopOrderDateFilter = (shopId, start, end) => {
  const filter = { shop: shopId };
  if (start || end) {
    filter.orderDate = {};
    if (start) filter.orderDate.$gte = start;
    if (end) filter.orderDate.$lte = end;
  }
  return filter;
};

/**
 * @desc    Get Artisan Shop Overview Analytics (Artisan only)
 * @route   GET /api/artisan/analytics/overview
 * @access  Private/Artisan
 */
exports.getOverview = async (req, res, next) => {
  try {
    const { startDate, endDate, shopId } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const { shop, error: shopErr, statusCode: shopCode } = await getArtisanShop(req.user._id, shopId);
    if (shopErr) {
      return res.status(shopCode).json({ success: false, message: shopErr });
    }

    if (!shop) {
      return res.status(200).json({
        success: true,
        data: {
          orders: { total: 0, delivered: 0, cancelled: 0 },
          financials: { grossSales: 0, tax: 0, netRevenue: 0, unitsSold: 0, averageOrderValue: 0 },
          products: { total: 0, active: 0 }
        }
      });
    }

    const orderFilter = buildShopOrderDateFilter(shop._id, start, end);

    const totalOrders = await Order.countDocuments(orderFilter);
    const deliveredOrders = await Order.countDocuments({ ...orderFilter, orderStatus: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ ...orderFilter, orderStatus: 'Cancelled' });

    // Financial calculations (excluding Cancelled orders)
    const validOrdersFilter = { ...orderFilter, orderStatus: { $ne: 'Cancelled' } };
    const validOrders = await Order.find(validOrdersFilter);

    let grossSales = 0;
    let tax = 0;
    let netRevenue = 0;
    let unitsSold = 0;

    for (const order of validOrders) {
      grossSales += order.subtotal || 0;
      tax += order.tax || 0;
      netRevenue += order.totalAmount || 0;

      for (const item of order.items) {
        unitsSold += item.quantity || 0;
      }
    }

    const validOrderCount = validOrders.length;
    const averageOrderValue = validOrderCount > 0 ? Math.round((netRevenue / validOrderCount) * 100) / 100 : 0;

    const totalProducts = await Product.countDocuments({ shop: shop._id });
    const activeProducts = await Product.countDocuments({ shop: shop._id, status: 'Active' });

    res.status(200).json({
      success: true,
      data: {
        shop: { id: shop._id, name: shop.name, status: shop.status },
        orders: {
          total: totalOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders
        },
        financials: {
          grossSales: Math.round(grossSales * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          netRevenue: Math.round(netRevenue * 100) / 100,
          unitsSold,
          averageOrderValue
        },
        products: {
          total: totalProducts,
          active: activeProducts
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Revenue Trend for Artisan Shop (Artisan only)
 * @route   GET /api/artisan/analytics/revenue
 * @access  Private/Artisan
 */
exports.getRevenueTrend = async (req, res, next) => {
  try {
    const { startDate, endDate, shopId, groupBy } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const { shop, error: shopErr, statusCode: shopCode } = await getArtisanShop(req.user._id, shopId);
    if (shopErr) {
      return res.status(shopCode).json({ success: false, message: shopErr });
    }

    if (!shop) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const orderFilter = buildShopOrderDateFilter(shop._id, start, end);
    const validOrdersFilter = { ...orderFilter, orderStatus: { $ne: 'Cancelled' } };

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
 * @desc    Get Order Status Statistics for Artisan Shop (Artisan only)
 * @route   GET /api/artisan/analytics/orders
 * @access  Private/Artisan
 */
exports.getOrderStats = async (req, res, next) => {
  try {
    const { startDate, endDate, shopId } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const { shop, error: shopErr, statusCode: shopCode } = await getArtisanShop(req.user._id, shopId);
    if (shopErr) {
      return res.status(shopCode).json({ success: false, message: shopErr });
    }

    if (!shop) {
      return res.status(200).json({ success: true, data: {} });
    }

    const orderFilter = buildShopOrderDateFilter(shop._id, start, end);
    const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    const breakdown = {};
    for (const st of statuses) {
      breakdown[st] = await Order.countDocuments({ ...orderFilter, orderStatus: st });
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
 * @desc    Get Top Products for Artisan Shop (Artisan only)
 * @route   GET /api/artisan/analytics/products
 * @access  Private/Artisan
 */
exports.getProductStats = async (req, res, next) => {
  try {
    const { startDate, endDate, shopId } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const { shop, error: shopErr, statusCode: shopCode } = await getArtisanShop(req.user._id, shopId);
    if (shopErr) {
      return res.status(shopCode).json({ success: false, message: shopErr });
    }

    if (!shop) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const orderFilter = buildShopOrderDateFilter(shop._id, start, end);
    const validOrders = await Order.find({ ...orderFilter, orderStatus: { $ne: 'Cancelled' } });

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

    res.status(200).json({
      success: true,
      count: topProducts.length,
      data: topProducts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Sales Report for Artisan Shop (JSON)
 * @route   GET /api/artisan/reports/sales
 * @access  Private/Artisan
 */
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, shopId } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const { shop, error: shopErr, statusCode: shopCode } = await getArtisanShop(req.user._id, shopId);
    if (shopErr) {
      return res.status(shopCode).json({ success: false, message: shopErr });
    }

    if (!shop) {
      return res.status(200).json({ success: true, summary: {}, count: 0, data: [] });
    }

    const orderFilter = buildShopOrderDateFilter(shop._id, start, end);
    const validOrders = await Order.find({ ...orderFilter, orderStatus: { $ne: 'Cancelled' } })
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
        orderStatus: order.orderStatus,
        subtotal: order.subtotal,
        tax: order.tax,
        totalAmount: order.totalAmount
      };
    });

    res.status(200).json({
      success: true,
      summary: {
        shopName: shop.name,
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
 * @desc    Export Sales Report for Artisan Shop as Excel (CSV)
 * @route   GET /api/artisan/reports/sales/export/excel
 * @access  Private/Artisan
 */
exports.exportSalesReportExcel = async (req, res, next) => {
  try {
    const { startDate, endDate, shopId } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const { shop, error: shopErr, statusCode: shopCode } = await getArtisanShop(req.user._id, shopId);
    if (shopErr) {
      return res.status(shopCode).json({ success: false, message: shopErr });
    }

    if (!shop) {
      return res.status(404).json({ success: false, message: 'No shop found for this artisan' });
    }

    const orderFilter = buildShopOrderDateFilter(shop._id, start, end);
    const validOrders = await Order.find({ ...orderFilter, orderStatus: { $ne: 'Cancelled' } })
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
        order.orderStatus,
        order.subtotal,
        order.tax,
        order.totalAmount
      ];
    });

    const csvContent = generateCSVReport({
      title: `Artisan Sales Report - ${shop.name}`,
      summary: {
        'Shop Name': shop.name,
        'Total Orders': validOrders.length,
        'Gross Sales (₹)': Math.round(grossSales * 100) / 100,
        'GST / Tax (₹)': Math.round(tax * 100) / 100,
        'Net Revenue (₹)': Math.round(netRevenue * 100) / 100
      },
      headers: ['Order Number', 'Date', 'Customer', 'Status', 'Subtotal (₹)', 'Tax (₹)', 'Total (₹)'],
      rows
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="artisan_sales_report_${shop._id}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export Sales Report for Artisan Shop as PDF
 * @route   GET /api/artisan/reports/sales/export/pdf
 * @access  Private/Artisan
 */
exports.exportSalesReportPDF = async (req, res, next) => {
  try {
    const { startDate, endDate, shopId } = req.query;
    const { start, end, error, statusCode } = parseDateRange(startDate, endDate);
    if (error) {
      return res.status(statusCode).json({ success: false, message: error });
    }

    const { shop, error: shopErr, statusCode: shopCode } = await getArtisanShop(req.user._id, shopId);
    if (shopErr) {
      return res.status(shopCode).json({ success: false, message: shopErr });
    }

    if (!shop) {
      return res.status(404).json({ success: false, message: 'No shop found for this artisan' });
    }

    const orderFilter = buildShopOrderDateFilter(shop._id, start, end);
    const validOrders = await Order.find({ ...orderFilter, orderStatus: { $ne: 'Cancelled' } })
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
        order.orderStatus,
        `Rs. ${order.totalAmount}`
      ];
    });

    const pdfContent = generatePDFReport({
      title: `Artisan Sales Report - ${shop.name}`,
      summary: {
        'Shop Name': shop.name,
        'Total Orders': validOrders.length,
        'Gross Sales': `Rs. ${Math.round(grossSales * 100) / 100}`,
        'Tax': `Rs. ${Math.round(tax * 100) / 100}`,
        'Net Revenue': `Rs. ${Math.round(netRevenue * 100) / 100}`
      },
      headers: ['Order #', 'Date', 'Customer', 'Status', 'Total'],
      rows
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="artisan_sales_report_${shop._id}.pdf"`);
    return res.status(200).send(pdfContent);
  } catch (error) {
    next(error);
  }
};
