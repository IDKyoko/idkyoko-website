const fs = require('fs');
const path = require('path');
const Chapter = require('../models/Chapter');
const Komik = require('../models/Komik');

// Config - Sesuaikan dengan project Anda
const CHAPTER_UPLOAD_DIR = path.join(__dirname, '../../public/chapter');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 50;
const MAX_FILES = 50;

exports.uploadChapter = async (req, res) => {
  try {
    // 1. Validasi Input Dasar
    const { judul, nomor, komikId } = req.body;
    
    if (!judul || !nomor || !komikId) {
      return res.status(400).json({
        success: false,
        error: 'Judul, nomor, dan komikId wajib diisi'
      });
    }

    // 2. Validasi Komik Exist
    const komik = await Komik.findById(komikId);
    if (!komik) {
      return res.status(404).json({
        success: false,
        error: 'Komik tidak ditemukan'
      });
    }

    // 3. Cek Chapter Duplikat
    const existingChapter = await Chapter.findOne({ 
      komik: komikId, 
      nomor: parseInt(nomor) 
    });
    
    if (existingChapter) {
      return res.status(409).json({
        success: false,
        error: `Chapter nomor ${nomor} sudah ada untuk komik ini`
      });
    }

    // 4. Validasi File Upload
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Minimal satu gambar harus diupload'
      });
    }

    // 5. Validasi File Filter (Backup)
    const invalidFiles = req.files.filter(file => 
      !ALLOWED_MIME_TYPES.includes(file.mimetype)
    );

    if (invalidFiles.length > 0) {
      // Hapus file invalid
      invalidFiles.forEach(file => {
        fs.unlinkSync(path.join(CHAPTER_UPLOAD_DIR, file.filename));
      });

      return res.status(400).json({
        success: false,
        error: 'Format file tidak valid. Hanya JPEG, PNG, atau WebP yang diperbolehkan',
        invalidFiles: invalidFiles.map(f => f.originalname)
      });
    }

    // 6. Proses Penyimpanan
    const daftarGambar = req.files.map(file => ({
      url: `/chapter/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    }));

    const chapterBaru = await Chapter.create({
      judul,
      nomor: parseInt(nomor),
      komik: komikId,
      gambar: daftarGambar,
      uploadedBy: req.user.id
    });

    // 7. Update Komik
    await Komik.findByIdAndUpdate(komikId, {
      $push: { chapters: chapterBaru._id },
      $set: { 
        updatedAt: new Date(),
        lastChapter: chapterBaru.nomor 
      }
    });

    // 8. Response Sukses
    res.status(201).json({
      success: true,
      message: 'Chapter berhasil diupload',
      data: {
        id: chapterBaru._id,
        judul: chapterBaru.judul,
        nomor: chapterBaru.nomor,
        totalGambar: chapterBaru.gambar.length,
        komik: {
          id: komik._id,
          judul: komik.judul
        },
        gambar: chapterBaru.gambar.map(g => g.url)
      }
    });

  } catch (error) {
    console.error('[CHAPTER CONTROLLER ERROR]', error);

    // 9. Cleanup File jika Error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(path.join(CHAPTER_UPLOAD_DIR, file.filename));
        } catch (err) {
          console.error('Gagal menghapus file:', file.filename, err);
        }
      });
    }

    // 10. Error Handling
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Terjadi kesalahan server'
      : error.message;

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: error.stack
      })
    });
  }
};

exports.getAllChapters = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // batasi limit max 100

    const allowedSortFields = ['nomor', 'judul', 'createdAt', 'updatedAt'];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'nomor';
    const order = req.query.order === 'desc' ? -1 : 1;

    const keyword = req.query.keyword?.trim() || '';
    const komikId = req.query.komikId?.trim() || null;

    const filter = {};

    if (keyword) {
      filter.judul = { $regex: keyword, $options: 'i' };
    }

    if (komikId) {
      filter.komik = komikId;
    }

    const skip = (page - 1) * limit;
    const total = await Chapter.countDocuments(filter);

    const chapters = await Chapter.find(filter)
      .populate('komik', 'judul slug')
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: chapters.length,
      chapters,
    });
  } catch (error) {
    console.error('🔥 Error di getAllChapters:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil data chapter' });
  }
};


// Fungsi dapatkan chapter berdasarkan ID
exports.getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id).populate('komik', 'judul slug');
    if (!chapter) return res.status(404).json({ error: 'Chapter tidak ditemukan' });
    res.json(chapter);
  } catch (error) {
    console.error('Error saat mengambil chapter berdasarkan ID:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil data chapter' });
  }
};

exports.getChaptersByKomik = async (req, res) => {
  try {
    const { komikId } = req.params;
    if (!komikId || komikId === ':komikId') {
      return res.status(400).json({ error: 'Parameter komikId wajib diisi dengan benar' });
    }

    // Ambil query pagination dan sorting dari URL, contoh: ?page=2&limit=10&sort=desc
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortOrder = req.query.sort === 'desc' ? -1 : 1;
    const skip = (page - 1) * limit;

    const total = await Chapter.countDocuments({ komik: komikId });

    const chapters = await Chapter.find({ komik: komikId })
      .populate('komik', 'judul slug')
      .sort({ nomor: sortOrder }) // Sort berdasarkan urutan nomor
      .skip(skip)
      .limit(limit);

    if (chapters.length === 0) {
      return res.status(404).json({ message: 'Chapter tidak ditemukan untuk komik ini' });
    }

    res.status(200).json({
      totalData: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: chapters,
    });
  } catch (error) {
    console.error('❌ Gagal ambil chapter dari komikId:', komikId, '\n', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil data chapter' });
  }
};

// Pastikan ada fungsi ini:
exports.logChapterAction = (req, res, next) => {
  console.log(`User ${req.user.id} mengupdate chapter ${req.params.id}`);
  next(); // WAJIB ada next() untuk melanjutkan
};


// Fungsi update chapter
exports.updateChapter = async (req, res) => {
  try {
    const { judul, nomor } = req.body;
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ error: 'Chapter tidak ditemukan' });

    // Cek jika nomor diganti, pastikan unik dalam komik
    if (nomor && nomor !== chapter.nomor) {
      const adaNomor = await Chapter.findOne({ komik: chapter.komik, nomor });
      if (adaNomor) return res.status(400).json({ error: `Nomor chapter ${nomor} sudah ada` });
      chapter.nomor = nomor;
    }

    if (judul) chapter.judul = judul;

    // Jika ada gambar baru diupload, hapus gambar lama dan ganti dengan yang baru
    if (req.files && req.files.length > 0) {
      for (const gambarPath of chapter.gambar) {
        const filePath = path.join(__dirname, '../../public', gambarPath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      chapter.gambar = req.files.map(file => `/chapter/${file.filename}`);
    }

    await chapter.save();
    res.json({ pesan: 'Chapter berhasil diperbarui', chapter });
  } catch (error) {
    console.error('Error update chapter:', error);
    if (error.message && error.message.includes('File harus berupa gambar')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Terjadi kesalahan server saat memperbarui chapter' });
  }
};

// Fungsi hapus chapter
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) return res.status(404).json({ error: 'Chapter tidak ditemukan' });

    // Hapus file gambar fisik
    for (const gambarPath of chapter.gambar) {
      const filePath = path.join(__dirname, '../../public', gambarPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ pesan: 'Chapter berhasil dihapus' });
  } catch (error) {
    console.error('Error hapus chapter:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat menghapus chapter' });
  }
};

// Pastikan ada fungsi softDeleteChapter
exports.softDeleteChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() }, // Soft delete dengan timestamp
      { new: true }
    );
    
    if (!chapter) {
      return res.status(404).json({ 
        success: false, 
        error: 'Chapter tidak ditemukan' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Chapter berhasil dihapus (soft delete)',
      data: chapter 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

//fungsi restore
exports.restoreChapter = async (req, res) => {
  await Chapter.findByIdAndUpdate(req.params.id, { deletedAt: null });
  res.json({ success: true, message: 'Chapter berhasil dipulihkan' });
};