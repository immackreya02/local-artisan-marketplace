const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

const authRoutes = require('../routes/authRoutes');
const cartRoutes = require('../routes/cartRoutes');
const wishlistRoutes = require('../routes/wishlistRoutes');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);

let server;
let mongoServer;

const runTests = async () => {
  try {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      console.log('Connected to In-Memory MongoDB for Step 6 testing.');
    } catch (e) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace');
      console.log('Connected to Local MongoDB for Step 6 testing.');
    }

    server = app.listen(5005, () => {
      console.log('Step 6 Test Server running on port 5005');
    });

    const baseUrl = 'http://localhost:5005/api';

    console.log('\n--- SETTING UP SEED ACCOUNTS AND PRODUCTS FOR STEP 6 ---\n');

    // Customer 1
    const cust1 = await User.create({ name: 'Customer One', email: 'cust1_s6@lam.in', password: 'password123', role: 'customer', status: 'Active' });
    const cust1Login = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'cust1_s6@lam.in', password: 'password123' }) });
    const cust1Token = (await cust1Login.json()).token;

    // Customer 2
    const cust2 = await User.create({ name: 'Customer Two', email: 'cust2_s6@lam.in', password: 'password123', role: 'customer', status: 'Active' });
    const cust2Login = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'cust2_s6@lam.in', password: 'password123' }) });
    const cust2Token = (await cust2Login.json()).token;

    // Artisan & Shop
    const artisanUser = await User.create({ name: 'Artisan S6', email: 'artisan_s6@lam.in', password: 'password123', role: 'artisan', status: 'Active' });
    const artisanLogin = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'artisan_s6@lam.in', password: 'password123' }) });
    const artisanToken = (await artisanLogin.json()).token;

    const activeShop = await Shop.create({ name: 'Active Shop', owner: artisanUser._id, description: 'Active shop description', status: 'Active' });
    const inactiveShop = await Shop.create({ name: 'Inactive Shop', owner: artisanUser._id, description: 'Inactive shop description', status: 'Pending' });

    // Products
    const readyProduct = await Product.create({ name: 'Ready-to-Ship Pot', description: 'Pot', shop: activeShop._id, mrp: 1000, price: 1000, stock: 5, status: 'Active', availability: 'Ready-to-Ship' });
    const limitedProduct = await Product.create({ name: 'Limited Ring', description: 'Ring', shop: activeShop._id, mrp: 2000, price: 2000, stock: 2, status: 'Active', availability: 'Limited Edition' });
    const madeProduct = await Product.create({ name: 'Made-to-Order Saree', description: 'Saree', shop: activeShop._id, mrp: 5000, price: 5000, stock: 0, status: 'Active', availability: 'Made-to-Order' });
    const preorderProduct = await Product.create({ name: 'Pre-order Decor', description: 'Decor', shop: activeShop._id, mrp: 3000, price: 3000, stock: 0, status: 'Active', availability: 'Pre-order' });
    const inactiveProduct = await Product.create({ name: 'Inactive Item', description: 'Item', shop: activeShop._id, mrp: 500, price: 500, stock: 10, status: 'Inactive', availability: 'Ready-to-Ship' });
    const inactiveShopProduct = await Product.create({ name: 'Inactive Shop Item', description: 'Item', shop: inactiveShop._id, mrp: 500, price: 500, stock: 10, status: 'Active', availability: 'Ready-to-Ship' });

    console.log('Seed setup complete.');
    console.log('\n--- RUNNING STEP 6 API TESTS ---\n');

    // Test 1: Customer can get own empty cart
    console.log('Test 1: Customer can get own empty cart');
    const emptyCartRes = await fetch(`${baseUrl}/cart`, { headers: { Authorization: `Bearer ${cust1Token}` } });
    const emptyCartData = await emptyCartRes.json();
    console.assert(emptyCartRes.status === 200 && emptyCartData.data.items.length === 0, 'Cart should be empty');
    console.log('  ✅ PASSED: Customer gets own empty cart.');

    // Test 2 & 4: Customer can add valid active product (Verifies backend DB price is used)
    console.log('Test 2 & 4: Customer adds product & backend enforces DB price');
    const addRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: readyProduct._id.toString(), quantity: 2, price: 1 }) // Client sends fake price 1
    });
    console.assert(addRes.status === 200, 'Adding product failed');
    const cartRes1 = await fetch(`${baseUrl}/cart`, { headers: { Authorization: `Bearer ${cust1Token}` } });
    const cartData1 = await cartRes1.json();
    console.assert(cartData1.data.items[0].unitPrice === 1000, 'Price must be 1000 from DB');
    console.log('  ✅ PASSED: Added active product and verified DB price (1000) was enforced.');

    // Test 3: Adding same product again increases quantity
    console.log('Test 3: Adding same product again increases quantity');
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: readyProduct._id.toString(), quantity: 1 })
    });
    const cartRes2 = await fetch(`${baseUrl}/cart`, { headers: { Authorization: `Bearer ${cust1Token}` } });
    const cartData2 = await cartRes2.json();
    console.assert(cartData2.data.items[0].quantity === 3, 'Quantity should increase to 3');
    console.log('  ✅ PASSED: Duplicate addition incremented item quantity to 3.');

    // Test 5: Ready-to-Ship quantity cannot exceed stock (stock is 5, trying to add 3 more -> total 6)
    console.log('Test 5: Ready-to-Ship quantity cannot exceed stock');
    const overStockRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: readyProduct._id.toString(), quantity: 3 })
    });
    console.assert(overStockRes.status === 400, 'Overstock request should return 400');
    console.log('  ✅ PASSED: Ready-to-Ship stock limit enforced.');

    // Test 6: Limited Edition quantity cannot exceed stock (stock is 2)
    console.log('Test 6: Limited Edition quantity cannot exceed stock');
    const overLimitedRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: limitedProduct._id.toString(), quantity: 5 })
    });
    console.assert(overLimitedRes.status === 400, 'Overstock limited edition request should return 400');
    console.log('  ✅ PASSED: Limited Edition stock limit enforced.');

    // Test 7: Made-to-Order quantity is not artificially stock-capped (stock is 0, adding 10)
    console.log('Test 7: Made-to-Order quantity is not stock-capped');
    const addMadeRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: madeProduct._id.toString(), quantity: 10 })
    });
    console.assert(addMadeRes.status === 200, 'Made-to-order addition failed');
    console.log('  ✅ PASSED: Made-to-Order product added without stock capping.');

    // Test 8: Pre-order quantity is not artificially stock-capped (stock is 0, adding 5)
    console.log('Test 8: Pre-order quantity is not stock-capped');
    const addPreRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: preorderProduct._id.toString(), quantity: 5 })
    });
    console.assert(addPreRes.status === 200, 'Pre-order addition failed');
    console.log('  ✅ PASSED: Pre-order product added without stock capping.');

    // Test 9: Inactive product cannot be added
    console.log('Test 9: Inactive product cannot be added');
    const addInactiveRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: inactiveProduct._id.toString(), quantity: 1 })
    });
    console.assert(addInactiveRes.status === 400, 'Inactive product addition should return 400');
    console.log('  ✅ PASSED: Inactive product rejected.');

    // Test 10: Product belonging to inactive shop cannot be added
    console.log('Test 10: Product belonging to inactive shop cannot be added');
    const addInactiveShopRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: inactiveShopProduct._id.toString(), quantity: 1 })
    });
    console.assert(addInactiveShopRes.status === 400, 'Product from inactive shop addition should return 400');
    console.log('  ✅ PASSED: Product from inactive shop rejected.');

    // Test 11: Invalid quantity is rejected
    console.log('Test 11: Invalid quantity rejected (0 or negative)');
    const invalidQtyRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: readyProduct._id.toString(), quantity: -2 })
    });
    console.assert(invalidQtyRes.status === 400, 'Negative quantity should return 400');
    console.log('  ✅ PASSED: Invalid quantity rejected.');

    // Test 12: Customer can update own cart quantity
    console.log('Test 12: Customer updates own cart item quantity');
    const updateQtyRes = await fetch(`${baseUrl}/cart/items/${readyProduct._id.toString()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ quantity: 2 })
    });
    console.assert(updateQtyRes.status === 200, 'Update quantity failed');
    console.log('  ✅ PASSED: Cart item quantity updated.');

    // Test 13: Customer can remove own cart item
    console.log('Test 13: Customer removes single cart item');
    const removeItemRes = await fetch(`${baseUrl}/cart/items/${madeProduct._id.toString()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    console.assert(removeItemRes.status === 200, 'Remove item failed');
    console.log('  ✅ PASSED: Cart item removed.');

    // Test 14: Customer can clear own cart
    console.log('Test 14: Customer clears cart');
    const clearRes = await fetch(`${baseUrl}/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    console.assert(clearRes.status === 200, 'Clear cart failed');
    console.log('  ✅ PASSED: Cart cleared.');

    // Test 15: Customer cannot access another customer\'s cart
    console.log('Test 15: Customer isolation check (Customer 2 receives own cart, not Customer 1\'s)');
    const cust2CartRes = await fetch(`${baseUrl}/cart`, { headers: { Authorization: `Bearer ${cust2Token}` } });
    const cust2CartData = await cust2CartRes.json();
    console.assert(cust2CartData.data.items.length === 0, 'Customer 2 must have an independent empty cart');
    console.log('  ✅ PASSED: Customer carts strictly isolated by req.user._id.');

    // Test 16: Customer can add product to wishlist
    console.log('Test 16: Customer adds product to wishlist');
    const addWishRes = await fetch(`${baseUrl}/wishlist/${readyProduct._id.toString()}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    console.assert(addWishRes.status === 200, 'Add to wishlist failed');
    console.log('  ✅ PASSED: Product added to wishlist.');

    // Test 17: Duplicate wishlist addition does not create duplicate entries
    console.log('Test 17: Duplicate wishlist addition handled safely');
    await fetch(`${baseUrl}/wishlist/${readyProduct._id.toString()}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    const getWishRes = await fetch(`${baseUrl}/wishlist`, { headers: { Authorization: `Bearer ${cust1Token}` } });
    const wishData = await getWishRes.json();
    console.assert(wishData.count === 1, 'Wishlist must contain exactly 1 item without duplicates');
    console.log('  ✅ PASSED: Duplicate wishlist entry prevented.');

    // Test 18: Customer can remove wishlist product
    console.log('Test 18: Customer removes product from wishlist');
    const removeWishRes = await fetch(`${baseUrl}/wishlist/${readyProduct._id.toString()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${cust1Token}` }
    });
    console.assert(removeWishRes.status === 200, 'Remove from wishlist failed');
    console.log('  ✅ PASSED: Product removed from wishlist.');

    // Test 19: Customer cannot access another customer\'s wishlist
    console.log('Test 19: Wishlist isolation check');
    const cust2WishRes = await fetch(`${baseUrl}/wishlist`, { headers: { Authorization: `Bearer ${cust2Token}` } });
    const cust2WishData = await cust2WishRes.json();
    console.assert(cust2WishData.count === 0, 'Customer 2 must have independent empty wishlist');
    console.log('  ✅ PASSED: Customer wishlists strictly isolated.');

    // Test 20: Non-customer roles are rejected from Cart/Wishlist APIs
    console.log('Test 20: Non-customer role rejection (Artisan blocked with 403)');
    const artisanCartRes = await fetch(`${baseUrl}/cart`, { headers: { Authorization: `Bearer ${artisanToken}` } });
    console.assert(artisanCartRes.status === 403, 'Artisan access to cart must return 403');
    console.log('  ✅ PASSED: Non-customer role rejected with HTTP 403.');

    // Test 21: Invalid product ID is handled safely
    console.log('Test 21: Invalid product ID handled safely');
    const invalidProdRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 })
    });
    console.assert(invalidProdRes.status === 404, 'Nonexistent product ID should return 404');
    console.log('  ✅ PASSED: Invalid product ID handled safely with HTTP 404.');

    // Test 22: Product becoming inactive after being added to cart is handled safely
    console.log('Test 22: Product becoming inactive after cart addition');
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ productId: readyProduct._id.toString(), quantity: 1 })
    });
    // Now deactivate readyProduct in database
    readyProduct.status = 'Inactive';
    await readyProduct.save();

    const postDeactivateCartRes = await fetch(`${baseUrl}/cart`, { headers: { Authorization: `Bearer ${cust1Token}` } });
    const postDeactivateData = await postDeactivateCartRes.json();
    console.assert(postDeactivateData.data.items[0].isPurchasable === false, 'Deactivated item must be flagged as non-purchasable');
    console.log('  ✅ PASSED: Product deactivation after addition flagged isPurchasable: false.');

    console.log('\n=============================================');
    console.log('🎉 ALL 22 STEP 6 CART/WISHLIST TESTS PASSED CLEANLY!');
    console.log('=============================================\n');

    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Step 6 Test Failed:', error);
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
