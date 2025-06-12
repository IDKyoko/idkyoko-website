const express = require('express');
const router = express.Router();

const chapterController = require('../controllers/chapterController');
const { chapterCreateValidation } = require('../validations/chapterValidation');
const validate = require('../middlewares/validateRequest');
const auth = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// POST /api/chapter – Upload chapter baru dengan upload file gambar chapter
router.post(
  '/',
  auth,
  upload.single('chapterImage'),   // <-- gunakan .single('chapterImage')
  chapterCreateValidation,
  validate,
  chapterController.uploadChapter
);

// GET semua chapter (admin panel, dsb)
router.get('/', chapterController.getAllChapters);

// GET /api/chapter/:id – Ambil detail chapter berdasarkan ID
router.get('/:id', chapterController.getChapterById);

// GET /api/chapter/komik/:komikId – Ambil semua chapter dari komik tertentu
router.get('/komik/:komikId', chapterController.getChaptersByKomik);

// PUT /api/chapter/:id – Update chapter (jika Anda izinkan)
router.put('/:id', auth, chapterController.updateChapter);

// DELETE /api/chapter/:id – Hapus chapter
router.delete('/:id', auth, chapterController.deleteChapter);

module.exports = router;
