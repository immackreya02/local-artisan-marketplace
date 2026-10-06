const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace');
    console.log('MongoDB Connected for Seeding...');

    const adminEmail = 'admin@lam.in';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`ℹ️ Admin user already exists (${adminEmail}). Skipping seed.`);
      process.exit(0);
    }

    const adminUser = await User.create({
      name: 'Rohan Deshmukh (Admin)',
      email: adminEmail,
      password: 'ArtisanAdmin#2026!', // Will be hashed automatically by userSchema.pre('save')
      role: 'admin',
      status: 'Active',
      location: 'Pune',
      phone: '+91 90000 00001'
    });

    console.log(`✅ Admin user seeded successfully!`);
    console.log(`Email: ${adminUser.email} | Role: ${adminUser.role} | Status: ${adminUser.status}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
