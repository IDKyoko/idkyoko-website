const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Logging hanya saat development
  if (process.env.NODE_ENV !== 'production') {
    console.log('====================');
    console.log('🛡️  Middleware Auth');
    console.log('Authorization Header:', authHeader);
    console.log('JWT_SECRET:', process.env.JWT_SECRET || '[NOT SET]');
    console.log('====================');
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'fail',
      errors: [{ message: 'Token otentikasi tidak ditemukan' }]
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET tidak tersedia di environment');
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded.id || !decoded.username) {
      return res.status(401).json({
        status: 'fail',
        errors: [{ message: 'Token tidak valid: data pengguna tidak lengkap' }]
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Gagal verifikasi token:', err.message);
    return res.status(401).json({
      status: 'fail',
      errors: [{ message: 'Token tidak valid atau sudah kadaluarsa' }]
    });
  }
};

module.exports = auth;
