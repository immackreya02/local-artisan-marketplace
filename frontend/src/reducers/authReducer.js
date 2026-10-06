// ============================================================
// authReducer.js
// Pure reducer function for authentication state.
// state shape: { user: {...} | null, registry: [...allUsers] }
// ============================================================

export function authReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_AUTH':
      return { ...state, user: action.payload }

    case 'SET_USERS':
      return { ...state, registry: action.payload }

    case 'LOGIN':
      return { ...state, user: action.payload }

    case 'REGISTER':
      return {
        ...state,
        user: action.payload,
        registry: [...state.registry, action.payload],
      }

    case 'LOGOUT':
      return { ...state, user: null }

    case 'UPDATE_USER_STATUS': {
      const { userId, status } = action.payload
      return {
        ...state,
        registry: state.registry.map((u) => (u.id === userId || u._id === userId ? { ...u, status } : u)),
        user: (state.user?.id === userId || state.user?._id === userId) ? { ...state.user, status } : state.user,
      }
    }

    case 'REMOVE_USER':
      return { ...state, registry: state.registry.filter((u) => u.id !== action.payload.userId && u._id !== action.payload.userId) }

    case 'UPDATE_PROFILE': {
      const { userId, patch } = action.payload
      return {
        ...state,
        registry: state.registry.map((u) => (u.id === userId || u._id === userId ? { ...u, ...patch } : u)),
        user: (state.user?.id === userId || state.user?._id === userId) ? { ...state.user, ...patch } : state.user,
      }
    }

    default:
      return state
  }
}
