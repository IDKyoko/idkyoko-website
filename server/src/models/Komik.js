const mongoose = require('mongoose');
const slugify = require('slugify');

const komikSchema = new mongoose.Schema({
  judul: { type: String, required: true },
  penulis: { type: String, required: true },
  genre: { type: [String], default: [] },
  cover: { type: String },
  slug: { type: String, unique: true, lowercase: true, trim: true },

  // Note: Array ini menyimpan ObjectId dari dokumen Chapter yang berelasi dengan Komik ini.
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
});

komikSchema.pre('save', function(next) {
  if (!this.isModified('judul')) return next();
  this.slug = slugify(this.judul, { lower: true, strict: true });
  next();
});

module.exports = mongoose.model('Komik', komikSchema);
