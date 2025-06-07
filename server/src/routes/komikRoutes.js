const express = require('express');
const router = express.Router();

const upload = require('../middlewares/upload');
const komikController = require('../controllers/komikController');
const { validateBuatKomik, validateGantiIdKomik } = require('../validations/komikValidation');
const { validationResult } = require('express-validator');

// Middleware upload cover komik dengan error handling
function uploadCoverMiddleware(req, res, next) {
  upload.single('cover')(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

// Middleware validasi hasil express-validator
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// GET semua komik dengan pagination & filter genre
router.get('/', komikController.getAllKomik);

// GET pencarian komik berdasarkan query q
router.get('/search', komikController.searchKomik);

// GET komik berdasarkan slug (termasuk populate chapters)
router.get('/slug/:slug', komikController.getKomikBySlug);

// GET komik berdasarkan ID (termasuk populate chapters)
router.get('/:id', komikController.getKomikById);

// POST buat komik baru dengan upload cover dan validasi input
router.post(
  '/',
  uploadCoverMiddleware,
  validateBuatKomik,
  handleValidationErrors,
  komikController.createKomik
);

// PATCH ganti ID komik dengan validasi input
router.patch(
  '/:id/ganti-id',
  validateGantiIdKomik,
  handleValidationErrors,
  komikController.gantiIdKomik
);

// DELETE komik berdasarkan ID
router.delete('/:id', komikController.deleteKomik);

module.exports = router;
