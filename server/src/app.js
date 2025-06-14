// Naikkan batas listener ke 20 agar tidak muncul warning
require('events').EventEmitter.defaultMaxListeners = 20;

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose'); // Tambahkan ini
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const xss = require('xss');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const komikRoutes = require('./routes/komikRoutes');
const chapterRoutes = require('./routes/chapterRoutes');
const authRoutes = require('./routes/authRoutes');
const connectDB = require('./config/db');

const app = express();

// ========================
// 1. Validasi Environment Variables
// ========================
const requiredEnvs = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
requiredEnvs.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
});

// ========================
// 2. Konfigurasi Utama
// ========================
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = process.env.MONGO_URI;

// ========================
// 3. Koneksi Database
// ========================
connectDB(MONGO_URI).catch(err => {
  console.error('❌ Gagal koneksi ke MongoDB:', err);
  process.exit(1);
});

// ========================
// 4. Middleware
// ========================
// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Terlalu banyak request dari IP ini'
});

// XSS Sanitizer
const sanitizeInput = (obj) => {
  if (!obj) return;
  const skipFields = ['htmlContent'];
  
  for (const key in obj) {
    if (skipFields.includes(key)) continue;
    
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key], {
        whiteList: { b: [], i: [], em: [] },
        stripIgnoreTag: true
      });
    } else if (typeof obj[key] === 'object') {
      sanitizeInput(obj[key]);
    }
  }
};

// ========================
// 5. Middleware Pipeline
// ========================
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet());
app.use(mongoSanitize());
app.use((req, res, next) => {
  sanitizeInput(req.body);
  sanitizeInput(req.query);
  next();
});
app.use('/api/', limiter);

// ========================
// 6. Static Files
// ========================
const publicDir = path.join(__dirname, '../public');
app.use('/covers', express.static(path.join(publicDir, 'covers')));
app.use('/chapter', express.static(path.join(publicDir, 'chapter')));
app.use('/assets', express.static(publicDir));

// ========================
// 7. Routes
// ========================
app.use('/api/auth', authRoutes);
app.use('/api/komik', komikRoutes);
app.use('/api/chapter', chapterRoutes);

// ========================
// 8. Special Endpoints
// ========================
app.get('/', (req, res) => {
  res.send('🎉 Server Komik API Berjalan!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// ========================
// 9. Error Handling
// ========================
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint tidak ditemukan' 
  });
});

app.use((err, req, res, next) => {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[${new Date().toISOString()}] ${status} ${req.method} ${req.path}`, {
    error: err.message,
    stack: isProduction ? undefined : err.stack
  });

  res.status(status).json({
    success: false,
    error: isProduction && status === 500 ? 'Terjadi kesalahan server' : err.message,
    ...(!isProduction && { 
      stack: err.stack,
      details: err.errors 
    })
  });
});

// ========================
// 10. Server Startup
// ========================
app.listen(PORT, () => {
  console.log(`🖥️ Server aktif di http://localhost:${PORT} (${NODE_ENV})`);
  console.log('🔒 JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'Tidak ada!');
});