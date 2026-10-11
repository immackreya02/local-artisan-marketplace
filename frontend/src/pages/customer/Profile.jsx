import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Bell, MessageSquare, ShieldCheck, Check } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/common/Button'
import OTPModal from '../../components/common/OTPModal'
import { useAuth } from '../../hooks/useAuth'
import { communicationService } from '../../services/communicationService'

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '', location: user.location || '' })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  // Notification Preferences State
  const [channels, setChannels] = useState({ email: true, sms: true, whatsapp: true })
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)

  useEffect(() => {
    // Load notification preferences from server
    communicationService.getPreferences().then((res) => {
      if (res.success && res.preferences) {
        setChannels(res.preferences)
      }
    })
  }, [])

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setSaved(false) }

  const handleChannelToggle = (ch) => {
    const updated = { ...channels, [ch]: !channels[ch] }
    setChannels(updated)
    communicationService.updatePreferences(updated)
  }

  const handleSave = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required.'
    if (!form.email) newErrors.email = 'Email is required.'
    else if (!validateEmail(form.email)) newErrors.email = 'Enter a valid email address.'
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      updateProfile({ name: form.name, email: form.email, phone: form.phone, location: form.location })
      communicationService.updatePreferences({ ...channels, phone: form.phone })
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
            <label className="form-label">Phone Number (Required for SMS & WhatsApp Alerts)</label>
            <div className="form-input-wrap" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <Phone size={14} className="form-input-icon" />
                <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              </div>
              <button
                type="button"
                onClick={() => setIsOTPModalOpen(true)}
                style={{ fontSize: '12px', color: phoneVerified ? 'var(--color-forest)' : 'var(--color-terracotta)', fontWeight: 600, background: 'var(--color-cream-dark)', padding: '4px 10px', borderRadius: '99px', border: 'none' }}
              >
                {phoneVerified ? '✓ Verified' : 'Verify via OTP'}
              </button>
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

        {/* Multi-Channel Communication Preferences */}
        <div className="card card-pad" style={{ background: 'var(--color-card-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Bell size={20} color="var(--color-terracotta)" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>Multi-Channel Communication Settings</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-ink-50)' }}>Choose how you receive order updates, delivery tracking, and custom quotes.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', background: 'var(--color-cream-dark)', padding: '14px 16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={18} color="var(--color-terracotta)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-ink)' }}>Email Notifications</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-50)' }}>Invoices, order confirmations, and custom quotes</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channels.email}
                onChange={() => handleChannelToggle('email')}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-terracotta)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', background: 'var(--color-cream-dark)', padding: '14px 16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageSquare size={18} color="#25D366" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-ink)' }}>WhatsApp Order Alerts</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-50)' }}>Instant status updates and artisan chat support</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channels.whatsapp}
                onChange={() => handleChannelToggle('whatsapp')}
                style={{ width: '18px', height: '18px', accentColor: '#25D366', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', background: 'var(--color-cream-dark)', padding: '14px 16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={18} color="var(--color-forest)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-ink)' }}>SMS & Delivery Alerts</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-ink-50)' }}>Time-sensitive dispatch & out-for-delivery SMS</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={channels.sms}
                onChange={() => handleChannelToggle('sms')}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-forest)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      <OTPModal
        isOpen={isOTPModalOpen}
        onClose={() => setIsOTPModalOpen(false)}
        phone={form.phone}
        onVerified={() => setPhoneVerified(true)}
      />
    </DashboardLayout>
  )
}
