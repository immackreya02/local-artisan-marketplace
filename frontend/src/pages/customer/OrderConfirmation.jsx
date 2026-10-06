import { useLocation, useParams, Link } from 'react-router-dom'
import { CheckCircle2, Package, Truck, Home } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const { state } = useLocation()
  const orderIds = state?.orderIds?.length ? state.orderIds : [orderId]

  return (
    <PublicLayout>
      <div className="confirmation-wrap">
        <div className="confirmation-icon">
          <CheckCircle2 size={30} />
        </div>
        <h1 className="page-title" style={{ fontSize: 30 }}>Order Confirmed!</h1>
        <p style={{ color: 'var(--color-ink-55)', fontSize: 14, marginBottom: 4 }}>Thank you for supporting local artisans.</p>
        {orderIds.length > 1 ? (
          <p style={{ color: 'var(--color-ink-40)', fontSize: 14, marginBottom: 32 }}>
            Your cart spanned {orderIds.length} shops, so it was split into {orderIds.length} orders:{' '}
            {orderIds.map((id, i) => (
              <span key={id} style={{ fontWeight: 600, color: 'var(--color-ink)' }}>#{id}{i < orderIds.length - 1 ? ', ' : ''}</span>
            ))}
          </p>
        ) : (
          <p style={{ color: 'var(--color-ink-40)', fontSize: 14, marginBottom: 32 }}>Order ID: <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>#{orderId}</span></p>
        )}

        <div className="card card-pad" style={{ textAlign: 'left', marginBottom: 24 }}>
          {state?.items ? (
            <div className="divider-list">
              {state.items.map(({ product, qty }) => (
                <div key={product.id} className="confirmation-item-row">
                  <Swatch seed={product.id} icon={Package} rounded="rounded-lg" style={{ width: 48, height: 48, flexShrink: 0 }} />
                  <div className="cart-item-info">
                    <div className="line-clamp-1" style={{ fontSize: 14, fontWeight: 500 }}>{product.name}</div>
                    <div className="cart-item-shop">Qty: {qty}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>₹{(product.price * qty).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--color-ink-50)' }}>Your order details have been sent to your email.</p>
          )}
          <div className="order-total-row" style={{ marginBottom: 0 }}>
            <span style={{ fontWeight: 600 }}>Total Paid</span>
            <span className="order-total-value" style={{ fontSize: 18 }}>{state?.total ? `₹${state.total.toLocaleString('en-IN')}` : '—'}</span>
          </div>
          {state?.address && <p style={{ fontSize: 12, color: 'var(--color-ink-45)', marginTop: 12 }}>Delivering to: {state.address}</p>}
        </div>

        <div className="confirmation-tracker-row">
          <span><Package size={14} /> Order Placed</span>
          <span><Truck size={14} /> Preparing to Ship</span>
          <span><Home size={14} /> Delivery</span>
        </div>

        <div className="flex justify-center gap-3">
          <Link to="/customer/orders"><Button>View Orders</Button></Link>
          <Link to="/marketplace"><Button variant="outline">Continue Shopping</Button></Link>
        </div>
      </div>
    </PublicLayout>
  )
}
