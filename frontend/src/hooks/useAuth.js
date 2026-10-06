import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

// Custom hook: clean wrapper around AuthContext.
// Lets components call useAuth() instead of useContext(AuthContext) directly.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
