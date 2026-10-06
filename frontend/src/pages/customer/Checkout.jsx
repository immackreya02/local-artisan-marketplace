import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, Check, Plus, Banknote, Bell, MessageSquare, Mail, Smartphone } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/common/Button'
import TestPaymentModal from '../../components/common/TestPaymentModal'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { useOrders } from '../../hooks/useOrders'
import { useShops } from '../../hooks/useShops'
import { computeCheckoutPricing } from '../../utils/orderPricing'
import { isProductPubliclyVisible } from '../../utils/productVisibility'
import { isProductPurchasable } from '../../utils/productAvailability'
import { api } from '../../services/api'

const fallbackAddresses = [
  { id: 'home', label: 'Home', default: true, line: '42, Sardar Patel Marg, Bani Park, Jaipur, Rajasthan 302016', raw: { name: 'Recipient', phone: '9829045671', streetAddress: '42, Sardar Patel Marg', city: 'Jaipur', state: 'Rajasthan', postalCode: '302016', country: 'India' } },
  { id: 'work', label: 'Work', default: false, line: '3rd Floor, Malviya Nagar Industrial Area, Jaipur, Rajasthan 302017', raw: { name: 'Recipient Work', phone: '9829045671', streetAddress: '3rd Floor, Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', postalCode: '302017', country: 'India' } },
]

export default function Checkout() {
  const { user } = useAuth()
  const { cartProducts, clearCart } = useCart()
  const { createOrder } = useOrders()
  const { shops } = useShops()
  const navigate = useNavigate()
  const [addressId, setAddressId] = useState('home')
  const [method, setMethod] = useState('online')
  const [addresses, setAddresses] = useState(fallbackAddresses)
  const [notifPrefs, setNotifPrefs] = useState({ whatsapp: true, email: true, sms: true })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  useEffect(() => {
    if (user && user.role === 'customer') {
      api.get('/addresses')
        .then((res) => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            const normalized = res.data.map((a) => ({
              id: a._id || a.id,
              _id: a._id,
              label: a.name || 'Saved Address',
              default: Boolean(a.isDefault),
              line: `${a.streetAddress || ''}, ${a.city || ''}, ${a.state || ''} ${a.postalCode || ''}`.trim(),
              raw: a
            }))
            setAddresses(normalized)
            const defAddr = normalized.find((a) => a.default) || normalized[0]
            if (defAddr) setAddressId(defAddr.id)
          }
        })
        .catch(() => {})
    }
  }, [user])

  if (!user) return <Navigate to="/login?redirect=/checkout" replace />
  if (cartProducts.length === 0) return <Navigate to="/marketplace" replace />
  const hasUnavailableItems = cartProducts.some(
    ({ product }) => !isProductPubliclyVisible(product, shops) || !isProductPurchasable(product)
  )
  if (hasUnavailableItems) return <Navigate to="/cart" replace />

  const { itemsByShop, shopTotals, subtotal, gst, total } = computeCheckoutPricing(cartProducts)
  const address = addresses.find((a) => a.id === addressId) || addresses[0]

  const handlePlaceOrderClick = () => {
    if (method === 'online') {
      setIsPaymentModalOpen(true)
    } else {
      executeOrderPlacement(null)
    }
  }

  const executeOrderPlacement = async (paymentDetails = null) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const paymentMethod = method === 'online' ? 'Online' : 'COD'
      let payload

      if (address._id) {
        payload = {
          addressId: address._id,
          paymentMethod,
          paymentStatus: paymentDetails ? 'Paid' : 'Pending',
          transactionId: paymentDetails?.transactionId || null,
          notificationPreferences: notifPrefs
        }
      } else {
        const raw = address.raw || {}
        payload = {
          shippingAddress: {
            name: raw.name || user.name || 'Customer',
            phone: raw.phone || user.phone || '9829045671',
            streetAddress: raw.streetAddress || '42, Sardar Patel Marg',
            city: raw.city || 'Jaipur',
            state: raw.state || 'Rajasthan',
            postalCode: raw.postalCode || '302016',
            country: raw.country || 'India'
          },
          paymentMethod,
          paymentStatus: paymentDetails ? 'Paid' : 'Pending',
          transactionId: paymentDetails?.transactionId || null,
          notificationPreferences: notifPrefs
        }
      }

      const createdOrders = await createOrder(payload)
      clearCart()

      const firstOrder = createdOrders && createdOrders[0] ? createdOrders[0] : null
      const firstOrderId = firstOrder ? firstOrder.id : `ORD-${Date.now()}`
      const orderIds = createdOrders ? createdOrders.map((o) => o.id) : [firstOrderId]

      navigate(`/order-confirmation/${firstOrderId}`, {
        state: { total, items: cartProducts, address: address.line, method, orderIds, paymentDetails },
      })
    } catch (err) {
      console.error('Failed to place order:', err)
      alert(err.message || 'Failed to place order. Please check address details and try again.')
    } finally {
      setIsSubmitting(false)
      setIsPaymentModalOpen(false)
    }
  }

  return (
    <PublicLayout>
      <div className="container" style={{ maxWidth: 880, paddingTop: 32, paddingBottom: 64 }}>
        <h1 className="page-title" style={{ fontSize: 30 }}>Checkout</h1>
        <p className="page-subtitle">Complete your purchase securely.</p>

        <div className="checkout-steps">
          <span className="checkout-step done"><span className="checkout-step-circle"><Check size={11} /></span> Cart</span>
          <span className="checkout-step-line" />
          <span className="checkout-step current"><span className="checkout-step-circle">2</span> Checkout</span>
          <span className="checkout-step-line" />
          <span className="checkout-step"><span className="checkout-step-circle">3</span> Confirmation</span>
        </div>

        <div className="checkout-summary-strip">
          <div className="checkout-summary-tile"><div className="checkout-summary-tile-label">Cart Items</div><div className="checkout-summary-tile-value">{cartProducts.length} Items</div></div>
          <div className="checkout-summary-tile"><div className="checkout-summary-tile-label">Total Amount</div><div className="checkout-summary-tile-value">₹{total.toLocaleString('en-IN')}</div></div>
          <div className="checkout-summary-tile"><div className="checkout-summary-tile-label">Delivery Address</div><div className="checkout-summary-tile-value">{address.label}</div></div>
          <div className="checkout-summary-tile"><div className="checkout-summary-tile-label">Payment Method</div><div className="checkout-summary-tile-value" style={{ textTransform: 'capitalize' }}>{method === 'online' ? 'Online Payment' : 'Cash on Delivery'}</div></div>
        </div>

        <div className="form-section">
          <div className="flex justify-between mb-4">
            <h3 className="form-section-title" style={{ marginBottom: 0 }}><MapPin size={16} color="#C1673B" /> Delivery Address</h3>
            <button disabled style={{ fontSize: 12, color: 'var(--color-ink-35)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, cursor: 'not-allowed' }}><Plus size={12} /> Add New Address</button>
          </div>
          <div className="grid-2">
            {addresses.map((a) => (
              <button key={a.id} onClick={() => setAddressId(a.id)} className={`address-option${addressId === a.id ? ' selected' : ''}`}>
                <div className="address-option-title">{a.label} {a.default && <span className="default-chip">Default</span>}</div>
                <p style={{ fontSize: 12, color: 'var(--color-ink-55)' }}>{user.name} · {a.line}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title"><CreditCard size={16} color="#C1673B" /> Payment Method</h3>
          <div className="flex-col gap-3">
            <button onClick={() => setMethod('cod')} className={`payment-option${method === 'cod' ? ' selected' : ''}`}>
              <Banknote size={17} color="#8a7f70" />
              <div><div className="payment-option-title">Cash on Delivery</div><div className="payment-option-desc">Pay in cash when your order arrives.</div></div>
            </button>
            <button onClick={() => setMethod('online')} className={`payment-option${method === 'online' ? ' selected' : ''}`}>
              <CreditCard size={17} color="#C1673B" />
              <div><div className="payment-option-title">Online Payment</div><div className="payment-option-desc">Pay securely via UPI, Card or Netbanking.</div></div>
            </button>
          </div>
        </div>

        {/* Notification Preferences Selector */}
        <div className="form-section">
          <h3 className="form-section-title"><Bell size={16} color="#C1673B" /> Notification Preferences</h3>
          <p style={{ fontSize: 13, color: 'var(--color-ink-55)', marginBottom: 14 }}>
            Choose how you would like to receive your invoice receipts and live AWB courier updates:
          </p>
          <div className="grid-3" style={{ gap: 12 }}>
            <label className={`address-option${notifPrefs.whatsapp ? ' selected' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input 
                type="checkbox" 
                checked={notifPrefs.whatsapp} 
                onChange={(e) => setNotifPrefs(p => ({ ...p, whatsapp: e.target.checked }))}
                style={{ marginTop: 3, accentColor: '#C1673B' }} 
              />
              <div>
                <div className="address-option-title" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <MessageSquare size={14} color="#25D366" /> WhatsApp
                  <span className="default-chip" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontSize: 10, padding: '1px 6px' }}>Recommended</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-ink-55)', marginTop: 2, lineHeight: 1.4 }}>Instant order alert &amp; live courier tracking links on WhatsApp.</p>
              </div>
            </label>

            <label className={`address-option${notifPrefs.email ? ' selected' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input 
                type="checkbox" 
                checked={notifPrefs.email} 
                onChange={(e) => setNotifPrefs(p => ({ ...p, email: e.target.checked }))}
                style={{ marginTop: 3, accentColor: '#C1673B' }} 
              />
              <div>
                <div className="address-option-title" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <Mail size={14} color="#EA4335" /> Email Receipt
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-ink-55)', marginTop: 2, lineHeight: 1.4 }}>Official PDF invoice breakdown sent to your email.</p>
              </div>
            </label>

            <label className={`address-option${notifPrefs.sms ? ' selected' : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input 
                type="checkbox" 
                checked={notifPrefs.sms} 
                onChange={(e) => setNotifPrefs(p => ({ ...p, sms: e.target.checked }))}
                style={{ marginTop: 3, accentColor: '#C1673B' }} 
              />
              <div>
                <div className="address-option-title" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <Smartphone size={14} color="#0284c7" /> SMS Alerts
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-ink-55)', marginTop: 2, lineHeight: 1.4 }}>Fast2SMS text alerts for order confirmation &amp; delivery.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="checkout-total-bar">
          <div>
            <div style={{ fontSize: 14, color: 'var(--color-ink-55)' }}>Total Payable</div>
            <div className="order-total-value" style={{ fontSize: 24 }}>₹{total.toLocaleString('en-IN')}</div>
          </div>
          <Button size="lg" onClick={handlePlaceOrderClick} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : method === 'online' ? 'Proceed to Pay' : 'Place Order'}
          </Button>
        </div>

        {/* Sandbox Test Payment Modal */}
        <TestPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={(details) => executeOrderPlacement(details)}
          amount={total}
        />
      </div>
    </PublicLayout>
  )
}
