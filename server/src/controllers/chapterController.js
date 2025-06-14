const Chapter = require('../models/Chapter');
const Komik = require('../models/Komik');
const fs = require('fs');
const path = require('path');

// Fungsi upload chapter baru
exports.uploadChapter = async (req, res) => {
  try {
    const { judul, nomor, komikId } = req.body;

    const komik = await Komik.findById(komikId);
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    const chapterExist = await Chapter.findOne({ komik: komikId, nomor });
    if (chapterExist) return res.status(400).json({ error: `Nomor chapter ${nomor} sudah ada` });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Minimal satu gambar harus diupload' });
    }

    const daftarGambar = req.files.map(file => `/chapter/${file.filename}`);

    const chapterBaru = new Chapter({ judul, nomor, komik: komikId, gambar: daftarGambar });

    await chapterBaru.save();

    res.status(201).json({ pesan: 'Chapter berhasil diupload', chapter: chapterBaru });
  } catch (error) {
    console.error('Error saat upload chapter:', error);
    if (error.message && error.message.includes('File harus berupa gambar')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Terjadi kesalahan server saat upload chapter' });
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
