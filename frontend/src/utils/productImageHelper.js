import { CATEGORY_IMAGES, getCategoryImage } from './categoryImages'

export const FALLBACK_IMAGES = {
  pottery: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop',
  textiles: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop',
  paintings: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop',
  metalwork: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop',
  woodcraft: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=800&auto=format&fit=crop',
  'leather-crafts': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop',
  jewellery: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop',
  'home-decor': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop'
}

export function getProductFallbackImage(categoryKey) {
  if (!categoryKey) return FALLBACK_IMAGES.default
  const key = categoryKey.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
  return FALLBACK_IMAGES[key] || getCategoryImage(key) || FALLBACK_IMAGES.default
}

export function getProductMainImage(product) {
  if (!product) return FALLBACK_IMAGES.default
  if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
    return product.images[0]
  }
  if (product.image) return product.image
  const catKey = product.categorySlug || product.category || product.categoryName
  return getProductFallbackImage(catKey)
}

export function handleImageError(e, categoryKey) {
  const fallback = getProductFallbackImage(categoryKey)
  if (e.target && e.target.src !== fallback) {
    e.target.onerror = null // Prevent infinite loop
    e.target.src = fallback
  }
}
