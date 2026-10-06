import {
  LayoutGrid, Store, Package, ClipboardList, BarChart3, Settings,
  Heart, MapPin, User, Users, Contact, Tags, FileBarChart2, MessageSquarePlus,
} from 'lucide-react'
import Sidebar from './Sidebar'
import DashboardTopbar from './DashboardTopbar'

// Nav items per role. Passing a role-specific array into the shared
// Sidebar component (via props) is what avoids writing three sidebars.
export const NAV = {
  customer: [
    { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/customer/orders', label: 'Orders', icon: ClipboardList },
    { to: '/customer/custom-requests', label: 'Custom Requests', icon: MessageSquarePlus },
    { to: '/customer/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/customer/addresses', label: 'Addresses', icon: MapPin },
    { to: '/customer/profile', label: 'Profile', icon: User },
  ],
  artisan: [
    { to: '/artisan/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/artisan/shop', label: 'Shop Profile', icon: Store },
    { to: '/artisan/products', label: 'Products', icon: Package },
    { to: '/artisan/orders', label: 'Orders', icon: ClipboardList },
    { to: '/artisan/custom-requests', label: 'Custom Requests', icon: MessageSquarePlus },
    { to: '/artisan/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/artisan/reports', label: 'Reports', icon: FileBarChart2 },
    { to: '/artisan/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/artisans', label: 'Artisans', icon: Contact },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart2 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
}

const ROLE_LABEL = { customer: 'Customer', artisan: 'Artisan · Seller', admin: 'Administrator' }

export default function DashboardLayout({ role, children, topbarPlaceholder }) {
  return (
    <div className="dashboard-layout">
      <Sidebar items={NAV[role]} accentLabel={ROLE_LABEL[role]} />
      <div className="dashboard-main">
        <DashboardTopbar placeholder={topbarPlaceholder} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  )
}
