import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, Loader2, CheckCircle2, Search, FileText, Download } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'
import { useAuth } from '../../hooks/useAuth'
import { useOrders } from '../../hooks/useOrders'
import { useShops } from '../../hooks/useShops'
import { generateArtisanOrdersPDF } from '../../utils/pdfReportGenerator'
import { exportReportToExcel } from '../../utils/exportReport'
import { buildOrdersRows } from '../../utils/reportGenerator'

import { getProductMainImage, handleImageError } from '../../utils/productImageHelper'

const STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered']
const TABS = ['All', ...STEPS, 'Cancelled']

export default function ArtisanOrders() {
  const { user } = useAuth()
  const { getShopByOwnerId } = useShops()
  const shop = getShopByOwnerId(user.id)
  const { orders, updateStatus } = useOrders()
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')

  const shopOrders = orders.filter((o) => o.shopId === shop?.id || o.shopId === shop?._id)
  const filtered = shopOrders.filter((o) => (tab === 'All' || o.status === tab) && (o.id.toLowerCase().includes(query.toLowerCase()) || o.orderNumber?.toLowerCase().includes(query.toLowerCase())))

  const advance = (order) => {
    const idx = STEPS.indexOf(order.status)
    if (idx >= 0 && idx < STEPS.length - 1) updateStatus(order.id, STEPS[idx + 1])
  }

  const handleExportExcel = () => {
    const rows = buildOrdersRows(filtered)
    exportReportToExcel({ title: `${shop?.name || 'Shop'} Orders`, rows, filename: `${shop?.name || 'shop'}-orders` })
  }

  const handleExportPDF = () => {
    generateArtisanOrdersPDF({
      shopName: shop?.name || 'Artisan Studio',
      orders: filtered,
      title: `Orders Report (${tab} Orders)`
    })
  }

  return (
    <DashboardLayout role="artisan">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage customer orders and delivery status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download size={14} /> Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText size={14} /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={Package} label="Total Orders" value={shopOrders.length} />
        <StatCard icon={Clock} label="Pending Orders" value={shopOrders.filter((o) => o.status === 'Pending').length} />
        <StatCard icon={Loader2} label="Processing Orders" value={shopOrders.filter((o) => o.status === 'Processing').length} />
        <StatCard icon={CheckCircle2} label="Delivered Orders" value={shopOrders.filter((o) => o.status === 'Delivered').length} />
      </div>

      <div className="flex justify-between mb-5 flex-wrap gap-3">
        <div className="flex-wrap-gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`chip-filter${tab === t ? ' active' : ''}`}>{t}</button>
          ))}
        </div>
        <div className="promo-input" style={{ maxWidth: 220 }}>
          <Search size={14} className="form-input-icon" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search orders..." />
        </div>
      </div>

      <div>
        {filtered.map((o) => {
          const idx = STEPS.indexOf(o.status)
          const cancelled = o.status === 'Cancelled'
          const itemImg = o.items[0]?.image || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300'
          return (
            <div key={o.id} className="order-card">
              <div className="order-card-header-row">
                <img
                  src={itemImg}
                  alt={o.items[0]?.name || 'Order Item'}
                  onError={(e) => handleImageError(e, 'pottery')}
                  style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0, display: 'block' }}
                />
                <div className="flex-1" style={{ minWidth: 200 }}>
                  <div className="order-card-id-row"><span style={{ fontSize: 12, color: 'var(--color-ink-40)' }}>#{o.id}</span><Badge>{o.status}</Badge></div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{o.items[0]?.name}</div>
                  <div className="order-card-meta">{o.customerName} · Qty {o.items[0]?.qty} · {o.date} · {o.address} · {o.method}</div>
                </div>
                <div className="order-card-actions">
                  <div className="order-card-amount">₹{o.amount.toLocaleString('en-IN')}</div>
                  <div className="flex gap-2">
                    <Link to={`/artisan/orders/${o.id}`}><Button size="sm" variant="outline">View</Button></Link>
                    {!cancelled && idx < STEPS.length - 1 && <Button size="sm" onClick={() => advance(o)}>Update Order Status</Button>}
                  </div>
                </div>
              </div>
              {!cancelled && (
                <div className="tracker tracker-sm mt-4">
                  {STEPS.map((s, i) => (
                    <div key={s} className="tracker-step">
                      <div className={`tracker-circle${i <= idx ? ' done' : ''}`}>{i <= idx ? '✓' : i + 1}</div>
                      {i < STEPS.length - 1 && <div className={`tracker-line${i < idx ? ' done' : ''}`} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && <div className="orders-empty">No orders found.</div>}
      </div>
    </DashboardLayout>
  )
}
