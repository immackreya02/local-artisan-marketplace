const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/local_artisan_marketplace';
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`📌 MongoDB Compass Connection URI: ${mongoUri}`);
  } catch (error) {
    console.log(`Local MongoDB notice (${error.message}). Starting In-Memory MongoDB Server...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log('MongoDB Connected: In-Memory MongoDB Server running.');
      console.log(`📌 MongoDB Compass Connection URI: ${mongoUri}`);

      const seedFullDatabase = require('../utils/seedFullDatabase');
      if (typeof seedFullDatabase === 'function') {
        await seedFullDatabase(true);
      }

    } catch (memError) {
      console.error(`MongoDB Connection Error: ${memError.message}`);
      process.exit(1);
    }
  }
};



module.exports = connectDB;
