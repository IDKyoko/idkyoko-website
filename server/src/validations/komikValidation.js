const { body } = require('express-validator');

const validateBuatKomik = [
  body('judul')
    .trim()
    .notEmpty().withMessage('Judul wajib diisi')
    .isLength({ min: 2 }).withMessage('Judul minimal 2 karakter'),

  body('penulis')
    .trim()
    .notEmpty().withMessage('Penulis wajib diisi'),

  body('tipe')
    .trim()
    .equals('covers').withMessage('Field tipe harus bernilai "covers"'),

  body('genre')
    .optional()
    .customSanitizer(value => value.split(',').map(g => g.trim()))
    .custom((arr) => {
      if (!Array.isArray(arr)) throw new Error('Genre harus berupa array');
      const valid = arr.every(g => typeof g === 'string' && g.length > 0);
      if (!valid) throw new Error('Setiap genre harus berupa teks yang valid');
      return true;
    }),
];

const validateGantiIdKomik = [
  body('idBaru')
    .trim()
    .notEmpty().withMessage('Field idBaru wajib diisi')
    .isAlphanumeric().withMessage('idBaru harus berupa karakter alfanumerik'),
];

module.exports = {
  validateBuatKomik,
  validateGantiIdKomik,
};
