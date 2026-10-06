// ============================================================
// Local Artisan Marketplace — Mock Data
// Single source of truth. All pages read from here.
// ============================================================

export const categories = [
  { id: 'pottery', name: 'Pottery', desc: 'Handcrafted terracotta pots, planters and clay tableware.', icon: 'Amphora', products: 642 },
  { id: 'jewellery', name: 'Jewellery', desc: 'Handmade silver, beadwork and traditional tribal ornaments.', icon: 'Gem', products: 918 },
  { id: 'home-decor', name: 'Home Decor', desc: 'Decorative pieces, wall art and artisan lighting for homes.', icon: 'Lamp', products: 571 },
  { id: 'textiles', name: 'Textiles', desc: 'Handloom sarees, block-print fabrics and woven shawls.', icon: 'Scissors', products: 734 },
  { id: 'paintings', name: 'Paintings', desc: 'Madhubani, Warli and contemporary canvas artwork.', icon: 'Palette', products: 389 },
  { id: 'handmade-gifts', name: 'Handmade Gifts', desc: 'Curated gift sets, festive hampers and personalised keepsakes.', icon: 'Gift', products: 256 },
  { id: 'woodcraft', name: 'Woodcraft', desc: 'Hand-carved figurines, boxes and rosewood home accents.', icon: 'TreePine', products: 204 },
  { id: 'metalwork', name: 'Metalwork', desc: 'Brass dhokra art, copper utensils and engraved metal decor.', icon: 'Hammer', products: 168 },
]

export const users = [
  { id: 'u-admin', name: 'Rohan Deshmukh', email: 'admin@lam.in', password: 'ArtisanAdmin#2026!', role: 'admin', status: 'Active', joined: '2023-01-05', location: 'Pune', phone: '+91 90000 00001' },
  { id: 'u-cust-1', name: 'Ananya Sharma', email: 'customer@lam.in', password: 'CraftCustomer#2026!', role: 'customer', status: 'Active', joined: '2024-01-12', location: 'Mumbai, Maharashtra', phone: '+91 98765 43210' },
  { id: 'u-cust-2', name: 'Priya Nair', email: 'priya.nair@yahoo.in', password: 'CraftCustomer#2026!', role: 'customer', status: 'Active', joined: '2024-06-21', location: 'Kochi, Kerala', phone: '+91 90045 67812' },
  { id: 'u-art-1', name: 'Meera Kumhar', email: 'artisan@lam.in', password: 'JaipurArtisan#2026!', role: 'artisan', status: 'Active', joined: '2023-03-03', location: 'Jaipur, Rajasthan', phone: '+91 98290 45671', shopId: 'shop-1' },
  { id: 'u-art-2', name: 'Sunita Verma', email: 'sunita@banarasisilk.in', password: 'JaipurArtisan#2026!', role: 'artisan', status: 'Pending', joined: '2024-11-01', location: 'Varanasi, UP', phone: '+91 99871 22345', shopId: 'shop-2' },
]

export const shops = [
  {
    id: 'shop-1', ownerId: 'u-art-1', name: 'Kumhar Kala Pottery', owner: 'Meera Kumhar', category: 'Blue Pottery',
    location: 'Jaipur, Rajasthan', rating: 4.7, reviewCount: 3, verified: true, status: 'Active', years: 62,
    phone: '+91 98290 45671', email: 'hello@kumharkala.in',
    description: 'Kumhar Kala Pottery brings the timeless craft of Rajasthani terracotta to your home. Every piece is hand-thrown, sun-dried and kiln-fired by our family of artisans — carrying forward four generations of pottery tradition from the heart of Jaipur.',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600',
  },
  {
    id: 'shop-2', ownerId: 'u-art-2', name: 'Banarasi Silk House', owner: 'Sunita Verma', category: 'Textiles & Weaving',
    location: 'Varanasi, UP', rating: 0, reviewCount: 0, verified: false, status: 'Pending', years: 18,
    phone: '+91 99871 22345', email: 'hello@banarasisilk.in',
    description: 'A family weaving house producing hand-loomed Banarasi silk sarees using techniques passed down for generations.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600',
  },
  {
    id: 'shop-3', ownerId: null, name: 'Ananya Jewels', owner: 'Ananya Rao', category: 'Jewellery',
    location: 'Mumbai, Maharashtra', rating: 4.5, reviewCount: 4, verified: true, status: 'Active', years: 9,
    phone: '+91 90000 11111', email: 'hello@ananyajewels.in',
    description: 'Handmade silver and oxidised jewellery inspired by tribal and traditional Indian motifs.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600',
  },
  {
    id: 'shop-4', ownerId: null, name: 'Diya Candle Co.', owner: 'Diya Menon', category: 'Candles',
    location: 'Bengaluru, Karnataka', rating: 4.5, reviewCount: 4, verified: true, status: 'Active', years: 4,
    phone: '+91 90000 22222', email: 'hello@diyacandle.in',
    description: 'Soy-wax candles hand-poured in small batches, scented with natural Indian botanicals.',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600',
  },
]

export const products = [
  { id: 'p-1', shopId: 'shop-1', name: 'Jaipur Blue Pottery Decorative Vase', category: 'pottery', price: 2249, mrp: 2999, rating: 4.7, reviewCount: 3, stock: 48, sku: 'LAM-2041', status: 'Active', featured: true,
    images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800'],
    description: 'Handcrafted using the centuries-old Jaipur Blue Pottery technique, this vase features intricate cobalt-blue floral motifs painted on a pristine glazed surface. A timeless piece to elevate any living space.',
    specs: { Material: 'Quartz Ceramic', Height: '25 cm', Weight: '850 g', Finish: 'Hand-glazed', Origin: 'Jaipur, Rajasthan', Care: 'Wipe with dry cloth' },
    tags: ['Pottery', 'Home Decor', 'Handmade', 'Jaipur'] },
  { id: 'p-2', shopId: 'shop-1', name: 'Terracotta Serving Bowl Set', category: 'pottery', price: 1450, mrp: 1450, rating: 4.6, reviewCount: 0, stock: 0, sku: 'LAM-3856', status: 'Active', featured: false,
    images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800'],
    description: 'A set of hand-thrown terracotta serving bowls, glazed and kiln-fired in Jaipur.', specs: { Material: 'Terracotta', Origin: 'Jaipur, Rajasthan' }, tags: ['Pottery'] },
  { id: 'p-3', shopId: 'shop-1', name: 'Terracotta Kulhad Tea Set (Set of 6)', category: 'pottery', price: 450, mrp: 450, rating: 4.5, reviewCount: 0, stock: 210, sku: 'LAM-1099', status: 'Active', featured: false,
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800'],
    description: 'Rustic hand-thrown kulhad cups, perfect for chai.', specs: { Material: 'Terracotta' }, tags: ['Pottery'] },
  { id: 'p-4', shopId: 'shop-3', name: 'Oxidised Silver Jhumka Earrings', category: 'jewellery', price: 899, mrp: 899, rating: 4.5, reviewCount: 2, stock: 31, sku: 'LAM-4401', status: 'Active', featured: true,
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'],
    description: 'Traditional oxidised silver jhumkas with intricate filigree work.', specs: { Material: 'Oxidised Silver' }, tags: ['Jewellery'] },
  { id: 'p-5', shopId: 'shop-3', name: 'Meenakari Beaded Necklace', category: 'jewellery', price: 1499, mrp: 1499, rating: 5.0, reviewCount: 1, stock: 15, sku: 'LAM-4402', status: 'Active', featured: false,
    availabilityType: 'Limited Edition', limitedQuantity: 15,
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'],
    description: 'Hand-enamelled meenakari necklace with beadwork detailing.', specs: { Material: 'Meenakari Metal' }, tags: ['Jewellery'] },
  { id: 'p-6', shopId: 'shop-4', name: 'Sandalwood Soy Candle', category: 'home-decor', price: 599, mrp: 599, rating: 5.0, reviewCount: 2, stock: 60, sku: 'LAM-5501', status: 'Active', featured: true,
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800'],
    description: 'Hand-poured soy wax candle with a warm sandalwood fragrance, 40-hour burn time.', specs: { Material: 'Soy Wax' }, tags: ['Candles', 'Home Decor'] },
  { id: 'p-7', shopId: 'shop-2', name: 'Handwoven Banarasi Silk Saree', category: 'textiles', price: 4500, mrp: 5200, rating: 5.0, reviewCount: 0, stock: 12, sku: 'LAM-1188', status: 'Active', featured: true,
    availabilityType: 'Made to Order', productionTime: '10-15 days',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
    description: 'Pure silk Banarasi saree with gold zari border, handwoven on traditional looms in Varanasi.', specs: { Material: 'Pure Silk', Origin: 'Varanasi, UP' }, tags: ['Textiles'] },
  { id: 'p-8', shopId: 'shop-2', name: 'Handwoven Cotton Scarf', category: 'textiles', price: 1050, mrp: 1050, rating: 4.9, reviewCount: 0, stock: 40, sku: 'LAM-1024', status: 'Active', featured: true,
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
    description: 'Soft handwoven cotton scarf with a block-printed border.', specs: { Material: 'Cotton' }, tags: ['Textiles'] },
  { id: 'p-9', shopId: 'shop-1', name: 'Madhubani Wall Painting', category: 'paintings', price: 2150, mrp: 2150, rating: 4.7, reviewCount: 0, stock: 7, sku: 'LAM-0912', status: 'Pending', featured: false,
    images: ['https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800'],
    description: 'Hand-painted Madhubani folk art on handmade paper, framed and ready to hang.', specs: { Material: 'Natural Pigments on Handmade Paper' }, tags: ['Paintings'] },
  { id: 'p-10', shopId: 'shop-4', name: 'Macrame Wall Hanging', category: 'home-decor', price: 1499, mrp: 1499, rating: 4.0, reviewCount: 2, stock: 22, sku: 'LAM-1573', status: 'Active', featured: false,
    images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
    description: 'Handknotted cotton macrame wall hanging, boho style.', specs: { Material: 'Cotton Rope' }, tags: ['Home Decor'] },
  { id: 'p-11', shopId: 'shop-3', name: 'Brass Peacock Diya Set', category: 'metalwork', price: 1750, mrp: 1750, rating: 4.0, reviewCount: 1, stock: 0, sku: 'LAM-3320', status: 'Active', featured: false,
    images: ['https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=800'],
    description: 'Brass diya set with peacock detailing, ideal for festive decor.', specs: { Material: 'Brass' }, tags: ['Metalwork'] },
  { id: 'p-12', shopId: 'shop-1', name: 'Channapatna Handcrafted Wooden Toy Set', category: 'woodcraft', price: 899, mrp: 1199, rating: 4.8, reviewCount: 2, stock: 33, sku: 'LAM-6601', status: 'Active', featured: false,
    images: ['https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=800'],
    description: 'Traditional eco-friendly wooden stacking toy handcrafted by master artisans of Channapatna using natural ivory wood and safe vegetable dyes.', specs: { Material: 'Wrightia Tinctoria Wood', Finish: 'Natural Lacquer', Origin: 'Channapatna, Karnataka' }, tags: ['Woodcraft', 'Toys', 'Handmade'] },
]


// Orders — items reference product ids; status drives all dashboards
export const orders = [
  {
    id: 'ORD-90241', customerId: 'u-cust-1', customerName: 'Ananya Sharma', shopId: 'shop-1',
    items: [{ productId: 'p-1', name: 'Jaipur Blue Pottery Vase Set', qty: 1, price: 2499 }],
    amount: 2499, date: '2024-06-12', address: 'Jaipur, Rajasthan', payment: 'Paid', method: 'Online', status: 'Delivered',
  },
  {
    id: 'ORD-90238', customerId: 'u-cust-2', customerName: 'Priya Nair', shopId: 'shop-2',
    items: [{ productId: 'p-7', name: 'Handloom Bandhani Dupatta', qty: 1, price: 1850 }],
    amount: 1850, date: '2024-06-12', address: 'Ahmedabad, GJ', payment: 'Pending', method: 'Online', status: 'Processing',
  },
  {
    id: 'ORD-90235', customerId: 'u-cust-1', customerName: 'Ananya Sharma', shopId: 'shop-4',
    items: [{ productId: 'p-10', name: 'Wooden Handcrafted Toy Set', qty: 1, price: 999 }],
    amount: 999, date: '2024-06-11', address: 'Mysuru, KA', payment: 'Paid', method: 'COD', status: 'Shipped',
  },
  {
    id: 'ORD-4821', customerId: 'u-cust-1', customerName: 'Ananya Sharma', shopId: 'shop-1',
    items: [{ productId: 'p-1', name: 'Blue Pottery Ceramic Vase Set', qty: 2, price: 1749.5 }],
    amount: 3499, date: '2025-02-12', address: 'Jaipur, Rajasthan', payment: 'COD', method: 'COD', status: 'Pending',
  },
  {
    id: 'ORD-4815', customerId: 'u-cust-2', customerName: 'Priya Nair', shopId: 'shop-4',
    items: [{ productId: 'p-10', name: 'Handwoven Jute Macramé Wall Hanging', qty: 1, price: 1650 }],
    amount: 1650, date: '2025-02-05', address: 'Hyderabad, Telangana', payment: 'COD', method: 'COD', status: 'Delivered',
  },
  {
    id: 'ORD-4812', customerId: 'u-cust-2', customerName: 'Priya Nair', shopId: 'shop-1',
    items: [{ productId: 'p-3', name: 'Terracotta Clay Kulhad Tea Cups (Set of 6)', qty: 3, price: 299.67 }],
    amount: 899, date: '2025-02-03', address: 'Ahmedabad, Gujarat', payment: 'COD', method: 'COD', status: 'Cancelled',
  },
]

export const reviews = [
  { id: 'r-1', productId: 'p-1', customerId: null, orderId: null, name: 'Ananya Sharma', location: 'Bengaluru, Karnataka', rating: 5, date: '2024-03-12', text: 'The blue detailing is even more vibrant in person and the packaging was excellent.', verified: false },
  { id: 'r-2', productId: 'p-1', customerId: null, orderId: null, name: 'Rohan Mehta', location: 'Mumbai, Maharashtra', rating: 4, date: '2024-02-28', text: 'Great quality vase, gifted it to my mother and she loved it. Slight colour variance from the photos.', verified: false },
  { id: 'r-3', productId: 'p-1', customerId: null, orderId: null, name: 'Priya Nair', location: 'Kochi, Kerala', rating: 5, date: '2024-02-15', text: 'Supporting local artisans has never felt so rewarding. Lovely authenticity certificate included.', verified: false },
  // shop-3 (Ananya Jewels) - realistic spread across its products
  { id: 'r-4', productId: 'p-4', customerId: null, orderId: null, name: 'Meera Iyer', location: 'Chennai, Tamil Nadu', rating: 5, date: '2024-04-02', text: 'These jhumkas are gorgeous and so lightweight for everyday wear.', verified: false },
  { id: 'r-5', productId: 'p-4', customerId: null, orderId: null, name: 'Karthik Menon', location: 'Bengaluru, Karnataka', rating: 4, date: '2024-03-20', text: 'Good quality oxidised finish, arrived well packaged. Sizing runs a touch large.', verified: false },
  { id: 'r-6', productId: 'p-5', customerId: null, orderId: null, name: 'Divya Reddy', location: 'Hyderabad, Telangana', rating: 5, date: '2024-03-05', text: 'The meenakari work is stunning, exactly like the photos. Wore it to a wedding and got so many compliments.', verified: false },
  { id: 'r-7', productId: 'p-11', customerId: null, orderId: null, name: 'Arjun Nair', location: 'Kochi, Kerala', rating: 4, date: '2024-02-18', text: 'Beautiful brass diya set, a little heavier than expected but great for festive decor.', verified: false },
  // shop-4 (Diya Candle Co.) - realistic spread across its products
  { id: 'r-8', productId: 'p-6', customerId: null, orderId: null, name: 'Sneha Kulkarni', location: 'Pune, Maharashtra', rating: 5, date: '2024-04-10', text: 'The sandalwood scent is subtle and long-lasting, not overpowering at all.', verified: false },
  { id: 'r-9', productId: 'p-6', customerId: null, orderId: null, name: 'Vikram Joshi', location: 'Ahmedabad, Gujarat', rating: 5, date: '2024-03-27', text: 'Burns evenly and the packaging made it a lovely gift.', verified: false },
  { id: 'r-10', productId: 'p-10', customerId: null, orderId: null, name: 'Anjali Desai', location: 'Surat, Gujarat', rating: 4, date: '2024-03-08', text: 'Nice macrame work, adds a cosy touch to my living room wall.', verified: false },
  { id: 'r-11', productId: 'p-10', customerId: null, orderId: null, name: 'Farhan Sheikh', location: 'Mumbai, Maharashtra', rating: 4, date: '2024-02-22', text: 'Well made, though slightly smaller than I pictured from the listing.', verified: false },
]

export const heroStats = { artisans: '12,000+', products: '85,000+', cities: '120+' }

export const platformName = 'Local Artisan Marketplace'

// Custom/special order requests a customer sends directly to an artisan,
// outside the normal catalogue checkout flow. Seeds CustomRequestsContext.
export const customRequests = [
  {
    id: 'CR-1001',
    customerId: 'u-cust-1',
    customerName: 'Ananya Sharma',
    shopId: 'shop-1',
    productRef: 'Pottery - Custom Dinner Set',
    quantity: 12,
    budget: 8000,
    requiredByDate: '2026-10-15',
    description: 'Looking for a hand-painted blue pottery dinner set (12 pieces) with a peacock motif, similar style to your vase collection.',
    notes: 'Needed as a wedding gift - gift wrapping would be appreciated.',
    status: 'Pending',
    createdDate: '2026-08-20',
  },
]

// ---- helpers ----
export const getProduct = (id) => products.find((p) => p.id === id)
export const getShop = (id) => shops.find((s) => s.id === id)
export const getShopByOwner = (ownerId) => shops.find((s) => s.ownerId === ownerId)
export const getProductsByShop = (shopId) => products.filter((p) => p.shopId === shopId)
export const getOrdersByCustomer = (customerId) => orders.filter((o) => o.customerId === customerId)
export const getOrdersByShop = (shopId) => orders.filter((o) => o.shopId === shopId)
export const getReviewsForProduct = (productId) => reviews.filter((r) => r.productId === productId)
