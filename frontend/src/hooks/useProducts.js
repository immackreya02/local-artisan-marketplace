import { useContext } from 'react'
import { ProductsContext } from '../context/ProductsContext'

// Custom hook: clean wrapper around ProductsContext.
export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider')
  }
  return context
}
