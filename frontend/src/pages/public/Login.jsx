import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Sparkles, ShieldCheck, Truck, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/common/Button'

// Basic client-side validation helpers
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1082345678901-placeholder.apps.googleusercontent.com'

    const handleCredentialResponse = async (response) => {
      if (response && response.credential) {
        setError('')
        const res = await loginWithGoogle({ idToken: response.credential })
        if (res.ok) {
          const redirect = params.get('redirect')
          const defaultPath = res.user.role === 'customer' ? '/marketplace' : `/${res.user.role}/dashboard`
          navigate(redirect || defaultPath)
        } else {
          setError(res.error || 'Google authentication failed')
        }
      }
    }

    const initializeGis = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false
        })

        const container = document.getElementById('googleSignInBtn')
        if (container) {
          container.innerHTML = ''
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular'
          })
        }
      }
    }

    if (!window.google || !window.google.accounts) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGis
      document.head.appendChild(script)
    } else {
      initializeGis()
    }
  }, [loginWithGoogle, navigate, params])

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    const errors = {}
    if (!email) errors.email = 'Email is required.'
    else if (!validateEmail(email)) errors.email = 'Enter a valid email address.'
    if (!password) errors.password = 'Password is required.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const res = await login(email, password)
    if (!res.ok) return setError(res.error)
    const redirect = params.get('redirect')
    const defaultPath = res.user.role === 'customer' ? '/marketplace' : `/${res.user.role}/dashboard`
    navigate(redirect || defaultPath)
  }

  return (
    <div className="auth-screen">
      <div className="auth-side">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon"><Sparkles size={17} color="#F7F3EC" /></div>
          <span className="navbar-brand-text">Local Artisan Marketplace</span>
        </Link>
        <div>
          <h1 className="auth-side-title">Supporting local Indian artisans, one craft at a time.</h1>
          <p className="auth-side-desc">Discover authentic handmade treasures and empower the makers who create them across India.</p>
          <img
            src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800"
            alt="Indian Artisan Crafting"
            style={{ height: 224, width: '100%', maxWidth: 420, objectFit: 'cover', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          />
        </div>
        <div className="auth-side-stats">
          <div>
            <div className="hero-stat-value">12,000+</div>
            <div className="hero-stat-label">Local artisans onboard</div>
          </div>
          <div className="flex gap-2" style={{ fontSize: 14, color: 'var(--color-ink-60)' }}><ShieldCheck size={15} color="#3F6B52" /> 100% authentic handmade goods</div>
          <div className="flex gap-2" style={{ fontSize: 14, color: 'var(--color-ink-60)' }}><Truck size={15} color="#3F6B52" /> Fair pay direct to makers</div>
        </div>
      </div>

      <div className="auth-form-side">
        <form onSubmit={submit} className="auth-card">
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-terracotta)',
              marginBottom: 16,
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} /> Return to Marketplace
          </Link>

          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Login to continue shopping or manage your business.</p>

          {error && <div className="form-error-box">{error}</div>}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className={`form-input-wrap${fieldErrors.email ? ' form-input-error' : ''}`}>
              <Mail size={15} className="form-input-icon" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
            </div>
            {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Password</label>
            <div className={`form-input-wrap${fieldErrors.password ? ' form-input-error' : ''}`}>
              <Lock size={15} className="form-input-icon" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} />
              <button type="button" onClick={() => setShowPw((s) => !s)}>{showPw ? <EyeOff size={15} className="form-input-icon" /> : <Eye size={15} className="form-input-icon" />}</button>
            </div>
            {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
          </div>

          <div className="flex justify-between mb-5" style={{ fontSize: 12, marginTop: 12 }}>
            <label className="checkbox-row"><input type="checkbox" defaultChecked /> Remember Me</label>
            <span style={{ color: 'var(--color-ink-35)', fontWeight: 500 }}>Forgot Password?</span>
          </div>

          <Button type="submit" className="btn-full" size="lg">Login</Button>

          <p className="text-center" style={{ fontSize: 12, color: 'var(--color-ink-40)', marginTop: 16, marginBottom: 8 }}>or continue with</p>
          {(!import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('your_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('placeholder')) && (
            <div style={{ fontSize: 11, color: '#b45309', background: '#fef3c7', padding: '6px 10px', borderRadius: 6, marginBottom: 8, textAlign: 'center' }}>
              💡 Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code> with your Google Cloud OAuth Client ID to test live login.
            </div>
          )}
          <div id="googleSignInBtn" style={{ width: '100%', minHeight: 44 }}></div>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register" style={{ color: 'var(--color-terracotta)', fontWeight: 500 }}>Register</Link>
          </p>
        </form>
      </div>
    </div>
  )
}


