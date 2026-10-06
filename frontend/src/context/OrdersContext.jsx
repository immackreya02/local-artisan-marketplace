import { createContext, useReducer, useEffect, useCallback } from 'react'
import { orderReducer } from '../reducers/orderReducer'
import { api } from '../services/api'
import { normalizeOrder } from '../utils/adapters'
import { useAuth } from '../hooks/useAuth'
import { orders as mockOrders } from '../data/mockData'

export const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const [orders, dispatch] = useReducer(orderReducer, mockOrders)
  const { user } = useAuth()

  const fetchOrders = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      let endpoint = '/orders'
      if (user.role === 'artisan') endpoint = '/orders/artisan'
      else if (user.role === 'admin') endpoint = '/orders/all'

      const res = await api.get(endpoint)
      const rawOrders = Array.isArray(res) ? res : (res.orders || res.data || [])
      if (rawOrders.length > 0) {
        const normalized = rawOrders.map(normalizeOrder)
        dispatch({ type: 'HYDRATE_ORDERS', payload: normalized })
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }, [user])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])


  const createOrder = async (orderPayload) => {
    try {
      const res = await api.post('/orders', orderPayload)
      const newOrders = Array.isArray(res.orders) ? res.orders : (res.order ? [res.order] : [res])
      const normalizedList = newOrders.map(normalizeOrder)
      for (const ord of normalizedList) {
        dispatch({ type: 'CREATE_ORDER', payload: ord })
      }
      fetchOrders()
      return normalizedList
    } catch (err) {
      console.error('Failed to create order:', err)
      throw err
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { orderStatus: status })
      if (res.success || res.order || res.data) {
        dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } })
        fetchOrders()
      }
    } catch (err) {
      console.error('Failed to update order status:', err)
      throw err
    }
  }

  const cancelOrder = async (orderId) => {
    try {
      const res = await api.patch(`/orders/${orderId}/cancel`)
      if (res.success || res.order) {
        dispatch({ type: 'CANCEL_ORDER', payload: { orderId } })
        fetchOrders()
      }
    } catch (err) {
      console.error('Failed to cancel order:', err)
      throw err
    }
  }

  return (
    <OrdersContext.Provider value={{ orders, createOrder, updateStatus, cancelOrder, fetchOrders }}>
      {children}
    </OrdersContext.Provider>
  )
}
