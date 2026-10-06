// ============================================================
// productReducer.js
// Pure reducer function for the product catalogue (CRUD).
// ============================================================

export function productReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_PRODUCTS':
      return action.payload

    case 'ADD_PRODUCT':
      return [action.payload, ...state]

    case 'UPDATE_PRODUCT': {
      const { id, patch } = action.payload
      return state.map((p) => (p.id === id ? { ...p, ...patch } : p))
    }

    case 'DELETE_PRODUCT':
      return state.filter((p) => p.id !== action.payload.id)

    default:
      return state
  }
}
