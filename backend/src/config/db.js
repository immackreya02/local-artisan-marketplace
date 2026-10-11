const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB Connection Error with provided MONGO_URI: ${error.message}`);
    }
  }

  // Fallback for local development if MONGO_URI is not set
  console.log(`MONGO_URI not provided or failed. Attempting local MongoDB / Memory Server fallback...`);
  try {
    const localUri = 'mongodb://127.0.0.1:27017/local_artisan_marketplace';
    const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`Connected to local MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Local MongoDB unavailable (${error.message}). Attempting MongoMemoryServer...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log('MongoDB Connected: In-Memory Server running.');

      const seedFullDatabase = require('../utils/seedFullDatabase');
      if (typeof seedFullDatabase === 'function') {
        await seedFullDatabase(true);
      }
    } catch (memError) {
      console.error(`\n=============================================================`);
      console.error(`ERROR: Database connection failed on host server!`);
      console.error(`Please set the MONGO_URI environment variable in your Render Dashboard settings.`);
      console.error(`Example: mongodb+srv://<user>:<password>@cluster.mongodb.net/artisan_db`);
      console.error(`=============================================================\n`);
    }
  }
};

module.exports = connectDB;
