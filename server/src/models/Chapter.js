const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  // Note: Field ini mengacu ke Komik yang memiliki chapter ini
  komik: { type: mongoose.Schema.Types.ObjectId, ref: 'Komik', required: true },

  judul: { type: String, required: true },
  nomor: { type: Number, required: true },

  // Array path gambar halaman chapter
  halaman: { type: [String], default: [] },

  tanggalTerbit: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chapter', chapterSchema);
