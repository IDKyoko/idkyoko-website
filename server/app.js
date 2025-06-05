// ======================
// 📦 IMPORT PACKAGE
// ======================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const komikRoutes = require('./routes/komikRoutes'); // Router komik
const chapterRoutes = require('./routes/chapter');    // Router chapter (upload chapter)
const app = express();
const PORT = 3001;

// ======================
// 🛠️ MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder agar file upload dapat diakses lewat URL
app.use('/covers', express.static(path.join(__dirname, '../public/covers')));
app.use('/chapter', express.static(path.join(__dirname, '../public/chapter')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ======================
// 🗃️ KONEKSI DATABASE
// ======================
mongoose.connect('mongodb://localhost:27017/komik_db')
  .then(() => console.log('✅ Terhubung ke MongoDB'))
  .catch(err => console.error('❌ Gagal konek MongoDB:', err));

// ======================
// 🚪 ROUTES
// ======================
app.get('/', (req, res) => {
  res.send('🎉 Server Komik API Berjalan!');
});

app.use('/komik', komikRoutes);    // Router komik
app.use('/chapter', chapterRoutes); // Router chapter

// ======================
// 🚨 ERROR HANDLING
// ======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan server!' });
});

// ======================
// 🚀 JALANKAN SERVER
// ======================
app.listen(PORT, () => {
  console.log(`🖥️ Server aktif di http://localhost:${PORT}`);
});
