const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('lam_token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config)
  
  let data
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      // localStorage.removeItem('lam_token')
      // localStorage.removeItem('lam_user')
    }
    const errorMessage = (typeof data === 'object' && data.message) ? data.message : (data || 'API request failed')
    const error = new Error(errorMessage)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  del: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
}
