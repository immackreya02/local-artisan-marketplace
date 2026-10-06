import { useContext } from 'react'
import { ShopsContext } from '../context/ShopsContext'

// Custom hook: clean wrapper around ShopsContext.
export function useShops() {
  const context = useContext(ShopsContext)
  if (!context) {
    throw new Error('useShops must be used within a ShopsProvider')
  }
  return context
}
