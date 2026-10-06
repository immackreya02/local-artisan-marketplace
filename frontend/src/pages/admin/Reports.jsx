import { IndianRupee, ShoppingBag, Users, Store, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ReportsPanel from '../../components/shared/ReportsPanel'
import { useOrders } from '../../hooks/useOrders'
import { useProducts } from '../../hooks/useProducts'
import { useShops } from '../../hooks/useShops'
import { useAuth } from '../../hooks/useAuth'
import {
  filterOrdersByDate, computeOrderSummary, buildOrdersRows, buildProductPerformanceRows, buildArtisanPerformanceRows,
} from '../../utils/reportGenerator'
import { generateMarketplacePDFSummary } from '../../utils/pdfReportGenerator'

const REPORT_TYPES = [
  { value: 'orders', label: 'Order Report — Order count, status, payment & details' },
  { value: 'products', label: 'Product Report — Product-wise sales, revenue, rating & performance' },
  { value: 'artisans', label: 'Artisan Report — Artisan/shop orders, revenue & performance' },
  { value: 'pdf-summary', label: 'Reports / Comprehensive PDF Summary' },
]

export default function AdminReports() {
  const { orders } = useOrders()
  const { products } = useProducts()
  const { shops } = useShops()
  const { users } = useAuth()

  const summary = computeOrderSummary(orders)

  const summaryStats = [
    { icon: IndianRupee, label: 'Total Sales', value: `₹${summary.totalRevenue.toLocaleString('en-IN')}` },
    { icon: ShoppingBag, label: 'Total Orders', value: summary.totalOrders },
    { icon: Users, label: 'Total Customers', value: users.filter((u) => u.role === 'customer').length },
    { icon: Store, label: 'Total Artisans', value: users.filter((u) => u.role === 'artisan').length },
    { icon: CheckCircle2, label: 'Active Shops', value: shops.filter((s) => s.status === 'Active').length },
  ]

  const handleGenerate = (fromDate, toDate, reportType) => {
    const rangeOrders = filterOrdersByDate(orders, fromDate, toDate)

    if (reportType === 'pdf-summary') {
      const validOrders = rangeOrders.filter((o) => (o.status || o.orderStatus) !== 'Cancelled')
      const totalRev = validOrders.reduce((sum, o) => sum + (o.amount || o.totalAmount || 0), 0)
      const totalUnits = validOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, it) => s + (it.qty || it.quantity || 0), 0), 0)
      const avgOrderVal = validOrders.length ? Math.round(totalRev / validOrders.length) : 0

      return [
        { Metric: 'Total Realized Revenue', Value: `₹${totalRev.toLocaleString('en-IN')}` },
        { Metric: 'Total Orders Placed', Value: rangeOrders.length },
        { Metric: 'Active Delivered Orders', Value: validOrders.length },
        { Metric: 'Craft Units Sold', Value: `${totalUnits} Units` },
        { Metric: 'Average Order Value (AOV)', Value: `₹${avgOrderVal.toLocaleString('en-IN')}` },
        { Metric: 'Active Artisan Studios', Value: shops.filter((s) => s.status === 'Active').length },
        { Metric: 'Active Products', Value: products.filter((p) => p.status === 'Active').length },
      ]
    }

    if (reportType === 'artisans') return buildArtisanPerformanceRows(shops, rangeOrders, products)
    if (reportType === 'products') return buildProductPerformanceRows(products, rangeOrders)
    return buildOrdersRows(rangeOrders)
  }

  const handleExportPDF = (fromDate, toDate, reportType) => {
    if (reportType === 'pdf-summary') {
      generateMarketplacePDFSummary({
        fromDate,
        toDate,
        summaryStats,
        orders,
        products,
        shops
      })
      return true
    }
    return false
  }

  return (
    <DashboardLayout role="admin">
      <ReportsPanel
        title="Reports & Analytics"
        subtitle="Generate and download platform-wide records and comprehensive PDF summaries."
        summaryStats={summaryStats}
        reportTypeOptions={REPORT_TYPES}
        onGenerate={handleGenerate}
        onExportPDF={handleExportPDF}
        filenamePrefix="platform-report"
        scopeNote="All shops"
      />
    </DashboardLayout>
  )
}

