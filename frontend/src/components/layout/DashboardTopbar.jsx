import { Search } from 'lucide-react'
import ThemeToggle from '../common/ThemeToggle'
import LanguageSelector from '../common/LanguageSelector'
import NotificationDropdown from '../common/NotificationDropdown'

export default function DashboardTopbar({ placeholder = 'Search…' }) {
  return (
    <div className="dashboard-topbar">
      <div className="dashboard-topbar-search">
        <Search size={15} color="var(--color-ink-60)" />
        <input placeholder={placeholder} />
      </div>
      <div className="dashboard-topbar-actions">
        <LanguageSelector />
        <ThemeToggle />
        <NotificationDropdown />
      </div>
    </div>
  )
}
