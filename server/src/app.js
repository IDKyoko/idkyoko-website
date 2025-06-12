require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const komikRoutes = require('./routes/komikRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const authRoutes = require('./routes/authRoutes');
const connectDB = require('./config/db');

const app = express();

// Validasi env vars penting
const requiredEnvs = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
requiredEnvs.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = process.env.MONGO_URI;

// Koneksi ke MongoDB dengan penanganan error
connectDB(MONGO_URI).catch(err => {
  console.error('❌ Gagal koneksi ke MongoDB:', err);
  process.exit(1);
});

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files: gunakan base path '/assets' untuk semua file statis
const publicDir = path.join(__dirname, '../public');
app.use('/assets', express.static(publicDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/komik', komikRoutes);
app.use('/api/chapter', chapterRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('🎉 Server Komik API Berjalan!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan server!' });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🖥️ Server aktif di http://localhost:${PORT} (${NODE_ENV})`);
});

console.log('JWT_SECRET:', process.env.JWT_SECRET);