import { Link } from 'react-router-dom'
import { Sparkles, Instagram, Facebook, Twitter } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="site-footer-brand-row">
            <div className="site-footer-brand-icon">
              <Sparkles size={16} color="var(--color-footer-brand-icon-fg)" />
            </div>
            <span className="site-footer-brand-text">Local Artisan Marketplace</span>
          </div>
          <p className="site-footer-desc">Empowering Indian small businesses to sell, grow, and get discovered — one handmade product at a time.</p>
          <div className="site-footer-social">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <span key={i} className="site-footer-social-icon"><Icon size={14} /></span>
            ))}
          </div>
        </div>
        <div className="site-footer-col">
          <h4 className="site-footer-col-title">Marketplace</h4>
          <ul>
            <li><Link to="/marketplace">{t('explore')}</Link></li>
            <li><Link to="/shops">{t('shops')}</Link></li>
            <li><Link to="/categories">{t('categories')}</Link></li>
          </ul>
        </div>
        <div className="site-footer-col">
          <h4 className="site-footer-col-title">For Sellers</h4>
          <ul>
            <li><Link to="/register?role=artisan">{t('becomeSeller')}</Link></li>
            <li><Link to="/artisan/dashboard">{t('dashboard')}</Link></li>
          </ul>
        </div>
        <div className="site-footer-col">
          <h4 className="site-footer-col-title">Company</h4>
          <ul>
            <li>About Us</li>
            <li>Careers</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="site-footer-bottom">
        © Local Artisan Marketplace. All rights reserved.
      </div>
    </footer>
  )
}
