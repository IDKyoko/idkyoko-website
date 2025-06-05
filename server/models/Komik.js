const mongoose = require('mongoose');
const slugify = require('slugify');

const komikSchema = new mongoose.Schema({
  judul: { 
    type: String, 
    required: [true, 'Judul wajib diisi'] 
  },
  penulis: { 
    type: String, 
    required: [true, 'Penulis wajib diisi'] 
  },
  genre: { 
    type: [String], 
    default: [] 
  },
  cover: { 
    type: String 
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  }
});

// Middleware untuk menghasilkan slug sebelum disimpan
komikSchema.pre('save', function(next) {
  if (!this.isModified('judul')) return next();

  this.slug = slugify(this.judul, { lower: true, strict: true });
  next();
});

module.exports = mongoose.model('Komik', komikSchema);
