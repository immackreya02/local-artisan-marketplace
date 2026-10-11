import { Link } from 'react-router-dom'
import { Heart, Package, ShoppingCart } from 'lucide-react'
import Swatch from './Swatch'
import Rating from './Rating'
import { categories } from '../../data/mockData'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'
import { getAvailabilityBadge, isProductPurchasable } from '../../utils/productAvailability'

import { getProductMainImage, handleImageError } from '../../utils/productImageHelper'

// Reusable ProductCard - takes a single `product` prop and renders
// consistently everywhere a product needs to appear (Home, Marketplace,
// Cart suggestions, Wishlist, Product Detail related products, etc.)
export default function ProductCard({ product }) {
  const { addToCart, wishlist, toggleWishlist } = useCart()
  const { user } = useAuth()
  const { getShopById } = useShops()
  const shop = getShopById(product.shopId)
  const category = categories.find((c) => c.id === product.category || c.slug === product.categorySlug || c.name === product.categoryName)
  const categoryLabel = product.categoryName || category?.name || product.category || ''
  const shopNameLabel = shop?.name || product.shopName || 'Artisan Shop'
  const isWishlisted = wishlist.includes(product.id)
  const purchasable = isProductPurchasable(product)
  const availability = getAvailabilityBadge(product)
  const isCustomerOrGuest = user?.role !== 'artisan' && user?.role !== 'admin'

  const imageUrl = getProductMainImage(product)
  const catKey = product.categorySlug || product.category || product.categoryName

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-card-media" style={{ position: 'relative', overflow: 'hidden', display: 'block' }}>
        <img
          src={imageUrl}
          alt={product.name}
          onError={(e) => handleImageError(e, catKey)}
          style={{ height: 180, width: '100%', objectFit: 'cover', display: 'block' }}
        />
        {!purchasable && <span className="product-card-stock-badge">{product.availabilityType === 'Limited Edition' ? 'Sold Out' : 'Out of Stock'}</span>}
        {isCustomerOrGuest && (
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(product.id) }}
            className="product-card-wishlist-btn"
          >
            <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} color={isWishlisted ? '#C1673B' : '#8a7f70'} />
          </button>
        )}
      </Link>
      <div className="product-card-body">
        <span className="product-card-category">{categoryLabel}</span>
        {availability && <span className={`badge ${availability.tone}`} style={{ width: 'fit-content' }}>{availability.label}</span>}
        <Link to={`/product/${product.id}`} className="product-card-name line-clamp-2">
          {product.name}
        </Link>
        <span className="product-card-shop">by {shopNameLabel}</span>
        <div className="product-card-footer">
          <div>
            <div className="product-card-price">₹{product.price.toLocaleString('en-IN')}</div>
            <Rating value={product.rating} />
          </div>
          {isCustomerOrGuest && (
            <button
              disabled={!purchasable}
              onClick={() => addToCart(product.id, 1)}
              className="product-card-cart-btn"
              title="Add to cart"
            >
              <ShoppingCart size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
