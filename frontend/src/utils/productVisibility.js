// ============================================================
// productVisibility.js
// ONE shared rule for "is this product visible to a customer
// browsing the public site": the product itself must be Active,
// AND the shop it belongs to must be Active (admin-approved).
//
// Every public page (Home, Marketplace, Product Detail, Shop
// Page, category/search results) filters through this same
// function instead of re-implementing the rule per page.
// ============================================================

export function isProductPubliclyVisible(product, shops) {
  if (!product || product.status !== 'Active') return false
  if (!shops || !shops.length) return true
  const pShopId = typeof product.shopId === 'object' ? (product.shopId?.id || product.shopId?._id) : (product.shopId || product.shop)
  const shop = shops.find((s) => s.id === pShopId || s._id === pShopId || s.id === product.shopId)
  return shop ? shop.status === 'Active' : true
}

export function getPublicProducts(products = [], shops = []) {
  if (!products.length) return []
  return products.filter((p) => isProductPubliclyVisible(p, shops))
}

