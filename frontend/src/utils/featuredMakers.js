// ============================================================
// featuredMakers.js
// Automatically determines which artisan shops to feature on the
// homepage, from real review data - no admin-controlled flag.
//
// Uses a weighted ("Bayesian") average: each shop's score blends
// its own average rating with the platform-wide average rating,
// weighted by how many reviews it has. This is the same idea
// sites like IMDB use for "top rated" lists, and it's what keeps
// a shop with one 5-star review from outranking a shop with
// dozens of consistently strong reviews - simple to explain:
// "the fewer reviews a shop has, the more its score gets pulled
// toward the platform average, until it earns more reviews."
// ============================================================

export function getFeaturedMakers(shops, products, reviews, { limit = 4, minReviews = 1 } = {}) {
  const activeShops = (shops || []).filter((s) => s.status === 'Active')
  if (activeShops.length === 0) return []

  const validReviews = (reviews || []).filter((r) => r && typeof r.rating === 'number')
  const globalAvgRating = validReviews.length > 0
    ? validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length
    : 4.8

  const scored = activeShops
    .map((shop) => {
      const shopIdStr = String(shop._id || shop.id)
      const shopProducts = (products || []).filter((p) => {
        const pShop = String(p.shopId || p.shop?._id || p.shop || '')
        return pShop === shopIdStr
      })
      const shopProdIds = new Set(shopProducts.map((p) => String(p._id || p.id)))

      const shopReviews = validReviews.filter((r) => {
        const rProd = String(r.productId || r.product?._id || r.product || '')
        const rShop = String(r.shopId || r.shop?._id || r.shop || '')
        return rShop === shopIdStr || (rProd && shopProdIds.has(rProd))
      })

      const reviewCount = shopReviews.length > 0 ? shopReviews.length : (shop.reviewCount || 0)
      const avgRating = shopReviews.length > 0
        ? shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length
        : (shop.rating || 4.8)

      const score = (avgRating * (reviewCount + 1) + globalAvgRating) / (reviewCount + 2)

      return { shop, avgRating, reviewCount, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.shop)
}
