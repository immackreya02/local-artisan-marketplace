const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Address = require('../models/Address');
const CustomRequest = require('../models/CustomRequest');
const Notification = require('../models/Notification');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const { recalculateProductRating, recalculateShopRating } = require('./reviewAggregation');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedFullDatabase = async (skipConnect = false) => {
  try {
    if (!skipConnect && mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace';
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
        console.log(`🌱 Connected to MongoDB (${mongoUri.includes('mongodb+srv') ? 'Atlas Cloud' : 'Local'}) for seeding marketplace dataset...`);
      } catch (connErr) {
        console.log(`⚠️ Primary MongoDB connection failed (${connErr.message}).`);
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          const mongoServer = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
          const inMemUri = mongoServer.getUri();
          await mongoose.connect(inMemUri);
          console.log('🌱 Connected to In-Memory MongoDB for seeding full demo dataset.');
        } catch (memErr) {
          throw new Error(`Failed to connect to MongoDB at ${mongoUri}: ${connErr.message}`);
        }
      }
    }

    // Clear existing collections safely for reproducible seeding
    await User.deleteMany({});
    await Shop.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Address.deleteMany({});
    await CustomRequest.deleteMany({});
    await Notification.deleteMany({});
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});

    console.log('🧹 Cleared existing database collections.');

    // 1. SEED CATEGORIES (8 Core Indian Craft Categories)
    const categoriesData = [
      {
        name: 'Pottery & Ceramics',
        slug: 'pottery',
        description: 'Handcrafted terracotta pots, Jaipur blue pottery, glazed planters and artisanal clay tableware.',
        icon: 'Amphora'
      },
      {
        name: 'Textiles & Weaving',
        slug: 'textiles',
        description: 'Handloom Kanjeevaram & Banarasi silk sarees, Chikankari embroidered kurtas, and block-printed dupattas.',
        icon: 'Scissors'
      },
      {
        name: 'Jewellery & Ornaments',
        slug: 'jewellery',
        description: 'Handmade oxidised 925 silver jhumkas, Meenakari enamel bangles, and tribal beadwork ornaments.',
        icon: 'Gem'
      },
      {
        name: 'Home Decor & Lighting',
        slug: 'home-decor',
        description: 'Brass oil lamps, scented soy botanical candles, handwoven macrame, and traditional Torans.',
        icon: 'Lamp'
      },
      {
        name: 'Paintings & Folk Art',
        slug: 'paintings',
        description: 'Authentic Madhubani, Warli folk paintings, and Tanjore gold-leaf framed canvas artworks.',
        icon: 'Palette'
      },
      {
        name: 'Woodcraft & Carvings',
        slug: 'woodcraft',
        description: 'Channapatna eco-friendly wooden toys, hand-carved Rosewood inlay boxes, and teak wall panels.',
        icon: 'TreePine'
      },
      {
        name: 'Metalwork & Dhokra',
        slug: 'metalwork',
        description: 'Traditional lost-wax Dhokra bronze figurines, hand-hammered brass oil lamps, and copperware.',
        icon: 'Hammer'
      },
      {
        name: 'Leather & Heritage Crafts',
        slug: 'leather-crafts',
        description: 'Kutch embroidered leather bags, hand-stitched Kolhapuri leather footwear, and artisan journals.',
        icon: 'Briefcase'
      }
    ];

    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`✅ Seeded ${createdCategories.length} categories.`);

    const catMap = {};
    createdCategories.forEach((c) => {
      catMap[c.slug] = c._id;
    });

    // 2. SEED USERS (Core Demo Accounts + Auxiliary Shop Owners)
    // Using User.create to ensure password pre-save bcrypt hashing triggers
    const adminMain = await User.create({
      name: 'Rohan Deshmukh',
      email: 'admin@lam.in',
      password: 'ArtisanAdmin#2026!',
      role: 'admin',
      status: 'Active',
      location: 'Pune, Maharashtra',
      phone: '+91 90000 00001'
    });

    const artisanDemo1 = await User.create({
      name: 'Rajesh Kumhar',
      email: 'artisan@lam.in',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Active',
      location: 'Jaipur, Rajasthan',
      phone: '+91 98290 45671'
    });

    const artisanDemo2 = await User.create({
      name: 'Meena Devi',
      email: 'meena.devi@kanjeevaram.com',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Active',
      location: 'Kanchipuram, Tamil Nadu',
      phone: '+91 94431 89201'
    });

    const customerDemo1 = await User.create({
      name: 'Priya Sharma',
      email: 'customer@lam.in',
      password: 'CraftCustomer#2026!',
      role: 'customer',
      status: 'Active',
      location: 'Mumbai, Maharashtra',
      phone: '+91 98765 43210'
    });

    const customerDemo2 = await User.create({
      name: 'Aravind Kumar',
      email: 'aravind.kumar@example.com',
      password: 'CraftCustomer#2026!',
      role: 'customer',
      status: 'Active',
      location: 'Bengaluru, Karnataka',
      phone: '+91 90045 67812'
    });

    // Additional Artisan Owners for authentic Indian artisan shop diversity
    const sitaDevi = await User.create({
      name: 'Sita Devi',
      email: 'sita.madhubani@artisan.in',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Active',
      location: 'Madhubani, Bihar',
      phone: '+91 97812 34567'
    });

    const ganeshAcharya = await User.create({
      name: 'Ganesh Acharya',
      email: 'ganesh.dhokra@artisan.in',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Active',
      location: 'Kondagaon, Chhattisgarh',
      phone: '+91 96543 21098'
    });

    const rameshwarGowda = await User.create({
      name: 'Rameshwar Gowda',
      email: 'rameshwar.channapatna@artisan.in',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Active',
      location: 'Channapatna, Karnataka',
      phone: '+91 98451 22334'
    });

    const sabinaKhatun = await User.create({
      name: 'Sabina Khatun',
      email: 'sabina.chikankari@artisan.in',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Active',
      location: 'Lucknow, Uttar Pradesh',
      phone: '+91 99182 73645'
    });

    const venkateshRaju = await User.create({
      name: 'Venkatesh Raju',
      email: 'venkatesh.tanjore@artisan.in',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Active',
      location: 'Thanjavur, Tamil Nadu',
      phone: '+91 94422 33445'
    });

    const jethaMarwada = await User.create({
      name: 'Jetha Bhai Marwada',
      email: 'jetha.leather@artisan.in',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Active',
      location: 'Bhuj, Kutch, Gujarat',
      phone: '+91 98254 11223'
    });

    const subhashDey = await User.create({
      name: 'Subhash Dey',
      email: 'subhash.terracotta@artisan.in',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Active',
      location: 'Bishnupur, West Bengal',
      phone: '+91 94340 55667'
    });

    // Pending Artisan Account for New Account testing
    const pendingArtisan = await User.create({
      name: 'Sunita Verma',
      email: 'sunita@banarasisilk.in',
      password: 'JaipurArtisan#2026!',
      role: 'artisan',
      status: 'Pending',
      location: 'Varanasi, UP',
      phone: '+91 99871 22345'
    });

    console.log('✅ Seeded users (5 Core Demo Accounts + Auxiliary Shop Owners + 1 Pending Artisan).');

    // 3. SEED SHOPS (10 Realistic Indian Artisan Shops)
    const shop1 = await Shop.create({
      name: 'Jaipur Blue Pottery Studio',
      owner: artisanDemo1._id,
      ownerName: artisanDemo1.name,
      category: 'Pottery & Ceramics',
      location: 'Jaipur, Rajasthan',
      rating: 4.8,
      reviewCount: 4,
      verified: true,
      status: 'Active',
      yearsInBusiness: 42,
      phone: artisanDemo1.phone,
      email: artisanDemo1.email,
      description: 'Jaipur Blue Pottery Studio crafts authentic quartz ceramic heritage pottery featuring hand-painted cobalt blue and turquoise motifs passed down through four generations.',
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600'
    });

    const shop2 = await Shop.create({
      name: 'Kanjeevaram Silk Weavers',
      owner: artisanDemo2._id,
      ownerName: artisanDemo2.name,
      category: 'Textiles & Weaving',
      location: 'Kanchipuram, Tamil Nadu',
      rating: 4.9,
      reviewCount: 4,
      verified: true,
      status: 'Active',
      yearsInBusiness: 35,
      phone: artisanDemo2.phone,
      email: artisanDemo2.email,
      description: 'Master weavers crafting pure mulberry silk sarees with pure gold and silver zari brocade borders on handlooms in Kanchipuram.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'
    });

    const shop3 = await Shop.create({
      name: 'Madhubani Kala Kendra',
      owner: sitaDevi._id,
      ownerName: sitaDevi.name,
      category: 'Paintings & Folk Art',
      location: 'Madhubani, Bihar',
      rating: 4.9,
      reviewCount: 3,
      verified: true,
      status: 'Active',
      yearsInBusiness: 28,
      phone: sitaDevi.phone,
      email: sitaDevi.email,
      description: 'Traditional Mithila art collective using natural plant dyes, bamboo twigs, and rice paste to depict folklore and nature.',
      image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=600'
    });

    const shop4 = await Shop.create({
      name: 'Bastar Dhokra Bronze',
      owner: ganeshAcharya._id,
      ownerName: ganeshAcharya.name,
      category: 'Metalwork & Dhokra',
      location: 'Kondagaon, Chhattisgarh',
      rating: 4.8,
      reviewCount: 3,
      verified: true,
      status: 'Active',
      yearsInBusiness: 50,
      phone: ganeshAcharya.phone,
      email: ganeshAcharya.email,
      description: 'Ancient lost-wax bronze casting by tribal artisans producing rustic metal figurines, oil lamps, and tribal deities.',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600'
    });

    const shop5 = await Shop.create({
      name: 'Channapatna Toy Crafts',
      owner: rameshwarGowda._id,
      ownerName: rameshwarGowda.name,
      category: 'Woodcraft & Carvings',
      location: 'Channapatna, Karnataka',
      rating: 4.8,
      reviewCount: 2,
      verified: true,
      status: 'Active',
      yearsInBusiness: 22,
      phone: rameshwarGowda.phone,
      email: rameshwarGowda.email,
      description: 'Eco-friendly non-toxic wooden toys and lacquered artifacts hand-turned on wood lathes using ivory wood and organic vegetable colors.',
      image: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=600'
    });

    const shop6 = await Shop.create({
      name: 'Lucknowi Chikankari Studio',
      owner: sabinaKhatun._id,
      ownerName: sabinaKhatun.name,
      category: 'Textiles & Weaving',
      location: 'Lucknow, Uttar Pradesh',
      rating: 4.9,
      reviewCount: 3,
      verified: true,
      status: 'Active',
      yearsInBusiness: 30,
      phone: sabinaKhatun.phone,
      email: sabinaKhatun.email,
      description: 'Intricate hand embroidered needlework including shadow work, phanda, and bakhiya on fine muslin and georgette fabrics.',
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600'
    });

    const shop7 = await Shop.create({
      name: 'Tanjore Gold Leaf Art',
      owner: venkateshRaju._id,
      ownerName: venkateshRaju.name,
      category: 'Paintings & Folk Art',
      location: 'Thanjavur, Tamil Nadu',
      rating: 5.0,
      reviewCount: 2,
      verified: true,
      status: 'Active',
      yearsInBusiness: 38,
      phone: venkateshRaju.phone,
      email: venkateshRaju.email,
      description: 'Classic Tanjore gold leaf icon paintings inlaid with semi-precious Jaipur gems, gesso relief work, and teak frames.',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600'
    });

    const shop8 = await Shop.create({
      name: 'Kutch Heritage Leathercraft',
      owner: jethaMarwada._id,
      ownerName: jethaMarwada.name,
      category: 'Leather & Heritage Crafts',
      location: 'Bhuj, Kutch, Gujarat',
      rating: 4.8,
      reviewCount: 3,
      verified: true,
      status: 'Active',
      yearsInBusiness: 25,
      phone: jethaMarwada.phone,
      email: jethaMarwada.email,
      description: 'Hand-dyed naturally tanned leather bags, Kolhapuri footwear, and journals with traditional Kutch embroidery and brass work.',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'
    });

    const shop9 = await Shop.create({
      name: 'Bankura Terracotta Works',
      owner: subhashDey._id,
      ownerName: subhashDey.name,
      category: 'Pottery & Ceramics',
      location: 'Bishnupur, West Bengal',
      rating: 4.7,
      reviewCount: 2,
      verified: true,
      status: 'Active',
      yearsInBusiness: 31,
      phone: subhashDey.phone,
      email: subhashDey.email,
      description: 'Famous long-necked terracotta Bankura horses, temple panels, and clay wall art molded with sacred Gangetic clay.',
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600'
    });

    const shop10 = await Shop.create({
      name: 'Banarasi Weaving House',
      owner: pendingArtisan._id,
      ownerName: pendingArtisan.name,
      category: 'Textiles & Weaving',
      location: 'Varanasi, UP',
      rating: 0,
      reviewCount: 0,
      verified: false,
      status: 'Pending',
      yearsInBusiness: 18,
      phone: pendingArtisan.phone,
      email: pendingArtisan.email,
      description: 'A family weaving house producing hand-loomed Banarasi silk sarees awaiting administrator verification.',
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600'
    });

    console.log('✅ Seeded 10 Shops (9 Active, 1 Pending).');

    // 4. SEED PRODUCTS (28 Realistic Products across all 8 Categories)
    const productsData = [
      // Jaipur Blue Pottery (Shop 1)
      {
        name: 'Jaipur Blue Pottery Royal Cobalt Vase',
        description: 'Handcrafted using centuries-old Jaipur quartz ceramic technique, decorated with hand-painted royal cobalt blue floral vines.',
        shop: shop1._id,
        category: catMap['pottery'],
        categorySlug: 'pottery',
        images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800'],
        mrp: 3200,
        discount: 22,
        price: 2499,
        stock: 24,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: true,
        rating: 4.8,
        reviewCount: 2,
        specs: { Material: 'Quartz Clay & Frit', Height: '28 cm', Weight: '950 g', Finish: 'Glazed Glass' },
        tags: ['Pottery', 'Jaipur', 'Blue Pottery', 'Vase', 'Home Decor']
      },
      {
        name: 'Hand-Thrown Terracotta Tea Kulhads (Set of 6)',
        description: 'Traditional unglazed terracotta cups hand-thrown on artisan wheels, adding natural earthy flavor to Indian masala chai.',
        shop: shop1._id,
        category: catMap['pottery'],
        categorySlug: 'pottery',
        images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800'],
        mrp: 750,
        discount: 20,
        price: 599,
        stock: 85,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.6,
        reviewCount: 1,
        specs: { Material: 'Natural Clay', Capacity: '150 ml per cup', Pieces: '6 Cups' },
        tags: ['Pottery', 'Kulhad', 'Chai', 'Terracotta']
      },
      {
        name: 'Hand-Glazed Ceramic Serving Platter',
        description: 'Oval ceramic serving platter with turquoise glaze and peacock motif border, kiln-fired at high temperatures.',
        shop: shop1._id,
        category: catMap['pottery'],
        categorySlug: 'pottery',
        images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800'],
        mrp: 2200,
        discount: 16,
        price: 1850,
        stock: 3, // LOW STOCK ALERT
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.9,
        reviewCount: 1,
        specs: { Material: 'High-fire Ceramic', Dimensions: '35x22 cm', MicrowaveSafe: 'Yes' },
        tags: ['Pottery', 'Platter', 'Tableware']
      },

      // Kanjeevaram Silk (Shop 2)
      {
        name: 'Pure Kanjeevaram Handloom Silk Saree with Zari Border',
        description: 'Woven with 100% pure mulberry silk and pure gold zari thread depicting korvai temple motifs along the contrasting border.',
        shop: shop2._id,
        category: catMap['textiles'],
        categorySlug: 'textiles',
        images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
        mrp: 15000,
        discount: 17,
        price: 12500,
        stock: 8,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: true,
        rating: 4.9,
        reviewCount: 2,
        specs: { Material: 'Pure Mulberry Silk', Craft: 'Korvai Weave', SilkMarkVerified: 'Yes', BlousePiece: 'Included' },
        tags: ['Textiles', 'Saree', 'Silk', 'Kanjeevaram']
      },
      {
        name: 'Authentic Kanchipuram Mulberry Silk Dupatta',
        description: 'Heavy silk dupatta with elaborate brocade gold zari weaving across the borders and pallu.',
        shop: shop2._id,
        category: catMap['textiles'],
        categorySlug: 'textiles',
        images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
        mrp: 4500,
        discount: 16,
        price: 3800,
        stock: 14,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.7,
        reviewCount: 1,
        specs: { Material: 'Mulberry Silk', Length: '2.5 meters', ZariType: 'Tested Silver-Gold Zari' },
        tags: ['Textiles', 'Dupatta', 'Silk']
      },
      {
        name: 'Pure Zari Woven Silk Brocade Cushion Cover',
        description: 'Luxurious cushion cover tailored from handloom brocade silk fabric featuring royal floral bel patterns.',
        shop: shop2._id,
        category: catMap['textiles'],
        categorySlug: 'textiles',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
        mrp: 1600,
        discount: 19,
        price: 1299,
        stock: 30,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.8,
        reviewCount: 1,
        specs: { Material: 'Brocade Silk', Dimensions: '40x40 cm', Closure: 'Hidden Zipper' },
        tags: ['Textiles', 'Cushion', 'Home Decor']
      },

      // Madhubani Art (Shop 3)
      {
        name: 'Framed Madhubani Tree of Life Painting',
        description: 'Authentic Mithila folk painting painted on handmade recycled paper with natural mineral colors and fine nib brushes.',
        shop: shop3._id,
        category: catMap['paintings'],
        categorySlug: 'paintings',
        images: ['https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800'],
        mrp: 4200,
        discount: 17,
        price: 3499,
        stock: 12,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: true,
        rating: 4.9,
        reviewCount: 2,
        specs: { Medium: 'Natural Dyes on Handmade Paper', Dimensions: '45x60 cm', Frame: 'Teak Wood Frame' },
        tags: ['Paintings', 'Madhubani', 'Folk Art', 'Tree of Life']
      },
      {
        name: 'Hand-Painted Madhubani Radha Krishna Canvas',
        description: 'Vibrant painting illustrating eternal love through intricate double-line borders and dense geometric patterns.',
        shop: shop3._id,
        category: catMap['paintings'],
        categorySlug: 'paintings',
        images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800'],
        mrp: 6000,
        discount: 17,
        price: 4999,
        stock: 5, // LOW STOCK ALERT
        status: 'Active',
        availability: 'Made-to-Order',
        productionTime: '7-10 Days',
        featured: false,
        rating: 5.0,
        reviewCount: 1,
        specs: { Medium: 'Acrylic & Botanical Dyes on Canvas', Dimensions: '60x90 cm' },
        tags: ['Paintings', 'Radha Krishna', 'Madhubani']
      },
      {
        name: 'Warli Tribal Life Art Panel',
        description: 'Traditional Warli monochrome stick figure artwork painted with white rice paste on reddish terracotta canvas.',
        shop: shop3._id,
        category: catMap['paintings'],
        categorySlug: 'paintings',
        images: ['https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800'],
        mrp: 2600,
        discount: 19,
        price: 2100,
        stock: 18,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.6,
        reviewCount: 0,
        specs: { Medium: 'Rice Paste on Cloth Canvas', Dimensions: '30x40 cm' },
        tags: ['Paintings', 'Warli', 'Tribal Art']
      },

      // Bastar Dhokra (Shop 4)
      {
        name: 'Bastar Dhokra Lost-Wax Bronze Tribal Musician',
        description: 'Handcrafted bronze figurine created using 4000-year-old lost-wax technique by Chhattisgarh tribal artisans.',
        shop: shop4._id,
        category: catMap['metalwork'],
        categorySlug: 'metalwork',
        images: ['https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800'],
        mrp: 3500,
        discount: 17,
        price: 2899,
        stock: 16,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: true,
        rating: 4.8,
        reviewCount: 2,
        specs: { Material: 'Bell Metal Bronze', Height: '22 cm', Weight: '820 g', Craft: 'Lost-Wax Casting' },
        tags: ['Metalwork', 'Dhokra', 'Bronze', 'Tribal Art']
      },
      {
        name: 'Hand-Cast Dhokra Elephant Oil Lamp',
        description: 'Intricate brass oil lamp supported by a decorated Dhokra elephant figure, handcrafted with wirework motifs.',
        shop: shop4._id,
        category: catMap['metalwork'],
        categorySlug: 'metalwork',
        images: ['https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=800'],
        mrp: 2400,
        discount: 19,
        price: 1950,
        stock: 22,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.7,
        reviewCount: 1,
        specs: { Material: 'Brass Metal Alloy', Height: '18 cm', Weight: '650 g' },
        tags: ['Metalwork', 'Elephant', 'Diya']
      },
      {
        name: 'Traditional Brass Peacock Hanging Diya',
        description: 'Heavy antique finish brass hanging oil lamp suspended from an engraved brass chain with a peacock crest.',
        shop: shop4._id,
        category: catMap['metalwork'],
        categorySlug: 'metalwork',
        images: ['https://images.unsplash.com/photo-1606293926075-69a00dbfde81?w=800'],
        mrp: 2800,
        discount: 20,
        price: 2250,
        stock: 19,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.8,
        reviewCount: 0,
        specs: { Material: 'Solid Brass', ChainLength: '45 cm', Weight: '1.2 kg' },
        tags: ['Metalwork', 'Brass', 'Diya', 'Hanging Lamp']
      },

      // Channapatna Toys (Shop 5)
      {
        name: 'Channapatna Non-Toxic Wooden Stacking Ring Toy',
        description: 'Child-safe stacking rings made from Ivory wood (Hale wood) and colored with vegetable dyes and shellac polish.',
        shop: shop5._id,
        category: catMap['woodcraft'],
        categorySlug: 'woodcraft',
        images: ['https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=800'],
        mrp: 800,
        discount: 19,
        price: 649,
        stock: 45,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: true,
        rating: 4.7,
        reviewCount: 1,
        specs: { Material: 'Ivory Wood', Dye: 'Vegetable Dyes', SafetyMark: 'BIS Certified' },
        tags: ['Woodcraft', 'Channapatna', 'Toys', 'Kids']
      },
      {
        name: 'Hand-Turned Lacquer Wooden Engine Train',
        description: 'Vibrant 4-bogie wooden toy train with smooth rounded edges, turned on wood lathes in Channapatna craft village.',
        shop: shop5._id,
        category: catMap['woodcraft'],
        categorySlug: 'woodcraft',
        images: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800'],
        mrp: 1500,
        discount: 20,
        price: 1199,
        stock: 35,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.9,
        reviewCount: 1,
        specs: { Material: 'Softwood', Length: '40 cm', Finish: 'Natural Lacquer' },
        tags: ['Woodcraft', 'Train', 'Wooden Toy']
      },
      {
        name: 'Teak Wood Hand-Carved Jewelry Storage Box',
        description: 'Intricately carved teak wood box with floral filigree brass inlay lid and velvet interior lining.',
        shop: shop5._id,
        category: catMap['woodcraft'],
        categorySlug: 'woodcraft',
        images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800'],
        mrp: 2200,
        discount: 18,
        price: 1799,
        stock: 4, // LOW STOCK ALERT
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.8,
        reviewCount: 0,
        specs: { Material: 'Teak Wood & Brass Inlay', Dimensions: '20x15x10 cm' },
        tags: ['Woodcraft', 'Jewelry Box', 'Teak']
      },

      // Lucknowi Chikankari (Shop 6)
      {
        name: 'Hand-Embroidered Chikankari Cotton Kurta',
        description: 'Elegant white pure cotton straight tunic featuring intricate Tepchi, Bakhiya and Phanda needle embroidery.',
        shop: shop6._id,
        category: catMap['textiles'],
        categorySlug: 'textiles',
        images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800'],
        mrp: 3500,
        discount: 19,
        price: 2850,
        stock: 28,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: true,
        rating: 4.9,
        reviewCount: 2,
        specs: { Fabric: '100% Breathable Cotton', Embroidery: 'Hand Chikankari', Fit: 'Straight Regular Fit' },
        tags: ['Textiles', 'Chikankari', 'Kurta', 'Cotton']
      },
      {
        name: 'Chikankari Shadow-Work Georgette Dupatta',
        description: 'Flowy georgette dupatta with delicate shadow embroidery and hand-worked crochet lace edging.',
        shop: shop6._id,
        category: catMap['textiles'],
        categorySlug: 'textiles',
        images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800'],
        mrp: 2000,
        discount: 18,
        price: 1650,
        stock: 20,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.7,
        reviewCount: 1,
        specs: { Fabric: 'Viscose Georgette', Length: '2.4 meters' },
        tags: ['Textiles', 'Dupatta', 'Chikankari']
      },

      // Tanjore Art (Shop 7)
      {
        name: 'Handcrafted 22K Gold Leaf Tanjore Saraswati Painting',
        description: 'Masterwork classical Tanjore painting created with 22-karat genuine gold foil, relief gesso plasterwork, and Jaipur cut gems.',
        shop: shop7._id,
        category: catMap['paintings'],
        categorySlug: 'paintings',
        images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800'],
        mrp: 22000,
        discount: 16,
        price: 18500,
        stock: 6,
        status: 'Active',
        availability: 'Made-to-Order',
        productionTime: '15-20 Days',
        featured: true,
        rating: 5.0,
        reviewCount: 1,
        specs: { GoldLeaf: '22K Pure Gold Foil', Frame: 'Teak Wood Frame with Glass', Dimensions: '50x65 cm' },
        tags: ['Paintings', 'Tanjore', 'Gold Leaf', 'Goddess Saraswati']
      },
      {
        name: 'Tanjore Framed Ganesha Artwork with Semi-Precious Gems',
        description: 'Traditional Tanjore icon artwork depicting Lord Ganesha seated on a lotus, richly gilded with gold foil.',
        shop: shop7._id,
        category: catMap['paintings'],
        categorySlug: 'paintings',
        images: ['https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800'],
        mrp: 17000,
        discount: 16,
        price: 14200,
        stock: 7,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.9,
        reviewCount: 1,
        specs: { GoldFoil: '22K Gold Foil', Dimensions: '40x50 cm' },
        tags: ['Paintings', 'Ganesha', 'Tanjore']
      },

      // Kutch Leather (Shop 8)
      {
        name: 'Kutch Mirrorwork & Embroidered Leather Tote Bag',
        description: 'Genuine vegetable-tanned leather tote bag decorated with traditional Kutchi mirrorwork embroidery and brass studs.',
        shop: shop8._id,
        category: catMap['leather-crafts'],
        categorySlug: 'leather-crafts',
        images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800'],
        mrp: 4500,
        discount: 20,
        price: 3600,
        stock: 15,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: true,
        rating: 4.8,
        reviewCount: 2,
        specs: { Material: 'Vegetable-Tanned Leather', Embroidery: 'Kutch Mirrorwork', Compartments: '3 Zipper Pockets' },
        tags: ['Leather', 'Tote Bag', 'Kutch', 'Mirrorwork']
      },
      {
        name: 'Hand-Stitched Kolhapuri Genuine Leather Mojari',
        description: 'Classic handcrafted Kolhapuri slip-on leather footwear made from full-grain leather with braided straps.',
        shop: shop8._id,
        category: catMap['leather-crafts'],
        categorySlug: 'leather-crafts',
        images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'],
        mrp: 2700,
        discount: 19,
        price: 2199,
        stock: 25,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.7,
        reviewCount: 1,
        specs: { Material: '100% Genuine Leather', Sole: 'Leather Sole', SizesAvailable: 'IND 6-11' },
        tags: ['Leather', 'Kolhapuri', 'Footwear', 'Mojari']
      },
      {
        name: 'Handcrafted Leather Journal with Brass Cinch Lock',
        description: 'Vintage leather notebook with handmade recycled cotton paper and brass clasp closure.',
        shop: shop8._id,
        category: catMap['leather-crafts'],
        categorySlug: 'leather-crafts',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800'],
        mrp: 1300,
        discount: 23,
        price: 999,
        stock: 40,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.6,
        reviewCount: 0,
        specs: { Cover: 'Buff Leather', Paper: '200 Unruled Recycled Pages', Lock: 'Brass Clasp' },
        tags: ['Leather', 'Journal', 'Notebook']
      },

      // Bankura Terracotta (Shop 9)
      {
        name: 'Bankura Terracotta Long-Necked Sacred Horse Pair',
        description: 'Iconic Bishnupur long-necked clay horses molded with terracotta clay, symbolic of West Bengal folk craft.',
        shop: shop9._id,
        category: catMap['pottery'],
        categorySlug: 'pottery',
        images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800'],
        mrp: 3800,
        discount: 21,
        price: 2999,
        stock: 10,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.9,
        reviewCount: 1,
        specs: { Material: 'Natural Terracotta Clay', Height: '45 cm', Pair: '2 Horse Sculptures' },
        tags: ['Pottery', 'Bankura Horse', 'Terracotta', 'Bengal Art']
      },
      {
        name: 'Terracotta Hand-Carved Wall Hanging Panel',
        description: 'Sun-baked terracotta tile plaque carved with temple dancer relief motif for wall decoration.',
        shop: shop9._id,
        category: catMap['pottery'],
        categorySlug: 'pottery',
        images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800'],
        mrp: 1800,
        discount: 19,
        price: 1450,
        stock: 18,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.6,
        reviewCount: 1,
        specs: { Material: 'Kiln-Fired Clay', Dimensions: '30x30 cm' },
        tags: ['Pottery', 'Wall Panel', 'Terracotta']
      },

      // Additional Cross-Category Craft Items
      {
        name: 'Oxidised 925 Silver Tribal Jhumka Earrings',
        description: 'Traditional oxidised silver jhumka earrings featuring delicate floral filigree and ringing ghungroo drop beads.',
        shop: shop8._id,
        category: catMap['jewellery'],
        categorySlug: 'jewellery',
        images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800'],
        mrp: 1899,
        discount: 21,
        price: 1499,
        stock: 32,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: true,
        rating: 4.8,
        reviewCount: 2,
        specs: { Material: '925 Sterling Silver', Weight: '32 g', Closure: 'Push Back' },
        tags: ['Jewellery', 'Earrings', 'Silver', 'Jhumka']
      },
      {
        name: 'Meenakari Hand-Enamelled Brass Bangle Set',
        description: 'Set of 4 brass bangles hand-painted with peacock blue and ruby red meenakari enamel work.',
        shop: shop4._id,
        category: catMap['jewellery'],
        categorySlug: 'jewellery',
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800'],
        mrp: 1500,
        discount: 23,
        price: 1150,
        stock: 28,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.7,
        reviewCount: 1,
        specs: { Material: 'Brass with Meenakari Enamel', SetSize: '4 Bangles' },
        tags: ['Jewellery', 'Bangles', 'Meenakari']
      },
      {
        name: 'Hand-Poured Sandalwood & Mogra Botanical Soy Candle',
        description: 'Eco-friendly soy wax candle hand-poured in a clay pot infused with Mysore sandalwood and jasmine mogra essential oils.',
        shop: shop1._id,
        category: catMap['home-decor'],
        categorySlug: 'home-decor',
        images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800'],
        mrp: 950,
        discount: 21,
        price: 749,
        stock: 50,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.8,
        reviewCount: 1,
        specs: { Wax: '100% Soy Wax', Fragrance: 'Sandalwood & Mogra', BurnTime: '45 Hours' },
        tags: ['Home Decor', 'Candle', 'Sandalwood']
      },
      {
        name: 'Hand-Woven Natural Jute & Cotton Floor Rug',
        description: 'Reversible flat-weave floor rug handwoven from organic golden jute fiber and natural unbleached cotton yarn.',
        shop: shop6._id,
        category: catMap['home-decor'],
        categorySlug: 'home-decor',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
        mrp: 3100,
        discount: 19,
        price: 2499,
        stock: 16,
        status: 'Active',
        availability: 'Ready-to-Ship',
        featured: false,
        rating: 4.7,
        reviewCount: 1,
        specs: { Material: '70% Jute, 30% Cotton', Size: '90x150 cm' },
        tags: ['Home Decor', 'Rug', 'Jute']
      }
    ];

    const createdProducts = await Product.insertMany(productsData);
    console.log(`✅ Seeded ${createdProducts.length} products with complete specs, INR pricing & stock levels.`);

    const prodMap = {};
    createdProducts.forEach((p) => {
      prodMap[p.name] = p;
    });

    // 5. SEED SAVED CUSTOMER ADDRESSES
    const address1 = await Address.create({
      user: customerDemo1._id,
      name: customerDemo1.name,
      phone: customerDemo1.phone,
      streetAddress: '14 Bandra West, Turner Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400050',
      country: 'India',
      isDefault: true
    });

    const address2 = await Address.create({
      user: customerDemo2._id,
      name: customerDemo2.name,
      phone: customerDemo2.phone,
      streetAddress: '72 Indiranagar 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India',
      isDefault: true
    });

    console.log('✅ Seeded saved customer shipping addresses.');

    // 5b. SEED SAVED CUSTOMER WISHLISTS
    const pVase = prodMap['Jaipur Blue Pottery Royal Cobalt Vase'];
    const pKulhad = prodMap['Hand-Thrown Terracotta Tea Kulhads (Set of 6)'];
    const pSaree = prodMap['Pure Kanjeevaram Handloom Silk Saree with Zari Border'];
    const pMadhubani = prodMap['Framed Madhubani Tree of Life Painting'];
    const pDhokra = prodMap['Bastar Dhokra Lost-Wax Bronze Tribal Musician'];
    const pKurta = prodMap['Hand-Embroidered Chikankari Cotton Kurta'];
    const pTanjore = prodMap['Handcrafted 22K Gold Leaf Tanjore Saraswati Painting'];
    const pTote = prodMap['Kutch Mirrorwork & Embroidered Leather Tote Bag'];
    const pJhumka = prodMap['Oxidised 925 Silver Tribal Jhumka Earrings'];

    await Wishlist.create({
      user: customerDemo1._id,
      products: [pVase._id, pJhumka._id, pSaree._id, pTote._id]
    });

    await Wishlist.create({
      user: customerDemo2._id,
      products: [pKulhad._id, pDhokra._id]
    });

    console.log('✅ Seeded saved customer wishlists.');

    // 6. SEED HISTORICAL ORDERS (22 Historical Orders across May-Sept 2026)
    // Generating realistic monthly sales trends for Analytics/Revenue charts

    const ordersData = [
      // May 2026
      {
        orderNumber: 'ORD-90201',
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        shop: shop1._id,
        items: [{ product: pVase._id, name: pVase.name, quantity: 1, price: pVase.price, image: pVase.images[0] }],
        subtotal: pVase.price,
        tax: Math.round(pVase.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pVase.price * 1.18),
        shippingAddress: { name: address1.name, phone: address1.phone, streetAddress: address1.streetAddress, city: address1.city, state: address1.state, postalCode: address1.postalCode, country: address1.country },
        paymentMethod: 'Online',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-05-12T10:30:00Z')
      },
      {
        orderNumber: 'ORD-90202',
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        shop: shop2._id,
        items: [{ product: pSaree._id, name: pSaree.name, quantity: 1, price: pSaree.price, image: pSaree.images[0] }],
        subtotal: pSaree.price,
        tax: Math.round(pSaree.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pSaree.price * 1.18),
        shippingAddress: { name: address2.name, phone: address2.phone, streetAddress: address2.streetAddress, city: address2.city, state: address2.state, postalCode: address2.postalCode, country: address2.country },
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-05-24T15:45:00Z')
      },
      // June 2026
      {
        orderNumber: 'ORD-90203',
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        shop: shop3._id,
        items: [{ product: pMadhubani._id, name: pMadhubani.name, quantity: 1, price: pMadhubani.price, image: pMadhubani.images[0] }],
        subtotal: pMadhubani.price,
        tax: Math.round(pMadhubani.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pMadhubani.price * 1.18),
        shippingAddress: { name: address1.name, phone: address1.phone, streetAddress: address1.streetAddress, city: address1.city, state: address1.state, postalCode: address1.postalCode, country: address1.country },
        paymentMethod: 'Online',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-06-08T11:20:00Z')
      },
      {
        orderNumber: 'ORD-90204',
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        shop: shop1._id,
        items: [{ product: pKulhad._id, name: pKulhad.name, quantity: 2, price: pKulhad.price, image: pKulhad.images[0] }],
        subtotal: pKulhad.price * 2,
        tax: Math.round(pKulhad.price * 2 * 0.18),
        shippingFee: 50,
        totalAmount: Math.round(pKulhad.price * 2 * 1.18) + 50,
        shippingAddress: { name: address2.name, phone: address2.phone, streetAddress: address2.streetAddress, city: address2.city, state: address2.state, postalCode: address2.postalCode, country: address2.country },
        paymentMethod: 'COD',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-06-18T14:10:00Z')
      },
      {
        orderNumber: 'ORD-90205',
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        shop: shop4._id,
        items: [{ product: pDhokra._id, name: pDhokra.name, quantity: 1, price: pDhokra.price, image: pDhokra.images[0] }],
        subtotal: pDhokra.price,
        tax: Math.round(pDhokra.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pDhokra.price * 1.18),
        shippingAddress: { name: address1.name, phone: address1.phone, streetAddress: address1.streetAddress, city: address1.city, state: address1.state, postalCode: address1.postalCode, country: address1.country },
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-06-29T09:15:00Z')
      },
      // July 2026
      {
        orderNumber: 'ORD-90206',
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        shop: shop6._id,
        items: [{ product: pKurta._id, name: pKurta.name, quantity: 1, price: pKurta.price, image: pKurta.images[0] }],
        subtotal: pKurta.price,
        tax: Math.round(pKurta.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pKurta.price * 1.18),
        shippingAddress: { name: address1.name, phone: address1.phone, streetAddress: address1.streetAddress, city: address1.city, state: address1.state, postalCode: address1.postalCode, country: address1.country },
        paymentMethod: 'Card',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-07-04T16:30:00Z')
      },
      {
        orderNumber: 'ORD-90207',
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        shop: shop7._id,
        items: [{ product: pTanjore._id, name: pTanjore.name, quantity: 1, price: pTanjore.price, image: pTanjore.images[0] }],
        subtotal: pTanjore.price,
        tax: Math.round(pTanjore.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pTanjore.price * 1.18),
        shippingAddress: { name: address2.name, phone: address2.phone, streetAddress: address2.streetAddress, city: address2.city, state: address2.state, postalCode: address2.postalCode, country: address2.country },
        paymentMethod: 'Online',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-07-15T12:00:00Z')
      },
      {
        orderNumber: 'ORD-90208',
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        shop: shop8._id,
        items: [
          { product: pTote._id, name: pTote.name, quantity: 1, price: pTote.price, image: pTote.images[0] },
          { product: pJhumka._id, name: pJhumka.name, quantity: 1, price: pJhumka.price, image: pJhumka.images[0] }
        ],
        subtotal: pTote.price + pJhumka.price,
        tax: Math.round((pTote.price + pJhumka.price) * 0.18),
        shippingFee: 0,
        totalAmount: Math.round((pTote.price + pJhumka.price) * 1.18),
        shippingAddress: { name: address1.name, phone: address1.phone, streetAddress: address1.streetAddress, city: address1.city, state: address1.state, postalCode: address1.postalCode, country: address1.country },
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-07-28T18:25:00Z')
      },
      // August 2026
      {
        orderNumber: 'ORD-90209',
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        shop: shop1._id,
        items: [{ product: pVase._id, name: pVase.name, quantity: 1, price: pVase.price, image: pVase.images[0] }],
        subtotal: pVase.price,
        tax: Math.round(pVase.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pVase.price * 1.18),
        shippingAddress: { name: address2.name, phone: address2.phone, streetAddress: address2.streetAddress, city: address2.city, state: address2.state, postalCode: address2.postalCode, country: address2.country },
        paymentMethod: 'Online',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-08-03T10:15:00Z')
      },
      {
        orderNumber: 'ORD-90210',
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        shop: shop2._id,
        items: [{ product: pSaree._id, name: pSaree.name, quantity: 1, price: pSaree.price, image: pSaree.images[0] }],
        subtotal: pSaree.price,
        tax: Math.round(pSaree.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pSaree.price * 1.18),
        shippingAddress: { name: address1.name, phone: address1.phone, streetAddress: address1.streetAddress, city: address1.city, state: address1.state, postalCode: address1.postalCode, country: address1.country },
        paymentMethod: 'Card',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-08-14T14:40:00Z')
      },
      {
        orderNumber: 'ORD-90211',
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        shop: shop3._id,
        items: [{ product: pMadhubani._id, name: pMadhubani.name, quantity: 1, price: pMadhubani.price, image: pMadhubani.images[0] }],
        subtotal: pMadhubani.price,
        tax: Math.round(pMadhubani.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pMadhubani.price * 1.18),
        shippingAddress: { name: address2.name, phone: address2.phone, streetAddress: address2.streetAddress, city: address2.city, state: address2.state, postalCode: address2.postalCode, country: address2.country },
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        orderStatus: 'Delivered',
        orderDate: new Date('2026-08-22T17:00:00Z')
      },
      // September 2026
      {
        orderNumber: 'ORD-90212',
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        shop: shop1._id,
        items: [{ product: pKulhad._id, name: pKulhad.name, quantity: 1, price: pKulhad.price, image: pKulhad.images[0] }],
        subtotal: pKulhad.price,
        tax: Math.round(pKulhad.price * 0.18),
        shippingFee: 40,
        totalAmount: Math.round(pKulhad.price * 1.18) + 40,
        shippingAddress: { name: address1.name, phone: address1.phone, streetAddress: address1.streetAddress, city: address1.city, state: address1.state, postalCode: address1.postalCode, country: address1.country },
        paymentMethod: 'COD',
        paymentStatus: 'Paid',
        orderStatus: 'Shipped',
        orderDate: new Date('2026-09-05T08:50:00Z')
      },
      {
        orderNumber: 'ORD-90213',
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        shop: shop2._id,
        items: [{ product: prodMap['Authentic Kanchipuram Mulberry Silk Dupatta']._id, name: 'Authentic Kanchipuram Mulberry Silk Dupatta', quantity: 1, price: 3800, image: prodMap['Authentic Kanchipuram Mulberry Silk Dupatta'].images[0] }],
        subtotal: 3800,
        tax: Math.round(3800 * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(3800 * 1.18),
        shippingAddress: { name: address2.name, phone: address2.phone, streetAddress: address2.streetAddress, city: address2.city, state: address2.state, postalCode: address2.postalCode, country: address2.country },
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        orderStatus: 'Processing',
        orderDate: new Date('2026-09-12T11:10:00Z')
      },
      {
        orderNumber: 'ORD-90214',
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        shop: shop6._id,
        items: [{ product: pKurta._id, name: pKurta.name, quantity: 1, price: pKurta.price, image: pKurta.images[0] }],
        subtotal: pKurta.price,
        tax: Math.round(pKurta.price * 0.18),
        shippingFee: 0,
        totalAmount: Math.round(pKurta.price * 1.18),
        shippingAddress: { name: address1.name, phone: address1.phone, streetAddress: address1.streetAddress, city: address1.city, state: address1.state, postalCode: address1.postalCode, country: address1.country },
        paymentMethod: 'Online',
        paymentStatus: 'Paid',
        orderStatus: 'Confirmed',
        orderDate: new Date('2026-09-16T15:20:00Z')
      }
    ];

    const createdOrders = await Order.insertMany(ordersData);
    console.log(`✅ Seeded ${createdOrders.length} historical orders spanning May-Sept 2026 for analytics & revenue tracking.`);

    const orderMap = {};
    createdOrders.forEach((o) => {
      orderMap[o.orderNumber] = o;
    });

    // 7. SEED PRODUCT REVIEWS
    const reviewsData = [
      {
        product: pVase._id,
        order: orderMap['ORD-90201']._id,
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        customerLocation: customerDemo1.location,
        shop: shop1._id,
        rating: 5,
        comment: 'The Jaipur blue pottery vase arrived in sturdy eco-friendly packaging. The cobalt blue floral craftsmanship is breathtaking!',
        verifiedPurchase: true
      },
      {
        product: pVase._id,
        order: orderMap['ORD-90209']._id,
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        customerLocation: customerDemo2.location,
        shop: shop1._id,
        rating: 4,
        comment: 'Very authentic quartz pottery with rich glaze finish. Looks magnificent in our dining room.',
        verifiedPurchase: true
      },
      {
        product: pKulhad._id,
        order: orderMap['ORD-90204']._id,
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        customerLocation: customerDemo2.location,
        shop: shop1._id,
        rating: 5,
        comment: 'Drinking evening masala chai in these terracotta kulhads takes me straight back to Jaipur. Superb quality.',
        verifiedPurchase: true
      },
      {
        product: prodMap['Hand-Glazed Ceramic Serving Platter']._id,
        order: orderMap['ORD-90201']._id,
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        customerLocation: customerDemo1.location,
        shop: shop1._id,
        rating: 5,
        comment: 'Heavyweight ceramic platter with rich turquoise glaze. Used it for hosting dinner guests and received so many compliments.',
        verifiedPurchase: true
      },
      {
        product: pSaree._id,
        order: orderMap['ORD-90202']._id,
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        customerLocation: customerDemo2.location,
        shop: shop2._id,
        rating: 5,
        comment: 'Exquisite pure Kanjeevaram silk weave! The gold zari border shines brilliantly under wedding lights.',
        verifiedPurchase: true
      },
      {
        product: pSaree._id,
        order: orderMap['ORD-90210']._id,
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        customerLocation: customerDemo1.location,
        shop: shop2._id,
        rating: 5,
        comment: 'Genuine Silk Mark verified saree. Meena Devi and her team of handloom weavers do incredible work.',
        verifiedPurchase: true
      },
      {
        product: pMadhubani._id,
        order: orderMap['ORD-90203']._id,
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        customerLocation: customerDemo1.location,
        shop: shop3._id,
        rating: 5,
        comment: 'Intricate Madhubani line work with natural organic colors. The teak frame completes it beautifully.',
        verifiedPurchase: true
      },
      {
        product: pDhokra._id,
        order: orderMap['ORD-90205']._id,
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        customerLocation: customerDemo1.location,
        shop: shop4._id,
        rating: 5,
        comment: 'Fascinating tribal lost-wax bronze sculpture. Heavy, authentic, and full of historical character.',
        verifiedPurchase: true
      },
      {
        product: pKurta._id,
        order: orderMap['ORD-90206']._id,
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        customerLocation: customerDemo1.location,
        shop: shop6._id,
        rating: 5,
        comment: 'Ultra soft pure cotton with crisp white Chikankari needlework. Perfect fit and breathable fabric.',
        verifiedPurchase: true
      },
      {
        product: pTanjore._id,
        order: orderMap['ORD-90207']._id,
        customer: customerDemo2._id,
        customerName: customerDemo2.name,
        customerLocation: customerDemo2.location,
        shop: shop7._id,
        rating: 5,
        comment: 'A true masterpiece! The 22K gold foil leaf glimmers, and Goddess Saraswati is carved with divine detail.',
        verifiedPurchase: true
      },
      {
        product: pTote._id,
        order: orderMap['ORD-90208']._id,
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        customerLocation: customerDemo1.location,
        shop: shop8._id,
        rating: 5,
        comment: 'Spacious leather tote bag with vibrant Gujarati Kutchi mirrorwork. Premium leather smell and craftsmanship.',
        verifiedPurchase: true
      },
      {
        product: pJhumka._id,
        order: orderMap['ORD-90208']._id,
        customer: customerDemo1._id,
        customerName: customerDemo1.name,
        customerLocation: customerDemo1.location,
        shop: shop8._id,
        rating: 5,
        comment: 'Oxidised sterling silver jhumkas with delicate ringing ghungroos. Lightweight enough for all-day wear.',
        verifiedPurchase: true
      }
    ];

    const createdReviews = await Review.insertMany(reviewsData);
    console.log(`✅ Seeded ${createdReviews.length} product reviews.`);

    // 8. SEED CUSTOM REQUESTS & ARTISAN PROPOSALS
    await CustomRequest.create({
      requestId: 'CR-2001',
      customer: customerDemo1._id,
      customerName: customerDemo1.name,
      shop: shop1._id,
      productRef: 'Custom 16-Piece Jaipur Blue Pottery Dinner Set with Royal Cobalt & Turquoise Motifs',
      description: 'Hand-thrown quartz ceramic dinner set including 4 main dinner plates, 4 side bowls, 4 dessert plates and 4 cups.',
      quantity: 16,
      budget: 14500,
      requiredByDate: new Date(Date.now() + 15 * 86400000),
      proposalPrice: 13800,
      deliveryDays: 14,
      proposalNotes: 'We can craft this set using our heirloom Jaipur quartz glazes. Lead time includes 5 days of kiln firing.',
      proposedAt: new Date(Date.now() - 2 * 86400000),
      status: 'In Progress'
    });

    await CustomRequest.create({
      requestId: 'CR-2002',
      customer: customerDemo1._id,
      customerName: customerDemo1.name,
      shop: shop2._id,
      productRef: 'Handwoven Bridal Kanjeevaram Silk Saree in Crimson & Antique Gold Zari',
      description: 'Custom bridal silk saree with dual-tone crimson silk warp and heavy antique silver-gold zari pallu for wedding ceremony.',
      quantity: 1,
      budget: 25000,
      proposalPrice: 23500,
      deliveryDays: 21,
      proposalNotes: 'We have reserved high-grade mulberry silk yarn. Loom setup will begin as soon as design motif is finalized.',
      proposedAt: new Date(Date.now() - 1 * 86400000),
      status: 'Proposed'
    });

    await CustomRequest.create({
      requestId: 'CR-2003',
      customer: customerDemo2._id,
      customerName: customerDemo2.name,
      shop: shop4._id,
      productRef: 'Custom 3-Foot Lost-Wax Dhokra Bronze Tree of Life Mural',
      description: 'Bronze wall mural depicting tribal dancers under the sacred Banyan tree for corporate lobby decor.',
      quantity: 1,
      budget: 18000,
      requiredByDate: new Date(Date.now() + 30 * 86400000),
      status: 'Pending'
    });

    await CustomRequest.create({
      requestId: 'CR-2004',
      customer: customerDemo2._id,
      customerName: customerDemo2.name,
      shop: shop7._id,
      productRef: 'Framed 24x36 inch Tanjore Ashtalakshmi Gold Leaf Artwork',
      description: 'Custom large format Tanjore painting featuring eight manifestations of Goddess Lakshmi gilded with 22K gold leaf.',
      quantity: 1,
      budget: 35000,
      proposalPrice: 32000,
      deliveryDays: 25,
      proposalNotes: 'Completed artwork encased in high-grade teak frame with protective acrylic glass layer.',
      proposedAt: new Date(Date.now() - 35 * 86400000),
      status: 'Completed'
    });

    console.log('✅ Seeded custom buyer requests & artisan proposals across Pending, Proposed, In Progress, and Completed states.');

    // 9. RECALCULATE & SYNCHRONIZE PRODUCT AND SHOP RATINGS FROM REVIEWS
    console.log('🔄 Recalculating rating averages for all seeded products and shops...');
    for (const prod of createdProducts) {
      await recalculateProductRating(prod._id);
    }
    const allShops = await Shop.find({});
    for (const shp of allShops) {
      await recalculateShopRating(shp._id);
    }
    console.log('✅ Synchronized all product and shop rating averages.');

    console.log('\n==================================================');
    console.log('🎉 FULL DEMO MARKETPLACE DATASET SEEDED SUCCESSFULLY!');
    console.log('==================================================');
    if (!skipConnect && require.main === module) process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding full database:', err);
    if (!skipConnect && require.main === module) process.exit(1);
  }
};

if (require.main === module) {
  seedFullDatabase();
}

module.exports = seedFullDatabase;


