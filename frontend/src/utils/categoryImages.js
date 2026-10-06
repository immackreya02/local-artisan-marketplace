export const CATEGORY_IMAGES = {
  pottery: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop',
  jewellery: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop',
  'home-decor': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop',
  textiles: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=500&auto=format&fit=crop',
  paintings: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=600&auto=format&fit=crop',
  'handmade-gifts': 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=500&auto=format&fit=crop',
  woodcraft: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=500&auto=format&fit=crop',
  metalwork: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop'
}

export function getCategoryImage(slug) {
  const normalized = (slug || '').toLowerCase()
  return CATEGORY_IMAGES[normalized] || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&auto=format&fit=crop'
}
