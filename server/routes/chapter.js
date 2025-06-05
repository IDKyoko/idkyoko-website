const express = require('express');
const router = express.Router();
const Chapter = require('../models/Chapter');
const upload = require('../middlewares/upload');

// Upload chapter baru
router.post('/', upload.array('gambar', 20), async (req, res) => {
  try {
    const { judul, nomor, komik } = req.body;
    const paths = req.files.map(file => `/chapter/${file.filename}`);

    const chapterBaru = new Chapter({
      judul,
      nomor,
      komik,
      gambar: paths
    });

    const saved = await chapterBaru.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Gagal unggah chapter' });
  }
});

module.exports = router;
