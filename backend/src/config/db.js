const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace';
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Local MongoDB connection notice (${error.message}). Attempting fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('MongoDB Connected: In-Memory Server running.');

      const seedFullDatabase = require('../utils/seedFullDatabase');
      if (typeof seedFullDatabase === 'function') {
        await seedFullDatabase(true);
      }
    } catch (memError) {
      console.error(`MongoDB Connection Warning: Could not connect to local MongoDB. Ensure MONGO_URI is set in Render environment settings.`);
      if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
        process.exit(1);
      }
    }
  }
};



module.exports = connectDB;
