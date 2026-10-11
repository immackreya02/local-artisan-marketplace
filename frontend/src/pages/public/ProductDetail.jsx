import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Package, Heart, Truck, ShieldCheck, RotateCcw, BadgeCheck, Store, PenLine, Star, ArrowLeft } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import Swatch from '../../components/common/Swatch'
import Rating from '../../components/common/Rating'
import Button from '../../components/common/Button'
import WhatsAppButton from '../../components/common/WhatsAppButton'
import ProductCard from '../../components/common/ProductCard'
import { categories } from '../../data/mockData'
import { useCart } from '../../hooks/useCart'
import { useShops } from '../../hooks/useShops'
import { useProducts } from '../../hooks/useProducts'
import { useAuth } from '../../hooks/useAuth'
import { useOrders } from '../../hooks/useOrders'
import { useReviews } from '../../hooks/useReviews'
import { useLanguage } from '../../hooks/useLanguage'
import { isProductPubliclyVisible } from '../../utils/productVisibility'
import { getAvailabilityBadge, isProductPurchasable, getStockStatusLabel, getMaxQuantity } from '../../utils/productAvailability'
import { addRecentlyViewedId } from '../../utils/recentlyViewed'
import { getProductMainImage, handleImageError } from '../../utils/productImageHelper'

export default function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { products, updateProduct } = useProducts()
  const { shops, getShopById, updateShopDetails } = useShops()
  const product = products.find((p) => p.id === productId)
  const { addToCart, wishlist, toggleWishlist } = useCart()
  const { user } = useAuth()
  const { orders } = useOrders()
  const { reviews: allReviews, addReview, hasReviewed } = useReviews()
  const { t } = useLanguage()
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('description')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setQty(1)
    setTab('description')
    if (product && product.id) {
      addRecentlyViewedId(product.id)
    }
  }, [productId, product])

  if (!product || !isProductPubliclyVisible(product, shops)) {
    return (
      <PublicLayout>
        <div className="container text-center" style={{ maxWidth: 640, paddingTop: 96, paddingBottom: 96 }}>
          <h2 className="page-title" style={{ fontSize: 24 }}>Product not found</h2>
          <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      </PublicLayout>
    )
  }

  const shop = getShopById(product.shopId) || {
    id: product.shopId,
    name: product.shopName || 'Artisan Shop',
    location: '',
    description: '',
    rating: 0,
    reviewCount: 0,
  }
  const category = categories.find((c) => c.id === product.category || c.slug === product.categorySlug || c.name === product.categoryName)
  const categoryLabel = product.categoryName || category?.name || product.category || ''
  const reviews = allReviews.filter((r) => r.productId === product.id || r.productId === product._id || r.productId === productId)
  const related = products.filter((p) => isProductPubliclyVisible(p, shops) && (p.category === product.category || p.categorySlug === product.categorySlug) && p.id !== product.id).slice(0, 4)
  const discountPct = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0
  const isWishlisted = wishlist.includes(product.id)
  const availability = getAvailabilityBadge(product)
  const purchasable = isProductPurchasable(product)
  const stockLabel = getStockStatusLabel(product)

  const eligibleOrder = user && user.role === 'customer'
    ? orders.find((o) =>
        o.customerId === user.id &&
        o.status === 'Delivered' &&
        o.items.some((it) => it.productId === product.id) &&
        !hasReviewed(user.id, product.id, o.id)
      )
    : null

  const submitReview = () => {
    if (!eligibleOrder || !reviewText.trim()) return
    addReview({
      id: `r-${Date.now()}`,
      productId: product.id,
      customerId: user.id,
      orderId: eligibleOrder.id,
      name: user.name,
      location: user.location || '',
      rating: reviewRating,
      text: reviewText.trim(),
      date: new Date().toISOString().slice(0, 10),
      verified: true,
    })

    const newProductCount = (product.reviewCount || 0) + 1
    const newProductRating = Math.round((((product.rating || 0) * (product.reviewCount || 0)) + reviewRating) / newProductCount * 10) / 10
    updateProduct(product.id, { rating: newProductRating, reviewCount: newProductCount })

    const newShopCount = (shop.reviewCount || 0) + 1
    const newShopRating = Math.round((((shop.rating || 0) * (shop.reviewCount || 0)) + reviewRating) / newShopCount * 10) / 10
    updateShopDetails(shop.id, { rating: newShopRating, reviewCount: newShopCount })

    setReviewText('')
    setReviewRating(5)
  }

  return (
    <PublicLayout>
      <div className="container" style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="icon-btn back-btn"
            title="Return to Marketplace Home"
            aria-label="Return to Marketplace Home"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--color-cream-dark)',
              border: '1px solid var(--color-ink-10)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-ink)',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} color="var(--color-ink)" />
          </button>

          <p className="breadcrumb" style={{ margin: 0 }}>
            <Link to="/">{t('home')}</Link> / <Link to="/marketplace">{t('explore')}</Link> / {categoryLabel} / <span>{product.name}</span>
          </p>
        </div>

        <div className="pd-grid">
          <div className="pd-media">
            {discountPct > 0 && <span className="pd-discount-badge">{discountPct}% OFF</span>}
            <img
              src={getProductMainImage(product)}
              alt={product.name}
              onError={(e) => handleImageError(e, product.categorySlug || product.category)}
              style={{ height: 420, width: '100%', objectFit: 'cover', borderRadius: 12, display: 'block' }}
            />
          </div>

          <div>
            <h1 className="pd-title">{product.name}</h1>
            <div className="pd-meta-row">
              <span style={{ color: 'var(--color-ink-50)' }}>{t('by')} <Link to={`/shop/${shop.id}`} style={{ color: 'var(--color-terracotta)', fontWeight: 500 }}>{shop.name}</Link></span>
              <Rating value={product.rating} count={product.reviewCount} />
            </div>

            <div className="pd-price-row">
              <span className="pd-price">₹{product.price.toLocaleString('en-IN')}</span>
              {product.mrp > product.price && <span className="pd-mrp">₹{product.mrp.toLocaleString('en-IN')}</span>}
              {discountPct > 0 && <span className="pd-save">{t('save')} ₹{(product.mrp - product.price).toLocaleString('en-IN')}</span>}
            </div>

            <div className={`pd-stock-pill ${purchasable ? 'in' : 'out'}`}>
              <span className="badge-dot" /> {stockLabel}
            </div>
            {availability && <span className={`badge ${availability.tone} mt-2`} style={{ display: 'inline-flex', marginLeft: 8 }}>{availability.label}</span>}

            <p className="pd-desc">{product.description}</p>

            {user?.role === 'artisan' ? (
              <div style={{ padding: '12px 16px', background: 'var(--color-cream-dark)', borderRadius: 10, fontSize: 13, color: 'var(--color-ink-60)', border: '1px solid var(--color-ink-10)', display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <span>🎨 <strong>Artisan Studio Account:</strong> Dedicated to craft selling & storefront management.</span>
              </div>
            ) : (
              <div className="pd-actions-row">
                <div className="qty-stepper">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={!purchasable}>–</button>
                  <span>{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.max(1, Math.min(getMaxQuantity(product), q + 1)))}
                    disabled={!purchasable || qty >= getMaxQuantity(product)}
                  >+</button>
                </div>
                <Button size="lg" disabled={!purchasable} onClick={() => addToCart(product.id, qty)}>{t('addToCart')}</Button>
                <button onClick={() => toggleWishlist(product.id)} className="pd-wishlist-btn">
                  <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} color={isWishlisted ? '#C1673B' : '#8a7f70'} />
                </button>
              </div>
            )}

            <div className="pd-trust-row">
              <span><Truck size={14} /> {t('freeShipping')}</span>
              <span><ShieldCheck size={14} /> {t('securePayment')}</span>
              <span><RotateCcw size={14} /> {t('easyReturns')}</span>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16, alignItems: 'center' }}>
              <Link to={`/customer/custom-requests/new?shopId=${shop.id}&product=${encodeURIComponent(product.name)}`} style={{ display: 'inline-flex' }}>
                <Button variant="outline" size="sm"><PenLine size={13} /> {t('requestCustomization')}</Button>
              </Link>
              <WhatsAppButton
                productName={product.name}
                shopName={shop.name}
                phone={shop.phone || shop.ownerPhone || '919829045671'}
                label={t('askWhatsApp')}
                size="sm"
              />
            </div>

            <div className="pd-tags">
              {product.tags.map((t) => <span key={t} className="pd-tag">{t}</span>)}
            </div>
          </div>
        </div>

        <div className="pd-tabs">
          {[
            { key: 'description', label: t('description') },
            { key: 'specifications', label: t('specifications') },
            { key: 'reviews', label: `${t('reviews')} (${reviews.length})` }
          ].map((tItem) => (
            <button key={tItem.key} onClick={() => setTab(tItem.key)} className={`pd-tab${tab === tItem.key ? ' active' : ''}`}>
              {tItem.label}
            </button>
          ))}
        </div>

        <div className="pd-tab-content">
          {tab === 'description' && <p style={{ fontSize: 14, color: 'var(--color-ink-65, var(--color-ink-60))', lineHeight: 1.6, maxWidth: 640 }}>{product.description}</p>}
          {tab === 'specifications' && (
            <div style={{ maxWidth: 420 }}>
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="spec-row"><span style={{ color: 'var(--color-ink-50)' }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span></div>
              ))}
            </div>
          )}
          {tab === 'reviews' && (
            <div style={{ maxWidth: 640 }}>
              {eligibleOrder && (
                <div className="card card-pad mb-4">
                  <h4 className="filter-title" style={{ marginBottom: 10 }}>Write a Review</h4>
                  <p style={{ fontSize: 12, color: 'var(--color-ink-45)', marginBottom: 10 }}>You purchased this in order #{eligibleOrder.id} — your review will show as a Verified Purchase.</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} star`}>
                        <Star size={20} fill={n <= reviewRating ? '#f59e0b' : 'none'} color="#f59e0b" />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={3}
                    className="form-textarea mb-3"
                    placeholder="Share how the product turned out, quality, packaging, etc."
                  />
                  <Button size="sm" disabled={!reviewText.trim()} onClick={submitReview}>Submit Review</Button>
                </div>
              )}

              {reviews.map((r) => (
                <div key={r.id} className="review-card">
                  <div className="review-header">
                    <span style={{ fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {r.name}
                      {r.verified && (
                        <span className="badge badge-green" style={{ fontSize: 10 }}>
                          <BadgeCheck size={11} /> Verified Purchase
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-ink-40)' }}>{r.date}</span>
                  </div>
                  <Rating value={r.rating} />
                  <p className="review-text">{r.text}</p>
                </div>
              ))}
              {reviews.length === 0 && !eligibleOrder && <p style={{ fontSize: 14, color: 'var(--color-ink-45)' }}>No reviews yet.</p>}
            </div>
          )}
          {(tab === 'specifications' || tab === 'description') && (
            <div className="card card-pad" style={{ height: 'fit-content' }}>
              <h4 className="filter-title" style={{ marginBottom: 12 }}>Specifications</h4>
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="spec-row-sm"><span style={{ color: 'var(--color-ink-45)' }}>{k}</span><span style={{ fontWeight: 500, color: 'var(--color-ink-70, var(--color-ink))' }}>{v}</span></div>
              ))}
            </div>
          )}
        </div>

        <div className="artisan-panel">
          <div className="artisan-panel-left">
            {shop?.image && (shop.image.startsWith('http') || shop.image.startsWith('/')) ? (
              <img src={shop.image} alt={shop.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 16 }} />
            ) : (
              <Swatch seed={shop.id} icon={Store} rounded="rounded-2xl" style={{ width: 56, height: 56 }} />
            )}
            <div>
              <div className="artisan-panel-name">{shop.name} {shop.verified && <BadgeCheck size={14} color="#3F6B52" />}</div>
              <div className="artisan-panel-meta">{shop.location} · <Rating value={shop.rating} /> · {shop.reviewCount} reviews</div>
              <p className="artisan-panel-desc">{shop.description}</p>
            </div>
          </div>
          <Link to={`/shop/${shop.id}`}><Button variant="success">Visit Shop</Button></Link>
        </div>

        {related.length > 0 && (
          <div className="section-tight" style={{ paddingTop: 0 }}>
            <h3 className="section-title-sm mb-5">Related Products</h3>
            <div className="grid-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
