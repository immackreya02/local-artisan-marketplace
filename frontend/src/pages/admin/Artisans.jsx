import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, Store, Ban, Search, Download, FileText } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'
import Rating from '../../components/common/Rating'
import { useShops } from '../../hooks/useShops'
import { useAuth } from '../../hooks/useAuth'
import { useOrders } from '../../hooks/useOrders'
import { api } from '../../services/api'
import { exportReportToExcel, exportReportToPDF } from '../../utils/exportReport'

export default function AdminArtisans() {
  const { shops, updateShopStatus } = useShops()
  const { updateUserStatus } = useAuth()
  const { orders } = useOrders()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('All')

  const setShopAndUserStatus = async (shop, status) => {
    const artisanId = shop.ownerId || shop.owner?._id
    if (artisanId) {
      try {
        let action = 'approve'
        if (status === 'Rejected') action = 'reject'
        else if (status === 'Suspended') action = 'suspend'
        else if (status === 'Active' && shop.status === 'Suspended') action = 'reinstate'

        await api.patch(`/admin/artisans/${artisanId}/${action}`)
      } catch (err) {
        console.warn('Backend admin artisan patch error:', err)
      }
    }
    updateShopStatus(shop.id, status)
    if (artisanId) updateUserStatus(artisanId, status)
  }

  const filtered = shops.filter((s) => (tab === 'All' || s.status === tab) && s.name.toLowerCase().includes(query.toLowerCase()))

  const getRows = () => filtered.map((s) => ({
    Shop: s.name,
    Owner: s.owner || s.ownerName || '—',
    Category: s.category || '—',
    Location: s.location || '—',
    Rating: s.rating || 0,
    Status: s.status || 'Active'
  }))

  const handleExportExcel = () => {
    exportReportToExcel({ title: 'Artisans Report', rows: getRows(), filename: 'admin-artisans' })
  }

  const handleExportPDF = () => {
    exportReportToPDF({ title: 'Artisans Report', subtitle: 'Registered artisan studios log', rows: getRows(), filename: 'admin-artisans' })
  }

  return (
    <DashboardLayout role="admin">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Artisan Management</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Review and manage registered artisans.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}><Download size={14} /> Export Excel</Button>
          <Button variant="outline" onClick={handleExportPDF}><FileText size={14} /> Export PDF</Button>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={Users} label="Total Shops" value={shops.length} />
        <StatCard icon={Clock} label="Pending Approval" value={shops.filter((s) => s.status === 'Pending').length} />
        <StatCard icon={Store} label="Active Shops" value={shops.filter((s) => s.status === 'Active').length} />
        <StatCard icon={Ban} label="Suspended Shops" value={shops.filter((s) => s.status === 'Suspended').length} />
      </div>

      <div className="flex-wrap-gap-3 mb-5">
        <div className="promo-input flex-1" style={{ minWidth: 220 }}>
          <Search size={14} className="form-input-icon" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by shop or owner name..." />
        </div>
        <div className="flex gap-2">
          {['All', 'Pending', 'Active', 'Suspended', 'Rejected'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`chip-filter${tab === t ? ' active' : ''}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {filtered.map((s) => (
          <div key={s.id} className="user-card">
            <div className="flex gap-3 mb-3" style={{ alignItems: 'center' }}>
              <Swatch seed={s.id} icon={Store} rounded="rounded-lg" style={{ width: 44, height: 44 }} />
              <div className="flex-1">
                <div className="flex gap-2" style={{ alignItems: 'center' }}><span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span><Badge>{s.status}</Badge></div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>{s.owner}</div>
              </div>
            </div>
            <div className="flex-wrap-gap-2 mb-3">
              <span className="badge badge-stone">{s.category}</span>
              <span style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>{s.location}</span>
            </div>
            <div className="artisan-card-stats">
              <div><div className="artisan-card-stat-value">{s.years}</div><div className="artisan-card-stat-label">Years</div></div>
              <div><div className="artisan-card-stat-value"><Rating value={s.rating} /></div><div className="artisan-card-stat-label">Rating</div></div>
              <div><div className="artisan-card-stat-value">{orders.filter((o) => o.shopId === s.id).length}</div><div className="artisan-card-stat-label">Orders</div></div>
            </div>
            <div className="artisan-card-actions">
              <Link to={`/shop/${s.id}`} style={{ flex: 1 }}>
                <Button size="sm" variant="outline" style={{ width: '100%' }}>View Details</Button>
              </Link>
              {s.status === 'Pending' && (
                <>
                  <Button size="sm" variant="success" className="flex-1" onClick={() => setShopAndUserStatus(s, 'Active')}>Approve</Button>
                  <Button size="sm" variant="danger" className="flex-1" onClick={() => setShopAndUserStatus(s, 'Rejected')}>Reject</Button>
                </>
              )}
              {s.status === 'Active' && <Button size="sm" variant="danger" className="flex-1" onClick={() => setShopAndUserStatus(s, 'Suspended')}>Suspend</Button>}
              {(s.status === 'Suspended' || s.status === 'Rejected') && <Button size="sm" variant="success" className="flex-1" onClick={() => setShopAndUserStatus(s, 'Active')}>Reinstate</Button>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty-state" style={{ gridColumn: '1 / -1' }}>No artisans match this filter.</div>}
      </div>
    </DashboardLayout>
  )
}
