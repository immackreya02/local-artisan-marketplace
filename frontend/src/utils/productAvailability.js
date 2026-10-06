// ============================================================
// productAvailability.js
// Single place that turns a product's availabilityType (+ its
// type-specific detail field) into a label/tone to display -
// reused by ProductCard and Product Detail so the wording and
// color never drift apart between the two.
// ============================================================

export const AVAILABILITY_TYPES = ['Ready to Ship', 'Made to Order', 'Limited Edition', 'Pre-order']

export function getAvailabilityBadge(product) {
  const type = product.availabilityType || 'Ready to Ship'
  if (type === 'Made to Order') {
    return { label: product.productionTime ? `Made to Order · ${product.productionTime}` : 'Made to Order', tone: 'badge-blue' }
  }
  if (type === 'Limited Edition') {
    return { label: product.limitedQuantity ? `Limited Edition · Only ${product.limitedQuantity} left` : 'Limited Edition', tone: 'badge-terracotta' }
  }
  if (type === 'Pre-order') {
    return { label: 'Pre-order', tone: 'badge-amber' }
  }
  return null // Ready to Ship is the default state and isn't called out with a badge
}

// Whether a customer can currently buy this product - the rule depends on
// the availability type, not just a blanket `stock === 0` check:
//  - Ready to Ship: respects stock, same as before.
//  - Made to Order / Pre-order: always purchasable - it's produced/shipped
//    later, so a stock count of 0 doesn't mean "unavailable".
//  - Limited Edition: respects its own limitedQuantity (falls back to
//    stock if the artisan never set one).
export function isProductPurchasable(product) {
  const type = product.availabilityType || 'Ready to Ship'
  if (type === 'Made to Order' || type === 'Pre-order') return true
  if (type === 'Limited Edition') return (product.limitedQuantity ?? product.stock) > 0
  return product.stock > 0
}

// Short status text for the stock/availability pill, consistent with
// the purchasability rule above.
export function getStockStatusLabel(product) {
  const type = product.availabilityType || 'Ready to Ship'
  const purchasable = isProductPurchasable(product)
  if (type === 'Made to Order') return 'Available — Made to Order'
  if (type === 'Pre-order') return 'Available for Pre-order'
  if (type === 'Limited Edition') return purchasable ? `Limited Stock — Only ${product.limitedQuantity ?? product.stock} left` : 'Sold Out'
  return purchasable ? 'In Stock — Ready to ship' : 'Out of Stock'
}

// The highest quantity a customer may hold in their cart for this product -
// same per-type rule as purchasability, used to clamp cart quantity
// controls so the cart can never hold an "obviously impossible" amount.
// Made to Order / Pre-order aren't stock-limited (no ceiling); Ready to
// Ship and Limited Edition are capped by stock / limitedQuantity.
export function getMaxQuantity(product) {
  const type = product.availabilityType || 'Ready to Ship'
  if (type === 'Made to Order' || type === 'Pre-order') return Infinity
  if (type === 'Limited Edition') return product.limitedQuantity ?? product.stock ?? 0
  return product.stock ?? 0
}

// A compact SECOND badge for management views (Admin/Artisan Products
// lists) - shown alongside the product's real status badge, never instead
// of it. An Active Made-to-Order product with stock 0 is still "Active";
// this just adds a second "Made to Order" badge next to it. Returns null
// when there's nothing worth calling out (Ready to Ship, in stock).
export function getManagementAvailabilityBadge(product) {
  const type = product.availabilityType || 'Ready to Ship'
  const purchasable = isProductPurchasable(product)
  if (type === 'Ready to Ship') return purchasable ? null : { label: 'Out of Stock', tone: 'badge-red' }
  if (type === 'Limited Edition') return purchasable ? { label: 'Limited Stock', tone: 'badge-terracotta' } : { label: 'Sold Out', tone: 'badge-red' }
  if (type === 'Made to Order') return { label: 'Made to Order', tone: 'badge-blue' }
  if (type === 'Pre-order') return { label: 'Pre-order', tone: 'badge-amber' }
  return null
}
