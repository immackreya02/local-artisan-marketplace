import { useState, useEffect, useCallback } from 'react'
import { MapPin, Home, Briefcase, Plus, Pencil, Trash2, X } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../services/api'

export default function Addresses() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: 'Home',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  })

  const fetchAddresses = useCallback(async () => {
    if (user && user.role === 'customer') {
      try {
        const res = await api.get('/addresses')
        if (res.success && Array.isArray(res.data)) {
          const normalized = res.data.map((a) => ({
            id: a._id || a.id,
            _id: a._id,
            label: a.name || 'Saved Address',
            icon: a.name?.toLowerCase().includes('work') ? 'work' : 'home',
            default: Boolean(a.isDefault),
            line1: a.streetAddress || '',
            city: `${a.city || ''}, ${a.state || ''} ${a.postalCode || ''}`.trim(),
            phone: a.phone || '',
            raw: a
          }))
          setAddresses(normalized)
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err)
      }
    }
  }, [user])

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const openAddModal = () => {
    setEditingId(null)
    setFormData({
      name: 'Home',
      phone: user?.phone || '',
      streetAddress: '',
      city: 'Jaipur',
      state: 'Rajasthan',
      postalCode: '302016',
      country: 'India',
      isDefault: addresses.length === 0
    })
    setShowModal(true)
  }

  const openEditModal = (addr) => {
    const raw = addr.raw || {}
    setEditingId(addr.id)
    setFormData({
      name: raw.name || addr.label || 'Home',
      phone: raw.phone || addr.phone || '',
      streetAddress: raw.streetAddress || addr.line1 || '',
      city: raw.city || 'Jaipur',
      state: raw.state || 'Rajasthan',
      postalCode: raw.postalCode || '302016',
      country: raw.country || 'India',
      isDefault: Boolean(raw.isDefault || addr.default)
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId && !editingId.startsWith('home') && !editingId.startsWith('work')) {
        await api.put(`/addresses/${editingId}`, formData)
      } else {
        await api.post('/addresses', formData)
      }
      setShowModal(false)
      fetchAddresses()
    } catch (err) {
      alert(err.message || 'Failed to save address.')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this saved address?')) return
    try {
      if (!id.startsWith('home') && !id.startsWith('work')) {
        await api.del(`/addresses/${id}`)
      }
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert('Failed to delete address.')
    }
  }

  return (
    <DashboardLayout role="customer">
      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Saved Addresses</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage delivery addresses for your orders.</p>
        </div>
        <Button onClick={openAddModal}><Plus size={14} /> Add New Address</Button>
      </div>

      {showModal && (
        <div className="card card-pad mb-6" style={{ borderColor: 'var(--color-terracotta-20, #F4D3C5)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
            <button onClick={() => setShowModal(false)} style={{ color: 'var(--color-ink-50)' }}><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid-2 mb-3">
              <div className="form-group mb-2">
                <label className="form-label">Label (e.g. Home, Work)</label>
                <input className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group mb-2">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
            </div>
            <div className="form-group mb-3">
              <label className="form-label">Street Address</label>
              <input className="form-input" value={formData.streetAddress} onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })} required />
            </div>
            <div className="grid-3 mb-4">
              <div className="form-group mb-2">
                <label className="form-label">City</label>
                <input className="form-input" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
              </div>
              <div className="form-group mb-2">
                <label className="form-label">State</label>
                <input className="form-input" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
              </div>
              <div className="form-group mb-2">
                <label className="form-label">Postal Code</label>
                <input className="form-input" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} required />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="filter-radio-row">
                <input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} />
                Set as Default Address
              </label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" size="sm">Save Address</Button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid-2">
        {addresses.map((a) => (
          <div key={a.id} className="address-card">
            <div className="address-card-header">
              <span className="flex gap-2" style={{ fontWeight: 600, fontSize: 14 }}>
                {a.icon === 'home' ? <Home size={15} color="#C1673B" /> : <Briefcase size={15} color="#C1673B" />} {a.label}
              </span>
              {a.default && <span className="default-chip">Default</span>}
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>{user?.name}</p>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>{a.line1},<br />{a.city}</p>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>{a.phone}</p>
            <div className="address-card-actions">
              <Button size="sm" variant="outline" onClick={() => openEditModal(a)}><Pencil size={12} /> Edit</Button>
              <Button size="sm" variant="outline" className="btn-danger-text" onClick={() => remove(a.id)}><Trash2 size={12} /> Delete</Button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <MapPin size={24} style={{ margin: '0 auto 8px' }} />
            No addresses saved yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
