import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import ProductCard from '../../components/common/ProductCard'
import Button from '../../components/common/Button'
import { useCart } from '../../hooks/useCart'
import { useProducts } from '../../hooks/useProducts'

export default function Wishlist() {
  const { wishlist } = useCart()
  const { products } = useProducts()
  const wishlistProducts = (wishlist || [])
    .map((id) => products.find((p) => p.id === id || p._id === id || String(p._id) === String(id) || String(p.id) === String(id)))
    .filter(Boolean)

  return (
    <DashboardLayout role="customer">
      <h1 className="page-title">Your Wishlist</h1>
      <p className="page-subtitle">{wishlistProducts.length} saved items.</p>

      {wishlistProducts.length === 0 ? (
        <div className="wishlist-empty">
          <Heart size={28} style={{ margin: '0 auto 12px', color: 'var(--color-ink-20, var(--color-ink-10))' }} />
          <p className="mb-4" style={{ fontSize: 14 }}>Nothing saved yet — tap the heart on any product to add it here.</p>
          <Link to="/marketplace"><Button>Explore Marketplace</Button></Link>
        </div>
      ) : (
        <div className="grid-4">
          {wishlistProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
