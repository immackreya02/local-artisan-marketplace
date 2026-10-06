import { createContext, useReducer, useEffect, useCallback } from 'react'
import { productReducer } from '../reducers/productReducer'
import { api } from '../services/api'
import { normalizeProduct } from '../utils/adapters'
import { products as mockProducts } from '../data/mockData'

export const ProductsContext = createContext(null)

export function ProductsProvider({ children }) {
  const [products, dispatch] = useReducer(productReducer, mockProducts)

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products')
      const rawProducts = Array.isArray(res) ? res : (res.products || res.data || [])
      if (rawProducts.length > 0) {
        const normalized = rawProducts.map(normalizeProduct)
        dispatch({ type: 'HYDRATE_PRODUCTS', payload: normalized })
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])


  const addProduct = async (productData) => {
    try {
      const res = await api.post('/products', productData)
      const newProd = res.product || res.data || res
      const normalized = normalizeProduct(newProd)
      dispatch({ type: 'ADD_PRODUCT', payload: normalized })
      fetchProducts()
      return normalized.id
    } catch (err) {
      console.error('Failed to add product:', err)
      throw err
    }
  }

  const updateProduct = async (id, patch) => {
    try {
      const res = await api.put(`/products/${id}`, patch)
      const updated = res.product || res.data || res
      const normalized = normalizeProduct(updated)
      dispatch({ type: 'UPDATE_PRODUCT', payload: { id, patch: normalized } })
      fetchProducts()
    } catch (err) {
      console.error('Failed to update product:', err)
      throw err
    }
  }

  const deleteProduct = async (id) => {
    try {
      await api.del(`/products/${id}`)
      dispatch({ type: 'DELETE_PRODUCT', payload: { id } })
      fetchProducts()
    } catch (err) {
      console.error('Failed to delete product:', err)
      throw err
    }
  }

  return (
    <ProductsContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, fetchProducts }}>
      {children}
    </ProductsContext.Provider>
  )
}
