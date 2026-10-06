// ============================================================
// reviewReducer.js
// Pure reducer function for product reviews.
// ============================================================

export function reviewReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_REVIEWS':
      return action.payload

    case 'ADD_REVIEW':
      return [action.payload, ...state]

    default:
      return state
  }
}
