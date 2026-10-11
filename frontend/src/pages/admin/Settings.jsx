import { useState } from 'react'
import { Settings as SettingsIcon, ShieldCheck, Percent } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'

export default function AdminSettings() {
  const { user } = useAuth()
  const [commission, setCommission] = useState(10)

  return (
    <DashboardLayout role="admin">
      <h1 className="page-title">Platform Settings</h1>
      <p className="page-subtitle">Configure marketplace-wide preferences.</p>

      <div className="settings-grid">
        <div className="form-section" style={{ marginTop: 0 }}>
          <h3 className="form-section-title"><SettingsIcon size={16} color="#C1673B" /> Admin Account</h3>
          <div className="form-group"><label className="form-label">Name</label><input defaultValue={user.name} className="form-input" /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Email</label><input defaultValue={user.email} className="form-input" /></div>
        </div>

        <div className="form-section" style={{ marginTop: 0 }}>
          <h3 className="form-section-title"><Percent size={16} color="#C1673B" /> Marketplace Commission</h3>
          <label className="form-label">Platform commission per order (%)</label>
          <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} className="form-input" />
          <p style={{ fontSize: 12, color: 'var(--color-ink-40)', marginTop: 8 }}>Applies to all completed orders across the marketplace.</p>
        </div>



        <div className="form-section" style={{ marginTop: 0 }}>
          <h3 className="form-section-title"><ShieldCheck size={16} color="#C1673B" /> Access &amp; Security</h3>
          <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-input" /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">New Password</label><input type="password" className="form-input" /></div>
        </div>
      </div>

      <Button size="lg" className="mt-6" disabled>Save Settings</Button>
    </DashboardLayout>
  )
}
