import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UploadCloud, Package, ShieldAlert, Plus, Trash2 } from 'lucide-react'
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

  const initialImages = existing?.images && existing.images.length > 0
    ? existing.images
    : (existing?.image ? [existing.image] : [])
  const [images, setImages] = useState(initialImages)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: existing?.name || '',
    category: existing?.category || categories[0].id,
    description: existing?.description || '',
    price: existing?.mrp ?? existing?.price ?? '',
    discount: existing?.discount ?? 0,
    stock: existing?.stock ?? '',
    sku: existing?.sku || `LAM-${Math.floor(1000 + Math.random() * 9000)}`,
    active: existing ? existing.status !== 'Inactive' : true,
    featured: existing?.featured || false,
    availabilityType: existing?.availabilityType || 'Ready to Ship',
    productionTime: existing?.productionTime || '',
    limitedQuantity: existing?.limitedQuantity ?? '',
  })
  const [errors, setErrors] = useState({})

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return

      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const rawData = loadEvent.target.result
        // Compress using canvas to ensure fast loading and optimal MongoDB doc size
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxDim = 800
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82)
          setImages((prev) => [...prev, compressedDataUrl])
        }
        img.src = rawData
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleAddUrl = () => {
    if (urlInput.trim() && (urlInput.startsWith('http://') || urlInput.startsWith('https://') || urlInput.startsWith('data:'))) {
      setImages((prev) => [...prev, urlInput.trim()])
      setUrlInput('')
    }
  }

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

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
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80'],
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
            
            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              multiple 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />

            {/* Click to upload box */}
            <div 
              className="upload-box" 
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer', border: '2px dashed var(--color-sand)', padding: '20px 16px', textAlign: 'center', borderRadius: '12px', background: 'var(--color-cream-light, #faf8f5)', transition: 'all 0.2s' }}
            >
              <UploadCloud size={28} style={{ color: 'var(--color-terracotta)', margin: '0 auto 6px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: 'var(--color-ink)' }}>Click to Choose Images from Computer</p>
              <p style={{ fontSize: 12, color: 'var(--color-ink-60)', margin: '0 0 10px' }}>Upload JPG, PNG, WEBP (saved permanently to MongoDB Atlas)</p>
              <Button size="sm" variant="outline" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                📁 Browse Computer Files
              </Button>
            </div>

            {/* Web URL fallback */}
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-ink-60)', display: 'block', marginBottom: 4 }}>Or Add via Image URL:</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="url" 
                  value={urlInput} 
                  onChange={(e) => setUrlInput(e.target.value)} 
                  placeholder="https://example.com/artisan-craft.jpg" 
                  className="form-input" 
                  style={{ flex: 1, height: 38, fontSize: 13 }} 
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
                />
                <Button size="sm" type="button" variant="outline" onClick={handleAddUrl}>Add URL</Button>
              </div>
            </div>

            {/* Previews */}
            {images.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 8 }}>Product Photos ({images.length}):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {images.map((imgSrc, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--color-sand)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                      <img src={imgSrc} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveImage(idx)} 
                        title="Remove image"
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    style={{ width: 72, height: 72, borderRadius: 8, border: '2px dashed var(--color-terracotta)', background: '#fff', color: 'var(--color-terracotta)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}
                  >
                    <Plus size={18} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}
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
