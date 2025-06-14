const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array().map(err => ({ message: err.msg }))
    });
  }

  const { username, password } = req.body;

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        status: 'error',
        errors: [{ message: 'JWT_SECRET belum dikonfigurasi di environment' }]
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        errors: [{ message: 'Username tidak ditemukan' }]
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        errors: [{ message: 'Password salah' }]
      });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      token
    });
  } catch (err) {
    console.error('Error saat login:', err);
    res.status(500).json({
      status: 'error',
      errors: [{ message: 'Terjadi kesalahan saat login' }]
    });
  }
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array().map(err => ({ message: err.msg }))
    });
  }

  const { username, password } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({
        status: 'fail',
        errors: [{ message: 'Username sudah digunakan' }]
      });
    }

    const user = new User({ username, password });
    await user.save();

    res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil'
    });
  } catch (err) {
    console.error('Error saat registrasi:', err);
    res.status(500).json({
      status: 'error',
      errors: [{ message: 'Terjadi kesalahan saat registrasi' }]
    });
  }
};
