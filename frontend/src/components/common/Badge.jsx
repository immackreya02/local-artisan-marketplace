// Status pill shown across dashboards (order status, stock status, account status, etc).
// Demonstrates: a lookup object used for conditional styling instead of if/else chains.
const TONE_MAP = {
  Active: 'badge-green',
  Approved: 'badge-green',
  Accepted: 'badge-green',
  Delivered: 'badge-green',
  Completed: 'badge-green',
  'In Stock': 'badge-green',
  Paid: 'badge-green',
  Pending: 'badge-amber',
  'Low Stock': 'badge-amber',
  'In Review': 'badge-blue',
  Processing: 'badge-blue',
  Shipped: 'badge-blue',
  Suspended: 'badge-red',
  Rejected: 'badge-red',
  Cancelled: 'badge-red',
  Failed: 'badge-red',
  'Out of Stock': 'badge-red',
  Draft: 'badge-stone',
  Inactive: 'badge-stone',
  Featured: 'badge-terracotta',
}

export default function Badge({ children }) {
  const toneClass = TONE_MAP[children] || 'badge-stone'
  return (
    <span className={`badge ${toneClass}`}>
      <span className="badge-dot" />
      {children}
    </span>
  )
}
