import { createContext, useReducer, useEffect, useCallback } from 'react'
import { customRequestReducer } from '../reducers/customRequestReducer'
import { api } from '../services/api'
import { normalizeCustomRequest } from '../utils/adapters'
import { useAuth } from '../hooks/useAuth'
import { customRequests as mockCustomRequests } from '../data/mockData'

export const CustomRequestsContext = createContext(null)

export function CustomRequestsProvider({ children }) {
  const [requests, dispatch] = useReducer(customRequestReducer, mockCustomRequests)
  const { user } = useAuth()

  const fetchRequests = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      let endpoint = '/custom-requests'
      if (user.role === 'artisan') endpoint = '/custom-requests/artisan'

      const res = await api.get(endpoint)
      const raw = Array.isArray(res) ? res : (res.data || res.customRequests || [])
      if (raw.length > 0) {
        const normalized = raw.map(normalizeCustomRequest)
        dispatch({ type: 'HYDRATE_REQUESTS', payload: normalized })
      }
    } catch (err) {
      console.error('Failed to fetch custom requests:', err)
    }
  }, [user])


  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const createRequest = async (requestPayload) => {
    try {
      const res = await api.post('/custom-requests', requestPayload)
      const newReq = res.data || res.customRequest || res
      const normalized = normalizeCustomRequest(newReq)
      dispatch({ type: 'CREATE_REQUEST', payload: normalized })
      fetchRequests()
      return normalized
    } catch (err) {
      console.error('Failed to create custom request:', err)
      throw err
    }
  }

  const updateRequestStatus = async (requestId, status) => {
    try {
      const res = await api.patch(`/custom-requests/${requestId}/status`, { status })
      if (res.success || res.data) {
        dispatch({ type: 'UPDATE_REQUEST_STATUS', payload: { requestId, status } })
        fetchRequests()
      }
    } catch (err) {
      console.error('Failed to update custom request status:', err)
      throw err
    }
  }

  const submitProposal = async (requestId, { proposalPrice, deliveryDays, proposalNotes }) => {
    try {
      const res = await api.post(`/custom-requests/${requestId}/proposal`, { proposalPrice, deliveryDays, proposalNotes })
      if (res.success || res.data) {
        fetchRequests()
        return res.data
      }
    } catch (err) {
      console.error('Failed to submit proposal:', err)
      throw err
    }
  }

  const acceptProposal = async (requestId) => {
    try {
      const res = await api.post(`/custom-requests/${requestId}/accept-proposal`)
      if (res.success || res.data) {
        fetchRequests()
        return res.data
      }
    } catch (err) {
      console.error('Failed to accept proposal:', err)
      throw err
    }
  }

  return (
    <CustomRequestsContext.Provider value={{ requests, createRequest, updateRequestStatus, submitProposal, acceptProposal, fetchRequests }}>
      {children}
    </CustomRequestsContext.Provider>
  )
}


