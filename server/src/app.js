require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const komikRoutes = require('./routes/komikRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Port dan Environment dari .env
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = process.env.MONGO_URI;

// Koneksi ke MongoDB (gunakan URI dari .env)
connectDB(MONGO_URI);

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/auth', authRoutes);

// Logging permintaan
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// Serving file statis dari public
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));
app.use('/covers', express.static(path.join(publicDir, 'covers')));
app.use('/chapter', express.static(path.join(publicDir, 'chapter')));
app.use('/uploads', express.static(path.join(publicDir, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.send('🎉 Server Komik API Berjalan!');
});

app.use('/komik', komikRoutes);
app.use('/chapter', chapterRoutes);

// Handler 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Handler error global
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan server!' });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🖥️ Server aktif di http://localhost:${PORT} (${NODE_ENV})`);
});
