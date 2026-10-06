// ============================================================
// shopReducer.js
// Pure reducer function for the shops list.
// ============================================================

export function shopReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_SHOPS':
      return action.payload

    case 'ADD_SHOP':
      return [action.payload, ...state]

    case 'UPDATE_SHOP_STATUS': {
      const { shopId, status } = action.payload
      return state.map((s) => (s.id === shopId || s._id === shopId ? { ...s, status } : s))
    }

    case 'UPDATE_SHOP_DETAILS': {
      const { shopId, patch } = action.payload
      return state.map((s) => (s.id === shopId || s._id === shopId ? { ...s, ...patch } : s))
    }

    default:
      return state
  }
}
