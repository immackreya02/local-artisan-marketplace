import { useState } from 'react'
import { Store, Pencil, BadgeCheck, Package, Star, Users, MapPin, Phone, Mail, Clock } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Swatch from '../../components/common/Swatch'
import StatCard from '../../components/common/StatCard'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'
import { useProducts } from '../../hooks/useProducts'
import { useOrders } from '../../hooks/useOrders'

export default function ArtisanShop() {
  const { user } = useAuth()
  const { getShopByOwnerId, updateShopDetails } = useShops()
  const { products } = useProducts()
  const { orders } = useOrders()
  const shop = getShopByOwnerId(user.id)
  const [editing, setEditing] = useState(false)
  const [desc, setDesc] = useState(shop?.description || '')

  const handleEditToggle = () => {
    if (editing) {
      // Leaving edit mode = save: persist to ShopsContext (the single
      // source of truth for shop data), not just this page's local state.
      updateShopDetails(shop.id, { description: desc })
    }
    setEditing((e) => !e)
  }

  if (!shop || shop.status === 'Pending') {
    return (
      <DashboardLayout role="artisan">
        <div className="card card-pad-lg text-center" style={{ padding: 48, color: 'var(--color-ink-50)' }}>
          <Clock size={22} style={{ margin: '0 auto 10px', color: 'var(--color-ink-20, var(--color-ink-10))' }} />
          Your shop is pending admin approval. Once approved, your storefront details will appear here.
        </div>
      </DashboardLayout>
    )
  }

  const shopProducts = products.filter((p) => p.shopId === shop.id)
  const shopOrders = orders.filter((o) => o.shopId === shop.id)

  return (
    <DashboardLayout role="artisan">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Shop Profile</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage your business information and storefront.</p>
        </div>
        <Button onClick={handleEditToggle}><Pencil size={14} /> {editing ? 'Save' : 'Edit Profile'}</Button>
      </div>

      <img
        src={shop.image || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200'}
        alt={shop.name}
        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200' }}
        style={{ height: 192, width: '100%', objectFit: 'cover', borderRadius: 'var(--radius-card)', marginBottom: 16, display: 'block' }}
      />

      <div className="card card-pad-lg flex-wrap-gap-3 mb-6" style={{ display: 'flex' }}>
        <img
          src={shop.image || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300'}
          alt={shop.name}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300' }}
          style={{ width: 96, height: 96, borderRadius: 16, objectFit: 'cover', flexShrink: 0, display: 'block' }}
        />
        <div className="flex-1">
          <div className="flex-wrap-gap-2" style={{ alignItems: 'center' }}>
            <h2 style={{ fontSize: 20 }}>{shop.name}</h2>
            {shop.verified && <span className="verified-chip"><BadgeCheck size={12} /> Verified</span>}
            <span className="category-chip">{shop.category}</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--color-ink-50)', marginTop: 4 }}>Owned by {shop.owner}</p>
          {editing ? (
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="form-textarea mt-2" />
          ) : (
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)', marginTop: 8, maxWidth: 640, lineHeight: 1.6 }}>{desc}</p>
          )}
          <div className="flex-wrap-gap-3 mt-3" style={{ fontSize: 14, color: 'var(--color-ink-55)' }}>
            <span className="flex gap-1"><MapPin size={13} /> {shop.location}</span>
            <span className="flex gap-1"><Phone size={13} /> {shop.phone}</span>
            <span className="flex gap-1"><Mail size={13} /> {shop.email}</span>
          </div>
        </div>
      </div>

      <div className="grid-3">
        <StatCard icon={Package} label="Total Products" value={shopProducts.length} />
        <StatCard icon={Star} label="Shop Rating" value={shop.rating || '—'} />
        <StatCard icon={Users} label="Total Orders" value={shopOrders.length} />
      </div>
    </DashboardLayout>
  )
}
