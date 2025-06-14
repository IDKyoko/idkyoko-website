const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

// Validator bantu untuk validasi ObjectId
const isValidObjectId = (value) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error('ID tidak valid (bukan ObjectId)');
  }
  return true;
};

// Validasi saat membuat komik baru
const validateBuatKomik = [
  body('judul')
    .trim()
    .notEmpty().withMessage('Judul wajib diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Judul minimal 2 dan maksimal 100 karakter'),

  body('penulis')
    .trim()
    .notEmpty().withMessage('Penulis wajib diisi')
    .isLength({ max: 50 }).withMessage('Penulis maksimal 50 karakter'),

  body('tipe')
    .trim()
    .equals('covers').withMessage('Field tipe harus bernilai "covers"'),

  body('genre')
    .optional()
    .customSanitizer(value => {
      if (typeof value === 'string') return value.split(',').map(g => g.trim());
      return value;
    })
    .custom(arr => {
      if (!Array.isArray(arr)) throw new Error('Genre harus berupa array');
      const valid = arr.every(g => typeof g === 'string' && g.length > 0 && g.length <= 30);
      if (!valid) throw new Error('Setiap genre harus berupa teks yang valid (maks 30 karakter)');
      return true;
    }),
];

// Validasi saat update komik
const validateUpdateKomik = [
  body('judul')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Judul minimal 2 dan maksimal 100 karakter'),

  body('penulis')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Penulis maksimal 50 karakter'),

  body('genre')
    .optional()
    .customSanitizer(value => {
      if (typeof value === 'string') return value.split(',').map(g => g.trim());
      return value;
    })
    .custom(arr => {
      if (!Array.isArray(arr)) throw new Error('Genre harus berupa array');
      const valid = arr.every(g => typeof g === 'string' && g.length > 0 && g.length <= 30);
      if (!valid) throw new Error('Setiap genre harus berupa teks yang valid (maks 30 karakter)');
      return true;
    }),
];

// Validasi ganti ID komik
const validateGantiIdKomik = [
  param('id')
    .custom(isValidObjectId),

  body('idBaru')
    .trim()
    .notEmpty().withMessage('Field idBaru wajib diisi')
    .isAlphanumeric().withMessage('idBaru harus berupa karakter alfanumerik')
    .isLength({ min: 5, max: 24 }).withMessage('idBaru harus antara 5–24 karakter'),
];

// Validasi param ID untuk keperluan umum
const validateParamId = [
  param('id')
    .custom(isValidObjectId),
];

// Validasi slug di param
const validateParamSlug = [
  param('slug')
    .trim()
    .notEmpty().withMessage('Slug wajib diisi')
    .isSlug().withMessage('Slug tidak valid'),
];

// Validasi komikId di query (misalnya untuk chapter list)
const validateQueryKomikId = [
  query('komikId')
    .optional()
    .custom(isValidObjectId),
];

module.exports = {
  validateBuatKomik,
  validateUpdateKomik,
  validateGantiIdKomik,
  validateParamId,
  validateParamSlug,
  validateQueryKomikId,
};
