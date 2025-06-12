const { checkSchema } = require('express-validator');

exports.chapterCreateValidation = checkSchema({
  komik: {
    notEmpty: true,
    isMongoId: true,
    errorMessage: 'Invalid komik ID',
  },
  title: {
    notEmpty: true,
    trim: true,
    isLength: { options: { min: 2, max: 100 } },
    errorMessage: 'Chapter title must be 2–100 characters',
  },
  chapterNumber: {
    notEmpty: true,
    isNumeric: true,
    errorMessage: 'Chapter number must be a number',
  },
});
