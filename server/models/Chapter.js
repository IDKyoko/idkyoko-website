const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  judul: {
    type: String,
    required: true
  },
  nomor: {
    type: Number,
    required: true
  },
  komik: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Komik',
    required: true
  },
  gambar: [String] // path ke file gambar
});

module.exports = mongoose.model('Chapter', chapterSchema);
