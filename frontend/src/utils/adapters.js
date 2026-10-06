export function normalizeUser(user) {
  if (!user) return null
  const id = user._id || user.id
  return {
    ...user,
    id,
    _id: id,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'customer',
    status: user.status || 'Active',
    phone: user.phone || '',
    location: user.location || '',
    joined: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : (user.joined || new Date().toISOString().slice(0, 10)),
  }
}

export function normalizeShop(shop) {
  if (!shop) return null
  const id = shop._id || shop.id
  const ownerObj = shop.owner
  const ownerId = (typeof ownerObj === 'object' && ownerObj?._id) ? ownerObj._id : (shop.ownerId || ownerObj || '')
  const ownerName = (typeof ownerObj === 'object' && ownerObj?.name) ? ownerObj.name : (shop.ownerName || (typeof ownerObj === 'string' ? ownerObj : '') || '')
  const reviews = Number(shop.reviewCount || shop.totalReviews || shop.reviews || 0)
  const years = Number(shop.yearsInBusiness || shop.years || 0)

  return {
    ...shop,
    id,
    _id: id,
    name: shop.shopName || shop.name || '',
    shopName: shop.shopName || shop.name || '',
    ownerId,
    owner: ownerName,
    ownerName,
    location: shop.address ? (typeof shop.address === 'string' ? shop.address : `${shop.address.city || ''}, ${shop.address.state || ''}`.replace(/^,\s*|,\s*$/g, '')) : (shop.location || ''),
    rating: Number(shop.rating || 0),
    reviews,
    reviewCount: reviews,
    years,
    yearsInBusiness: years,
    verified: Boolean(shop.verified),
    status: shop.status || 'Pending',
    joined: shop.createdAt ? new Date(shop.createdAt).toISOString().slice(0, 10) : (shop.joined || new Date().toISOString().slice(0, 10)),
  }
}

export function normalizeProduct(product) {
  if (!product) return null
  const id = product._id || product.id
  const shopObj = product.shop || product.shopId
  const shopId = (typeof shopObj === 'object' && shopObj?._id) ? shopObj._id : (shopObj || '')
  const shopName = (typeof shopObj === 'object' && shopObj?.name) ? shopObj.name : (typeof shopObj === 'object' && shopObj?.shopName ? shopObj.shopName : (product.shopName || ''))

  const categoryObj = product.category
  const categoryId = (typeof categoryObj === 'object' && categoryObj?._id) ? categoryObj._id : (categoryObj || '')
  const categorySlug = product.categorySlug || ((typeof categoryObj === 'object' && categoryObj?.slug) ? categoryObj.slug : '')
  const categoryName = (typeof categoryObj === 'object' && categoryObj?.name) ? categoryObj.name : (typeof product.category === 'string' ? product.category : '')

  const images = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : [])
  const image = images[0] || product.image || ''
  const reviews = Number(product.reviewCount || product.totalReviews || product.reviews || 0)
  const availability = product.availability || product.availabilityType || 'Ready-to-Ship'

  return {
    ...product,
    id,
    _id: id,
    shopId,
    shopName,
    categoryId,
    categorySlug,
    categoryName,
    category: categoryName || categorySlug || categoryId,
    name: product.name || product.title || '',
    title: product.name || product.title || '',
    images,
    image,
    mrp: Number(product.mrp || product.price || 0),
    price: Number(product.price || 0),
    discount: Number(product.discount || 0),
    stock: Number(product.stock || 0),
    rating: Number(product.rating || 0),
    reviews,
    reviewCount: reviews,
    status: product.status || 'Active',
    availability,
    availabilityType: availability,
    isAvailable: product.isAvailable !== undefined ? product.isAvailable : (product.status === 'Active'),
    specs: product.specs || {},
    tags: Array.isArray(product.tags) ? product.tags : [],
  }
}

export function normalizeOrder(order) {
  if (!order) return null
  const id = order._id || order.id
  const orderNumber = order.orderNumber || id
  const customerObj = order.customer || order.customerId
  const customerId = (typeof customerObj === 'object' && customerObj?._id) ? customerObj._id : (customerObj || '')
  const customerName = order.customerName || (typeof customerObj === 'object' && customerObj?.name ? customerObj.name : '')
  const shopObj = order.shop || order.shopId
  const shopId = (typeof shopObj === 'object' && shopObj?._id) ? shopObj._id : (shopObj || '')
  const shopName = order.shopName || (typeof shopObj === 'object' && shopObj?.name ? shopObj.name : '')

  const items = (order.items || []).map((item) => {
    const productId = (typeof item.product === 'object' && item.product?._id) ? item.product._id : (item.productId || item.product || '')
    const name = item.name || item.title || (typeof item.product === 'object' ? item.product?.name || item.product?.title : '')
    return {
      ...item,
      productId,
      id: productId,
      name,
      title: name,
      price: Number(item.price || 0),
      qty: Number(item.quantity || item.qty || 1),
      quantity: Number(item.quantity || item.qty || 1),
      image: item.image || (typeof item.product === 'object' ? item.product?.images?.[0] : ''),
    }
  })

  const amount = Number(order.totalAmount || order.amount || 0)
  const status = order.orderStatus || order.status || 'Pending'
  const payment = order.paymentStatus || order.payment || 'Pending'
  const method = order.paymentMethod || order.method || 'COD'

  let addressStr = order.address || ''
  if (!addressStr && order.shippingAddress) {
    if (typeof order.shippingAddress === 'string') {
      addressStr = order.shippingAddress
    } else {
      const addr = order.shippingAddress
      addressStr = [
        addr.name ? `${addr.name}` : '',
        addr.phone ? `(${addr.phone})` : '',
        addr.streetAddress,
        addr.city,
        addr.state,
        addr.postalCode
      ].filter(Boolean).join(', ')
    }
  }

  const date = order.orderDate
    ? new Date(order.orderDate).toISOString().slice(0, 10)
    : (order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : (order.date || new Date().toISOString().slice(0, 10)))

  return {
    ...order,
    id,
    _id: id,
    orderNumber,
    customerId,
    customerName,
    shopId,
    shopName,
    items,
    amount,
    totalAmount: amount,
    subtotal: Number(order.subtotal || 0),
    tax: Number(order.tax || 0),
    shippingFee: Number(order.shippingFee || 0),
    status,
    orderStatus: status,
    payment,
    paymentStatus: payment,
    method,
    paymentMethod: method,
    date,
    address: addressStr,
    shippingAddress: order.shippingAddress,
  }
}

export function normalizeReview(review) {
  if (!review) return null
  const id = review._id || review.id
  const customerObj = review.customer || review.customerId
  const customerId = (typeof customerObj === 'object' && customerObj?._id) ? customerObj._id : (customerObj || '')
  const customerName = review.customerName || (typeof customerObj === 'object' && customerObj?.name ? customerObj.name : '')
  const productObj = review.product || review.productId
  const productId = (typeof productObj === 'object' && productObj?._id) ? productObj._id : (productObj || '')
  const shopObj = review.shop || review.shopId
  const shopId = (typeof shopObj === 'object' && shopObj?._id) ? shopObj._id : (shopObj || '')
  const orderObj = review.order || review.orderId
  const orderId = (typeof orderObj === 'object' && orderObj?._id) ? orderObj._id : (orderObj || '')

  return {
    ...review,
    id,
    _id: id,
    customerId,
    customerName,
    name: customerName || review.name || 'Anonymous',
    productId,
    shopId,
    orderId,
    rating: Number(review.rating || 0),
    comment: review.comment || review.text || '',
    text: review.comment || review.text || '',
    verified: review.verifiedPurchase !== undefined ? review.verifiedPurchase : Boolean(review.verified),
    verifiedPurchase: review.verifiedPurchase !== undefined ? review.verifiedPurchase : Boolean(review.verified),
    date: review.createdAt ? new Date(review.createdAt).toISOString().slice(0, 10) : (review.date || new Date().toISOString().slice(0, 10)),
  }
}

export function normalizeCustomRequest(req) {
  if (!req) return null
  const id = req._id || req.id
  const requestId = req.requestId || id
  const customerObj = req.customer || req.customerId
  const customerId = (typeof customerObj === 'object' && customerObj?._id) ? customerObj._id : (customerObj || '')
  const customerName = req.customerName || (typeof customerObj === 'object' && customerObj?.name ? customerObj.name : '')
  const shopObj = req.shop || req.shopId
  const shopId = (typeof shopObj === 'object' && shopObj?._id) ? shopObj._id : (shopObj || '')
  const shopName = req.shopName || (typeof shopObj === 'object' && shopObj?.name ? shopObj.name : '')
  const image = (req.referenceImages && req.referenceImages[0]) || req.image || ''
  const productRef = req.productRef || req.title || ''

  const dateStr = req.createdAt ? new Date(req.createdAt).toISOString().slice(0, 10) : (req.date || new Date().toISOString().slice(0, 10))
  const requiredByStr = req.requiredByDate ? new Date(req.requiredByDate).toISOString().slice(0, 10) : ''

  return {
    ...req,
    id,
    _id: id,
    requestId,
    customerId,
    customerName,
    shopId,
    shopName,
    productRef,
    title: productRef,
    description: req.description || '',
    notes: req.notes || '',
    quantity: Number(req.quantity || 1),
    budget: Number(req.budget || 0),
    image,
    referenceImages: req.referenceImages || (image ? [image] : []),
    status: req.status || 'Pending',
    requiredByDate: requiredByStr,
    createdDate: dateStr,
    date: dateStr,
    artisanResponse: req.artisanResponse || '',
    proposalPrice: req.proposalPrice !== undefined && req.proposalPrice !== null ? Number(req.proposalPrice) : null,
    deliveryDays: req.deliveryDays !== undefined && req.deliveryDays !== null ? Number(req.deliveryDays) : null,
    proposalNotes: req.proposalNotes || '',
  }
}
