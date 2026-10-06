import { createContext, useEffect, useReducer, useCallback } from 'react'
import { cartReducer, cartInitialState } from '../reducers/cartReducer'
import { api } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export const CartContext = createContext(null)

function loadSaved(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, cartInitialState)
  const { user } = useAuth()

  // Guest localStorage sync (when unauthenticated or customer guest)
  useEffect(() => {
    if (!user) {
      const items = loadSaved('lam_cart', [])
      const wishlist = loadSaved('lam_wishlist', [])
      dispatch({ type: 'HYDRATE_CART', payload: { items, wishlist } })
    }
  }, [user])

  // Sync customer cart & wishlist with backend if logged in as customer
  const syncBackendCartAndWishlist = useCallback(async () => {
    if (user && user.role === 'customer') {
      try {
        // Merge guest cart items if present in localStorage
        const guestItems = loadSaved('lam_cart', [])
        if (guestItems.length > 0) {
          for (const gItem of guestItems) {
            try {
              await api.post('/cart/items', { productId: gItem.productId, quantity: gItem.qty || 1 })
            } catch (err) {
              console.warn('Could not merge item to cart:', gItem.productId, err.message)
            }
          }
          localStorage.removeItem('lam_cart')
        }

        // Fetch backend cart
        const cartRes = await api.get('/cart')
        const serverItems = (cartRes.data?.items || []).map((i) => ({
          productId: i.productId?._id || i.productId,
          qty: i.quantity,
        }))

        // Fetch backend wishlist
        let serverWishlist = []
        try {
          const wishRes = await api.get('/wishlist')
          const wishProds = wishRes.data?.products || []
          serverWishlist = wishProds.map((p) => p._id || p.id || p.toString())
        } catch {
          // ignore wishlist fetch error
        }

        dispatch({ type: 'HYDRATE_CART', payload: { items: serverItems, wishlist: serverWishlist } })
      } catch (err) {
        console.error('Failed to sync cart/wishlist:', err)
      }
    }
  }, [user])

  useEffect(() => {
    syncBackendCartAndWishlist()
  }, [syncBackendCartAndWishlist])

  // Keep localStorage updated for guest users
  useEffect(() => {
    if (!user) {
      localStorage.setItem('lam_cart', JSON.stringify(state.items))
    }
  }, [state.items, user])

  useEffect(() => {
    if (!user) {
      localStorage.setItem('lam_wishlist', JSON.stringify(state.wishlist))
    }
  }, [state.wishlist, user])

  const addToCart = async (productId, qty = 1) => {
    dispatch({ type: 'ADD_TO_CART', payload: { productId, qty } })
    if (user && user.role === 'customer') {
      try {
        await api.post('/cart/items', { productId, quantity: qty })
        syncBackendCartAndWishlist()
      } catch (err) {
        console.error('Failed to add item to backend cart:', err)
      }
    }
  }

  const updateQty = async (productId, qty) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, qty } })
    if (user && user.role === 'customer') {
      try {
        await api.put(`/cart/items/${productId}`, { quantity: qty })
        syncBackendCartAndWishlist()
      } catch (err) {
        console.error('Failed to update cart quantity on backend:', err)
      }
    }
  }

  const removeFromCart = async (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId } })
    if (user && user.role === 'customer') {
      try {
        await api.del(`/cart/items/${productId}`)
        syncBackendCartAndWishlist()
      } catch (err) {
        console.error('Failed to remove item from backend cart:', err)
      }
    }
  }

  const clearCart = async () => {
    dispatch({ type: 'CLEAR_CART' })
    if (user && user.role === 'customer') {
      try {
        await api.del('/cart')
        syncBackendCartAndWishlist()
      } catch (err) {
        console.error('Failed to clear backend cart:', err)
      }
    }
  }

  const toggleWishlist = async (productId) => {
    const isSaved = state.wishlist.includes(productId)
    dispatch({ type: 'TOGGLE_WISHLIST', payload: { productId } })
    if (user && user.role === 'customer') {
      try {
        if (isSaved) {
          await api.del(`/wishlist/${productId}`)
        } else {
          await api.post(`/wishlist/${productId}`)
        }
        syncBackendCartAndWishlist()
      } catch (err) {
        console.error('Failed to update backend wishlist:', err)
      }
    }
  }

  const moveToCart = async (productId) => {
    dispatch({ type: 'MOVE_TO_CART', payload: { productId } })
    if (user && user.role === 'customer') {
      try {
        await api.post('/cart/items', { productId, quantity: 1 })
        await api.del(`/wishlist/${productId}`)
        syncBackendCartAndWishlist()
      } catch (err) {
        console.error('Failed to move to backend cart:', err)
      }
    }
  }

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        wishlist: state.wishlist,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        toggleWishlist,
        moveToCart,
        syncBackendCartAndWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
