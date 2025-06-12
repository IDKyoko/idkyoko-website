const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log('====================');
  console.log('🛡️  Middleware Auth');
  console.log('Authorization Header:', authHeader);
  console.log('JWT_SECRET (hardcoded):', 'senpai0078'); // jika Anda nanti kembali ke .env, ubah ini
  console.log('====================');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Token tidak ditemukan di header');
    return res.status(401).json({ error: 'Token otentikasi tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'senpai0078'); // hardcoded sementara untuk memastikan validasi benar
    console.log('✅ Token berhasil diverifikasi:', decoded);

    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Gagal verifikasi token:', err.message);
    return res.status(401).json({ error: 'Token otentikasi tidak valid atau sudah kadaluarsa' });
  }
};

module.exports = auth;
