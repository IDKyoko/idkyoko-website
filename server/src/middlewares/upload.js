const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const uploadPath = require('../config/uploadPath');

// ========================
// KONFIGURASI UTAMA
// ========================
const UKURAN_MAKSIMAL_FILE = 20 * 1024 * 1024; // 20MB
const JENIS_FILE_DIIZINKAN = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};
const PATH_WATERMARK = path.resolve(__dirname, '../assets/watermark.png');
const PENYESUAIAN_UKURAN = {
  width: 1200,
  height: 1800,
  fit: sharp.fit.inside,
  withoutEnlargement: true
};

// ========================
// FUNGSI PENDUKUNG
// ========================
const buatDirektoriJikaTidakAda = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const bersihkanNamaFile = (filename) => {
  return filename
    .replace(/[^a-z0-9.\-_]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .substring(0, 100);
};

const dapatkanPathTujuan = (type) => {
  const paths = {
    chapter: uploadPath.chapter,
    covers: uploadPath.covers,
    profile: uploadPath.profile,
    default: uploadPath.default
  };
  return paths[type] || paths.default;
};

// ========================
// PENYIMPANAN MULTER
// ========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetPath = path.resolve(__dirname, '../../', dapatkanPathTujuan(req.body.type));
    buatDirektoriJikaTidakAda(targetPath);
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    const ext = JENIS_FILE_DIIZINKAN[file.mimetype] || 'bin';
    const namaUnik = `${uuidv4()}-${bersihkanNamaFile(path.parse(file.originalname).name)}.${ext}`;
    cb(null, namaUnik);
  }
});

// ========================
// PROSES GAMBAR
// ========================
const prosesGambar = async (req, res, next) => {
  if (!req.file) return next();

  const pathAsli = path.join(req.file.destination, req.file.filename);
  const pathHasil = `${pathAsli}.webp`;

  try {
    // Cek ukuran file sebelum diproses
    const stats = fs.statSync(pathAsli);
    if (stats.size > UKURAN_MAKSIMAL_FILE) {
      throw new Error('Ukuran file melebihi batas');
    }

    const processor = sharp(pathAsli)
      .resize(PENYESUAIAN_UKURAN)
      .webp({ quality: 80 });

    if (fs.existsSync(PATH_WATERMARK)) {
      processor.composite([{
        input: PATH_WATERMARK,
        gravity: 'southeast',
        blend: 'over'
      }]);
    }

    await processor.toFile(pathHasil);
    fs.unlinkSync(pathAsli);
    
    req.file.filename = `${req.file.filename}.webp`;
    req.file.path = pathHasil;
    req.file.mimetype = 'image/webp';

  } catch (error) {
    console.error('Gagal memproses gambar:', error);
    
    // Simpan error untuk logging
    req.file.error = {
      message: error.message,
      stack: error.stack
    };
    
    if (fs.existsSync(pathAsli)) {
      req.file.path = pathAsli;
    } else {
      return next(new Error(`Gagal memproses gambar: ${error.message}`));
    }
  }

  next();
};

// ========================
// FILTER FILE
// ========================
const filterFile = (req, file, cb) => {
  // Blok file berbahaya
  const FILE_BERBAHAYA = [
    'application/x-msdownload',
    'application/x-sh',
    'text/html'
  ];
  
  if (FILE_BERBAHAYA.includes(file.mimetype)) {
    return cb(new Error('Jenis file ini berpotensi berbahaya'));
  }

  if (JENIS_FILE_DIIZINKAN[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Jenis file tidak didukung. Hanya menerima: ${Object.keys(JENIS_FILE_DIIZINKAN).join(', ')}`));
  }
};

// ========================
// INISIALISASI MULTER
// ========================
const upload = multer({
  storage,
  limits: {
    fileSize: UKURAN_MAKSIMAL_FILE,
    files: 1
  },
  fileFilter: filterFile
});

// ========================
// EXPORT MIDDLEWARE
// ========================
module.exports = {
  // Versi dasar (multer langsung)
  ...upload,
  
  // Versi enhanced dengan proses gambar
  enhanced: {
    singleUpload: (fieldName) => [
      upload.single(fieldName),
      prosesGambar
    ],
    multiUpload: (fieldName, maxCount) => [
      upload.array(fieldName, maxCount),
      prosesGambar
    ]
  },
  
  // Untuk file non-gambar
  memoryUpload: multer({ storage: multer.memoryStorage() })
};