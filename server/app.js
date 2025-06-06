// ======================
// 📦 IMPORT PACKAGE
// ======================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const komikRoutes = require('./routes/komikRoutes');
const chapterRoutes = require('./routes/chapter');

const app = express();
const PORT = process.env.PORT || 3001;

// ======================
// 🛠️ MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging setiap request (opsional tapi sangat membantu saat debugging)
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Static file
app.use('/covers', express.static(path.join(__dirname, '../public/covers')));
app.use('/chapter', express.static(path.join(__dirname, '../public/chapter')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ======================
// 🗃️ KONEKSI DATABASE
// ======================
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/komik_db')
  .then(() => console.log('✅ Terhubung ke MongoDB'))
  .catch(err => console.error('❌ Gagal konek MongoDB:', err));

// ======================
// 🚪 ROUTES
// ======================
app.get('/', (req, res) => {
  res.send('🎉 Server Komik API Berjalan!');
});

app.use('/komik', komikRoutes);
app.use('/chapter', chapterRoutes);

// ======================
// ❌ 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ======================
// 🚨 GLOBAL ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan server!' });
});

// ======================
// 🚀 JALANKAN SERVER
// ======================
app.listen(PORT, () => {
  console.log(`🖥️ Server aktif di http://localhost:${PORT}`);
});
