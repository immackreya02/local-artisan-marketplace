// ============================================================
// reportGenerator.js
// Pure functions that turn existing context data (orders, products,
// shops) into report rows and summary numbers. Both Artisan Reports
// and Admin Reports call these - one implementation, scoped by
// whatever slice of orders/products/shops each page passes in.
// No fake/hardcoded rows: an empty input always produces an empty
// report, which the pages show as a "No data available" empty state.
// ============================================================

export function filterOrdersByDate(orders, fromDate, toDate) {
  if (!fromDate && !toDate) return orders
  const fromTime = fromDate ? new Date(fromDate).getTime() : null
  const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null

  return orders.filter((o) => {
    const rawDate = o.date || o.orderDate || o.createdAt
    if (!rawDate) return true
    const oTime = new Date(rawDate).getTime()
    if (isNaN(oTime)) return true
    if (fromTime && oTime < fromTime) return false
    if (toTime && oTime > toTime) return false
    return true
  })
}

// SUMMARY numbers for a set of orders already scoped + date-filtered.
export function computeOrderSummary(orders) {
  const counted = orders.filter((o) => (o.status || o.orderStatus) !== 'Cancelled')
  const totalRevenue = counted.reduce((sum, o) => sum + (o.amount || o.totalAmount || 0), 0)
  const productsSold = counted.reduce((sum, o) => sum + (o.items || []).reduce((s, it) => s + (it.qty || it.quantity || 0), 0), 0)
  const avgOrderValue = counted.length ? Math.round(totalRevenue / counted.length) : 0
  return { totalRevenue, totalOrders: orders.length, productsSold, avgOrderValue }
}

// "Order Report" - one row per order with full details.
export function buildOrdersRows(orders) {
  return orders.map((o) => {
    const items = o.items || []
    const totalQty = items.reduce((s, it) => s + (it.qty || it.quantity || 0), 0)
    const firstItemName = items[0]?.name || 'Item'
    const itemsLabel = items.length > 1 ? `${firstItemName} (+${items.length - 1} more)` : firstItemName

    return {
      'Order ID': o.orderNumber || o.id,
      Date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'),
      Customer: o.customerName || '—',
      'Shop / Seller': o.shopName || o.shop?.name || '—',
      'Items': itemsLabel,
      'Qty': totalQty,
      'Amount': o.amount || o.totalAmount || 0,
      'Payment Method': o.method || o.paymentMethod || 'COD',
      'Payment Status': o.payment || o.paymentStatus || 'Paid',
      'Order Status': o.status || o.orderStatus || 'Pending',
    }
  })
}

// "Product Report" - product-wise sales, units sold, revenue, rating, stock, and performance badge.
export function buildProductPerformanceRows(products, orders) {
  const validOrders = orders.filter((o) => (o.status || o.orderStatus) !== 'Cancelled')

  return products.map((p) => {
    let unitsSold = 0
    let revenue = 0
    const pId = p.id || p._id

    validOrders.forEach((o) => {
      const item = (o.items || []).find((it) => it.productId === pId || it.productId === p._id || it.id === pId)
      if (item) {
        const itemQty = item.qty || item.quantity || 0
        unitsSold += itemQty
        revenue += itemQty * (item.price || p.price || 0)
      }
    })

    let performance = 'Regular'
    if (unitsSold >= 3 || revenue >= 5000) performance = 'Best Seller'
    else if (p.rating >= 4.8) performance = 'Top Rated'
    else if (p.stock !== undefined && p.stock <= 5) performance = 'Low Stock Alert'

    return {
      'Product Name': p.name,
      Category: p.categoryName || p.category || '—',
      'Price': p.price || 0,
      'Stock': p.stock !== undefined ? p.stock : 0,
      'Rating': p.rating ? `${p.rating} ★` : 'No rating',
      'Units Sold': unitsSold,
      'Revenue': revenue,
      'Status': p.status || 'Active',
      'Performance': performance,
    }
  })
}

// "Artisan Report" - artisan/shop-wise orders, revenue, products, ratings, and performance.
export function buildArtisanPerformanceRows(shops, orders, products = []) {
  const validOrders = orders.filter((o) => (o.status || o.orderStatus) !== 'Cancelled')

  return shops.map((s) => {
    const sId = s.id || s._id
    const shopOrders = validOrders.filter((o) => (o.shopId === sId || o.shop === sId || o.shopId === s._id))
    const revenue = shopOrders.reduce((sum, o) => sum + (o.amount || o.totalAmount || 0), 0)
    const shopProductsCount = products.filter((p) => (p.shopId === sId || p.shop === sId || p.shopId === s._id)).length

    return {
      'Shop Name': s.name,
      'Owner Name': s.owner || s.ownerName || '—',
      'Craft Category': s.category || '—',
      'Location': s.location || '—',
      'Total Products': shopProductsCount || '—',
      'Rating': s.rating ? `${s.rating} ★` : 'No rating',
      'Total Orders': shopOrders.length,
      'Revenue': revenue,
      'Status': s.status || 'Active',
    }
  })
}

