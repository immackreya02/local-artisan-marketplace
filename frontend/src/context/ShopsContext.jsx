import { createContext, useReducer, useEffect, useCallback } from 'react'
import { shopReducer } from '../reducers/shopReducer'
import { api } from '../services/api'
import { normalizeShop } from '../utils/adapters'
import { shops as mockShops } from '../data/mockData'

export const ShopsContext = createContext(null)

export function ShopsProvider({ children }) {
  const [shops, dispatch] = useReducer(shopReducer, mockShops)

  const fetchShops = useCallback(async () => {
    try {
      const res = await api.get('/shops')
      const rawShops = Array.isArray(res) ? res : (res.shops || res.data || [])
      if (rawShops.length > 0) {
        const normalized = rawShops.map(normalizeShop)
        dispatch({ type: 'HYDRATE_SHOPS', payload: normalized })
      }
    } catch (err) {
      console.error('Failed to fetch shops:', err)
    }
  }, [])

  useEffect(() => {
    fetchShops()
  }, [fetchShops])


  const addShop = async (shopData) => {
    try {
      const res = await api.post('/shops', shopData)
      const newShop = res.shop || res.data || res
      const normalized = normalizeShop(newShop)
      dispatch({ type: 'ADD_SHOP', payload: normalized })
      fetchShops()
      return normalized.id
    } catch (err) {
      console.error('Failed to add shop:', err)
      throw err
    }
  }

  const updateShopStatus = async (shopId, status) => {
    try {
      const res = await api.patch(`/shops/${shopId}/status`, { status })
      if (res.success || res.status) {
        dispatch({ type: 'UPDATE_SHOP_STATUS', payload: { shopId, status } })
        fetchShops()
      }
    } catch (err) {
      console.error('Failed to update shop status:', err)
      throw err
    }
  }

  const updateShopDetails = async (shopId, patch) => {
    try {
      const res = await api.put(`/shops/${shopId}`, patch)
      const updated = res.shop || res.data || res
      const normalized = normalizeShop(updated)
      dispatch({ type: 'UPDATE_SHOP_DETAILS', payload: { shopId, patch: normalized } })
      fetchShops()
    } catch (err) {
      console.error('Failed to update shop details:', err)
      throw err
    }
  }

  const getShopById = (id) => shops.find((s) => s.id === id || s._id === id)
  const getShopByOwnerId = (ownerId) => shops.find((s) => s.ownerId === ownerId || s.owner?._id === ownerId || s.owner === ownerId)

  return (
    <ShopsContext.Provider value={{ shops, addShop, updateShopStatus, updateShopDetails, getShopById, getShopByOwnerId, fetchShops }}>
      {children}
    </ShopsContext.Provider>
  )
}
