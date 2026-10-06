import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generates a polished, multi-section PDF summary combining platform key metrics,
 * revenue trends, top products, top artisans, category breakdown, and low stock items.
 */
export function generateMarketplacePDFSummary({
  fromDate,
  toDate,
  summaryStats,
  orders = [],
  products = [],
  shops = [],
  categories = []
}) {
  const doc = new jsPDF('p', 'mm', 'a4')

  const terracotta = [193, 103, 59] // #C1673B
  const inkDark = [35, 31, 32]
  const inkLight = [120, 110, 100]

  // Filter orders by date range
  const fromTime = fromDate ? new Date(fromDate).getTime() : null
  const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null

  const filteredOrders = orders.filter((o) => {
    const rawDate = o.date || o.orderDate || o.createdAt
    if (!rawDate) return true
    const oTime = new Date(rawDate).getTime()
    if (isNaN(oTime)) return true
    if (fromTime && oTime < fromTime) return false
    if (toTime && oTime > toTime) return false
    return true
  })

  const validOrders = filteredOrders.filter((o) => (o.status || o.orderStatus) !== 'Cancelled')

  // Document Title & Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...terracotta)
  doc.text('Local Artisan Marketplace', 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(...inkDark)
  doc.text('Comprehensive Performance & Analytics Summary Report', 14, 25)

  const dateLabel = `Date Range: ${fromDate || 'Beginning'} to ${toDate || 'Present'}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`
  doc.setFontSize(9)
  doc.setTextColor(...inkLight)
  doc.text(dateLabel, 14, 31)

  doc.setDrawColor(...terracotta)
  doc.setLineWidth(0.5)
  doc.line(14, 34, 196, 34)

  let startY = 40

  // 1. Executive Summary KPIs Table
  const totalRev = validOrders.reduce((sum, o) => sum + (o.amount || o.totalAmount || 0), 0)
  const totalUnits = validOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, it) => s + (it.qty || it.quantity || 0), 0), 0)
  const avgOrderVal = validOrders.length ? Math.round(totalRev / validOrders.length) : 0
  const activeShopsCount = shops.filter((s) => (s.status || 'Active') === 'Active').length
  const activeProductsCount = products.filter((p) => (p.status || 'Active') === 'Active').length

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...inkDark)
  doc.text('1. Executive KPI Summary', 14, startY)
  startY += 4

  const kpiData = [
    ['Total Realized Revenue', `₹${totalRev.toLocaleString('en-IN')}`],
    ['Total Orders Placed', `${filteredOrders.length} (Delivered/Active: ${validOrders.length})`],
    ['Total Craft Units Sold', `${totalUnits} Units`],
    ['Average Order Value (AOV)', `₹${avgOrderVal.toLocaleString('en-IN')}`],
    ['Active Artisan Studios', `${activeShopsCount} Verified Studios`],
    ['Active Marketplace Products', `${activeProductsCount} Craft Items`]
  ]

  autoTable(doc, {
    head: [['Marketplace Metric', 'Value / Realized Performance']],
    body: kpiData,
    startY,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: terracotta, textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  startY = doc.lastAutoTable.finalY + 10

  // 2. Top Performing Products Table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...inkDark)
  doc.text('2. Top Performing Craft Products', 14, startY)
  startY += 4

  const prodPerformance = products.map((p) => {
    let units = 0
    let rev = 0
    const pId = p.id || p._id
    validOrders.forEach((o) => {
      const item = (o.items || []).find((it) => it.productId === pId || it.productId === p._id || it.id === pId)
      if (item) {
        const q = item.qty || item.quantity || 0
        units += q
        rev += q * (item.price || p.price || 0)
      }
    })
    return { name: p.name, category: p.categoryName || p.category || '', units, rev, rating: p.rating || 0, stock: p.stock || 0 }
  }).sort((a, b) => b.rev - a.rev).slice(0, 7)

  const prodRows = prodPerformance.map((p) => [
    p.name,
    p.category,
    `${p.units}`,
    `₹${p.rev.toLocaleString('en-IN')}`,
    `${p.rating} ★`,
    `${p.stock} pcs`
  ])

  autoTable(doc, {
    head: [['Product Name', 'Category', 'Units Sold', 'Total Revenue', 'Rating', 'Stock']],
    body: prodRows.length ? prodRows : [['No product sales data in date range', '-', '-', '-', '-', '-']],
    startY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: terracotta, textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  startY = doc.lastAutoTable.finalY + 10

  // Check page height limit
  if (startY > 230) {
    doc.addPage()
    startY = 20
  }

  // 3. Top Artisan Studios Table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...inkDark)
  doc.text('3. Artisan Studio Performance Overview', 14, startY)
  startY += 4

  const shopPerformance = shops.map((s) => {
    const sId = s.id || s._id
    const shopOrders = validOrders.filter((o) => o.shopId === sId || o.shop === sId || o.shopId === s._id)
    const rev = shopOrders.reduce((sum, o) => sum + (o.amount || o.totalAmount || 0), 0)
    return { name: s.name, owner: s.owner || s.ownerName || '—', category: s.category || '—', orders: shopOrders.length, rev, rating: s.rating || 0 }
  }).sort((a, b) => b.rev - a.rev)

  const shopRows = shopPerformance.map((s) => [
    s.name,
    s.owner,
    s.category,
    `${s.orders}`,
    `₹${s.rev.toLocaleString('en-IN')}`,
    `${s.rating} ★`
  ])

  autoTable(doc, {
    head: [['Artisan Studio', 'Owner', 'Craft Category', 'Orders', 'Revenue', 'Rating']],
    body: shopRows.length ? shopRows : [['No shop activity in date range', '-', '-', '-', '-', '-']],
    startY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: terracotta, textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  startY = doc.lastAutoTable.finalY + 10

  if (startY > 230) {
    doc.addPage()
    startY = 20
  }

  // 4. Low-Stock Alert Items
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...inkDark)
  doc.text('4. Low-Stock Inventory Alerts (Restock Required ≤ 5 Units)', 14, startY)
  startY += 4

  const lowStockItems = products.filter((p) => p.stock !== undefined && p.stock <= 5).map((p) => [
    p.name,
    p.categoryName || p.category || '—',
    `₹${p.price.toLocaleString('en-IN')}`,
    `${p.stock} units left`,
    p.stock === 0 ? 'Out of Stock' : 'Low Stock Alert'
  ])

  autoTable(doc, {
    head: [['Product Name', 'Category', 'Unit Price', 'Stock Level', 'Stock Status']],
    body: lowStockItems.length ? lowStockItems : [['All products have sufficient stock inventory level', '-', '-', '-', 'Healthy']],
    startY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [180, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...inkLight)
    doc.text(`Local Artisan Marketplace Platform Report  |  Page ${i} of ${pageCount}`, 14, 287)
  }

  const filename = `marketplace-comprehensive-report-${fromDate || 'all'}-${toDate || 'today'}.pdf`
  doc.save(filename)
}

/**
 * Generates a polished, multi-section PDF summary report specifically for an Artisan Studio.
 */
export function generateArtisanPDFSummary({
  shopName = 'Artisan Studio',
  fromDate,
  toDate,
  orders = [],
  products = []
}) {
  const doc = new jsPDF('p', 'mm', 'a4')

  const terracotta = [193, 103, 59] // #C1673B
  const inkDark = [35, 31, 32]
  const inkLight = [120, 110, 100]

  // Filter orders by date range
  const fromTime = fromDate ? new Date(fromDate).getTime() : null
  const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null

  const filteredOrders = orders.filter((o) => {
    const rawDate = o.date || o.orderDate || o.createdAt
    if (!rawDate) return true
    const oTime = new Date(rawDate).getTime()
    if (isNaN(oTime)) return true
    if (fromTime && oTime < fromTime) return false
    if (toTime && oTime > toTime) return false
    return true
  })

  const validOrders = filteredOrders.filter((o) => (o.status || o.orderStatus) !== 'Cancelled')

  // Document Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...terracotta)
  doc.text(shopName, 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(...inkDark)
  doc.text('Artisan Studio Performance & Sales Summary Report', 14, 25)

  const dateLabel = `Date Range: ${fromDate || 'Beginning'} to ${toDate || 'Present'}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`
  doc.setFontSize(9)
  doc.setTextColor(...inkLight)
  doc.text(dateLabel, 14, 31)

  doc.setDrawColor(...terracotta)
  doc.setLineWidth(0.5)
  doc.line(14, 34, 196, 34)

  let startY = 40

  // 1. Executive Summary KPIs Table
  const totalRev = validOrders.reduce((sum, o) => sum + (o.amount || o.totalAmount || 0), 0)
  const totalUnits = validOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, it) => s + (it.qty || it.quantity || 0), 0), 0)
  const avgOrderVal = validOrders.length ? Math.round(totalRev / validOrders.length) : 0
  const lowStockCount = products.filter((p) => p.stock !== undefined && p.stock <= 5).length

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...inkDark)
  doc.text('1. Studio Performance Summary', 14, startY)
  startY += 4

  const kpiData = [
    ['Total Realized Revenue', `₹${totalRev.toLocaleString('en-IN')}`],
    ['Total Orders Received', `${filteredOrders.length} Orders (${validOrders.length} Active/Delivered)`],
    ['Craft Units Sold', `${totalUnits} Units`],
    ['Average Order Value (AOV)', `₹${avgOrderVal.toLocaleString('en-IN')}`],
    ['Active Product Listings', `${products.length} Items`],
    ['Low-Stock Alerts', `${lowStockCount} Items Need Restocking`]
  ]

  autoTable(doc, {
    head: [['Studio Metric', 'Performance Value']],
    body: kpiData,
    startY,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: terracotta, textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  startY = doc.lastAutoTable.finalY + 10

  // 2. Product Catalogue Performance Table
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...inkDark)
  doc.text('2. Product Catalogue & Sales Breakdown', 14, startY)
  startY += 4

  const prodPerformance = products.map((p) => {
    let units = 0
    let rev = 0
    const pId = p.id || p._id
    validOrders.forEach((o) => {
      const item = (o.items || []).find((it) => it.productId === pId || it.productId === p._id || it.id === pId)
      if (item) {
        const q = item.qty || item.quantity || 0
        units += q
        rev += q * (item.price || p.price || 0)
      }
    })
    return { name: p.name, category: p.categoryName || p.category || 'Craft', units, rev, rating: p.rating || 0, stock: p.stock || 0 }
  }).sort((a, b) => b.rev - a.rev)

  const prodRows = prodPerformance.map((p) => [
    p.name,
    p.category,
    `${p.units}`,
    `₹${p.rev.toLocaleString('en-IN')}`,
    `${p.rating} ★`,
    `${p.stock} pcs`
  ])

  autoTable(doc, {
    head: [['Product Name', 'Category', 'Units Sold', 'Total Revenue', 'Rating', 'Stock']],
    body: prodRows.length ? prodRows : [['No product sales data recorded', '-', '-', '-', '-', '-']],
    startY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: terracotta, textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  startY = doc.lastAutoTable.finalY + 10

  if (startY > 230) {
    doc.addPage()
    startY = 20
  }

  // 3. Low-Stock Inventory Alerts
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...inkDark)
  doc.text('3. Low Stock Inventory Warnings (≤ 5 Units)', 14, startY)
  startY += 4

  const lowStockItems = products.filter((p) => p.stock !== undefined && p.stock <= 5).map((p) => [
    p.name,
    `₹${p.price.toLocaleString('en-IN')}`,
    `${p.stock} pcs left`,
    p.stock === 0 ? 'Out of Stock' : 'Low Stock'
  ])

  autoTable(doc, {
    head: [['Product Name', 'Price', 'Current Stock', 'Status']],
    body: lowStockItems.length ? lowStockItems : [['All inventory levels are healthy', '-', '-', 'Sufficient']],
    startY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [180, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...inkLight)
    doc.text(`${shopName} Studio Summary  |  Page ${i} of ${pageCount}`, 14, 287)
  }

  const cleanName = shopName.toLowerCase().replace(/[^a-z0-0]/g, '-').replace(/-+/g, '-')
  const filename = `${cleanName}-performance-summary-${fromDate || 'all'}-${toDate || 'today'}.pdf`
  doc.save(filename)
}

/**
 * Generates a clean PDF document for Artisan Orders list.
 */
export function generateArtisanOrdersPDF({ shopName = 'Artisan Studio', orders = [], title = 'Orders Report' }) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const terracotta = [193, 103, 59]
  const inkDark = [35, 31, 32]
  const inkLight = [120, 110, 100]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...terracotta)
  doc.text(shopName, 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(...inkDark)
  doc.text(title, 14, 25)

  doc.setFontSize(9)
  doc.setTextColor(...inkLight)
  doc.text(`Total Orders: ${orders.length}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 31)

  doc.setDrawColor(...terracotta)
  doc.setLineWidth(0.5)
  doc.line(14, 34, 196, 34)

  const rows = orders.map((o) => {
    const itemNames = (o.items || []).map((it) => `${it.name} (x${it.qty || it.quantity || 1})`).join(', ') || 'Craft Item'
    return [
      o.id || o._id || '—',
      o.customerName || o.customer?.name || 'Customer',
      o.date || o.orderDate || '—',
      o.status || 'Pending',
      itemNames,
      `₹${(o.amount || o.totalAmount || 0).toLocaleString('en-IN')}`
    ]
  })

  autoTable(doc, {
    head: [['Order ID', 'Customer', 'Date', 'Status', 'Items', 'Total Amount']],
    body: rows.length ? rows : [['No orders available', '-', '-', '-', '-', '-']],
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: terracotta, textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  const cleanName = shopName.toLowerCase().replace(/[^a-z0-0]/g, '-').replace(/-+/g, '-')
  doc.save(`${cleanName}-orders-report.pdf`)
}

/**
 * Generates a clean PDF document for Artisan Products catalog.
 */
export function generateArtisanProductsPDF({ shopName = 'Artisan Studio', products = [], categories = [] }) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const terracotta = [193, 103, 59]
  const inkDark = [35, 31, 32]
  const inkLight = [120, 110, 100]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...terracotta)
  doc.text(shopName, 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(...inkDark)
  doc.text('Craft Product Catalogue Report', 14, 25)

  doc.setFontSize(9)
  doc.setTextColor(...inkLight)
  doc.text(`Total Products: ${products.length}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 31)

  doc.setDrawColor(...terracotta)
  doc.setLineWidth(0.5)
  doc.line(14, 34, 196, 34)

  const rows = products.map((p) => {
    const catName = p.categoryName || categories.find((c) => c.id === p.category || c._id === p.category)?.name || p.category || 'Craft'
    return [
      p.name,
      catName,
      `₹${(p.price || 0).toLocaleString('en-IN')}`,
      `${p.stock ?? 0} pcs`,
      p.status || 'Active',
      `${p.rating || 0} ★`
    ]
  })

  autoTable(doc, {
    head: [['Product Name', 'Category', 'Price', 'Stock', 'Status', 'Rating']],
    body: rows.length ? rows : [['No products available', '-', '-', '-', '-', '-']],
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: terracotta, textColor: [255, 255, 255], fontStyle: 'bold' }
  })

  const cleanName = shopName.toLowerCase().replace(/[^a-z0-0]/g, '-').replace(/-+/g, '-')
  doc.save(`${cleanName}-products-catalogue.pdf`)
}

