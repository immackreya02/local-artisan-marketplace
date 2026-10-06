// ============================================================
// customRequestReducer.js
// Pure reducer function for custom/special order requests.
// ============================================================

export function customRequestReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_REQUESTS':
      return action.payload

    case 'CREATE_REQUEST':
      return [action.payload, ...state]

    case 'UPDATE_REQUEST_STATUS': {
      const { requestId, status } = action.payload
      return state.map((r) => (r.id === requestId || r._id === requestId ? { ...r, status } : r))
    }

    default:
      return state
  }
}
