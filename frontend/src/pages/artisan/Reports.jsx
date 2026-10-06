import { IndianRupee, Package, ShoppingBag, TrendingUp } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ReportsPanel from '../../components/shared/ReportsPanel'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'
import { useOrders } from '../../hooks/useOrders'
import { useProducts } from '../../hooks/useProducts'
import {
  filterOrdersByDate, computeOrderSummary, buildOrdersRows, buildProductPerformanceRows,
} from '../../utils/reportGenerator'
import { generateArtisanPDFSummary } from '../../utils/pdfReportGenerator'

const REPORT_TYPES = [
  { value: 'sales', label: 'Sales Report — Shop sales & revenue breakdown' },
  { value: 'orders', label: 'Orders Report — Customer order log & delivery details' },
  { value: 'products', label: 'Product Performance Report — Product sales, revenue & stock' },
  { value: 'pdf-summary', label: 'Reports / Comprehensive PDF Summary' },
]

export default function ArtisanReports() {
  const { user } = useAuth()
  const { getShopByOwnerId } = useShops()
  const shop = getShopByOwnerId(user.id)
  const { orders } = useOrders()
  const { products } = useProducts()

  // Scoped strictly to this artisan's own shop - never another artisan's data.
  const shopOrders = shop ? orders.filter((o) => o.shopId === shop.id) : []
  const shopProducts = shop ? products.filter((p) => p.shopId === shop.id) : []
  const summary = computeOrderSummary(shopOrders)

  const summaryStats = [
    { icon: IndianRupee, label: 'Total Revenue', value: `₹${summary.totalRevenue.toLocaleString('en-IN')}` },
    { icon: ShoppingBag, label: 'Total Orders', value: summary.totalOrders },
    { icon: Package, label: 'Products Sold', value: summary.productsSold },
    { icon: TrendingUp, label: 'Average Order Value', value: `₹${summary.avgOrderValue.toLocaleString('en-IN')}` },
  ]

  const handleGenerate = (fromDate, toDate, reportType) => {
    const rangeOrders = filterOrdersByDate(shopOrders, fromDate, toDate)

    if (reportType === 'pdf-summary') {
      const validOrders = rangeOrders.filter((o) => (o.status || o.orderStatus) !== 'Cancelled')
      const totalRev = validOrders.reduce((sum, o) => sum + (o.amount || o.totalAmount || 0), 0)
      const totalUnits = validOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, it) => s + (it.qty || it.quantity || 0), 0), 0)
      const avgOrderVal = validOrders.length ? Math.round(totalRev / validOrders.length) : 0

      return [
        { Metric: 'Total Realized Revenue', Value: `₹${totalRev.toLocaleString('en-IN')}` },
        { Metric: 'Total Orders Received', Value: rangeOrders.length },
        { Metric: 'Active Delivered Orders', Value: validOrders.length },
        { Metric: 'Craft Units Sold', Value: `${totalUnits} Units` },
        { Metric: 'Average Order Value (AOV)', Value: `₹${avgOrderVal.toLocaleString('en-IN')}` },
        { Metric: 'Active Product Listings', Value: shopProducts.length },
      ]
    }

    if (reportType === 'products') return buildProductPerformanceRows(shopProducts, rangeOrders)
    return buildOrdersRows(rangeOrders) // 'sales' and 'orders' share the same row shape
  }

  const handleExportPDF = (fromDate, toDate, reportType) => {
    if (reportType === 'pdf-summary') {
      generateArtisanPDFSummary({
        shopName: shop?.name || 'Artisan Studio',
        fromDate,
        toDate,
        orders: shopOrders,
        products: shopProducts
      })
      return true
    }
    return false
  }

  return (
    <DashboardLayout role="artisan">
      <ReportsPanel
        title="Reports"
        subtitle="Generate and download structured records for your shop."
        summaryStats={summaryStats}
        reportTypeOptions={REPORT_TYPES}
        onGenerate={handleGenerate}
        onExportPDF={handleExportPDF}
        filenamePrefix={`${shop?.name || 'shop'}-report`}
        scopeNote={shop?.name}
      />
    </DashboardLayout>
  )
}
