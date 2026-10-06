import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Sparkles, ShoppingBag, Store, Tag, MapPin, Store as StoreIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'
import { categories } from '../../data/mockData'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function Register() {
  const { register } = useAuth()
  const { addShop } = useShops()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // "Become a Seller" links here with ?role=artisan - that's a dedicated
  // entry point, so the Customer/Artisan toggle doesn't even render and
  // role can never change away from 'artisan'. The normal "Sign Up" flow
  // has no query param, defaults to Customer, and keeps the toggle.
  const isSellerFlow = params.get('role') === 'artisan'
  const [role, setRole] = useState(isSellerFlow ? 'artisan' : 'customer')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', agree: false })
  const [shop, setForm2] = useState({ shopName: '', category: 'Pottery', otherCategory: '', location: '', description: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setShop = (k) => (e) => setForm2((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Full name is required.'
    if (!form.email) errors.email = 'Email is required.'
    else if (!validateEmail(form.email)) errors.email = 'Enter a valid email address.'
    if (!form.password) errors.password = 'Password is required.'
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'
    if (form.confirm !== form.password) errors.confirm = 'Passwords do not match.'
    if (role === 'artisan' && !shop.shopName.trim()) errors.shopName = 'Shop name is required for artisan accounts.'
    if (role === 'artisan' && shop.category === 'Other' && !shop.otherCategory.trim()) errors.otherCategory = 'Please specify your category.'
    if (!form.agree) errors.agree = 'You must agree to the Terms of Service.'
    return errors
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    // If "Other" was picked, the artisan's own text replaces the label
    // everywhere the category is stored/displayed.
    const finalCategory = shop.category === 'Other' ? shop.otherCategory.trim() : shop.category

    const res = await register({
      name: form.name, email: form.email, password: form.password, role,
      shop: role === 'artisan' ? { name: shop.shopName, category: finalCategory, location: shop.location, description: shop.description } : undefined,
    })
    if (!res.ok) return setError(res.error)

    // Register the new artisan's shop in the shared ShopsContext so it
    // immediately shows up as a Pending application in Admin > Artisans -
    // both sides now read the same shop list instead of separate mock data.
    if (role === 'artisan') {
      addShop({
        ownerId: res.user.id,
        name: shop.shopName,
        owner: form.name,
        category: finalCategory,
        location: shop.location,
        rating: 0,
        reviewCount: 0,
        verified: false,
        status: 'Pending',
        years: 0,
        phone: '',
        email: form.email,
        description: shop.description,
        image: 'shop',
      })
    }

    navigate(role === 'artisan' ? '/artisan/dashboard' : '/marketplace')
  }

  return (
    <div className="auth-screen">
      <div className="auth-side">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon"><Sparkles size={17} color="#F7F3EC" /></div>
          <span className="navbar-brand-text">Local Artisan Marketplace</span>
        </Link>
        <div>
          <h1 className="auth-side-title">Join a growing community of Indian artisans</h1>
          <p className="auth-side-desc">Create your account today and start discovering handcrafted treasures — or open your own shop and sell to customers across India.</p>
          <img
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"
            alt="Indian Handloom Silk Weaving"
            style={{ height: 224, width: '100%', maxWidth: 420, objectFit: 'cover', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          />
        </div>
        <div className="auth-side-stats" style={{ fontSize: 14, color: 'var(--color-ink-60)' }}>
          <div><span className="hero-stat-value" style={{ fontSize: 20 }}>12k+</span><div className="hero-stat-label">Verified Artisans</div></div>
          <div><span className="hero-stat-value" style={{ fontSize: 20 }}>85k+</span><div className="hero-stat-label">Handmade Products</div></div>
          <div><span className="hero-stat-value" style={{ fontSize: 20 }}>4.9★</span><div className="hero-stat-label">Avg. Buyer Rating</div></div>
        </div>
      </div>

      <div className="auth-form-side" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <form onSubmit={submit} className="auth-card" style={{ maxWidth: 440 }}>
          <h2 className="auth-title">{isSellerFlow ? 'Become a Seller' : 'Create Account'}</h2>
          <p className="auth-subtitle">{isSellerFlow ? 'Set up your artisan shop and start selling on Local Artisan Marketplace.' : 'Join as a Customer or Artisan.'}</p>

          {error && <div className="form-error-box">{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className={`form-input-wrap${fieldErrors.name ? ' form-input-error' : ''}`}>
              <User size={15} className="form-input-icon" />
              <input value={form.name} onChange={set('name')} placeholder="Aarav Sharma" />
            </div>
            {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className={`form-input-wrap${fieldErrors.email ? ' form-input-error' : ''}`}>
              <Mail size={15} className="form-input-icon" />
              <input value={form.email} onChange={set('email')} type="email" placeholder="aarav@example.com" />
            </div>
            {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
          </div>

          <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label">Password</label>
              <div className={`form-input-wrap${fieldErrors.password ? ' form-input-error' : ''}`}>
                <Lock size={15} className="form-input-icon" />
                <input value={form.password} onChange={set('password')} type={showPw ? 'text' : 'password'} />
                <button type="button" onClick={() => setShowPw((s) => !s)}>{showPw ? <EyeOff size={14} className="form-input-icon" /> : <Eye size={14} className="form-input-icon" />}</button>
              </div>
              {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <div className={`form-input-wrap${fieldErrors.confirm ? ' form-input-error' : ''}`}>
                <Lock size={15} className="form-input-icon" />
                <input value={form.confirm} onChange={set('confirm')} type="password" />
              </div>
              {fieldErrors.confirm && <p className="form-error">{fieldErrors.confirm}</p>}
            </div>
          </div>

          {!isSellerFlow && (
            <>
              <label className="form-label" style={{ marginBottom: 6 }}>I want to join as</label>
              <div className="role-toggle">
                <button type="button" onClick={() => setRole('customer')} className={`role-option${role === 'customer' ? ' selected' : ''}`}>
                  <ShoppingBag size={17} color="#8a7f70" />
                  <div className="role-option-title">Customer</div>
                  <div className="role-option-desc">Shop &amp; discover unique handmade goods</div>
                </button>
                <button type="button" onClick={() => setRole('artisan')} className={`role-option${role === 'artisan' ? ' selected' : ''}`}>
                  <Store size={17} color="#C1673B" />
                  <div className="role-option-title">Artisan</div>
                  <div className="role-option-desc">Sell your handmade products online</div>
                </button>
              </div>
            </>
          )}

          {role === 'artisan' && (
            <div className="shop-details-box">
              <div className="shop-details-title"><StoreIcon size={14} /> Shop Details</div>
              <div className="form-group">
                <label className="form-label">Shop Name</label>
                <div className={`form-input-wrap${fieldErrors.shopName ? ' form-input-error' : ''}`} style={{ background: '#fff' }}>
                  <Tag size={14} className="form-input-icon" />
                  <input value={shop.shopName} onChange={setShop('shopName')} placeholder="Terracotta Tales" />
                </div>
                {fieldErrors.shopName && <p className="form-error">{fieldErrors.shopName}</p>}
              </div>
              <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="form-label">Business Category</label>
                  <select value={shop.category} onChange={setShop('category')} className="form-select">
                    {categories.map((c) => <option key={c.id}>{c.name}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <div className="form-input-wrap" style={{ background: '#fff' }}>
                    <MapPin size={14} className="form-input-icon" />
                    <input value={shop.location} onChange={setShop('location')} placeholder="Jaipur, Rajasthan" />
                  </div>
                </div>
              </div>
              {shop.category === 'Other' && (
                <div className="form-group">
                  <label className="form-label">Please specify your category</label>
                  <div className={`form-input-wrap${fieldErrors.otherCategory ? ' form-input-error' : ''}`} style={{ background: '#fff' }}>
                    <Tag size={14} className="form-input-icon" />
                    <input value={shop.otherCategory} onChange={setShop('otherCategory')} placeholder="e.g. Leatherwork" />
                  </div>
                  {fieldErrors.otherCategory && <p className="form-error">{fieldErrors.otherCategory}</p>}
                </div>
              )}
              <div>
                <label className="form-label">Shop Description</label>
                <textarea value={shop.description} onChange={setShop('description')} rows={3} placeholder="Handcrafted terracotta pottery..." className="form-textarea" style={{ background: '#fff' }} />
              </div>
            </div>
          )}

          <label className="checkbox-row" style={{ alignItems: 'flex-start', marginBottom: 20 }}>
            <input type="checkbox" checked={form.agree} onChange={(e) => setForm((f) => ({ ...f, agree: e.target.checked }))} style={{ marginTop: 2 }} />
            I agree to the Terms of Service and Privacy Policy
          </label>
          {fieldErrors.agree && <p className="form-error" style={{ marginTop: -12, marginBottom: 12 }}>{fieldErrors.agree}</p>}

          <Button type="submit" size="lg" className="btn-full">Register</Button>
          <p className="auth-footer-text">
            Already have an account? <Link to="/login" style={{ color: 'var(--color-terracotta)', fontWeight: 500 }}>Login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
