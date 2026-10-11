import { useState } from 'react'
import { User, Mail, Phone, MapPin } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '', location: user.location || '' })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setSaved(false) }

  const handleSave = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required.'
    if (!form.email) newErrors.email = 'Email is required.'
    else if (!validateEmail(form.email)) newErrors.email = 'Enter a valid email address.'
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      updateProfile({ name: form.name, email: form.email, phone: form.phone, location: form.location })
      setSaved(true)
    }
  }

  return (
    <DashboardLayout role="customer">
      <h1 className="page-title">Profile & Preferences</h1>
      <p className="page-subtitle">Manage your personal information and multi-channel notification alerts.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', maxWidth: '960px' }}>
        {/* Personal Profile Section */}
        <div className="profile-card" style={{ maxWidth: '100%' }}>
          <div className="profile-avatar-row">
            <div className="profile-avatar">
              {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>Customer since {user.joined || '2024'}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className={`form-input-wrap${errors.name ? ' form-input-error' : ''}`}><User size={14} className="form-input-icon" /><input value={form.name} onChange={set('name')} /></div>
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className={`form-input-wrap${errors.email ? ' form-input-error' : ''}`}><Mail size={14} className="form-input-icon" /><input value={form.email} onChange={set('email')} /></div>
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (For SMS & WhatsApp Alerts)</label>
            <div className="form-input-wrap">
              <Phone size={14} className="form-input-icon" />
              <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location</label>
            <div className="form-input-wrap"><MapPin size={14} className="form-input-icon" /><input value={form.location} onChange={set('location')} placeholder="City, State" /></div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave}>Save Profile</Button>
            {saved && <span className="saved-note">Saved successfully.</span>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
