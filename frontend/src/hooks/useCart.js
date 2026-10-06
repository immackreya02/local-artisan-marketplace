import { useContext } from 'react'
import { CartContext } from '../context/CartContext'
import { useProducts } from './useProducts'
import { getMaxQuantity } from '../utils/productAvailability'

// Custom hook: clean wrapper around CartContext.
// Cart items are stored as { productId, qty } pairs - the actual product
// data (name/price/stock) is resolved here from ProductsContext, live,
// so the cart always reflects ProductsContext as the single source of
// truth instead of a frozen mockData snapshot.
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  const { products } = useProducts()

  const cartProducts = context.items
    .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) }))
    .filter((i) => i.product)
  const subtotal = cartProducts.reduce((sum, i) => sum + i.product.price * i.qty, 0)

  // Quantity is clamped here (not in the reducer) using the same
  // availability rule as ProductCard/ProductDetail - Ready to Ship and
  // Limited Edition are capped by stock/limitedQuantity, Made to Order
  // and Pre-order are uncapped. Keeps CartContext's reducer a plain,
  // product-agnostic store of { productId, qty } pairs.
  const addToCart = (productId, qty = 1) => {
    const product = products.find((p) => p.id === productId)
    const max = product ? getMaxQuantity(product) : Infinity
    const existing = context.items.find((i) => i.productId === productId)
    const nextQty = Math.min((existing?.qty || 0) + qty, max)
    if (nextQty <= 0) return
    context.addToCart(productId, nextQty - (existing?.qty || 0))
  }

  const updateQty = (productId, qty) => {
    const product = products.find((p) => p.id === productId)
    const max = product ? getMaxQuantity(product) : Infinity
    context.updateQty(productId, Math.max(1, Math.min(qty, max)))
  }

  // Wishlist -> Cart must respect the same cap as adding from the catalogue -
  // otherwise a customer could sidestep stock/limitedQuantity limits simply
  // by saving an item to their wishlist first. If there's no room left
  // (already at the cap, or the item is no longer available at all), this
  // is a no-op and the item stays in the wishlist rather than vanishing.
  const moveToCart = (productId) => {
    const product = products.find((p) => p.id === productId)
    const max = product ? getMaxQuantity(product) : Infinity
    const existing = context.items.find((i) => i.productId === productId)
    const currentQty = existing?.qty || 0
    if (currentQty >= max) return
    context.moveToCart(productId)
  }

  return { ...context, cartProducts, subtotal, addToCart, updateQty, moveToCart }
}
