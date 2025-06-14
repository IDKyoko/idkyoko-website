const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const chapterController = require('../controllers/chapterController');
const { chapterCreateValidation } = require('../validations/chapterValidation');
const validate = require('../middlewares/validateRequest');
const auth = require('../middlewares/auth');
const adminCheck = require('../middlewares/adminCheck');
const cache = require('../middlewares/cache');
const fs = require('fs');


// 1. Setup Folder Upload
const uploadDir = path.join(__dirname, '../../public/chapter');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. File Filter Configuration
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file JPEG, PNG, atau WebP yang diperbolehkan'), false);
  }
};

// 3. Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chapter-${Date.now()}${ext}`);
  }
});

// 4. Initialize Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 10MB
  }
});

// 5. Rate Limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Terlalu banyak percobaan upload, silakan coba lagi setelah 15 menit'
});

// 6. Routes
router.post(
  '/',
  auth,
  uploadLimiter,
  upload.single('chapterImage'),
  (err, req, res, next) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err instanceof multer.MulterError
          ? err.code === 'LIMIT_FILE_SIZE'
            ? 'Ukuran file terlalu besar (maksimal 50MB)'
            : 'Error upload file'
          : err.message
      });
    }
    next();
  },
  chapterCreateValidation,
  validate,
  chapterController.uploadChapter
);

// GET /api/chapter – Ambil semua chapter (dengan paginasi + cache)
router.get(
  '/',
  auth,
  adminCheck, // Hanya admin yang bisa akses
  cache(300), // Cache 5 menit
  chapterController.getAllChapters
);

// GET /api/chapter/:id – Detail chapter (public + cache)
router.get(
  '/:id',
  cache(180), // Cache 3 menit
  chapterController.getChapterById
);

// GET /api/chapter/komik/:komikId – Chapter by komik ID (public + cache)
router.get(
  '/komik/:komikId',
  cache(180),
  chapterController.getChaptersByKomik
);

// PUT /api/chapter/:id – Update chapter (protected + audit log)
router.put(
  '/:id',
  auth,
  chapterController.logChapterAction, // Middleware audit log
  chapterController.updateChapter
);

// DELETE /api/chapter/:id – Soft delete chapter (protected)
router.delete(
  '/:id',
  auth,
  chapterController.logChapterAction,
  chapterController.softDeleteChapter // Ubah jadi soft delete
);

// PUT /api/chapter/:id/restore
router.put(
  '/:id/restore',
  auth,
  adminCheck,
  chapterController.restoreChapter
);

module.exports = router;