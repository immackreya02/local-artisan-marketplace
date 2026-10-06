import { useContext } from 'react'
import { CustomRequestsContext } from '../context/CustomRequestsContext'

// Custom hook: clean wrapper around CustomRequestsContext.
export function useCustomRequests() {
  const context = useContext(CustomRequestsContext)
  if (!context) {
    throw new Error('useCustomRequests must be used within a CustomRequestsProvider')
  }
  return context
}
