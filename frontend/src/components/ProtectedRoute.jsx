import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }
  // Suspended/Rejected accounts lose dashboard access - redirected to a safe
  // public page rather than staying in their protected area. Pending stays
  // allowed: a newly-registered artisan legitimately needs their dashboard
  // to see approval status and manage drafts while awaiting review.
  if (user.status === 'Suspended' || user.status === 'Rejected') {
    return <Navigate to="/" replace />
  }
  return children
}
