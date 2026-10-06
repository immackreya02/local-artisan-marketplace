import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { IndianRupee, Package, Star, Users, TrendingUp } from 'lucide-react'
import ChartTooltip from '../../components/common/ChartTooltip'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import { useAuth } from '../../hooks/useAuth'
import { useOrders } from '../../hooks/useOrders'
import { useProducts } from '../../hooks/useProducts'
import { useShops } from '../../hooks/useShops'
import { getMonthlyTrend, hasMeaningfulTrend } from '../../utils/revenueTrend'
import { api } from '../../services/api'

export default function ArtisanAnalytics() {
  const { user } = useAuth()
  const { getShopByOwnerId } = useShops()
  const { products } = useProducts()
  const { orders } = useOrders()
  const shop = getShopByOwnerId(user.id)
  const shopOrders = shop ? orders.filter((o) => o.shopId === shop.id || o.shop === shop.id) : []
  const shopProducts = shop ? products.filter((p) => p.shopId === shop.id || p.shop === shop.id) : []

  const [analyticsData, setAnalyticsData] = useState(null)
  const [revenueData, setRevenueData] = useState(null)

  useEffect(() => {
    if (user && user.role === 'artisan') {
      api.get('/artisan/analytics/overview')
        .then((res) => {
          if (res.success && res.data) setAnalyticsData(res.data)
        })
        .catch(() => {})

      api.get('/artisan/analytics/revenue?groupBy=month')
        .then((res) => {
          if (res.success && Array.isArray(res.data)) setRevenueData(res.data)
        })
        .catch(() => {})
    }
  }, [user])

  const revenue = analyticsData?.financials?.netRevenue !== undefined
    ? analyticsData.financials.netRevenue
    : shopOrders.reduce((s, o) => s + (o.amount || o.totalAmount || 0), 0)

  const totalOrdersCount = analyticsData?.orders?.total !== undefined
    ? analyticsData.orders.total
    : shopOrders.length

  const productsCount = analyticsData?.products?.total !== undefined
    ? analyticsData.products.total
    : shopProducts.length

  const hasSales = totalOrdersCount > 0
  const revenueTrend = revenueData && revenueData.length > 0
    ? revenueData.map((t) => ({
        m: t.shortMonth || t.period,
        period: t.period,
        v: t.sales,
        sales: t.sales,
        orders: t.orders
      }))
    : getMonthlyTrend(shopOrders, { metric: 'revenue' })

  const ordersTrend = revenueData && revenueData.length > 0
    ? revenueData.map((t) => ({
        m: t.shortMonth || t.period,
        period: t.period,
        v: t.orders,
        orders: t.orders,
        sales: t.sales
      }))
    : getMonthlyTrend(shopOrders, { metric: 'orders' })

  const hasTrend = (revenueData && revenueData.length > 1) || hasMeaningfulTrend(shopOrders)

  return (
    <DashboardLayout role="artisan">
      <h1 className="page-title">Analytics</h1>
      <p className="page-subtitle">Track your shop's performance over time.</p>

      <div className="grid-4 mb-6">
        <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${revenue.toLocaleString('en-IN')}`} />
        <StatCard icon={Package} label="Orders" value={totalOrdersCount} />
        <StatCard icon={Star} label="Shop Rating" value={shop?.rating || '—'} />
        <StatCard icon={Users} label="Products Listed" value={productsCount} />
      </div>

      {hasTrend ? (
        <div className="grid-2 mb-6">
          <div className="card card-pad">
            <h3 className="form-section-title">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueTrend}>
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#8a7f70' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip metricName="Revenue" unit="₹" />} />
                <Line type="monotone" dataKey="v" name="Revenue" stroke="#C1673B" strokeWidth={2.5} dot={{ r: 4, fill: '#C1673B' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card card-pad">
            <h3 className="form-section-title">Orders Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ordersTrend}>
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#8a7f70' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip metricName="Orders" unit="" />} />
                <Bar dataKey="v" name="Orders" fill="#3F6B52" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card card-pad mb-6 text-center" style={{ padding: 48 }}>
          <TrendingUp size={24} style={{ margin: '0 auto 10px', color: 'var(--color-ink-20, var(--color-ink-10))' }} />
          <p style={{ fontSize: 14, color: 'var(--color-ink-50)', fontWeight: 500 }}>{hasSales ? 'Not enough order history yet' : 'No sales data yet'}</p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-40)', marginTop: 4 }}>Revenue and order trends will appear here once your shop has orders across more than one month.</p>
        </div>
      )}

      <div className="card card-pad">
        <h3 className="form-section-title">Product Catalogue</h3>
        {shopProducts.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--color-ink-45)' }}>No products listed yet.</p>
        ) : (
          <table className="simple-table">
            <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Rating</th></tr></thead>
            <tbody>
              {shopProducts.slice(0, 6).map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>₹{p.price.toLocaleString('en-IN')}</td>
                  <td>{p.stock}</td>
                  <td>{p.rating ? `${p.rating}★` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
