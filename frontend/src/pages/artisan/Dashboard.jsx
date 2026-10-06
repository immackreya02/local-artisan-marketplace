import { Link } from 'react-router-dom'
import { Package, Clock, IndianRupee, Users, AlertTriangle, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from 'recharts'
import ChartTooltip from '../../components/common/ChartTooltip'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { useOrders } from '../../hooks/useOrders'
import { useProducts } from '../../hooks/useProducts'
import { useShops } from '../../hooks/useShops'
import { useLanguage } from '../../hooks/useLanguage'
import { getMonthlyTrend, hasMeaningfulTrend } from '../../utils/revenueTrend'
import { getProductMainImage, handleImageError } from '../../utils/productImageHelper'

export default function ArtisanDashboard() {
  const { user } = useAuth()
  const { getShopByOwnerId } = useShops()
  const { products } = useProducts()
  const { orders } = useOrders()
  const { t } = useLanguage()

  const shop = getShopByOwnerId(user.id)
  const shopOrders = shop ? orders.filter((o) => o.shopId === shop.id || o.shopId === shop._id) : []
  const shopProducts = shop ? products.filter((p) => p.shopId === shop.id || p.shopId === shop._id) : []
  const revenue = shopOrders.reduce((s, o) => s + (o.amount || o.totalAmount || 0), 0)
  const lowStock = shopProducts.filter((p) => p.stock > 0 && p.stock <= 5)
  const hasSales = shopOrders.length > 0
  const revenueTrend = getMonthlyTrend(shopOrders)
  const hasTrend = hasMeaningfulTrend(shopOrders)

  return (
    <DashboardLayout role="artisan" topbarPlaceholder={t('searchPlaceholder', 'Search products, orders, customers...')}>
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">{t('artisanDashboard', 'Artisan Dashboard')}</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>{t('manageShopSub', 'Manage your shop, products and orders.')}</p>
        </div>
        <span className="welcome-pill">Namaste, {user.name.split(' ')[0]} 👋</span>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={Package} label={t('totalProducts', 'Total Products')} value={shopProducts.length} />
        <StatCard icon={Clock} label={t('pendingOrders', 'Pending Orders')} value={shopOrders.filter((o) => o.status === 'Pending').length} />
        <StatCard icon={IndianRupee} label={t('revenue', 'Revenue')} value={`₹${revenue.toLocaleString('en-IN')}`} />
        <StatCard icon={Users} label={t('totalSales', 'Total Sales')} value={shopOrders.length} />
      </div>

      <div className="grid mb-6" style={{ gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card card-pad">
          <div className="flex justify-between mb-4">
            <h3 style={{ fontWeight: 600 }}>{t('revenueOverview', 'Revenue Overview')}</h3>
            {hasTrend && <span className="badge badge-stone">By month, from your real orders</span>}
          </div>
          {hasTrend ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={revenueTrend}>
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#8a7f70' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip metricName="Revenue" unit="₹" />} />
                <Line type="monotone" dataKey="v" name="Revenue" stroke="#C1673B" strokeWidth={2.5} dot={{ r: 4, fill: '#C1673B' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center" style={{ padding: '40px 0' }}>
              <TrendingUp size={22} style={{ margin: '0 auto 8px', color: 'var(--color-ink-20, var(--color-ink-10))' }} />
              <p style={{ fontSize: 14, color: 'var(--color-ink-50)', fontWeight: 500 }}>{hasSales ? 'Not enough order history yet' : 'No sales data yet'}</p>
              <p style={{ fontSize: 12, color: 'var(--color-ink-40)', marginTop: 4 }}>Your revenue trend will appear here once you have orders across more than one month.</p>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="low-stock-alert-title"><AlertTriangle size={15} /> {t('lowStockAlerts', 'Low Stock Alerts')}</div>
          {lowStock.length === 0 ? <p style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>All products are well stocked.</p> : (
            <div>
              {lowStock.map((p) => (
                <div key={p.id} className="low-stock-row"><span style={{ color: 'var(--color-ink-70)' }}>{p.name}</span><span style={{ color: '#b45309', fontWeight: 500 }}>{p.stock} left</span></div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="flex justify-between mb-4">
            <h3 style={{ fontWeight: 600 }}>{t('recentOrders', 'Recent Orders')}</h3>
            <Link to="/artisan/orders" className="view-all-link">{t('viewAll', 'View all')}</Link>
          </div>
          <table className="simple-table">
            <thead><tr><th>{t('customer', 'Customer')}</th><th>{t('product', 'Product')}</th><th>{t('status', 'Status')}</th></tr></thead>
            <tbody>
              {shopOrders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td>{o.customerName}</td>
                  <td style={{ color: 'var(--color-ink-60)' }}>{o.items[0]?.name}</td>
                  <td><Badge>{t(o.status.toLowerCase(), o.status)}</Badge></td>
                </tr>
              ))}
              {shopOrders.length === 0 && <tr><td colSpan={3} className="text-center" style={{ padding: '24px 0', color: 'var(--color-ink-40)' }}>No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card card-pad">
          <div className="flex justify-between mb-4">
            <h3 style={{ fontWeight: 600 }}>{t('topProducts', 'Top Products')}</h3>
            <Link to="/artisan/products" className="view-all-link">{t('viewAll', 'View all')}</Link>
          </div>
          <div className="flex-col gap-3">
            {shopProducts.slice(0, 5).map((p) => (
              <div key={p.id} className="flex justify-between" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={getProductMainImage(p)}
                    alt={p.name}
                    onError={(e) => handleImageError(e, p.categorySlug || p.category)}
                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', display: 'block' }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>Stock: {p.stock}</div>
                  </div>
                </div>
                <Link to={`/artisan/products/${p.id}/edit`}><Button size="sm" variant="outline">{t('edit', 'Edit')}</Button></Link>
              </div>
            ))}
            {shopProducts.length === 0 && <p style={{ fontSize: 14, color: 'var(--color-ink-45)' }}>No products listed yet.</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
