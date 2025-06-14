module.exports = (req, res, next) => {
    // Pastikan user sudah login (auth middleware harus dijalankan sebelumnya)
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    // Cek role user
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  
    next();
  };