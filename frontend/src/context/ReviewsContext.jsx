import { createContext, useReducer, useCallback } from 'react'
import { reviewReducer } from '../reducers/reviewReducer'
import { api } from '../services/api'
import { normalizeReview } from '../utils/adapters'
import { reviews as mockReviews } from '../data/mockData'

export const ReviewsContext = createContext(null)

export function ReviewsProvider({ children }) {
  const [reviews, dispatch] = useReducer(reviewReducer, mockReviews)

  const fetchProductReviews = useCallback(async (productId) => {
    if (!productId) return []
    try {
      const res = await api.get(`/reviews/product/${productId}`)
      const raw = Array.isArray(res) ? res : (res.reviews || res.data || [])
      if (raw.length > 0) {
        const normalized = raw.map(normalizeReview)
        dispatch({ type: 'HYDRATE_REVIEWS', payload: normalized })
        return normalized
      }
      return []
    } catch (err) {
      console.error('Failed to fetch product reviews:', err)
      return []
    }
  }, [])


  const fetchShopReviews = useCallback(async (shopId) => {
    if (!shopId) return []
    try {
      const res = await api.get(`/reviews/shop/${shopId}`)
      const raw = Array.isArray(res) ? res : (res.reviews || res.data || [])
      const normalized = raw.map(normalizeReview)
      dispatch({ type: 'HYDRATE_REVIEWS', payload: normalized })
      return normalized
    } catch (err) {
      console.error('Failed to fetch shop reviews:', err)
      return []
    }
  }, [])

  const addReview = async (reviewPayload) => {
    try {
      const res = await api.post('/reviews', {
        productId: reviewPayload.productId,
        orderId: reviewPayload.orderId,
        rating: reviewPayload.rating,
        comment: reviewPayload.comment,
      })
      const newRev = res.review || res.data || res
      const normalized = normalizeReview(newRev || reviewPayload)
      dispatch({ type: 'ADD_REVIEW', payload: normalized })
      if (reviewPayload.productId) fetchProductReviews(reviewPayload.productId)
      return normalized
    } catch (err) {
      console.error('Failed to add review:', err)
      throw err
    }
  }

  const hasReviewed = (customerId, productId, orderId) =>
    reviews.some(
      (r) =>
        (r.customerId === customerId || r.customerId?._id === customerId) &&
        (r.productId === productId || r.productId?._id === productId) &&
        (r.orderId === orderId || r.orderId?._id === orderId)
    )

  return (
    <ReviewsContext.Provider value={{ reviews, addReview, hasReviewed, fetchProductReviews, fetchShopReviews }}>
      {children}
    </ReviewsContext.Provider>
  )
}
