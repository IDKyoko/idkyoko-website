const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middlewares/auth');
const chapterController = require('../controllers/chapterController');
const { body, validationResult } = require('express-validator');

// Setup penyimpanan untuk upload gambar chapter
const storageChapter = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/chapter');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.toLowerCase().replace(/[^a-z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});

// Filter hanya izinkan file gambar
function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) cb(null, true);
  else cb(new Error('File harus berupa gambar dengan format jpeg, jpg, png, atau gif'));
}

const uploadChapter = multer({
  storage: storageChapter,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // Maksimum 50MB per file
});

// Middleware validasi input
const validateUpload = [
  body('judul').notEmpty().withMessage('Judul wajib diisi'),
  body('nomor').isInt({ min: 1 }).withMessage('Nomor chapter harus berupa angka >= 1'),
  body('komikId').notEmpty().withMessage('komikId wajib diisi'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// Routes chapter
router.get('/', chapterController.getAllChapters);
router.get('/komik/:komikId', chapterController.getChaptersByKomik);
router.get('/:id', chapterController.getChapterById);

router.post(
  '/upload-chapter',
  auth,
  uploadChapter.array('gambar', 20),
  validateUpload,
  chapterController.uploadChapter
);

router.patch(
  '/:id',
  auth,
  uploadChapter.array('gambar', 20),
  chapterController.updateChapter
);

router.delete('/:id', auth, chapterController.deleteChapter);

module.exports = router;
