// src/models/chapter.js
const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  // Relasi ke komik induk
  komik: { type: mongoose.Schema.Types.ObjectId, ref: 'Komik', required: true },

  judul: { type: String, required: true },
  nomor: { type: Number, required: true },

  // Daftar path gambar
  halaman: { type: [String], default: [] },

  tanggalTerbit: { type: Date, default: Date.now },
});

// Cegah OverwriteModelError saat reload
module.exports = mongoose.models.Chapter || mongoose.model('Chapter', chapterSchema);
