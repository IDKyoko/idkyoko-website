const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const Komik = require('../models/Komik');
const upload = require('../middlewares/upload');
const fs = require('fs');
const path = require('path');

// GET komik by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const komik = await Komik.findOne({ slug: req.params.slug });
    if (!komik) {
      return res.status(404).json({ error: 'Komik tidak ditemukan' });
    }
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
    res.status(500).json({ error: 'Error server' });
  }
});

// POST komik baru dengan upload cover
router.post('/', upload.single('cover'), async (req, res) => {
  try {
    const { judul, penulis, genre } = req.body;
    const coverPath = req.file ? `/covers/${req.file.filename}` : null;

    const slug = slugify(judul, { lower: true, strict: true });

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

    if (!newId) {
      return res.status(400).json({ error: 'Field newId wajib diisi' });
    }

    const oldKomik = await Komik.findById(oldId);
    if (!oldKomik) {
      return res.status(404).json({ error: 'Komik lama tidak ditemukan' });
    }

    const exists = await Komik.findById(newId);
    if (exists) {
      return res.status(400).json({ error: 'newId sudah digunakan' });
    }

    const newKomik = new Komik({
      _id: newId,
      judul: oldKomik.judul,
      penulis: oldKomik.penulis,
      genre: oldKomik.genre,
      cover: oldKomik.cover,
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

    // Hapus file cover jika ada
    if (komik.cover) {
      const filePath = path.join(__dirname, '../../public', komik.cover);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Gagal hapus file cover:', err);
      });
    }

    res.json({ message: 'Komik berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
