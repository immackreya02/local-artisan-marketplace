import { Search, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../common/ThemeToggle'
import PaletteSelector from '../common/PaletteSelector'
import LanguageSelector from '../common/LanguageSelector'
import NotificationDropdown from '../common/NotificationDropdown'

export default function DashboardTopbar({ placeholder = 'Search…' }) {
  const navigate = useNavigate()

  return (
    <div className="dashboard-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="icon-btn back-btn"
          title="Return to Marketplace Home"
          aria-label="Return to Marketplace Home"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--color-cream-dark)',
            border: '1px solid var(--color-ink-10)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-ink)',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <ArrowLeft size={16} color="var(--color-ink)" />
        </button>

        <div className="dashboard-topbar-search">
          <Search size={15} color="var(--color-ink-60)" />
          <input placeholder={placeholder} />
        </div>
      </div>

      <div className="dashboard-topbar-actions">
        <LanguageSelector />
        <PaletteSelector />
        <ThemeToggle />
        <NotificationDropdown />
      </div>
    </div>
  )
}
