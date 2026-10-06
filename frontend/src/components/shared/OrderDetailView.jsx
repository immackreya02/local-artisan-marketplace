import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, CreditCard, User, Store, Truck, Sparkles, Navigation } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Swatch from '../common/Swatch'
import { useShops } from '../../hooks/useShops'

const STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered']

export default function OrderDetailView({ order, role, backTo, onUpdateStatus, onCancelOrder }) {
  const navigate = useNavigate()
  const { getShopById } = useShops()
  if (!order) {
    return (
      <div className="text-center" style={{ padding: '80px 0' }}>
        <p className="mb-4" style={{ color: 'var(--color-ink-50)' }}>Order not found.</p>
        <Button onClick={() => navigate(backTo)}>Back to Orders</Button>
      </div>
    )
  }

  const shop = getShopById(order.shopId)
  const cancelled = order.status === 'Cancelled'
  const currentIdx = STEPS.indexOf(order.status)
  const nextStatus = !cancelled && currentIdx >= 0 && currentIdx < STEPS.length - 1 ? STEPS[currentIdx + 1] : null

  const canManage = (role === 'artisan' || role === 'admin') && !cancelled
  const customerCanCancel = role === 'customer' && order.status === 'Pending'
  const staffCanCancel = canManage && order.status !== 'Delivered'

  const awbCode = order.awbNumber || `DELHIVERY-${String(order.id).replace(/[^0-9]/g, '') || '984721'}-IN`
  const courierPartner = 'Delhivery Logistics (Express)'

  const handleCancel = () => {
    if (window.confirm('Cancel this order? This cannot be undone.')) {
      onCancelOrder?.(order.id)
    }
  }

  return (
    <div>
      <Link to={backTo} className="continue-shopping-link"><ArrowLeft size={14} /> Back to Orders</Link>

      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Order #{order.id}</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Placed on {order.date}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge>{order.status}</Badge>
        </div>
      </div>

      {!cancelled && (
        <div className="card card-pad-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-terracotta)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={15} /> Live Courier Progress Simulator
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-50)', marginTop: 2 }}>
                AWB: <strong>{awbCode}</strong> • Carrier: <strong>{courierPartner}</strong>
              </div>
            </div>
            {canManage && nextStatus && onUpdateStatus && (
              <Button size="sm" variant="primary" onClick={() => onUpdateStatus(order.id, nextStatus)}>
                <Navigation size={13} /> Simulate Next Courier Event ({nextStatus})
              </Button>
            )}
          </div>

          <div className="tracker">
            {STEPS.map((s, i) => (
              <div key={s} className="tracker-step">
                <div className="tracker-step-col">
                  <div className={`tracker-circle${i <= currentIdx ? ' done' : ''}`}>
                    {i <= currentIdx ? '✓' : i + 1}
                  </div>
                  <span className={`tracker-label${i <= currentIdx ? ' done' : ''}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`tracker-line${i < currentIdx ? ' done' : ''}`} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelled && (
        <div className="form-error-box mb-6" style={{ fontWeight: 500 }}>This order was cancelled.</div>
      )}

      <div className="order-detail-grid">
        <div className="flex-col gap-6">
          <div className="card card-pad">
            <h3 className="form-section-title"><Package size={16} color="#C1673B" /> Items</h3>
            <div className="divider-list">
              {order.items.map((it) => (
                <div key={it.productId} className="cart-item-row" style={{ padding: '12px 0' }}>
                  <Swatch seed={it.productId} icon={Package} rounded="rounded-lg" style={{ width: 56, height: 56 }} />
                  <div className="cart-item-info">
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{it.name}</div>
                    <div className="cart-item-shop">Qty: {it.qty}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>₹{(it.price * it.qty).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
            <div className="order-total-row" style={{ marginBottom: 0 }}>
              <span style={{ fontWeight: 600 }}>Total Amount</span>
              <span className="order-total-value">₹{order.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {canManage && onUpdateStatus && (nextStatus || staffCanCancel) && (
            <div className="card card-pad">
              <h3 className="form-section-title">Logistics &amp; Status Controls</h3>
              <div className="flex-wrap-gap-2">
                {nextStatus && <Button size="sm" onClick={() => onUpdateStatus(order.id, nextStatus)}>Mark as {nextStatus}</Button>}
                {staffCanCancel && <Button size="sm" variant="danger" onClick={handleCancel}>Cancel Order</Button>}
              </div>
            </div>
          )}

          {customerCanCancel && (
            <div className="card card-pad">
              <h3 className="form-section-title">Order Actions</h3>
              <p style={{ fontSize: 13, color: 'var(--color-ink-50)', marginBottom: 12 }}>You can cancel this order while it's still Pending.</p>
              <Button size="sm" variant="danger" onClick={handleCancel}>Cancel Order</Button>
            </div>
          )}
        </div>

        <div className="flex-col gap-4">
          <div className="card card-pad">
            <h3 className="form-section-title" style={{ fontSize: 14 }}><MapPin size={15} color="#C1673B" /> Delivery Address</h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>{order.address}</p>
          </div>
          <div className="card card-pad">
            <h3 className="form-section-title" style={{ fontSize: 14 }}><CreditCard size={15} color="#C1673B" /> Payment</h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>Method: {order.method || 'Online'}</p>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>Status: <Badge>{order.payment || (order.paymentMethod === 'Online' ? 'Paid' : 'Pending')}</Badge></p>
            {order.transactionId && (
              <p style={{ fontSize: 11, color: 'var(--color-ink-50)', marginTop: 4 }}>Txn ID: {order.transactionId}</p>
            )}
          </div>
          {role !== 'customer' && (
            <div className="card card-pad">
              <h3 className="form-section-title" style={{ fontSize: 14 }}><User size={15} color="#C1673B" /> Customer</h3>
              <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>{order.customerName}</p>
            </div>
          )}
          {role === 'admin' && shop && (
            <div className="card card-pad">
              <h3 className="form-section-title" style={{ fontSize: 14 }}><Store size={15} color="#C1673B" /> Artisan Shop</h3>
              <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>{shop.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
