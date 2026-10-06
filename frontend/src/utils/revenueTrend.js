// ============================================================
// revenueTrend.js
// Turns a shop's real orders into a monthly trend - no fabricated
// history. If there isn't enough real data to show a meaningful
// trend (fewer than 2 distinct months with activity), the caller
// should show an "insufficient data" empty state instead of a chart.
// ============================================================

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Groups orders by calendar month (YYYY-MM) and returns
// [{ m: 'May', period: 'May 2026', revenue: 4720, orders: 3, v: 4720 }, ...] in chronological order.
export function getMonthlyTrend(orders, { metric = 'revenue' } = {}) {
  const counted = (orders || []).filter((o) => (o.status || o.orderStatus) !== 'Cancelled')
  const byMonth = {}

  counted.forEach((o) => {
    const rawDate = o.orderDate || o.date || o.createdAt
    if (!rawDate) return
    const dateObj = new Date(rawDate)
    if (isNaN(dateObj.getTime())) return

    const year = dateObj.getFullYear()
    const monthIdx = dateObj.getMonth()
    const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`

    if (!byMonth[monthKey]) {
      const shortMonth = MONTH_LABELS[monthIdx] || 'Jan'
      byMonth[monthKey] = {
        shortMonth,
        fullPeriod: `${shortMonth} ${year}`,
        revenue: 0,
        orders: 0
      }
    }

    const amt = o.totalAmount !== undefined ? o.totalAmount : (o.amount !== undefined ? o.amount : (o.subtotal || 0))
    byMonth[monthKey].revenue += Number(amt || 0)
    byMonth[monthKey].orders += 1
  })

  const months = Object.keys(byMonth).sort()
  return months.map((key) => {
    const item = byMonth[key]
    const val = metric === 'orders' ? item.orders : Math.round(item.revenue * 100) / 100
    return {
      m: item.shortMonth,
      period: item.fullPeriod,
      revenue: Math.round(item.revenue * 100) / 100,
      sales: Math.round(item.revenue * 100) / 100,
      orders: item.orders,
      v: val
    }
  })
}

// A trend needs at least 2 distinct active months to mean anything -
// a single data point isn't a "trend", it's just one number.
export function hasMeaningfulTrend(orders) {
  return getMonthlyTrend(orders).length >= 2
}
