import { useState } from 'react'
import { Users as UsersIcon, UserCheck, Store, UserX, Search, CheckCircle2, Ban, Trash2, Plus } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'

const demoUsersFallback = [
  { id: 'usr-1', name: 'Rohan Deshmukh', email: 'admin@artisanmarketplace.com', role: 'admin', status: 'Active', location: 'Pune, Maharashtra', phone: '+91 90000 00001', joined: 'Jan 2026' },
  { id: 'usr-2', name: 'Priya Sharma', email: 'priya.sharma@example.com', role: 'customer', status: 'Active', location: 'Mumbai, Maharashtra', phone: '+91 98765 43210', joined: 'Feb 2026' },
  { id: 'usr-3', name: 'Aravind Kumar', email: 'aravind.kumar@example.com', role: 'customer', status: 'Active', location: 'Bengaluru, Karnataka', phone: '+91 90045 67812', joined: 'Mar 2026' },
  { id: 'usr-4', name: 'Rajesh Kumhar', email: 'rajesh.potter@jaipurcrafts.com', role: 'artisan', status: 'Active', location: 'Jaipur, Rajasthan', phone: '+91 98290 45671', joined: 'Feb 2026' },
  { id: 'usr-5', name: 'Meena Devi', email: 'meena.devi@kanjeevaram.com', role: 'artisan', status: 'Active', location: 'Kanchipuram, Tamil Nadu', phone: '+91 94431 89201', joined: 'Feb 2026' },
  { id: 'usr-6', name: 'Sita Devi', email: 'sita.madhubani@artisan.in', role: 'artisan', status: 'Active', location: 'Madhubani, Bihar', phone: '+91 97812 34567', joined: 'Mar 2026' },
  { id: 'usr-7', name: 'Sunita Verma', email: 'sunita@banarasisilk.in', role: 'artisan', status: 'Pending', location: 'Varanasi, UP', phone: '+91 99871 22345', joined: 'Apr 2026' }
]

export default function AdminUsers() {
  const { users, updateUserStatus, removeUser } = useAuth()
  const { getShopByOwnerId, updateShopStatus } = useShops()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('All')

  const activeUsers = (users && users.length > 0) ? users : demoUsersFallback

  const setUserStatus = (user, status) => {
    updateUserStatus(user.id, status)
    if (user.role === 'artisan') {
      const shop = getShopByOwnerId(user.id)
      if (shop) updateShopStatus(shop.id, status)
    }
  }

  const filtered = activeUsers.filter((u) => (role === 'All' || u.role === role) && u.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <DashboardLayout role="admin">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage customers and artisan accounts.</p>
        </div>
      </div>

      <div className="grid-4 mb-6">
        <StatCard icon={UsersIcon} label="Total Users" value={activeUsers.length} />
        <StatCard icon={UserCheck} label="Customers" value={activeUsers.filter((u) => u.role === 'customer').length} />
        <StatCard icon={Store} label="Artisans" value={activeUsers.filter((u) => u.role === 'artisan').length} />
        <StatCard icon={UserX} label="Suspended Accounts" value={activeUsers.filter((u) => u.status === 'Suspended').length} />
      </div>

      <div className="flex-wrap-gap-3 mb-5">
        <div className="promo-input flex-1" style={{ minWidth: 220 }}>
          <Search size={14} className="form-input-icon" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email or phone..." />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select" style={{ width: 'auto' }}>
          {['All', 'customer', 'artisan', 'admin'].map((r) => <option key={r} value={r}>{r === 'All' ? 'Role: All' : r}</option>)}
        </select>
      </div>

      <div className="grid-2">
        {filtered.map((u) => (
          <div key={u.id} className="user-card">
            <div className="user-card-top">
              <div className="user-card-avatar-row">
                <div className="sidebar-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>{u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                  <span className="role-chip">{u.role}</span>
                </div>
              </div>
              <Badge>{u.status}</Badge>
            </div>
            <p className="user-card-meta">{u.email}</p>
            <p className="user-card-meta">{u.phone}</p>
            <p className="user-card-meta">{u.location} · Joined {u.joined || '2026'}</p>
            <div className="user-card-actions">
              {u.status !== 'Active' && <Button size="sm" variant="success" onClick={() => setUserStatus(u, 'Active')}><CheckCircle2 size={12} /> Activate</Button>}
              {u.status === 'Active' && <Button size="sm" variant="outline" onClick={() => setUserStatus(u, 'Suspended')}><Ban size={12} /> Suspend</Button>}
              <Button size="sm" variant="outline" className="btn-danger-text" onClick={() => removeUser(u.id)}><Trash2 size={12} /> Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}

