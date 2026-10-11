// ============================================================
// reviewReducer.js
// Pure reducer function for product reviews.
// ============================================================

export function reviewReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_REVIEWS': {
      const incoming = Array.isArray(action.payload) ? action.payload : []
      const existingOthers = state.filter((r) => !incoming.some((i) => i.id === r.id))
      return [...incoming, ...existingOthers]
    }

    case 'ADD_REVIEW':
      return [action.payload, ...state]

    default:
      return state
  }
}
