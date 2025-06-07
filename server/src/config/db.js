const mongoose = require('mongoose');

const connectDB = async (mongoUri) => {
  const uri = mongoUri || process.env.MONGO_URI || 'mongodb://localhost:27017/komikdb';

  try {
    await mongoose.connect(uri);
    console.log('✅ Terkoneksi ke MongoDB');
  } catch (err) {
    console.error('❌ Gagal koneksi MongoDB:', err.message);
    process.exit(1); // Keluar dari proses jika koneksi gagal
  }
};

module.exports = connectDB;
