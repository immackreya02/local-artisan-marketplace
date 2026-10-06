import { Link } from 'react-router-dom'
import { Package, Heart, Clock, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import ProductCard from '../../components/common/ProductCard'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { useOrders } from '../../hooks/useOrders'
import { useProducts } from '../../hooks/useProducts'
import { useShops } from '../../hooks/useShops'
import { useLanguage } from '../../hooks/useLanguage'
import { getPublicProducts } from '../../utils/productVisibility'
import { getRecentlyViewedProducts } from '../../utils/recentlyViewed'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const { wishlist } = useCart()
  const { orders } = useOrders()
  const { products } = useProducts()
  const { shops } = useShops()
  const { t } = useLanguage()

  const myOrders = orders.filter((o) => o.customerId === user.id)
  const pending = myOrders.filter((o) => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length
  const delivered = myOrders.filter((o) => o.status === 'Delivered').length
  const wishlistProducts = (wishlist || [])
    .map((id) => products.find((p) => p.id === id || p._id === id || String(p._id) === String(id) || String(p.id) === String(id)))
    .filter(Boolean)
  const recommended = getPublicProducts(products, shops).filter((p) => !wishlist.includes(p.id) && !wishlist.includes(p._id)).slice(0, 4)
  const recentlyViewed = getRecentlyViewedProducts(products, shops)

  return (
    <DashboardLayout role="customer" topbarPlaceholder={t('searchPlaceholder', 'Search orders, products...')}>
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">{t('customerDashboard', 'Customer Dashboard')}</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>{t('manageOrdersSub', 'Manage your orders, wishlist and account.')}</p>
        </div>
        <span className="welcome-pill">{t('welcomeBack', 'Welcome back')}, {user.name.split(' ')[0]} 👋</span>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={Package} label={t('totalOrders', 'Total Orders')} value={myOrders.length} />
        <StatCard icon={Heart} label={t('wishlistItems', 'Wishlist Items')} value={wishlistProducts.length} />
        <StatCard icon={Clock} label={t('pendingOrders', 'Pending Orders')} value={pending} sub={t('awaitingDispatch', 'Awaiting dispatch')} />
        <StatCard icon={CheckCircle2} label={t('completedOrders', 'Completed Orders')} value={delivered} />
      </div>

      <div className="card card-pad mb-6">
        <div className="flex justify-between mb-4">
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>{t('recentOrders', 'Recent Orders')}</h3>
          <Link to="/customer/orders" className="view-all-link">{t('viewAllOrders', 'View all orders')}</Link>
        </div>
        <table className="simple-table">
          <thead><tr><th>{t('product', 'Product')}</th><th>{t('orderDate', 'Order Date')}</th><th>{t('status', 'Status')}</th><th></th></tr></thead>
          <tbody>
            {myOrders.slice(0, 4).map((o) => (
              <tr key={o.id}>
                <td>{o.items[0]?.name}</td>
                <td style={{ color: 'var(--color-ink-55)' }}>{o.date}</td>
                <td><Badge>{t(o.status.toLowerCase(), o.status)}</Badge></td>
                <td className="text-right"><Link to={`/customer/orders/${o.id}`}><Button size="sm" variant="outline">{t('viewOrder', 'View Order')}</Button></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recentlyViewed.length > 0 && (
        <div className="card card-pad mb-6">
          <div className="flex justify-between mb-4">
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>{t('recentlyViewed', 'Recently Viewed Crafts')}</h3>
            <Link to="/marketplace" className="view-all-link">{t('explore', 'Explore Marketplace')}</Link>
          </div>
          <div className="grid-4">
            {recentlyViewed.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      <div className="card card-pad mb-6">
        <div className="flex justify-between mb-4">
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>{t('yourWishlist', 'Your Wishlist')}</h3>
          <Link to="/customer/wishlist" className="view-all-link">{t('viewAll', 'View all')}</Link>
        </div>
        {wishlistProducts.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--color-ink-45)' }}>No items in your wishlist yet.</p>
        ) : (
          <div className="grid-4">
            {wishlistProducts.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      <div className="card card-pad">
        <div className="flex justify-between mb-4">
          <h3 className="form-section-title" style={{ marginBottom: 0 }}>{t('recommendedForYou', 'Recommended For You')}</h3>
          <Link to="/marketplace" className="view-all-link">{t('exploreMore', 'Explore more')}</Link>
        </div>
        <div className="grid-4">
          {recommended.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </DashboardLayout>
  )
}

