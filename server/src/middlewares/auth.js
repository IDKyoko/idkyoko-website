const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Ambil token dari header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token otentikasi tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Simpan data user hasil decode token ke request agar bisa diakses di route handler
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token otentikasi tidak valid atau sudah kadaluarsa' });
  }
};

module.exports = auth;
