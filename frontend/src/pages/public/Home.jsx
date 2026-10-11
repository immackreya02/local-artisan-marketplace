import { Link } from 'react-router-dom'
import {
  ShieldCheck, Store, Package, ClipboardCheck, Compass, BadgeCheck, Sparkles, Clock,
} from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import Button from '../../components/common/Button'
import Swatch from '../../components/common/Swatch'
import ProductCard from '../../components/common/ProductCard'
import ShopCard from '../../components/common/ShopCard'
import { categories, heroStats } from '../../data/mockData'
import { useShops } from '../../hooks/useShops'
import { useProducts } from '../../hooks/useProducts'
import { useReviews } from '../../hooks/useReviews'
import { useLanguage } from '../../hooks/useLanguage'
import { getPublicProducts } from '../../utils/productVisibility'
import { getFeaturedMakers } from '../../utils/featuredMakers'
import { getRecentlyViewedProducts } from '../../utils/recentlyViewed'

const features = [
  { icon: Store, title: 'Professional Shop Profile', desc: 'Create a beautiful, branded storefront with your logo, banner, and story in minutes.' },
  { icon: Package, title: 'Product & Inventory Management', desc: 'Add products, track stock, and update pricing effortlessly from one dashboard.' },
  { icon: ClipboardCheck, title: 'Order Management', desc: 'Receive, process, and fulfil orders with real-time status tracking and notifications.' },
  { icon: Compass, title: 'Marketplace Discovery', desc: 'Get discovered by thousands of shoppers searching for authentic local crafts.' },
]

const handmadeReasons = [
  { icon: Sparkles, title: 'Support Independent Artisans', desc: 'Every purchase goes directly to the maker who runs their own shop — no middlemen taking a cut of their craft.' },
  { icon: Package, title: 'One-of-a-Kind Products', desc: 'Handmade means small variations and real character — not identical items off a factory line.' },
  { icon: Compass, title: 'Strengthen Local Economies', desc: 'You\u2019re backing a real small business in a real Indian city, not a faceless warehouse.' },
  { icon: ShieldCheck, title: 'Ethical & Sustainable', desc: 'Traditional techniques, small-batch production, and materials sourced the way they always have been.' },
]

const customerSteps = ['Browse Shops', 'Order Products', 'Track Orders', 'Leave Reviews']
const sellerSteps = ['Register Shop', 'Add Products', 'Manage Orders', 'Grow Business']

export default function Home() {
  const { shops } = useShops()
  const { products } = useProducts()
  const { reviews } = useReviews()
  const { t } = useLanguage()

  const makers = [
    { title: t('maker1Title') || 'Handmade Artists', desc: t('maker1Desc') || 'Showcase your unique handcrafted art to a nationwide audience.', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop' },
    { title: t('maker2Title') || 'Home Bakers', desc: t('maker2Desc') || 'Sell fresh cakes, cookies, and treats to your local community.', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop' },
    { title: t('maker3Title') || 'Home Boutique Owners', desc: t('maker3Desc') || 'Bring your curated fashion and textile collections online.', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop' },
    { title: t('maker4Title') || 'Art & Craft Businesses', desc: t('maker4Desc') || 'Reach buyers who love authentic clay and craft creations.', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop' },
  ]

  const features = [
    { icon: Store, title: t('feat1Title'), desc: t('feat1Desc') },
    { icon: Package, title: t('feat2Title'), desc: t('feat2Desc') },
    { icon: ClipboardCheck, title: t('feat3Title'), desc: t('feat3Desc') },
    { icon: Compass, title: t('feat4Title'), desc: t('feat4Desc') },
  ]

  const handmadeReasons = [
    { icon: Sparkles, title: t('reason1Title'), desc: t('reason1Desc') },
    { icon: Package, title: t('reason2Title'), desc: t('reason2Desc') },
    { icon: Compass, title: t('reason3Title'), desc: t('reason3Desc') },
    { icon: ShieldCheck, title: t('reason4Title'), desc: t('reason4Desc') },
  ]

  const customerSteps = [t('stepBrowse'), t('stepOrder'), t('stepTrack'), t('stepReview')]
  const sellerSteps = [t('stepRegister'), t('stepAddProd'), t('stepManageOrders'), t('stepGrow')]

  const exploreShops = shops.filter((s) => s.status === 'Active').slice(0, 4)
  const featuredProducts = getPublicProducts(products, shops).filter((p) => p.featured).slice(0, 8)
  const featuredMakers = getFeaturedMakers(shops, products, reviews)

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="container hero">
        <div>
          <span className="hero-badge"><Sparkles size={12} /> Discover and support local Indian businesses</span>
          <h1 className="hero-title">{t('heroTitle')}</h1>
          <p className="hero-desc">{t('heroSubtitle')}</p>
          <div className="hero-actions">
            <Link to="/marketplace"><Button size="lg">{t('explore')}</Button></Link>
            <Link to="/register?role=artisan"><Button size="lg" variant="outline">{t('becomeSeller')}</Button></Link>
          </div>
          <div className="hero-stats">
            {[[heroStats.artisans, 'Local Artisans'], [heroStats.products, 'Handmade Products'], [heroStats.cities, 'Cities Covered']].map(([v, l]) => (
              <div key={l}>
                <div className="hero-stat-value">{v}</div>
                <div className="hero-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-media">
          <img
            src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1000&auto=format&fit=crop"
            alt="Handmade Indian Artisan Crafts"
            style={{ height: 320, width: '100%', objectFit: 'cover', borderRadius: 24, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)' }}
          />
          <div className="hero-verified-card">
            <img src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=100" alt="Verified Seller" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <div className="hero-verified-title">{t('verifiedArtisan')} <BadgeCheck size={13} color="#3F6B52" /></div>
              <div className="hero-verified-sub">{t('handcraftedQuality')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why shop handmade */}
      <section className="section-cream-dark section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">{t('whyShopHandmadeHeader')}</span>
            <h2 className="section-title">{t('whyShopHandmadeSub')}</h2>
          </div>
          <div className="grid-4">
            {handmadeReasons.map((r) => (
              <div key={r.title} className="feature-card">
                <div className="feature-icon"><r.icon size={19} /></div>
                <h3 className="feature-title">{r.title}</h3>
                <p className="feature-desc">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="section-white section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">{t('whyChooseUsEyebrow')}</span>
            <h2 className="section-title">{t('whyChooseUsTitle')}</h2>
          </div>
          <div className="grid-4">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon"><f.icon size={19} /></div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">{t('howItWorks')}</span>
            <h2 className="section-title">Simple steps for everyone</h2>
          </div>
          <div className="grid-2">
            {[[t('forShoppers'), customerSteps], [t('forSellers'), sellerSteps]].map(([title, steps]) => (
              <div key={title} className="steps-card">
                <h3 className="steps-title">{title}</h3>
                <div>
                  {steps.map((s, i) => (
                    <div key={s} className="step-row">
                      <span className="step-number">{i + 1}</span>
                      <span className="step-label">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is this for */}
      <section className="section-cream-dark section">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">{t('whoIsPlatformForEyebrow') || 'Built For Makers'}</span>
            <h2 className="section-title">{t('whoIsPlatformForTitle') || 'Who is this platform for?'}</h2>
          </div>
          <div className="grid-4">
            {makers.map((m) => (
              <div key={m.title}>
                <img
                  src={m.image}
                  alt={m.title}
                  style={{ height: 160, width: '100%', objectFit: 'cover', borderRadius: 16, marginBottom: 12 }}
                />
                <h3 className="maker-title">{m.title}</h3>
                <p className="maker-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured shops */}
      <section className="section">
        <div className="container">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">Discover</span>
              <h2 className="section-title-sm">{t('browseShops')}</h2>
            </div>
            <Link to="/shops" className="view-all-link">{t('browseShops')} →</Link>
          </div>
          <div className="grid-4">
            {exploreShops.map((s) => <ShopCard key={s.id} shop={s} />)}
          </div>
        </div>
      </section>

      {/* Featured makers */}
      <section className="section-tight">
        <div className="container">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">Highly Rated</span>
              <h2 className="section-title-sm">{t('featuredMakersTitle')}</h2>
              <p style={{ fontSize: 13, color: 'var(--color-ink-45)', marginTop: 4 }}>Ranked automatically from real customer reviews — not admin-picked.</p>
            </div>
          </div>
          {featuredMakers.length > 0 ? (
            <div className="grid-4">
              {featuredMakers.map((s) => <ShopCard key={s.id} shop={s} />)}
            </div>
          ) : (
            <div className="empty-state">Featured makers will appear here once enough customer reviews come in.</div>
          )}
        </div>
      </section>

      {/* Featured products */}
      <section className="section-tight">
        <div className="container">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">Handpicked</span>
              <h2 className="section-title-sm">{t('featuredProductsTitle')}</h2>
            </div>
            <Link to="/marketplace" className="view-all-link">{t('viewAllProducts')} →</Link>
          </div>
          <div className="grid-4">
            {featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-tight">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Shop By Category</span>
            <h2 className="section-title-sm">{t('categories')}</h2>
          </div>
          <div className="grid-4">
            {categories.map((c) => (
              <Link key={c.id} to={`/marketplace?category=${c.id}`} className="category-tile">
                <div className="category-tile-icon"><ShieldCheck size={17} /></div>
                <div className="category-tile-name">{c.name}</div>
                <div className="category-tile-count">{c.products.toLocaleString()} items</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container section-tight">
        <div className="cta-banner">
          <div>
            <h3 className="cta-banner-title">{t('turnCraftBusiness')}</h3>
            <p className="cta-banner-desc">{t('openShopDesc')}</p>
          </div>
          <Link to="/register?role=artisan"><Button variant="inverse" size="lg">{t('becomeSeller')}</Button></Link>
        </div>
      </section>
    </PublicLayout>
  )
}
