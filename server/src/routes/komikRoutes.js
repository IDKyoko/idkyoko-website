const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Middlewares
const cache = require('../middlewares/cache');
const audit = require('../middlewares/audit');
const validate = require('../middlewares/validateRequest');
const auth = require('../middlewares/auth');
const adminCheck = require('../middlewares/adminCheck');
const { enhanced } = require('../middlewares/upload');

// Validations
const {
  validateBuatKomik,
  validateUpdateKomik,
  validateGantiIdKomik,
  validateParamId,
  validateParamSlug
} = require('../validations/komikValidation');

// Controllers
const komikController = require('../controllers/komikController');

// Debugging
console.log('Fungsi yang tersedia:', Object.keys(komikController));
console.log('.', !!komikController.softDeleteKomik);

// ========================
// RATE LIMITING
// ========================
const limiterConfig = {
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // 100 request per windowMs
  message: 'Terlalu banyak permintaan, silakan coba lagi nanti'
};

const uploadLimiter = rateLimit({
  ...limiterConfig,
  max: 3, // Khusus upload lebih ketat
  message: 'Terlalu banyak upload, coba lagi setelah 15 menit'
});

// ========================
// ROUTES
// ========================

// POST - Buat Komik Baru
router.post(
  '/',
  auth,
  adminCheck, // Hanya admin yang bisa buat komik baru
  uploadLimiter,
  enhanced.singleUpload('cover'), // Gunakan versi enhanced dengan proses gambar
  validateBuatKomik,
  validate,
  audit('CREATE_KOMIK', { collection: 'komik' }),
  komikController.createKomik
);

// GET - Daftar Semua Komik (Publik)
router.get(
  '/',
  cache(300), // Cache 5 menit
  komikController.getAllKomik
);

// GET - Komik by Slug (Publik)
router.get(
  '/slug/:slug',
  cache(300),
  validateParamSlug,
  validate,
  komikController.getKomikBySlug
);

// GET - Komik by ID (Admin Only)
router.get(
  '/admin/:id',
  auth,
  adminCheck,
  validateParamId,
  validate,
  komikController.getKomikById
);

// PUT - Update Komik
router.put(
  '/:id',
  auth,
  adminCheck,
  enhanced.singleUpload('cover'),
  validateParamId,
  validateUpdateKomik,
  validate,
  audit('UPDATE_KOMIK', { collection: 'komik' }),
  komikController.updateKomik
);

// PATCH - Ganti Slug/ID Komik
router.patch(
  '/:id/ganti-id',
  auth,
  adminCheck,
  validateParamId,
  validateGantiIdKomik,
  validate,
  audit('UPDATE_KOMIK_ID', { collection: 'komik' }),
  komikController.getKomikBySlug
);

// DELETE - Soft Delete Komik
router.delete(
  '/:id',
  auth,
  adminCheck,
  validateParamId,
  validate,
  audit('DELETE_KOMIK', { collection: 'komik' }),
  komikController.softDeleteKomik // Pastikan menggunakan soft delete
);

// ========================
// ROUTE TAMBAHAN
// ========================

// GET - Komik Terpopuler
router.get(
  '/popular',
  cache(180), // Cache 3 menit
  komikController.getPopularKomik
);

/// PATCH - Restore Komik yang di-soft delete
router.patch(
  '/:id/restore',
  auth,
  adminCheck,
  validateParamId,
  validate,
  audit('RESTORE_KOMIK', { collection: 'komik' }),
  (req, res, next) => { // Wrapping untuk memastikan
    komikController.restoreKomik(req, res, next);
  } // <-- Tambahkan kurung kurawal tutup
); // <-- Tambahkan kurung tutup untuk router.patch()

module.exports = router;