const express = require('express');
const router = express.Router();

const komikController = require('../controllers/komikController');
const {
  validateBuatKomik,
  validateUpdateKomik,
  validateGantiIdKomik,
  validateParamId,
  validateParamSlug
} = require('../validations/komikValidation');

const validate = require('../middlewares/validateRequest');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// ===============================
// 📌 Tambah Komik
// POST /api/komik
// ===============================
router.post(
  '/',
  auth,
  upload.single('cover'),
  validateBuatKomik,
  validate,
  komikController.createKomik
);

// ===============================
// 📌 Ambil Semua Komik
// GET /api/komik
// ===============================
router.get('/', komikController.getAllKomik);

// ===============================
// 📌 Ambil Komik Berdasarkan Slug
// GET /api/komik/slug/:slug
// ===============================
router.get(
  '/slug/:slug',
  validateParamSlug,
  validate,
  komikController.getKomikBySlug
);

// ===============================
// 📌 Ambil Komik Berdasarkan ID
// GET /api/komik/:id
// ===============================
router.get(
  '/:id',
  validateParamId,
  validate,
  komikController.getKomikById
);

// ===============================
// 📌 Update Komik
// PUT /api/komik/:id
// ===============================
router.put(
  '/:id',
  auth,
  upload.single('cover'),
  validateParamId,
  validateUpdateKomik,
  validate,
  komikController.updateKomik
);

// ===============================
// 📌 Ganti Slug/ID Komik
// PATCH /api/komik/ganti-id/:id
// ===============================
router.patch(
  '/ganti-id/:id',
  auth,
  validateGantiIdKomik,
  validate,
  komikController.gantiIdKomik
);

// ===============================
// 📌 Hapus Komik
// DELETE /api/komik/:id
// ===============================
router.delete(
  '/:id',
  auth,
  validateParamId,
  validate,
  komikController.deleteKomik
);

module.exports = router;
