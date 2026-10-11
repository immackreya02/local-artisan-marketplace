import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, IndianRupee, CalendarClock, User, MessageSquare, CheckCircle2, XCircle, Tag, Send } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import { useCustomRequests } from '../../hooks/useCustomRequests'

export default function CustomRequestDetailView({ request, role, backTo, onUpdateStatus }) {
  const navigate = useNavigate()
  const { submitProposal, acceptProposal } = useCustomRequests()
  const [proposedPrice, setProposedPrice] = useState(request?.proposalPrice || request?.budget || '')
  const [deliveryDays, setDeliveryDays] = useState(request?.deliveryDays || 7)
  const [proposalNotes, setProposalNotes] = useState(request?.proposalNotes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  if (!request) {
    return (
      <div className="text-center" style={{ padding: '80px 0' }}>
        <p className="mb-4" style={{ color: 'var(--color-ink-50)' }}>Request not found.</p>
        <Button onClick={() => navigate(backTo)}>Back to Custom Requests</Button>
      </div>
    )
  }

  const handleProposalSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMsg('')
    try {
      if (submitProposal) {
        await submitProposal(request.id, {
          proposalPrice: Number(proposedPrice),
          deliveryDays: Number(deliveryDays),
          proposalNotes
        })
        setMsg('Proposal submitted successfully!')
      } else if (onUpdateStatus) {
        await onUpdateStatus(request.id, 'Proposed')
        setMsg('Proposal updated!')
      }
    } catch (err) {
      setMsg('Failed to submit proposal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAcceptProposal = async () => {
    setIsSubmitting(true)
    setMsg('')
    try {
      if (acceptProposal) {
        await acceptProposal(request.id)
      } else if (onUpdateStatus) {
        await onUpdateStatus(request.id, 'Accepted')
      }
      setMsg('Proposal accepted!')
    } catch (err) {
      setMsg('Failed to accept proposal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canDecide = role === 'artisan' && ['Pending', 'Proposed'].includes(request.status)
  const hasProposal = Boolean(request.proposalPrice || request.status === 'Proposed')

  return (
    <div>
      <Link to={backTo} className="continue-shopping-link"><ArrowLeft size={14} /> Back to Custom Requests</Link>

      <div className="dashboard-header-row">
        <div>
          <h1 className="page-title">Request #{request.id}</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Submitted on {request.createdDate}</p>
        </div>
        <Badge>{request.status}</Badge>
      </div>

      {msg && <div className="form-success-box mb-4">{msg}</div>}

      <div className="order-detail-grid">
        <div className="flex-col gap-6">
          <div className="card card-pad">
            <h3 className="form-section-title"><Package size={16} color="#C1673B" /> What They're Asking For</h3>
            <div className="spec-row"><span style={{ color: 'var(--color-ink-50)' }}>Product / Category</span><span style={{ fontWeight: 500 }}>{request.productRef}</span></div>
            <div className="spec-row"><span style={{ color: 'var(--color-ink-50)' }}>Quantity</span><span style={{ fontWeight: 500 }}>{request.quantity}</span></div>
            <div className="spec-row"><span style={{ color: 'var(--color-ink-50)' }}>Customer Budget</span><span style={{ fontWeight: 500 }}>₹{request.budget?.toLocaleString('en-IN')}</span></div>
            <div className="spec-row" style={{ borderBottom: 'none' }}><span style={{ color: 'var(--color-ink-50)' }}>Required By</span><span style={{ fontWeight: 500 }}>{request.requiredByDate}</span></div>
          </div>

          <div className="card card-pad">
            <h3 className="form-section-title"><MessageSquare size={16} color="#C1673B" /> Description</h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)', lineHeight: 1.6 }}>{request.description}</p>
            {request.notes && (
              <>
                <h4 className="filter-title mt-4" style={{ marginBottom: 6 }}>Additional Notes</h4>
                <p style={{ fontSize: 14, color: 'var(--color-ink-60)', lineHeight: 1.6 }}>{request.notes}</p>
              </>
            )}
          </div>

          {/* Artisan Proposal Form */}
          {canDecide && (
            <div className="card card-pad" style={{ borderColor: 'var(--color-terracotta-20, #F4D3C5)', backgroundColor: 'var(--color-terracotta-5)' }}>
              <h3 className="form-section-title flex items-center gap-2"><Tag size={16} color="var(--color-terracotta)" /> Submit Artisan Proposal &amp; Price Quote</h3>
              <p style={{ fontSize: 13, color: 'var(--color-ink-50)', marginBottom: 16 }}>
                Submit a custom price proposal, estimated production timeline, and technical craft details for the customer.
              </p>
              <form onSubmit={handleProposalSubmit}>
                <div className="grid-2 mb-4">
                  <div className="form-group">
                    <label className="form-label">Proposed Price (₹)</label>
                    <input type="number" className="form-input" value={proposedPrice} onChange={(e) => setProposedPrice(e.target.value)} required min="1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated Time (Days)</label>
                    <input type="number" className="form-input" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} required min="1" />
                  </div>
                </div>
                <div className="form-group mb-4">
                  <label className="form-label">Craft Proposal Notes &amp; Material Details</label>
                  <textarea className="form-input" rows="3" value={proposalNotes} onChange={(e) => setProposalNotes(e.target.value)} placeholder="Describe materials, handcrafting techniques, and timeline details..."></textarea>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="danger" onClick={() => onUpdateStatus && onUpdateStatus(request.id, 'Rejected')}><XCircle size={13} /> Reject Request</Button>
                  </div>
                  <Button type="submit" size="sm" disabled={isSubmitting}><Send size={13} /> {isSubmitting ? 'Submitting...' : 'Submit Proposal'}</Button>
                </div>
              </form>
            </div>
          )}

          {/* Artisan Progress Controls (Accepted / In Progress / Completed) */}
          {role === 'artisan' && ['Accepted', 'In Progress', 'Completed'].includes(request.status) && (
            <div className="card card-pad" style={{ borderColor: 'var(--color-forest-10)', backgroundColor: 'var(--color-forest-10)' }}>
              <h3 className="form-section-title flex items-center gap-2" style={{ color: 'var(--color-forest)' }}>
                <CheckCircle2 size={16} color="var(--color-forest)" /> Update Crafting &amp; Delivery Progress
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-ink-50)', marginBottom: 16 }}>
                Manage the fulfillment stage for this custom craft request.
              </p>
              <div className="flex gap-3 flex-wrap items-center">
                {request.status === 'Accepted' && (
                  <Button size="sm" variant="success" disabled={isSubmitting} onClick={async () => {
                    setIsSubmitting(true)
                    try {
                      if (onUpdateStatus) await onUpdateStatus(request.id, 'In Progress')
                      setMsg('Request status updated to In Progress!')
                    } catch (e) {
                      setMsg('Failed to update status.')
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}>
                    Start Crafting (Mark In Progress)
                  </Button>
                )}
                {request.status === 'In Progress' && (
                  <Button size="sm" variant="success" disabled={isSubmitting} onClick={async () => {
                    setIsSubmitting(true)
                    try {
                      if (onUpdateStatus) await onUpdateStatus(request.id, 'Completed')
                      setMsg('Request marked as Completed & Delivered!')
                    } catch (e) {
                      setMsg('Failed to update status.')
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}>
                    <CheckCircle2 size={14} /> Mark as Completed &amp; Delivered
                  </Button>
                )}
                {request.status === 'Completed' && (
                  <div style={{ color: '#2C5E43', fontWeight: 600, fontSize: 14 }} className="flex items-center gap-2">
                    <CheckCircle2 size={18} /> Craft Completed &amp; Delivered to Customer
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer View of Artisan Proposal */}
          {role === 'customer' && hasProposal && (
            <div className="card card-pad" style={{ borderColor: 'var(--color-forest-10)', backgroundColor: 'var(--color-forest-10)' }}>
              <h3 className="form-section-title flex items-center gap-2" style={{ color: 'var(--color-forest)' }}><CheckCircle2 size={16} color="var(--color-forest)" /> Artisan Proposal &amp; Quote Received</h3>
              <div className="spec-row"><span style={{ color: 'var(--color-ink-50)' }}>Proposed Price</span><span style={{ fontWeight: 600, fontSize: 16, color: '#C1673B' }}>₹{request.proposalPrice?.toLocaleString('en-IN')}</span></div>
              <div className="spec-row"><span style={{ color: 'var(--color-ink-50)' }}>Estimated Delivery</span><span style={{ fontWeight: 500 }}>{request.deliveryDays} business days</span></div>
              {request.proposalNotes && (
                <div className="mt-3 mb-3">
                  <span style={{ fontSize: 12, color: 'var(--color-ink-40)', fontWeight: 600 }}>ARTISAN NOTES:</span>
                  <p style={{ fontSize: 14, color: 'var(--color-ink-70)', marginTop: 4 }}>{request.proposalNotes}</p>
                </div>
              )}
              {request.status === 'Proposed' && (
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="success" onClick={handleAcceptProposal} disabled={isSubmitting}>
                    <CheckCircle2 size={13} /> {isSubmitting ? 'Accepting...' : 'Accept Proposal & Lock Order'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onUpdateStatus && onUpdateStatus(request.id, 'Cancelled')}>
                    <XCircle size={13} /> Decline Proposal
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-col gap-4">
          <div className="card card-pad">
            <h3 className="form-section-title" style={{ fontSize: 14 }}><CalendarClock size={15} color="#C1673B" /> Timeline</h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>Submitted: {request.createdDate}</p>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>Required by: {request.requiredByDate}</p>
          </div>
          {role !== 'customer' && (
            <div className="card card-pad">
              <h3 className="form-section-title" style={{ fontSize: 14 }}><User size={15} color="#C1673B" /> Customer</h3>
              <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>{request.customerName}</p>
            </div>
          )}
          <div className="card card-pad">
            <h3 className="form-section-title" style={{ fontSize: 14 }}><IndianRupee size={15} color="#C1673B" /> Budget</h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>₹{request.budget?.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

