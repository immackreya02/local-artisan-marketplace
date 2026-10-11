import { useState } from 'react'
import { Lock, CreditCard, User, Phone } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'

export default function ArtisanSettings() {
  const { user, updateProfile } = useAuth()
  const { getShopByOwnerId, updateShopDetails } = useShops()
  const shop = getShopByOwnerId(user?.id)

  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || shop?.phone || '')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (updateProfile) {
      await updateProfile({ name, phone })
    }
    if (shop?.id && updateShopDetails) {
      updateShopDetails(shop.id, { phone, owner: name })
    }
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
          <div className="form-group">
            <label className="form-label">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input defaultValue={user?.email} disabled className="form-input" style={{ opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">WhatsApp / Contact Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="form-input" />
          </div>
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
