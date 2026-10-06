import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Package, CheckCircle2, XCircle, Clock } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'
import { useCustomRequests } from '../../hooks/useCustomRequests'

const TABS = ['All', 'Pending', 'Accepted', 'Rejected']

export default function ArtisanCustomRequests() {
  const { user } = useAuth()
  const { getShopByOwnerId } = useShops()
  const shop = getShopByOwnerId(user.id)
  const { requests, updateRequestStatus } = useCustomRequests()
  const [tab, setTab] = useState('All')

  const shopRequests = shop ? requests.filter((r) => r.shopId === shop.id) : []
  const filtered = tab === 'All' ? shopRequests : shopRequests.filter((r) => r.status === tab)

  return (
    <DashboardLayout role="artisan">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Custom Requests</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Special order requests from customers.</p>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={ClipboardList} label="Total Requests" value={shopRequests.length} />
        <StatCard icon={Clock} label="Pending" value={shopRequests.filter((r) => r.status === 'Pending').length} />
        <StatCard icon={CheckCircle2} label="Accepted" value={shopRequests.filter((r) => r.status === 'Accepted').length} />
        <StatCard icon={XCircle} label="Rejected" value={shopRequests.filter((r) => r.status === 'Rejected').length} />
      </div>

      <div className="flex-wrap-gap-2 mb-5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`chip-filter${tab === t ? ' active' : ''}`}>{t}</button>
        ))}
      </div>

      <div>
        {filtered.map((r) => (
          <div key={r.id} className="order-card flex-wrap-gap-3" style={{ display: 'flex', alignItems: 'center' }}>
            <Swatch seed={r.id} icon={Package} rounded="rounded-lg" style={{ width: 56, height: 56, flexShrink: 0 }} />
            <div className="flex-1" style={{ minWidth: 200 }}>
              <div className="order-card-id-row"><span style={{ fontSize: 12, color: 'var(--color-ink-40)' }}>#{r.id}</span><Badge>{r.status}</Badge></div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{r.productRef}</div>
              <div className="order-card-meta">{r.customerName} · Qty {r.quantity} · Budget ₹{r.budget.toLocaleString('en-IN')} · Required by {r.requiredByDate}</div>
            </div>
            <div className="flex gap-2">
              {r.status === 'Pending' && (
                <>
                  <Button size="sm" variant="success" onClick={() => updateRequestStatus(r.id, 'Accepted')}>Accept</Button>
                  <Button size="sm" variant="danger" onClick={() => updateRequestStatus(r.id, 'Rejected')}>Reject</Button>
                </>
              )}
              <Link to={`/artisan/custom-requests/${r.id}`}><Button variant="outline" size="sm">View Details</Button></Link>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="orders-empty">No custom requests {tab !== 'All' ? `with status "${tab}"` : 'yet'}.</div>}
      </div>
    </DashboardLayout>
  )
}
