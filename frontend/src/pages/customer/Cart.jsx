import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Package, Trash2, ArrowLeft, ShieldCheck, Tag } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import Swatch from '../../components/common/Swatch'
import Button from '../../components/common/Button'
import ProductCard from '../../components/common/ProductCard'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'
import { useProducts } from '../../hooks/useProducts'
import { useLanguage } from '../../hooks/useLanguage'
import { getPublicProducts, isProductPubliclyVisible } from '../../utils/productVisibility'
import { isProductPurchasable } from '../../utils/productAvailability'

const GST_RATE = 0.18

export default function Cart() {
  const { cartProducts, subtotal, updateQty, removeFromCart } = useCart()
  const { user } = useAuth()
  const { shops, getShopById } = useShops()
  const { products } = useProducts()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [promo, setPromo] = useState('')

  useEffect(() => {
    if (user?.role === 'artisan') {
      navigate('/artisan/dashboard')
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard')
    }
  }, [user, navigate])

  const gst = Math.round(subtotal * GST_RATE)
  const total = subtotal + gst
  const suggestions = getPublicProducts(products, shops).filter((p) => !cartProducts.some((c) => c.productId === p.id)).slice(0, 4)

  const isCartItemAvailable = (product) => isProductPubliclyVisible(product, shops) && isProductPurchasable(product)
  const hasUnavailableItems = cartProducts.some(({ product }) => !isCartItemAvailable(product))

  const goCheckout = () => {
    if (hasUnavailableItems) return
    if (!user) return navigate('/login?redirect=/checkout')
    navigate('/checkout')
  }

  return (
    <PublicLayout>
      <div className="container" style={{ paddingTop: 32 }}>
        <p className="breadcrumb"><Link to="/">{t('home')}</Link> / <Link to="/marketplace">{t('explore')}</Link> / <span>{t('yourCart')}</span></p>
        <h1 className="page-title" style={{ fontSize: 30 }}>{t('yourCart')}</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>Review your selected products. {cartProducts.length} items in your cart</p>

        {cartProducts.length === 0 ? (
          <div className="text-center" style={{ padding: '80px 0' }}>
            <p className="mb-4" style={{ color: 'var(--color-ink-50)' }}>Your cart is empty.</p>
            <Link to="/marketplace"><Button>{t('explore')}</Button></Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="card divider-list">
              {cartProducts.map(({ product, qty }) => {
                const shop = getShopById(product.shopId)
                const available = isCartItemAvailable(product)
                return (
                  <div key={product.id} className="cart-item-row" style={!available ? { opacity: 0.55 } : undefined}>
                    <Swatch seed={product.id} icon={Package} rounded="rounded-lg" style={{ width: 64, height: 64, flexShrink: 0 }} />
                    <div className="cart-item-info">
                      <Link to={`/product/${product.id}`} style={{ fontWeight: 500, fontSize: 14 }}>{product.name}</Link>
                      <div className="cart-item-shop">{t('by')} {shop?.name}, {shop?.location.split(',')[0]}</div>
                      {!available && <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 500, marginTop: 2 }}>Currently unavailable — remove to continue</div>}
                    </div>
                    <div className="qty-stepper" style={!available ? { pointerEvents: 'none', opacity: 0.5 } : undefined}>
                      <button onClick={() => updateQty(product.id, qty - 1)} disabled={!available}>–</button>
                      <span>{qty}</span>
                      <button onClick={() => updateQty(product.id, qty + 1)} disabled={!available}>+</button>
                    </div>
                    <div className="cart-item-price">₹{(product.price * qty).toLocaleString('en-IN')}</div>
                    <button onClick={() => removeFromCart(product.id)} style={{ color: '#f87171' }}><Trash2 size={16} /></button>
                  </div>
                )
              })}
            </div>

            <div className="card card-pad" style={{ height: 'fit-content', position: 'sticky', top: 80 }}>
              <h3 className="steps-title">{t('orderSummary')}</h3>
              <div className="order-summary-row"><span className="order-summary-label">{t('subtotal')}</span><span style={{ fontWeight: 500 }}>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="order-summary-row"><span className="order-summary-label">{t('freeShipping')}</span><span style={{ fontWeight: 500, color: 'var(--color-forest)' }}>FREE</span></div>
              <div className="order-summary-row"><span className="order-summary-label">{t('tax')}</span><span style={{ fontWeight: 500 }}>₹{gst.toLocaleString('en-IN')}</span></div>

              <div className="promo-row">
                <div className="promo-input">
                  <Tag size={13} className="form-input-icon" />
                  <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Promo codes coming soon" disabled />
                </div>
                <Button variant="success" size="sm" disabled>Apply</Button>
              </div>

              <div className="order-total-row">
                <span style={{ fontWeight: 600 }}>{t('total')}</span>
                <span className="order-total-value">₹{total.toLocaleString('en-IN')}</span>
              </div>
              <Button size="lg" className="btn-full" onClick={goCheckout} disabled={hasUnavailableItems}>{t('checkout')} →</Button>
              {hasUnavailableItems && <p style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: 8 }}>Remove unavailable items to continue to checkout.</p>}
              <div className="trust-badges">
                <span className="flex gap-1" style={{ alignItems: 'center' }}><ShieldCheck size={12} /> Secure Checkout</span>
                <span>Buyer Protection</span>
              </div>
            </div>
          </div>
        )}

        <Link to="/marketplace" className="continue-shopping-link"><ArrowLeft size={14} /> Continue Shopping</Link>

        {suggestions.length > 0 && (
          <div className="section-tight" style={{ paddingTop: 0 }}>
            <h3 className="section-title-sm mb-5">You may also like</h3>
            <div className="grid-4">
              {suggestions.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
