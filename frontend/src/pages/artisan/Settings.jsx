import { useState } from 'react'
import { Bell, Lock, CreditCard, User } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'

export default function ArtisanSettings() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState({ orders: true, lowStock: true, marketing: false })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <DashboardLayout role="artisan">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Manage your account and shop preferences.</p>

      <div className="settings-grid">
        <div className="form-section" style={{ marginTop: 0 }}>
          <h3 className="form-section-title"><User size={16} color="#C1673B" /> Account</h3>
          <div className="form-group"><label className="form-label">Name</label><input defaultValue={user?.name} className="form-input" /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Email</label><input defaultValue={user?.email} className="form-input" /></div>
        </div>

        <div className="form-section" style={{ marginTop: 0 }}>
          <h3 className="form-section-title"><Bell size={16} color="#C1673B" /> Notifications</h3>
          {[['orders', 'New order alerts'], ['lowStock', 'Low stock warnings'], ['marketing', 'Marketing tips & updates']].map(([k, label]) => (
            <label key={k} className="toggle-row">
              {label}
              <input type="checkbox" checked={notifs[k]} onChange={(e) => setNotifs((n) => ({ ...n, [k]: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--color-terracotta)' }} />
            </label>
          ))}
        </div>

        <div className="form-section" style={{ marginTop: 0 }}>
          <h3 className="form-section-title"><Lock size={16} color="#C1673B" /> Security</h3>
          <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-input" /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">New Password</label><input type="password" className="form-input" /></div>
        </div>

        <div className="form-section" style={{ marginTop: 0 }}>
          <h3 className="form-section-title"><CreditCard size={16} color="#C1673B" /> Payout Details</h3>
          <div className="form-group"><label className="form-label">Bank Account Number</label><input placeholder="•••• •••• 8890" className="form-input" /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">UPI ID</label><input placeholder="artisan@okhdfcbank" className="form-input" /></div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {saved && (
          <div style={{ padding: '10px 16px', background: 'var(--color-emerald-bg)', color: 'var(--color-emerald-text)', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            ✓ Settings saved successfully!
          </div>
        )}
        <Button size="lg" onClick={handleSave}>Save Settings</Button>
      </div>
    </DashboardLayout>
  )
}
