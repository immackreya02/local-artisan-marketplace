import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import PublicNavbar from './PublicNavbar'
import Footer from './Footer'

export default function PublicLayout({ children }) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex-col" style={{ minHeight: '100vh', background: 'var(--color-cream)' }}>
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
