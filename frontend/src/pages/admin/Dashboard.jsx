import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Store, Package, ClipboardList, IndianRupee, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import ChartTooltip from '../../components/common/ChartTooltip'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import { useOrders } from '../../hooks/useOrders'
import { useProducts } from '../../hooks/useProducts'
import { useShops } from '../../hooks/useShops'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { getMonthlyTrend, hasMeaningfulTrend } from '../../utils/revenueTrend'
import { api } from '../../services/api'

import StockIntelligenceSection from '../../components/admin/StockIntelligenceSection'

export default function AdminDashboard() {
  const { orders } = useOrders()
  const { products } = useProducts()
  const { shops } = useShops()
  const { users, user } = useAuth()
  const { t } = useLanguage()

  const [overviewData, setOverviewData] = useState(null)
  const [revenueData, setRevenueData] = useState(null)

  useEffect(() => {
    if (user && user.role === 'admin') {
      api.get('/admin/analytics/overview')
        .then((res) => {
          if (res.success && res.data) setOverviewData(res.data)
        })
        .catch(() => {})

      api.get('/admin/analytics/revenue?groupBy=month')
        .then((res) => {
          if (res.success && Array.isArray(res.data)) setRevenueData(res.data)
        })
        .catch(() => {})
    }
  }, [user])

  const customersCount = overviewData?.users?.customers !== undefined
    ? overviewData.users.customers
    : users.filter((u) => u.role === 'customer').length

  const artisansCount = overviewData?.users?.artisans !== undefined
    ? overviewData.users.artisans
    : users.filter((u) => u.role === 'artisan').length

  const totalProductsCount = overviewData?.products?.total !== undefined
    ? overviewData.products.total
    : products.length

  const totalOrdersCount = overviewData?.orders?.total !== undefined
    ? overviewData.orders.total
    : orders.length

  const revenue = overviewData?.financials?.netRevenue !== undefined
    ? overviewData.financials.netRevenue
    : orders.reduce((s, o) => s + (o.amount || o.totalAmount || 0), 0)

  const pendingArtisans = shops.filter((s) => s.status === 'Pending')

  const revenueTrend = revenueData && revenueData.length > 0
    ? revenueData.map((t) => ({
        m: t.shortMonth || t.period,
        period: t.period,
        v: t.sales,
        sales: t.sales,
        orders: t.orders
      }))
    : getMonthlyTrend(orders)

  const hasTrend = (revenueData && revenueData.length > 1) || hasMeaningfulTrend(orders)

  return (
    <DashboardLayout role="admin" topbarPlaceholder={t('searchPlaceholder', 'Search users, artisans, orders...')}>
      <h1 className="page-title">{t('adminDashboard', 'Admin Dashboard')}</h1>
      <p className="page-subtitle">{t('adminDashboardSub', 'Monitor marketplace activities and manage platform operations.')}</p>

      <div className="grid-4 mb-6">
        <StatCard icon={Users} label={t('totalCustomers', 'Total Customers')} value={customersCount} />
        <StatCard icon={Store} label={t('totalArtisans', 'Total Artisans')} value={artisansCount} />
        <StatCard icon={Package} label={t('totalProducts', 'Total Products')} value={totalProductsCount} />
        <StatCard icon={ClipboardList} label={t('totalOrders', 'Total Orders')} value={totalOrdersCount} />
      </div>

      <div className="grid mb-6" style={{ gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card card-pad">
          <div className="mb-4">
            <h3 className="form-section-title" style={{ marginBottom: 4 }}><IndianRupee size={15} /> {t('totalRevenue', 'Total Revenue')}</h3>
            <div className="order-total-value" style={{ fontSize: 24, marginTop: 4 }}>₹{revenue.toLocaleString('en-IN')}</div>
          </div>
          {hasTrend ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueTrend}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C1673B" stopOpacity={0.3} /><stop offset="100%" stopColor="#C1673B" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#8a7f70' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip metricName="Revenue" unit="₹" />} />
                <Area type="monotone" dataKey="v" name="Revenue" stroke="#C1673B" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center" style={{ padding: '32px 0' }}>
              <TrendingUp size={20} style={{ margin: '0 auto 8px', color: 'var(--color-ink-20, var(--color-ink-10))' }} />
              <p style={{ fontSize: 13, color: 'var(--color-ink-50)', fontWeight: 500 }}>Not enough order history yet</p>
              <p style={{ fontSize: 12, color: 'var(--color-ink-40)', marginTop: 4 }}>The platform revenue trend will appear once orders span more than one month.</p>
            </div>
          )}
        </div>

        <div className="card card-pad flex-col gap-4">
          <div className="flex justify-between" style={{ fontSize: 14 }}><span style={{ color: 'var(--color-ink-55)' }}>{t('pendingApprovals', 'Pending Approvals')}</span><span style={{ fontWeight: 600 }}>{pendingArtisans.length}</span></div>
          <div className="flex justify-between" style={{ fontSize: 14 }}><span style={{ color: 'var(--color-ink-55)' }}>{t('activeProducts', 'Active Products')}</span><span style={{ fontWeight: 600 }}>{products.filter((p) => p.status === 'Active').length}</span></div>
          <div className="flex justify-between" style={{ fontSize: 14 }}><span style={{ color: 'var(--color-ink-55)' }}>{t('completedOrders', 'Completed Orders')}</span><span style={{ fontWeight: 600 }}>{orders.filter((o) => o.status === 'Delivered').length}</span></div>
        </div>
      </div>

      {/* Sales & Stock Intelligence Section */}
      <StockIntelligenceSection />

      <div className="grid-2">
        <div className="card card-pad">
          <div className="flex justify-between mb-4">
            <h3 style={{ fontWeight: 600 }}>{t('recentArtisanApplications', 'Recent Artisan Applications')}</h3>
            <Link to="/admin/artisans" className="view-all-link">{t('viewAll', 'View all')}</Link>
          </div>
          <div className="flex-col gap-3">
            {pendingArtisans.slice(0, 5).map((s) => (
              <div key={s.id} className="flex justify-between" style={{ fontSize: 14 }}>
                <div><div style={{ fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>{s.owner} · {s.category}</div></div>
                <Badge>{t(s.status.toLowerCase(), s.status)}</Badge>
              </div>
            ))}
            {pendingArtisans.length === 0 && <p style={{ fontSize: 14, color: 'var(--color-ink-45)' }}>No pending applications.</p>}
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex justify-between mb-4">
            <h3 style={{ fontWeight: 600 }}>{t('recentOrders', 'Recent Orders')}</h3>
            <Link to="/admin/orders" className="view-all-link">{t('viewAll', 'View all')}</Link>
          </div>
          <div className="flex-col gap-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex justify-between" style={{ fontSize: 14 }}>
                <div><div style={{ fontWeight: 500 }}>#{o.id}</div><div style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>{o.customerName} · {o.items[0]?.name}</div></div>
                <Badge>{t(o.status.toLowerCase(), o.status)}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
