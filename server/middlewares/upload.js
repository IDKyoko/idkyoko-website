const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Fungsi untuk membuat folder jika belum ada
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Fungsi sanitasi nama file: hanya huruf, angka, titik, dan strip bawah/strip tengah
const sanitize = (filename) => filename.replace(/[^a-z0-9.\-_]/gi, '_').toLowerCase();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let target = 'public/uploads'; // default folder
    const { type } = req.body;

    if (type === 'chapter') {
      target = 'public/chapter';
    } else if (type === 'covers') {
      target = 'public/covers';
    }

    const dir = path.join(__dirname, '../../', target);
    ensureDir(dir);
    cb(null, dir);
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + sanitize(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // maksimal 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipe file tidak didukung'), false);
    }
  }
});

module.exports = upload;
