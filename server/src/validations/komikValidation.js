const { body } = require('express-validator');

const validateBuatKomik = [
  body('judul')
    .notEmpty().withMessage('Judul wajib diisi')
    .isLength({ min: 2 }).withMessage('Judul minimal 2 karakter'),

  body('penulis')
    .notEmpty().withMessage('Penulis wajib diisi'),

  body('tipe')
    .equals('covers').withMessage('Field tipe harus bernilai "covers"'),

  body('genre')
    .optional()
    .customSanitizer(value => value.split(',').map(g => g.trim()))
];

const validateGantiIdKomik = [
  body('idBaru')
    .notEmpty().withMessage('Field idBaru wajib diisi')
];

module.exports = {
  validateBuatKomik,
  validateGantiIdKomik
};
