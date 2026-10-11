import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Store, BadgeCheck, Package, Grid3x3, Star, CalendarClock, PenLine } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import Swatch from '../../components/common/Swatch'
import Button from '../../components/common/Button'
import WhatsAppButton from '../../components/common/WhatsAppButton'
import Rating from '../../components/common/Rating'
import StatCard from '../../components/common/StatCard'
import ProductCard from '../../components/common/ProductCard'
import { categories } from '../../data/mockData'
import { useShops } from '../../hooks/useShops'
import { useProducts } from '../../hooks/useProducts'
import { useAuth } from '../../hooks/useAuth'
import { getPublicProducts } from '../../utils/productVisibility'

export default function ShopPage() {
  const { shopId } = useParams()
  const { user } = useAuth()
  const { shops, getShopById } = useShops()
  const { products } = useProducts()
  const shop = getShopById(shopId)
  const [filter, setFilter] = useState('All')

  if (!shop) {
    return <PublicLayout><div className="container text-center" style={{ maxWidth: 640, paddingTop: 96 }}>Shop not found.</div></PublicLayout>
  }
  // A Pending/Rejected/Suspended shop's storefront isn't publicly visible -
  // only its own artisan (via the Artisan dashboard) can see it in that state.
  if (shop.status !== 'Active') {
    return <PublicLayout><div className="container text-center" style={{ maxWidth: 640, paddingTop: 96 }}>This shop is currently unavailable.</div></PublicLayout>
  }

  // Same shared rule as everywhere else: only Active products from an
  // Active shop are shown publicly - a Draft or a Pending shop's
  // products never appear here, even on that shop's own page.
  const shopProducts = getPublicProducts(products, shops).filter((p) => p.shopId === shop.id)
  const shopCategories = ['All', ...new Set(shopProducts.map((p) => categories.find((c) => c.id === p.category)?.name))]
  const filtered = filter === 'All' ? shopProducts : shopProducts.filter((p) => categories.find((c) => c.id === p.category)?.name === filter)

  return (
    <PublicLayout>
      <div className="container" style={{ paddingTop: 32 }}>
        <p className="breadcrumb"><Link to="/">Home</Link> / <Link to="/shops">Shops</Link> / <span>{shop.name}</span></p>

        {shop.image && (shop.image.startsWith('http') || shop.image.startsWith('/')) ? (
          <img src={shop.image} alt={shop.name} className="shop-hero-overlap" style={{ height: 224, width: '100%', objectFit: 'cover', borderRadius: 16 }} />
        ) : (
          <Swatch seed={shop.id + 'banner'} className="shop-hero-overlap" style={{ height: 224, width: '100%' }} />
        )}
        <div className="shop-header">
          {shop.image && (shop.image.startsWith('http') || shop.image.startsWith('/')) ? (
            <img src={shop.image} alt={shop.name} style={{ width: 96, height: 96, flexShrink: 0, objectFit: 'cover', borderRadius: 16 }} />
          ) : (
            <Swatch seed={shop.id} icon={Store} rounded="rounded-2xl" style={{ width: 96, height: 96, flexShrink: 0 }} />
          )}
          <div className="shop-header-info">
            <div className="shop-header-name-row">
              <h1 style={{ fontSize: 24 }}>{shop.name}</h1>
              {shop.verified && <span className="verified-chip"><BadgeCheck size={12} /> Verified Artisan</span>}
            </div>
            <div className="shop-header-meta">
              <span>{shop.owner}</span><span>·</span><span>{shop.location}</span><span>·</span>
              <span className="category-chip">{shop.category}</span><span>·</span>
              <Rating value={shop.rating} count={shop.reviewCount} />
            </div>
            <p className="shop-header-desc">{shop.description}</p>
          </div>
          <div className="shop-header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {user?.role !== 'admin' && user?.role !== 'artisan' && (
              <Link to={`/customer/custom-requests/new?shopId=${shop.id}`}><Button variant="outline"><PenLine size={14} /> Request Customization</Button></Link>
            )}
            <WhatsAppButton shopName={shop.name} phone={shop.phone || '919876543210'} label="WhatsApp Seller" size="md" />
          </div>
        </div>

        <div className="grid-4 mt-8 mb-8">
          <StatCard icon={Package} label="Total Products" value={shopProducts.length} />
          <StatCard icon={Grid3x3} label="Categories" value={shopCategories.length - 1} />
          <StatCard icon={Star} label="Shop Rating" value={shop.rating} />
          <StatCard icon={CalendarClock} label="Years in Business" value={shop.years} />
        </div>

        <div className="collection-header">
          <div>
            <h2 className="section-title-sm">Handcrafted Collection</h2>
            <p style={{ fontSize: 14, color: 'var(--color-ink-50)' }}>Explore {shopProducts.length} handmade pieces from this workshop</p>
          </div>
          <div className="chip-filter-row">
            {shopCategories.map((c) => (
              <button key={c} onClick={() => setFilter(c)} className={`chip-filter${filter === c ? ' active' : ''}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="grid-4" style={{ paddingBottom: 64 }}>
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No products in this category yet.</div>}
        </div>
      </div>
    </PublicLayout>
  )
}
