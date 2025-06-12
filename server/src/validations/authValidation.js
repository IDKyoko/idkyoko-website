const { checkSchema } = require('express-validator');

exports.registerValidation = checkSchema({
  username: {
    notEmpty: true,
    isLength: { options: { min: 3, max: 20 } },
    trim: true,
    errorMessage: 'Username must be 3–20 characters',
  },
  email: {
    isEmail: true,
    normalizeEmail: true,
    errorMessage: 'Invalid email address',
  },
  password: {
    isLength: { options: { min: 6 } },
    errorMessage: 'Password must be at least 6 characters',
  },
});

exports.loginValidation = checkSchema({
  email: {
    isEmail: true,
    normalizeEmail: true,
    errorMessage: 'Email is required and must be valid',
  },
  password: {
    notEmpty: true,
    errorMessage: 'Password is required',
  },
});
