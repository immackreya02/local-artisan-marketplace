import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { OrdersProvider } from './context/OrdersContext'
import { ProductsProvider } from './context/ProductsContext'
import { ShopsProvider } from './context/ShopsContext'
import { CustomRequestsProvider } from './context/CustomRequestsContext'
import { ReviewsProvider } from './context/ReviewsContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public
import Home from './pages/public/Home'
import Marketplace from './pages/public/Marketplace'
import Shops from './pages/public/Shops'
import Categories from './pages/public/Categories'
import ShopPage from './pages/public/ShopPage'
import ProductDetail from './pages/public/ProductDetail'
import Login from './pages/public/Login'
import Register from './pages/public/Register'

// Customer
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerOrders from './pages/customer/Orders'
import CustomerOrderDetail from './pages/customer/OrderDetail'
import Wishlist from './pages/customer/Wishlist'
import Addresses from './pages/customer/Addresses'
import Profile from './pages/customer/Profile'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import OrderConfirmation from './pages/customer/OrderConfirmation'
import CustomerCustomRequests from './pages/customer/CustomRequests'
import CustomRequestForm from './pages/customer/CustomRequestForm'
import CustomerCustomRequestDetail from './pages/customer/CustomRequestDetail'

// Artisan
import ArtisanDashboard from './pages/artisan/Dashboard'
import ArtisanShop from './pages/artisan/Shop'
import ArtisanProducts from './pages/artisan/Products'
import ProductForm from './pages/artisan/ProductForm'
import ArtisanOrders from './pages/artisan/Orders'
import ArtisanOrderDetail from './pages/artisan/OrderDetail'
import ArtisanAnalytics from './pages/artisan/Analytics'
import ArtisanReports from './pages/artisan/Reports'
import ArtisanCustomRequests from './pages/artisan/CustomRequests'
import ArtisanCustomRequestDetail from './pages/artisan/CustomRequestDetail'
import ArtisanSettings from './pages/artisan/Settings'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminArtisans from './pages/admin/Artisans'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminOrderDetail from './pages/admin/OrderDetail'
import AdminCategories from './pages/admin/Categories'
import AdminReports from './pages/admin/Reports'
import AdminSettings from './pages/admin/Settings'

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <OrdersProvider>
              <ProductsProvider>
                <ShopsProvider>
                  <CustomRequestsProvider>
                  <ReviewsProvider>
                  <BrowserRouter>
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={<Home />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/shops" element={<Shops />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/shop/:shopId" element={<ShopPage />} />
                    <Route path="/product/:productId" element={<ProductDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Cart is guest-accessible; checkout requires login (enforced inside the page) */}
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />

                    {/* Customer */}
                    <Route path="/customer/dashboard" element={<ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>} />
                    <Route path="/customer/orders" element={<ProtectedRoute role="customer"><CustomerOrders /></ProtectedRoute>} />
                    <Route path="/customer/orders/:orderId" element={<ProtectedRoute role="customer"><CustomerOrderDetail /></ProtectedRoute>} />
                    <Route path="/customer/wishlist" element={<ProtectedRoute role="customer"><Wishlist /></ProtectedRoute>} />
                    <Route path="/customer/addresses" element={<ProtectedRoute role="customer"><Addresses /></ProtectedRoute>} />
                    <Route path="/customer/profile" element={<ProtectedRoute role="customer"><Profile /></ProtectedRoute>} />
                    <Route path="/customer/custom-requests" element={<ProtectedRoute role="customer"><CustomerCustomRequests /></ProtectedRoute>} />
                    <Route path="/customer/custom-requests/new" element={<ProtectedRoute role="customer"><CustomRequestForm /></ProtectedRoute>} />
                    <Route path="/customer/custom-requests/:requestId" element={<ProtectedRoute role="customer"><CustomerCustomRequestDetail /></ProtectedRoute>} />

                    {/* Artisan */}
                    <Route path="/artisan/dashboard" element={<ProtectedRoute role="artisan"><ArtisanDashboard /></ProtectedRoute>} />
                    <Route path="/artisan/shop" element={<ProtectedRoute role="artisan"><ArtisanShop /></ProtectedRoute>} />
                    <Route path="/artisan/products" element={<ProtectedRoute role="artisan"><ArtisanProducts /></ProtectedRoute>} />
                    <Route path="/artisan/products/new" element={<ProtectedRoute role="artisan"><ProductForm /></ProtectedRoute>} />
                    <Route path="/artisan/products/:productId/edit" element={<ProtectedRoute role="artisan"><ProductForm /></ProtectedRoute>} />
                    <Route path="/artisan/orders" element={<ProtectedRoute role="artisan"><ArtisanOrders /></ProtectedRoute>} />
                    <Route path="/artisan/orders/:orderId" element={<ProtectedRoute role="artisan"><ArtisanOrderDetail /></ProtectedRoute>} />
                    <Route path="/artisan/analytics" element={<ProtectedRoute role="artisan"><ArtisanAnalytics /></ProtectedRoute>} />
                    <Route path="/artisan/reports" element={<ProtectedRoute role="artisan"><ArtisanReports /></ProtectedRoute>} />
                    <Route path="/artisan/custom-requests" element={<ProtectedRoute role="artisan"><ArtisanCustomRequests /></ProtectedRoute>} />
                    <Route path="/artisan/custom-requests/:requestId" element={<ProtectedRoute role="artisan"><ArtisanCustomRequestDetail /></ProtectedRoute>} />
                    <Route path="/artisan/settings" element={<ProtectedRoute role="artisan"><ArtisanSettings /></ProtectedRoute>} />

                    {/* Admin */}
                    <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
                    <Route path="/admin/artisans" element={<ProtectedRoute role="admin"><AdminArtisans /></ProtectedRoute>} />
                    <Route path="/admin/products" element={<ProtectedRoute role="admin"><AdminProducts /></ProtectedRoute>} />
                    <Route path="/admin/orders" element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} />
                    <Route path="/admin/orders/:orderId" element={<ProtectedRoute role="admin"><AdminOrderDetail /></ProtectedRoute>} />
                    <Route path="/admin/categories" element={<ProtectedRoute role="admin"><AdminCategories /></ProtectedRoute>} />
                    <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />

                    <Route path="*" element={<Home />} />
                  </Routes>
                  </BrowserRouter>
                  </ReviewsProvider>
                  </CustomRequestsProvider>
                </ShopsProvider>
              </ProductsProvider>
            </OrdersProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
