import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle2, XCircle, Download, Search, FileText } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'
import { useAuth } from '../../hooks/useAuth'
import { useOrders } from '../../hooks/useOrders'
import { exportReportToExcel, exportReportToPDF } from '../../utils/exportReport'
import { buildOrdersRows } from '../../utils/reportGenerator'

const TABS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export default function CustomerOrders() {
  const { user } = useAuth()
  const { orders } = useOrders()
  const [tab, setTab] = useState('All')
  const [query, setQuery] = useState('')
  const myOrders = orders.filter((o) => o.customerId === user.id)
  const filtered = myOrders.filter((o) => (tab === 'All' || o.status === tab) && o.id.toLowerCase().includes(query.toLowerCase()))

  const handleExportExcel = () => {
    const rows = buildOrdersRows(filtered)
    exportReportToExcel({ title: 'My Purchase Orders', rows, filename: 'my-orders' })
  }

  const handleExportPDF = () => {
    const rows = buildOrdersRows(filtered)
    exportReportToPDF({ title: 'My Purchase Orders', subtitle: 'Customer Purchase History', rows, filename: 'my-orders' })
  }

  return (
    <DashboardLayout role="customer">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Track and manage your purchases.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}><Download size={14} /> Export Excel</Button>
          <Button variant="outline" onClick={handleExportPDF}><FileText size={14} /> Export PDF</Button>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={Package} label="Total Orders" value={myOrders.length} />
        <StatCard icon={Clock} label="Pending Orders" value={myOrders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length} />
        <StatCard icon={CheckCircle2} label="Delivered Orders" value={myOrders.filter((o) => o.status === 'Delivered').length} />
        <StatCard icon={XCircle} label="Cancelled Orders" value={myOrders.filter((o) => o.status === 'Cancelled').length} />
      </div>

      <div className="flex justify-between mb-4 flex-wrap gap-3">
        <div className="flex-wrap-gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`chip-filter${tab === t ? ' active' : ''}`}>{t}</button>
          ))}
        </div>
        <div className="promo-input" style={{ maxWidth: 220 }}>
          <Search size={14} className="form-input-icon" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search order ID" />
        </div>
      </div>

      <div>
        {filtered.map((o) => (
          <div key={o.id} className="order-card flex-wrap-gap-3" style={{ display: 'flex', alignItems: 'center' }}>
            <Swatch seed={o.id} icon={Package} rounded="rounded-lg" style={{ width: 64, height: 64, flexShrink: 0 }} />
            <div className="flex-1" style={{ minWidth: 200 }}>
              <div className="order-card-id-row"><span style={{ fontSize: 12, color: 'var(--color-ink-40)' }}>#{o.id}</span><Badge>{o.status}</Badge></div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{o.items[0]?.name}</div>
              <div className="order-card-meta">Ordered {o.date}</div>
            </div>
            <div className="order-total-value" style={{ fontSize: 18 }}>₹{o.amount.toLocaleString('en-IN')}</div>
            <Link to={`/customer/orders/${o.id}`}><Button variant="outline" size="sm">View Order</Button></Link>
          </div>
        ))}
        {filtered.length === 0 && <div className="orders-empty">No orders found.</div>}
      </div>
    </DashboardLayout>
  )
}
