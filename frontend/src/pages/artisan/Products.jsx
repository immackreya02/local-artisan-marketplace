import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Package, CheckCircle2, XCircle, Star, Search, FileText, Download } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'
import { useProducts } from '../../hooks/useProducts'
import { categories } from '../../data/mockData'
import { isProductPurchasable, getManagementAvailabilityBadge } from '../../utils/productAvailability'
import { generateArtisanProductsPDF } from '../../utils/pdfReportGenerator'
import { exportReportToExcel } from '../../utils/exportReport'

import { getProductMainImage, handleImageError } from '../../utils/productImageHelper'

export default function ArtisanProducts() {
  const { user } = useAuth()
  const { getShopByOwnerId } = useShops()
  const shop = getShopByOwnerId(user.id)
  const { products, deleteProduct } = useProducts()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')

  const shopProducts = products.filter((p) => p.shopId === shop?.id || p.shopId === shop?._id)
  const filtered = shopProducts.filter((p) => (status === 'All' || p.status === status) && p.name.toLowerCase().includes(query.toLowerCase()))

  const handleExportExcel = () => {
    const rows = filtered.map((p) => ({
      'Product Name': p.name,
      Category: categories.find((c) => c.id === p.category)?.name || p.category || '—',
      Price: p.price,
      Stock: p.stock,
      Status: p.status,
      Featured: p.featured ? 'Yes' : 'No'
    }))
    exportReportToExcel({ title: `${shop?.name || 'Shop'} Products`, rows, filename: `${shop?.name || 'shop'}-products` })
  }

  const handleExportPDF = () => {
    generateArtisanProductsPDF({
      shopName: shop?.name || 'Artisan Studio',
      products: filtered,
      categories
    })
  }

  return (
    <DashboardLayout role="artisan">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Product Management</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage your product catalogue.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download size={14} /> Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText size={14} /> Export PDF
          </Button>
          <Link to="/artisan/products/new"><Button><Plus size={14} /> Add Product</Button></Link>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={Package} label="Total Products" value={shopProducts.length} />
        <StatCard icon={CheckCircle2} label="Active Products" value={shopProducts.filter((p) => p.status === 'Active').length} />
        <StatCard icon={XCircle} label="Out of Stock" value={shopProducts.filter((p) => (!p.availabilityType || p.availabilityType === 'Ready to Ship') && !isProductPurchasable(p)).length} />
        <StatCard icon={Star} label="Featured Products" value={shopProducts.filter((p) => p.featured).length} />
      </div>

      <div className="flex-wrap-gap-3 mb-5">
        <div className="promo-input flex-1" style={{ minWidth: 200 }}>
          <Search size={14} className="form-input-icon" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select" style={{ width: 'auto' }}>
          {['All', 'Active', 'Inactive', 'Pending', 'Draft'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid-3">
        {filtered.map((p) => (
          <div key={p.id} className="product-grid-card">
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img
                src={getProductMainImage(p)}
                alt={p.name}
                onError={(e) => handleImageError(e, p.categorySlug || p.category)}
                style={{ height: 160, width: '100%', objectFit: 'cover', display: 'block' }}
              />
              <span style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Badge>{p.featured ? 'Featured' : p.status}</Badge>
                {getManagementAvailabilityBadge(p) && (
                  <span className={`badge ${getManagementAvailabilityBadge(p).tone}`}>{getManagementAvailabilityBadge(p).label}</span>
                )}
              </span>
            </div>
            <div className="product-grid-card-body">
              <span className="product-card-category">{categories.find((c) => c.id === p.category)?.name}</span>
              <h3 className="line-clamp-1" style={{ fontSize: 14, fontWeight: 500, margin: '4px 0' }}>{p.name}</h3>
              <div className="product-grid-card-footer">
                <span className="order-total-value" style={{ fontSize: 15 }}>₹{p.price.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>Stock: {p.stock}</span>
              </div>
              <div className="product-grid-card-actions">
                <Link to={`/artisan/products/${p.id}/edit`} className="flex-1"><Button size="sm" variant="outline" className="btn-full">Edit</Button></Link>
                <Button size="sm" variant="outline" className="btn-danger-text" onClick={() => deleteProduct(p.id)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No products match your search.</div>}
      </div>
    </DashboardLayout>
  )
}
