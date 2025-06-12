const express = require('express');
const router = express.Router();

const komikController = require('../controllers/komikController');
const { validateBuatKomik, validateGantiIdKomik } = require('../validations/komikValidation');
const validate = require('../middlewares/validateRequest');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// POST /api/komik – Tambah komik dengan upload cover
router.post(
  '/',
  auth,
  upload.single('coverImage'),     // <-- gunakan .single() dengan nama field upload
  validateBuatKomik,
  validate,
  komikController.createKomik
);

// GET semua komik
router.get('/', komikController.getAllKomik);

// PUT /api/komik/:id – Update komik dengan upload cover (jika ada)
router.put(
  '/:id',
  auth,
  upload.single('coverImage'),     // <-- jika update juga upload cover baru
  komikController.updateKomik
);

// PATCH /api/komik/ganti-id/:id – Ganti ID unik/slug komik
router.patch(
  '/ganti-id/:id',
  auth,
  validateGantiIdKomik,
  validate,
  komikController.gantiIdKomik
);

// DELETE /api/komik/:id – Hapus komik
router.delete('/:id', auth, komikController.deleteKomik);

// GET /api/komik/:id – Ambil komik berdasarkan ID
router.get('/:id', komikController.getKomikById);
module.exports = router;
