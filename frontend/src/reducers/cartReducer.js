// ============================================================
// cartReducer.js
// Pure reducer function for cart + wishlist state.
// Demonstrates useReducer action-type pattern from the syllabus.
// ============================================================

export const cartInitialState = {
  items: [],      // [{ productId, qty }]
  wishlist: [],   // [productId, ...]
}

export function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_CART':
      // Used once on app start to restore saved cart/wishlist from localStorage
      return { ...state, ...action.payload }

    case 'ADD_TO_CART': {
      const { productId, qty = 1 } = action.payload
      const existing = state.items.find((i) => i.productId === productId)
      const items = existing
        ? state.items.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty } : i))
        : [...state.items, { productId, qty }]
      return { ...state, items }
    }

    case 'UPDATE_QUANTITY': {
      const { productId, qty } = action.payload
      const items = state.items.map((i) => (i.productId === productId ? { ...i, qty: Math.max(1, qty) } : i))
      return { ...state, items }
    }

    case 'REMOVE_FROM_CART': {
      const items = state.items.filter((i) => i.productId !== action.payload.productId)
      return { ...state, items }
    }

    case 'CLEAR_CART':
      return { ...state, items: [] }

    case 'TOGGLE_WISHLIST': {
      const { productId } = action.payload
      const wishlist = state.wishlist.includes(productId)
        ? state.wishlist.filter((id) => id !== productId)
        : [...state.wishlist, productId]
      return { ...state, wishlist }
    }

    case 'MOVE_TO_CART': {
      const { productId } = action.payload
      const existing = state.items.find((i) => i.productId === productId)
      const items = existing
        ? state.items.map((i) => (i.productId === productId ? { ...i, qty: i.qty + 1 } : i))
        : [...state.items, { productId, qty: 1 }]
      const wishlist = state.wishlist.filter((id) => id !== productId)
      return { ...state, items, wishlist }
    }

    default:
      return state
  }
}
