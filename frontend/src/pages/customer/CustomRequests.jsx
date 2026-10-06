import { Link } from 'react-router-dom'
import { ClipboardList, Plus, Package } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'
import { useAuth } from '../../hooks/useAuth'
import { useCustomRequests } from '../../hooks/useCustomRequests'
import { useShops } from '../../hooks/useShops'

export default function CustomerCustomRequests() {
  const { user } = useAuth()
  const { requests } = useCustomRequests()
  const { getShopById } = useShops()
  const myRequests = requests.filter((r) => r.customerId === user.id)

  return (
    <DashboardLayout role="customer">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Custom Requests</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Special order requests you've sent to artisans.</p>
        </div>
        <Link to="/customer/custom-requests/new"><Button><Plus size={14} /> Make It Yours</Button></Link>
      </div>

      {myRequests.length === 0 ? (
        <div className="orders-empty">
          <ClipboardList size={24} style={{ margin: '0 auto 10px', color: 'var(--color-ink-20, var(--color-ink-10))' }} />
          <p style={{ marginBottom: 12 }}>You haven't sent any custom order requests yet.</p>
          <Link to="/customer/custom-requests/new"><Button variant="outline">Make It Yours</Button></Link>
        </div>
      ) : (
        <div>
          {myRequests.map((r) => {
            const shop = getShopById(r.shopId)
            return (
              <div key={r.id} className="order-card flex-wrap-gap-3" style={{ display: 'flex', alignItems: 'center' }}>
                <Swatch seed={r.id} icon={Package} rounded="rounded-lg" style={{ width: 56, height: 56, flexShrink: 0 }} />
                <div className="flex-1" style={{ minWidth: 200 }}>
                  <div className="order-card-id-row"><span style={{ fontSize: 12, color: 'var(--color-ink-40)' }}>#{r.id}</span><Badge>{r.status}</Badge></div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{r.productRef}</div>
                  <div className="order-card-meta">to {shop?.name || 'artisan'} · Qty {r.quantity} · Required by {r.requiredByDate}</div>
                </div>
                <Link to={`/customer/custom-requests/${r.id}`}><Button variant="outline" size="sm">View Details</Button></Link>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
