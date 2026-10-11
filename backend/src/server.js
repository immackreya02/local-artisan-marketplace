const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const shopRoutes = require('./routes/shopRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const customRequestRoutes = require('./routes/customRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminAnalyticsRoutes = require('./routes/adminAnalyticsRoutes');
const artisanAnalyticsRoutes = require('./routes/artisanAnalyticsRoutes');

// Load environment variables from backend root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
connectDB();

const app = express();

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/admin', adminRoutes);

// Analytics & Reports Routes
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/reports', adminAnalyticsRoutes);
app.use('/api/artisan/analytics', artisanAnalyticsRoutes);
app.use('/api/artisan/reports', artisanAnalyticsRoutes);

// Health-check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Local Artisan Marketplace API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve integrated frontend static production build
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Serve React Web App for all non-API routes (Integrated Single-Port Application)
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API Route Not Found - ${req.originalUrl}`
    });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).json({
        message: 'Welcome to the Local Artisan Marketplace API'
      });
    }
  });
});


// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});
