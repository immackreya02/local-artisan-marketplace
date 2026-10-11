import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, Check, Plus, Banknote, X } from 'lucide-react'
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

export default function Checkout() {
  const { user } = useAuth()
  const { cartProducts, clearCart } = useCart()
  const { createOrder } = useOrders()
  const { shops } = useShops()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [addressId, setAddressId] = useState(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [method, setMethod] = useState('online')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const [addressForm, setAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    streetAddress: '',
    city: user?.location || '',
    state: '',
    postalCode: '',
    saveToProfile: true
  })

  // Synchronize initial form data if user loads late
  useEffect(() => {
    if (user) {
      setAddressForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        city: prev.city || user.location || ''
      }))
    }
  }, [user])

  // Fetch customer's real saved addresses from DB
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
            if (defAddr) {
              setAddressId(defAddr.id)
              setShowNewAddress(false)
            }
          } else {
            // No saved address yet -> open the address entry form directly
            setShowNewAddress(true)
          }
        })
        .catch(() => {
          setShowNewAddress(true)
        })
    }
  }, [user])

  if (!user) return <Navigate to="/login?redirect=/checkout" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'artisan') return <Navigate to="/artisan/dashboard" replace />
  if (cartProducts.length === 0) return <Navigate to="/marketplace" replace />
  const hasUnavailableItems = cartProducts.some(
    ({ product }) => !isProductPubliclyVisible(product, shops) || !isProductPurchasable(product)
  )
  if (hasUnavailableItems) return <Navigate to="/cart" replace />

  const { itemsByShop, shopTotals, subtotal, gst, total } = computeCheckoutPricing(cartProducts)
  const selectedAddress = addresses.find((a) => a.id === addressId) || addresses[0]

  const validateAddressForm = () => {
    if (!addressForm.name.trim()) {
      alert('Please enter recipient full name.')
      return false
    }
    const cleanPhone = addressForm.phone.replace(/[^0-9]/g, '')
    if (cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number for courier delivery updates.')
      return false
    }
    if (!addressForm.streetAddress.trim()) {
      alert('Please enter street / house / apartment address.')
      return false
    }
    if (!addressForm.city.trim()) {
      alert('Please enter delivery city.')
      return false
    }
    if (!addressForm.state.trim()) {
      alert('Please enter delivery state.')
      return false
    }
    const cleanPostal = addressForm.postalCode.replace(/[^0-9]/g, '')
    if (cleanPostal.length !== 6) {
      alert('Please enter a valid 6-digit postal PIN code.')
      return false
    }
    return true
  }

  const handlePlaceOrderClick = () => {
    if (showNewAddress || addresses.length === 0) {
      if (!validateAddressForm()) return
    } else if (!selectedAddress) {
      alert('Please select or add a delivery address.')
      return
    }

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
      let finalDisplayAddress = ''

      if (showNewAddress || addresses.length === 0) {
        if (!validateAddressForm()) {
          setIsSubmitting(false)
          return
        }

        const shippingData = {
          name: addressForm.name.trim(),
          phone: addressForm.phone.trim(),
          streetAddress: addressForm.streetAddress.trim(),
          city: addressForm.city.trim(),
          state: addressForm.state.trim(),
          postalCode: addressForm.postalCode.trim(),
          country: 'India'
        }

        finalDisplayAddress = `${shippingData.streetAddress}, ${shippingData.city}, ${shippingData.state} - ${shippingData.postalCode}`

        // Save address to user's profile in background if selected
        if (addressForm.saveToProfile) {
          api.post('/addresses', {
            ...shippingData,
            isDefault: addresses.length === 0
          }).catch(() => {})
        }

        payload = {
          shippingAddress: shippingData,
          paymentMethod,
          paymentStatus: paymentDetails ? 'Paid' : 'Pending',
          transactionId: paymentDetails?.transactionId || null
        }
      } else {
        finalDisplayAddress = selectedAddress.line
        if (selectedAddress._id) {
          payload = {
            addressId: selectedAddress._id,
            paymentMethod,
            paymentStatus: paymentDetails ? 'Paid' : 'Pending',
            transactionId: paymentDetails?.transactionId || null
          }
        } else {
          const raw = selectedAddress.raw || {}
          payload = {
            shippingAddress: {
              name: raw.name || user.name || 'Customer',
              phone: raw.phone || user.phone || '',
              streetAddress: raw.streetAddress || '',
              city: raw.city || '',
              state: raw.state || '',
              postalCode: raw.postalCode || '',
              country: raw.country || 'India'
            },
            paymentMethod,
            paymentStatus: paymentDetails ? 'Paid' : 'Pending',
            transactionId: paymentDetails?.transactionId || null
          }
        }
      }

      const createdOrders = await createOrder(payload)
      clearCart()

      const firstOrder = createdOrders && createdOrders[0] ? createdOrders[0] : null
      const firstOrderId = firstOrder ? firstOrder.id : `ORD-${Date.now()}`
      const orderIds = createdOrders ? createdOrders.map((o) => o.id) : [firstOrderId]

      navigate(`/order-confirmation/${firstOrderId}`, {
        state: { total, items: cartProducts, address: finalDisplayAddress, method, orderIds, paymentDetails },
      })
    } catch (err) {
      console.error('Failed to place order:', err)
      alert(err.message || 'Failed to place order. Please check address details and try again.')
    } finally {
      setIsSubmitting(false)
      setIsPaymentModalOpen(false)
    }
  }

  const currentSummaryAddressLabel = showNewAddress || addresses.length === 0
    ? (addressForm.streetAddress ? `${addressForm.city || 'Custom Delivery'}` : 'New Address')
    : (selectedAddress?.label || 'Saved Address')

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
          <div className="checkout-summary-tile"><div className="checkout-summary-tile-label">Delivery Destination</div><div className="checkout-summary-tile-value">{currentSummaryAddressLabel}</div></div>
          <div className="checkout-summary-tile"><div className="checkout-summary-tile-label">Payment Method</div><div className="checkout-summary-tile-value" style={{ textTransform: 'capitalize' }}>{method === 'online' ? 'Online Payment' : 'Cash on Delivery'}</div></div>
        </div>

        {/* Delivery Address Section */}
        <div className="form-section">
          <div className="flex justify-between items-center mb-4">
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>
              <MapPin size={16} color="#C1673B" /> Delivery Address
            </h3>
            {addresses.length > 0 && (
              <button 
                type="button"
                onClick={() => setShowNewAddress(!showNewAddress)} 
                style={{ 
                  fontSize: 12, 
                  color: 'var(--color-terracotta, #C1673B)', 
                  fontWeight: 600, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 4, 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer' 
                }}
              >
                {showNewAddress ? 'Select Saved Address' : <><Plus size={13} /> Add New Address</>}
              </button>
            )}
          </div>

          {/* Show Saved Addresses when not adding new */}
          {!showNewAddress && addresses.length > 0 && (
            <div className="grid-2">
              {addresses.map((a) => (
                <button 
                  key={a.id} 
                  type="button"
                  onClick={() => setAddressId(a.id)} 
                  className={`address-option${addressId === a.id ? ' selected' : ''}`}
                >
                  <div className="address-option-title">
                    {a.label} {a.default && <span className="default-chip">Default</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-ink-55)', textAlign: 'left', marginTop: 4 }}>
                    <strong>{a.raw?.name || user.name}</strong> · {a.raw?.phone || user.phone}<br />
                    {a.line}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Inline Delivery Address Form */}
          {(showNewAddress || addresses.length === 0) && (
            <div style={{
              background: 'var(--color-surface, #fff)',
              border: '1px solid var(--color-ink-15, #e2e8f0)',
              borderRadius: 8,
              padding: 20
            }}>
              {addresses.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--color-ink-55)', marginBottom: 16 }}>
                  No saved addresses found. Please enter your delivery address below:
                </p>
              )}
              <div className="grid-2 mb-3" style={{ gap: 12 }}>
                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: 12 }}>Recipient Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Full name"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: 12 }}>Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="10-digit mobile number"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label" style={{ fontSize: 12 }}>Street / Flat / House Address *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="House/Flat No., Building Name, Street, Locality"
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  required
                />
              </div>

              <div className="grid-3 mb-3" style={{ gap: 12 }}>
                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: 12 }}>City *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="City / Town"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: 12 }}>State *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label" style={{ fontSize: 12 }}>PIN Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="form-input"
                    placeholder="6-digit PIN code"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center" style={{ marginTop: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--color-ink-70)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={addressForm.saveToProfile}
                    onChange={(e) => setAddressForm({ ...addressForm, saveToProfile: e.target.checked })}
                    style={{ accentColor: '#C1673B' }}
                  />
                  Save this address to my profile for future orders
                </label>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(false)}
                    style={{ fontSize: 12, color: 'var(--color-ink-50)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Section */}
        <div className="form-section">
          <h3 className="form-section-title"><CreditCard size={16} color="#C1673B" /> Payment Method</h3>
          <div className="flex-col gap-3">
            <button type="button" onClick={() => setMethod('cod')} className={`payment-option${method === 'cod' ? ' selected' : ''}`}>
              <Banknote size={17} color="#8a7f70" />
              <div><div className="payment-option-title">Cash on Delivery</div><div className="payment-option-desc">Pay in cash when your order arrives.</div></div>
            </button>
            <button type="button" onClick={() => setMethod('online')} className={`payment-option${method === 'online' ? ' selected' : ''}`}>
              <CreditCard size={17} color="#C1673B" />
              <div><div className="payment-option-title">Online Payment</div><div className="payment-option-desc">Pay securely via UPI, Card or Netbanking.</div></div>
            </button>
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
