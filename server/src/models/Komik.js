// src/models/komik.js
const mongoose = require('mongoose');
const slugify = require('slugify');

const komikSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  penulis: { type: String, required: true },
  genre: { type: [String], default: [] },
  cover: { type: String },
  slug: { type: String, unique: true, lowercase: true, trim: true },

  // Relasi ke chapter
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
});

// Auto-generate slug jika judul berubah
komikSchema.pre('save', function(next) {
  if (!this.isModified('judul')) return next();
  this.slug = slugify(this.judul, { lower: true, strict: true });
  next();
});

// Cegah OverwriteModelError
module.exports = mongoose.models.Komik || mongoose.model('Komik', komikSchema);
