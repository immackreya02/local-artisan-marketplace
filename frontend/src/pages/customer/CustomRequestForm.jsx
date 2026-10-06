import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Package, IndianRupee, Hash, CalendarClock, MessageSquare } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/common/Button'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'
import { useCustomRequests } from '../../hooks/useCustomRequests'

export default function CustomRequestForm() {
  const { user } = useAuth()
  const { shops } = useShops()
  const { createRequest } = useCustomRequests()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const activeShops = shops.filter((s) => s.status === 'Active')
  const [shopId, setShopId] = useState(params.get('shopId') || '')
  const [form, setForm] = useState({
    productRef: params.get('product') || '',
    quantity: 1,
    budget: '',
    requiredByDate: '',
    description: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!shopId) errs.shopId = 'Please choose an artisan shop.'
    if (!form.productRef.trim()) errs.productRef = 'Product or category is required.'
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = 'Quantity must be a positive number.'
    if (!form.budget || Number(form.budget) <= 0) errs.budget = 'Budget must be a positive number.'
    if (!form.requiredByDate) errs.requiredByDate = 'Please choose a required-by date.'
    if (!form.description.trim()) errs.description = 'Please describe what you need.'
    return errs
  }

  const submit = (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    createRequest({
      id: `CR-${Date.now()}`,
      customerId: user.id,
      customerName: user.name,
      shopId,
      productRef: form.productRef,
      quantity: Number(form.quantity),
      budget: Number(form.budget),
      requiredByDate: form.requiredByDate,
      description: form.description,
      notes: form.notes,
      status: 'Pending',
      createdDate: new Date().toISOString().slice(0, 10),
    })
    navigate('/customer/custom-requests')
  }

  return (
    <DashboardLayout role="customer">
      <p className="breadcrumb"><Link to="/customer/custom-requests">Custom Requests</Link> / New Request</p>
      <h1 className="page-title">Make It Yours</h1>
      <p className="page-subtitle">Request a Custom Order — tell an artisan exactly what you're looking for and they'll get back to you.</p>

      <form onSubmit={submit} className="form-section" style={{ maxWidth: 640 }}>
        <div className="form-group">
          <label className="form-label">Artisan Shop</label>
          <select value={shopId} onChange={(e) => setShopId(e.target.value)} className={`form-select${errors.shopId ? ' form-input-error' : ''}`}>
            <option value="">Select a shop…</option>
            {activeShops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.shopId && <p className="form-error">{errors.shopId}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Product / Category</label>
          <div className={`form-input-wrap${errors.productRef ? ' form-input-error' : ''}`}>
            <Package size={14} className="form-input-icon" />
            <input value={form.productRef} onChange={set('productRef')} placeholder="e.g. Blue Pottery Dinner Set" />
          </div>
          {errors.productRef && <p className="form-error">{errors.productRef}</p>}
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Required Quantity</label>
            <div className={`form-input-wrap${errors.quantity ? ' form-input-error' : ''}`}>
              <Hash size={14} className="form-input-icon" />
              <input type="number" min="1" value={form.quantity} onChange={set('quantity')} />
            </div>
            {errors.quantity && <p className="form-error">{errors.quantity}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Budget (₹)</label>
            <div className={`form-input-wrap${errors.budget ? ' form-input-error' : ''}`}>
              <IndianRupee size={14} className="form-input-icon" />
              <input type="number" min="1" value={form.budget} onChange={set('budget')} placeholder="5000" />
            </div>
            {errors.budget && <p className="form-error">{errors.budget}</p>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Required By</label>
          <div className={`form-input-wrap${errors.requiredByDate ? ' form-input-error' : ''}`}>
            <CalendarClock size={14} className="form-input-icon" />
            <input type="date" value={form.requiredByDate} onChange={set('requiredByDate')} />
          </div>
          {errors.requiredByDate && <p className="form-error">{errors.requiredByDate}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Custom Requirements / Description</label>
          <textarea value={form.description} onChange={set('description')} rows={4} className={`form-textarea${errors.description ? ' form-input-error' : ''}`} placeholder="Describe colours, size, materials, style references, etc." />
          {errors.description && <p className="form-error">{errors.description}</p>}
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Notes (optional)</label>
          <div className="form-input-wrap" style={{ alignItems: 'flex-start' }}>
            <MessageSquare size={14} className="form-input-icon" style={{ marginTop: 3 }} />
            <textarea value={form.notes} onChange={set('notes')} rows={2} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 14, flex: 1, resize: 'none' }} placeholder="Anything else the artisan should know" />
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-6">Submit Request</Button>
      </form>
    </DashboardLayout>
  )
}
