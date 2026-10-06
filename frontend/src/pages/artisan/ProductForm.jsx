import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UploadCloud, Package, ShieldAlert } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'
import { useProducts } from '../../hooks/useProducts'
import { categories } from '../../data/mockData'
import { AVAILABILITY_TYPES } from '../../utils/productAvailability'

export default function ProductForm() {
  const { productId } = useParams()
  const isEdit = Boolean(productId)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getShopByOwnerId } = useShops()
  const shop = getShopByOwnerId(user.id)
  // Single source of truth for the approval gate: read shop.status straight
  // from ShopsContext rather than tracking a second flag anywhere. Only an
  // Active (admin-approved) shop may publish - Pending, Rejected and
  // Suspended shops (and having no shop at all) can only save drafts.
  const canPublish = shop?.status === 'Active'
  const publishBlockedReason = !shop
    ? 'Your account has no shop set up yet, so products can only be saved as drafts.'
    : shop.status === 'Pending'
      ? 'Your shop is awaiting admin approval. You can save products as drafts, but publishing is available after your shop is approved.'
      : shop.status === 'Rejected'
        ? 'Your shop application was rejected, so publishing is unavailable. You can still save drafts.'
        : shop.status === 'Suspended'
          ? 'Your shop is currently suspended, so publishing is unavailable. You can still save drafts.'
          : null
  const { products, addProduct, updateProduct } = useProducts()
  const existing = isEdit ? products.find((p) => p.id === productId) : null

  const [form, setForm] = useState({
    name: existing?.name || '',
    category: existing?.category || categories[0].id,
    description: existing?.description || '',
    // The Price field represents MRP (pre-discount price) - for an
    // existing product we show its stored MRP here, not the already-
    // discounted selling price, so re-editing doesn't compound the discount.
    price: existing?.mrp ?? existing?.price ?? '',
    discount: existing?.discount ?? 0,
    stock: existing?.stock ?? '',
    sku: existing?.sku || `LAM-${Math.floor(1000 + Math.random() * 9000)}`,
    // Active/Inactive bug fix: reflect the product's actual stored status,
    // not just "anything that isn't Draft".
    active: existing ? existing.status !== 'Inactive' : true,
    featured: existing?.featured || false,
    availabilityType: existing?.availabilityType || 'Ready to Ship',
    productionTime: existing?.productionTime || '',
    limitedQuantity: existing?.limitedQuantity ?? '',
  })
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required.'
    if (!form.category) errs.category = 'Category is required.'
    if (!form.price || Number(form.price) <= 0) errs.price = 'Price must be a positive number.'
    if (form.stock === '' || Number(form.stock) < 0) errs.stock = 'Stock quantity cannot be negative.'
    const discountNum = Number(form.discount)
    if (form.discount !== '' && (Number.isNaN(discountNum) || discountNum < 0 || discountNum > 100)) {
      errs.discount = 'Discount must be between 0 and 100.'
    }
    if (form.availabilityType === 'Limited Edition' && (form.limitedQuantity === '' || Number(form.limitedQuantity) <= 0)) {
      errs.limitedQuantity = 'Available quantity must be a positive number.'
    }
    if (form.availabilityType === 'Made to Order' && !form.productionTime.trim()) {
      errs.productionTime = 'Please enter an approximate production time.'
    }
    return errs
  }

  const submit = (asDraft = false) => {
    if (!shop) return // No shop to attach the product to - nothing to save.
    if (!asDraft && !canPublish) return // Only an Active shop may publish.

    if (!asDraft) {
      const errs = validate()
      setErrors(errs)
      if (Object.keys(errs).length > 0) return
    }

    // Discount bug fix: "Price" the artisan enters is the MRP (pre-discount
    // price); the final selling price is always derived from MRP + discount,
    // and both the MRP and the discount % are stored so re-editing is exact.
    const mrp = Number(form.price) || 0
    const discount = Number(form.discount) || 0

    // Normalize availability string to match Mongoose enum values
    let normAvailability = 'Ready-to-Ship'
    if (form.availabilityType === 'Made to Order' || form.availabilityType === 'Made-to-Order') normAvailability = 'Made-to-Order'
    else if (form.availabilityType === 'Limited Edition') normAvailability = 'Limited Edition'
    else if (form.availabilityType === 'Pre-order' || form.availabilityType === 'Pre order') normAvailability = 'Pre-order'

    const payload = {
      shop: shop.id || shop._id,
      name: form.name,
      category: form.category,
      description: form.description,
      mrp,
      discount,
      stock: Number(form.stock) || 0,
      sku: form.sku,
      status: asDraft ? 'Draft' : (form.active ? 'Active' : 'Inactive'),
      featured: form.featured,
      availability: normAvailability,
      productionTime: form.availabilityType === 'Made to Order' || form.availabilityType === 'Made-to-Order' ? form.productionTime : undefined,
      limitedQuantity: form.availabilityType === 'Limited Edition' ? Number(form.limitedQuantity) || 0 : undefined,
    }
    if (isEdit) updateProduct(productId, payload)
    else addProduct(payload)
    navigate('/artisan/products')
  }

  const finalPrice = form.price ? Math.round(form.price * (1 - (form.discount || 0) / 100)) : 0

  return (
    <DashboardLayout role="artisan">
      <div className="dashboard-header-row">
        <div>
          <p className="breadcrumb" style={{ marginBottom: 4 }}>Products / {isEdit ? 'Edit Product' : 'Add Product'}</p>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Fill in the details below to list a handcrafted item in your shop.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/artisan/products')}>Cancel</Button>
          <Button variant="outline" onClick={() => submit(true)} disabled={!shop}>Save Draft</Button>
        </div>
      </div>

      {publishBlockedReason && (
        <div className="form-error-box mb-6" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#b45309', background: 'var(--color-amber-bg, #fef3c7)' }}>
          <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{publishBlockedReason}</span>
        </div>
      )}

      <div className="product-form-grid">
        <div className="flex-col gap-6">
          <div className="form-section">
            <h3 className="form-section-title">Product Images</h3>
            <div className="upload-box">
              <UploadCloud size={22} />
              <p style={{ fontSize: 14 }}>Drag &amp; drop images here</p>
              <Button size="sm" variant="outline" type="button" disabled>Browse Files</Button>
            </div>
            <div className="thumb-row">
              {[0, 1, 2].map((i) => <Swatch key={i} seed={`img-${i}`} icon={Package} rounded="rounded-lg" style={{ width: 64, height: 64 }} />)}
              <div className="thumb-add">+</div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Product Details</h3>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input value={form.name} onChange={set('name')} placeholder="Blue Pottery Handpainted Vase" className={`form-input${errors.name ? ' form-input-error' : ''}`} />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select value={form.category} onChange={set('category')} className="form-select">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={4} maxLength={500} className="form-textarea" />
              <p className="text-right" style={{ fontSize: 12, color: 'var(--color-ink-35)', marginTop: 4 }}>{form.description.length} / 500 characters</p>
            </div>
          </div>
        </div>

        <div className="flex-col gap-6">
          <div className="form-section">
            <h3 className="form-section-title">Pricing</h3>
            <label className="form-label">MRP (Original Price)</label>
            <input type="number" value={form.price} onChange={set('price')} placeholder="2,450" className={`form-input mb-3${errors.price ? ' form-input-error' : ''}`} />
            {errors.price && <p className="form-error" style={{ marginTop: -8, marginBottom: 8 }}>{errors.price}</p>}
            <label className="form-label">Discount (optional)</label>
            <input type="number" min="0" max="100" value={form.discount} onChange={set('discount')} className={`form-input mb-3${errors.discount ? ' form-input-error' : ''}`} />
            {errors.discount && <p className="form-error" style={{ marginTop: -8, marginBottom: 8 }}>{errors.discount}</p>}
            <div className="price-final-box">
              <span className="price-final-label">Final Price</span>
              <span style={{ fontWeight: 600 }}>₹{finalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Inventory</h3>
            <label className="form-label">Stock Quantity</label>
            <input type="number" value={form.stock} onChange={set('stock')} className={`form-input mb-3${errors.stock ? ' form-input-error' : ''}`} />
            {errors.stock && <p className="form-error" style={{ marginTop: -8, marginBottom: 8 }}>{errors.stock}</p>}
            <label className="form-label">SKU</label>
            <input value={form.sku} onChange={set('sku')} className="form-input" />
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Availability</h3>
            <label className="form-label">Availability Type</label>
            <select value={form.availabilityType} onChange={set('availabilityType')} className="form-select mb-3">
              {AVAILABILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {form.availabilityType === 'Made to Order' && (
              <div>
                <label className="form-label">Approximate Production Time</label>
                <input value={form.productionTime} onChange={set('productionTime')} placeholder="e.g. 7-10 days" className={`form-input${errors.productionTime ? ' form-input-error' : ''}`} />
                {errors.productionTime && <p className="form-error">{errors.productionTime}</p>}
              </div>
            )}
            {form.availabilityType === 'Limited Edition' && (
              <div>
                <label className="form-label">Available Quantity</label>
                <input type="number" min="1" value={form.limitedQuantity} onChange={set('limitedQuantity')} placeholder="e.g. 20" className={`form-input${errors.limitedQuantity ? ' form-input-error' : ''}`} />
                {errors.limitedQuantity && <p className="form-error">{errors.limitedQuantity}</p>}
              </div>
            )}
          </div>

          <div className="form-section">
            <h3 className="form-section-title" style={{ marginBottom: 16 }}>Status &amp; Visibility</h3>
            <label className="toggle-row">
              <span>Active <div className="toggle-row-sub">Product is visible to buyers</div></span>
              <input type="checkbox" checked={form.active} onChange={set('active')} disabled={!canPublish} style={{ width: 16, height: 16, accentColor: 'var(--color-terracotta)' }} />
            </label>
            <label className="toggle-row">
              <span>Featured <div className="toggle-row-sub">Highlight on your shop page</div></span>
              <input type="checkbox" checked={form.featured} onChange={set('featured')} style={{ width: 16, height: 16, accentColor: 'var(--color-terracotta)' }} />
            </label>
          </div>

          <Button size="lg" className="btn-full" disabled={!canPublish} onClick={() => submit(false)}>
            {canPublish ? 'Publish Product' : 'Publishing unavailable'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
