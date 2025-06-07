const multer = require('multer');
const fs = require('fs');
const path = require('path');
const uploadPath = require('../config/uploadPath'); // Path folder upload

// Fungsi untuk memastikan direktori tujuan ada
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Fungsi sanitize untuk nama file agar aman
const sanitize = (filename) => filename.replace(/[^a-z0-9.\-_]/gi, '_').toLowerCase();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Tentukan folder upload berdasarkan 'type' dari body request
    let target = uploadPath.default;
    const { type } = req.body;

    if (type === 'chapter') {
      target = uploadPath.chapter;
    } else if (type === 'covers') {
      target = uploadPath.covers;
    }

    const dir = path.join(__dirname, '../../', target);
    ensureDir(dir);
    cb(null, dir);
  },

  filename: function (req, file, cb) {
    // Tambahkan timestamp + sanitize nama file untuk menghindari duplikasi
    const uniqueName = Date.now() + '-' + sanitize(file.originalname);
    cb(null, uniqueName);
  }
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Maksimum 50MB
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe file ${file.mimetype} tidak didukung. Hanya menerima JPEG, PNG, GIF.`), false);
    }
  }
});

module.exports = upload;
