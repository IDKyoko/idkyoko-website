const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const Komik = require('../models/Komik');
const upload = require('../middlewares/upload');
const fs = require('fs');
const path = require('path');

// Middleware upload dengan penanganan error multer
function uploadCoverMiddleware(req, res, next) {
  upload.single('cover')(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

// Fungsi bantu generate slug unik
async function generateUniqueSlug(judul) {
  let baseSlug = slugify(judul, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;
  while (await Komik.findOne({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }
  return slug;
}

// GET semua komik
router.get('/', async (req, res) => {
  try {
    const komiks = await Komik.find();
    res.json(komiks);
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET komik berdasarkan pencarian judul
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q wajib diisi' });

    const regex = new RegExp(q, 'i');
    const results = await Komik.find({ judul: regex });
    res.json(results);
  } catch (error) {
    console.error('Error searching komik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET komik by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const komik = await Komik.findOne({ slug: req.params.slug });
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    res.json(komik);
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET komik by ID
router.get('/:id', async (req, res) => {
  try {
    const komik = await Komik.findById(req.params.id);
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    res.json(komik);
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// POST komik baru
router.post('/', uploadCoverMiddleware, async (req, res) => {
  try {
    const { judul, penulis, genre, type } = req.body;
    if (!judul || !penulis) return res.status(400).json({ error: 'Field judul dan penulis wajib diisi' });
    if (type !== 'covers') return res.status(400).json({ error: 'Field type harus diisi dengan "covers"' });

    const slug = await generateUniqueSlug(judul);
    const coverPath = req.file ? `/covers/${req.file.filename}` : null;

    const komikBaru = new Komik({
      judul,
      penulis,
      genre: genre ? genre.split(',') : [],
      cover: coverPath,
      slug
    });

    const savedKomik = await komikBaru.save();
    res.status(201).json(savedKomik);
  } catch (error) {
    console.error('Error in POST /komik:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// PATCH ganti _id komik
router.patch('/:id/change-id', async (req, res) => {
  try {
    const oldId = req.params.id;
    const { newId } = req.body;

    if (!newId) return res.status(400).json({ error: 'Field newId wajib diisi' });

    const oldKomik = await Komik.findById(oldId);
    if (!oldKomik) return res.status(404).json({ error: 'Komik lama tidak ditemukan' });

    const exists = await Komik.findById(newId);
    if (exists) return res.status(400).json({ error: 'newId sudah digunakan' });

    const newKomik = new Komik({
      _id: newId,
      judul: oldKomik.judul,
      penulis: oldKomik.penulis,
      genre: oldKomik.genre,
      cover: oldKomik.cover,
      slug: oldKomik.slug
    });

    await newKomik.save();
    await Komik.findByIdAndDelete(oldId);

    res.json({ message: 'ID komik berhasil diganti', newKomik });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// DELETE komik by ID
router.delete('/:id', async (req, res) => {
  try {
    const komik = await Komik.findByIdAndDelete(req.params.id);
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    if (komik.cover) {
      const filePath = path.join(__dirname, '../..', 'public', komik.cover);
      fs.unlink(filePath, err => {
        if (err) console.error('Gagal hapus file cover:', err);
      });
    }

    res.json({ message: 'Komik berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
