// ============================================================
// orderPricing.js
// A cart can span several shops, but an order belongs to exactly
// one shop. This is the ONE place that turns a cart into:
//   - the items grouped per shop (for creating each order)
//   - each shop's subtotal
//   - GST allocated to each shop, proportional to its share of
//     the cart - with any rounding remainder pushed onto the
//     last shop so the numbers always add up exactly
//   - the overall subtotal / gst / total shown at Checkout
//
// Checkout.jsx uses this same result both for what it displays
// to the customer AND for the `amount` stored on each created
// order, so the two can never drift apart.
// ============================================================

const GST_RATE = 0.18

export function computeCheckoutPricing(cartProducts) {
  const itemsByShop = {}
  cartProducts.forEach(({ product, qty }) => {
    if (!itemsByShop[product.shopId]) itemsByShop[product.shopId] = []
    itemsByShop[product.shopId].push({ productId: product.id, name: product.name, qty, price: product.price })
  })

  const shopIds = Object.keys(itemsByShop)
  const shopSubtotals = {}
  shopIds.forEach((id) => {
    shopSubtotals[id] = itemsByShop[id].reduce((sum, it) => sum + it.price * it.qty, 0)
  })

  const subtotal = Object.values(shopSubtotals).reduce((a, b) => a + b, 0)
  const gst = Math.round(subtotal * GST_RATE)
  const total = subtotal + gst

  // Proportional GST allocation with the rounding remainder assigned to
  // the last shop, guaranteeing SUM(shopTotals) === total exactly.
  const gstShares = {}
  let allocated = 0
  shopIds.forEach((id, i) => {
    if (i === shopIds.length - 1) {
      gstShares[id] = gst - allocated
    } else {
      const share = subtotal > 0 ? Math.round((shopSubtotals[id] / subtotal) * gst) : 0
      gstShares[id] = share
      allocated += share
    }
  })

  const shopTotals = {}
  shopIds.forEach((id) => { shopTotals[id] = shopSubtotals[id] + gstShares[id] })

  return { itemsByShop, shopSubtotals, shopTotals, subtotal, gst, total, gstRate: GST_RATE }
}
