const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Username tidak ditemukan' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Password salah' });
    }

    // Gunakan JWT_EXPIRES_IN dari environment, default 7d jika tidak ada
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.json({ message: 'Login berhasil', token });
  } catch (err) {
    console.error('Error saat login:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat login' });
  }
};

exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    const user = new User({ username, password });
    await user.save();

    res.status(201).json({ message: 'Registrasi berhasil' });
  } catch (err) {
    console.error('Error saat registrasi:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat registrasi' });
  }
};
