import { createContext, useEffect, useReducer, useCallback } from 'react'
import { authReducer } from '../reducers/authReducer'
import { api } from '../services/api'
import { normalizeUser } from '../utils/adapters'

export const AuthContext = createContext(null)

function loadSavedUser() {
  try {
    const raw = localStorage.getItem('lam_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: loadSavedUser(),
    registry: [],
  })

  // Hydrate logged-in user from backend on initial mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('lam_token')
    if (!token) return

    api.get('/auth/me')
      .then((res) => {
        if (res.success && res.user) {
          const normalized = normalizeUser(res.user)
          localStorage.setItem('lam_user', JSON.stringify(normalized))
          dispatch({ type: 'HYDRATE_AUTH', payload: normalized })
        }
      })
      .catch(() => {
        localStorage.removeItem('lam_token')
        localStorage.removeItem('lam_user')
        dispatch({ type: 'LOGOUT' })
      })
  }, [])

  // If user is Admin, load all users into registry for Admin user management
  const fetchUsers = useCallback(async () => {
    if (state.user?.role === 'admin') {
      try {
        const res = await api.get('/users')
        const rawList = res.users || res.data || (Array.isArray(res) ? res : [])
        if (res.success && Array.isArray(rawList)) {
          const normalizedList = rawList.map(normalizeUser)
          dispatch({ type: 'SET_USERS', payload: normalizedList })
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
      }
    }
  }, [state.user?.role])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      if (res.success && res.token) {
        localStorage.setItem('lam_token', res.token)
        const normalized = normalizeUser(res.user)
        localStorage.setItem('lam_user', JSON.stringify(normalized))
        dispatch({ type: 'LOGIN', payload: normalized })
        return { ok: true, user: normalized }
      }
      return { ok: false, error: res.message || 'Login failed' }
    } catch (err) {
      return { ok: false, error: err.message || 'Login failed' }
    }
  }

  const register = async ({ name, email, password, role, shop, phone }) => {
    try {
      const payload = {
        name,
        email,
        password,
        role: role || 'customer',
        phone: phone || shop?.phone || '',
        shopName: shop?.name || shop?.shopName || '',
        location: shop?.location || '',
      }
      const res = await api.post('/auth/register', payload)
      if (res.success && res.token) {
        localStorage.setItem('lam_token', res.token)
        const normalized = normalizeUser(res.user)
        localStorage.setItem('lam_user', JSON.stringify(normalized))
        dispatch({ type: 'REGISTER', payload: normalized })
        return { ok: true, user: normalized }
      }
      return { ok: false, error: res.message || 'Registration failed' }
    } catch (err) {
      return { ok: false, error: err.message || 'Registration failed' }
    }
  }

  const loginWithGoogle = async (googlePayload) => {
    try {
      const res = await api.post('/auth/google', googlePayload)
      if (res.success && res.token) {
        localStorage.setItem('lam_token', res.token)
        const normalized = normalizeUser(res.user)
        localStorage.setItem('lam_user', JSON.stringify(normalized))
        dispatch({ type: 'LOGIN', payload: normalized })
        return { ok: true, user: normalized }
      }
      return { ok: false, error: res.message || 'Google login failed' }
    } catch (err) {
      return { ok: false, error: err.message || 'Google login failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('lam_token')
    localStorage.removeItem('lam_user')
    localStorage.removeItem('artisan_token')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    dispatch({ type: 'LOGOUT' })
  }

  const updateUserStatus = async (userId, status) => {
    try {
      const res = await api.patch(`/users/${userId}/status`, { status })
      if (res.success) {
        dispatch({ type: 'UPDATE_USER_STATUS', payload: { userId, status } })
        fetchUsers()
      }
    } catch (err) {
      console.error('Failed to update user status:', err)
    }
  }

  const removeUser = async (userId) => {
    try {
      const res = await api.del(`/users/${userId}`)
      if (res.success) {
        dispatch({ type: 'REMOVE_USER', payload: { userId } })
        fetchUsers()
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  const updateProfile = async (patch) => {
    if (!state.user) return
    try {
      const userId = state.user.id || state.user._id
      const res = await api.put(`/users/${userId}`, patch)
      if (res.success) {
        const updated = normalizeUser(res.user || { ...state.user, ...patch })
        localStorage.setItem('lam_user', JSON.stringify(updated))
        dispatch({ type: 'UPDATE_PROFILE', payload: { userId, patch } })
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user: state.user, users: state.registry, login, loginWithGoogle, register, logout, updateUserStatus, removeUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

