import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Search, ShoppingCart, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { useLanguage } from '../../hooks/useLanguage'
import Button from '../common/Button'
import ThemeToggle from '../common/ThemeToggle'
import PaletteSelector from '../common/PaletteSelector'
import LanguageSelector from '../common/LanguageSelector'
import NotificationDropdown from '../common/NotificationDropdown'

export default function PublicNavbar() {
  const { user, logout } = useAuth()
  const { items } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const count = items.reduce((s, i) => s + i.qty, 0)
  const dashboardPath = user ? `/${user.role}/dashboard` : '/login'

  const links = [
    { to: '/', label: t('home') },
    { to: '/marketplace', label: t('explore') },
    { to: '/shops', label: t('shops') },
    { to: '/categories', label: t('categories') },
  ]

  return (
    <header className="public-navbar">
      <div className="public-navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <Sparkles size={16} color="#F7F3EC" />
          </div>
          <span className="navbar-brand-text">Local Artisan Marketplace</span>
        </Link>

        <nav className="navbar-links">
          {links.map((l) => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
        </nav>

        <div className="navbar-actions">
          <button onClick={() => navigate('/marketplace')} className="icon-btn" title="Search">
            <Search size={17} color="var(--color-ink-60)" />
          </button>
          {user?.role !== 'artisan' && user?.role !== 'admin' && (
            <button onClick={() => navigate('/cart')} className="icon-btn" title="Cart">
              <ShoppingCart size={17} color="var(--color-ink-60)" />
              {count > 0 && <span className="navbar-cart-count">{count}</span>}
            </button>
          )}
          <LanguageSelector />
          <PaletteSelector />
          <ThemeToggle />
          {user && <NotificationDropdown />}

          {user ? (
            <div className="navbar-user-menu">
              <button className="navbar-user-trigger">
                <div className="sidebar-avatar" style={{ width: 28, height: 28 }}>
                  {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <ChevronDown size={13} color="#8a7f70" />
              </button>
              <div className="navbar-dropdown">
                <Link to={dashboardPath} className="navbar-dropdown-item">{t('dashboard')}</Link>
                <button onClick={() => { logout(); navigate('/') }} className="navbar-dropdown-item danger">{t('logout')}</button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="navbar-login-link">{t('login')}</Link>
              <Link to="/register?role=artisan"><Button size="sm">{t('becomeSeller')}</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
