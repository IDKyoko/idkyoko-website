function multerErrorHandler(err, req, res, next) {
    if (err instanceof require('multer').MulterError) {
      // Error spesifik dari multer (misal limit file size, dsb)
      return res.status(400).json({ error: `Upload gagal: ${err.message}` });
    } else if (err) {
      // Error lain, misal dari fileFilter dll
      return res.status(400).json({ error: err.message || 'Error upload file' });
    }
    next();
  }
  
  module.exports = multerErrorHandler;
  