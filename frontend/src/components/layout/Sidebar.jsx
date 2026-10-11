import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'

export default function Sidebar({ items, accentLabel }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const translateLabel = (lbl) => {
    switch (lbl) {
      case 'Dashboard': return t('dashboard', 'Dashboard')
      case 'Orders': return t('orders', 'Orders')
      case 'Custom Requests': return t('customRequests', 'Custom Requests')
      case 'Wishlist': return t('wishlist', 'Wishlist')
      case 'Addresses': return t('addresses', 'Addresses')
      case 'Profile': return t('profile', 'Profile')
      case 'Shop Profile': return t('shopProfile', 'Shop Profile')
      case 'Products': return t('products', 'Products')
      case 'Analytics': return t('analytics', 'Analytics')
      case 'Reports': return t('reports', 'Reports')
      case 'Settings': return t('settings', 'Settings')
      case 'Users': return t('users', 'Users')
      case 'Artisans': return t('artisans', 'Artisans')
      case 'Categories': return t('categories', 'Categories')
      default: return lbl
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Sparkles size={16} color="#F7F3EC" />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">Local Artisan</div>
          <div className="sidebar-brand-sub">Marketplace</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.endsWith('dashboard')}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {translateLabel(label)}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{accentLabel}</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/') }} className="sidebar-logout">
          <LogOut size={16} /> {t('logout')}
        </button>
      </div>
    </aside>
  )
}
