const fs = require('fs');
const path = require('path');
const Komik = require('../models/Komik');
const Chapter = require('../models/Chapter');
const buatSlugUnik = require('../utils/buatSlugUnik');

// Utility function to process genre input
const processGenreInput = (genre) => {
  if (!genre) return [];
  
  if (typeof genre === 'string') {
    try {
      const parsed = JSON.parse(genre);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return genre.split(',').map(g => g.trim());
    }
  }
  
  return Array.isArray(genre) ? genre : [];
};

// GET semua komik dengan paginasi
async function getAllKomik(req, res) {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      select: 'judul penulis cover slug createdAt'
    };

    const komiks = await Komik.paginate({}, options);
    res.json({
      data: komiks.docs,
      total: komiks.totalDocs,
      pages: komiks.totalPages,
      currentPage: komiks.page
    });
  } catch (error) {
    console.error('❌ Error getAllKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil data komik' });
  }
}

// GET komik populer
async function getPopularKomik(req, res) {
  try {
    const komiks = await Komik.find()
      .sort({ viewCount: -1 })
      .limit(5)
      .select('judul cover slug viewCount');
    res.json(komiks);
  } catch (error) {
    console.error('❌ Error getPopularKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil komik populer' });
  }
}

// GET komik berdasarkan query judul
async function searchKomik(req, res) {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Parameter pencarian "q" wajib diisi' });
    }

    const regex = new RegExp(q.trim(), 'i');
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: 'judul penulis cover slug'
    };

    const hasil = await Komik.paginate({ judul: regex }, options);
    res.json({
      data: hasil.docs,
      total: hasil.totalDocs,
      pages: hasil.totalPages,
      currentPage: hasil.page
    });
  } catch (error) {
    console.error('❌ Error searchKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat melakukan pencarian' });
  }
}

// GET komik berdasarkan slug, termasuk daftar chapters
async function getKomikBySlug(req, res) {
  try {
    // Increment view count
    await Komik.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { viewCount: 1 } }
    );

    const komik = await Komik.findOne({ slug: req.params.slug })
      .populate({
        path: 'chapters',
        select: 'nomor judulChapter halaman createdAt',
        options: { sort: { nomor: 1 } },
      })
      .lean();

    if (!komik) {
      return res.status(404).json({ error: 'Komik tidak ditemukan' });
    }

    res.json(komik);
  } catch (error) {
    console.error('❌ Error getKomikBySlug:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil data komik' });
  }
}

// GET komik berdasarkan ID
async function getKomikById(req, res) {
  try {
    const komik = await Komik.findById(req.params.id)
      .select('-__v -updatedAt') // Exclude some fields
      .lean();

    if (!komik) {
      return res.status(404).json({ 
        success: false,
        error: 'Komik tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      data: komik
    });
  } catch (error) {
    console.error('❌ Error getKomikById:', error);
    res.status(500).json({ 
      success: false,
      error: 'Terjadi kesalahan server saat mengambil data komik',
      details: error.message 
    });
  }
}

// POST buat komik baru
async function createKomik(req, res) {
  try {
    const { judul, penulis, genre, sinopsis } = req.body;

    // Validasi input
    if (!judul || !penulis) {
      return res.status(400).json({ 
        error: 'Field judul dan penulis wajib diisi',
        fields: { judul: !judul, penulis: !penulis }
      });
    }

    // Proses genre
    const genreArr = processGenreInput(genre);

    // Buat slug unik
    const slug = await buatSlugUnik(judul);
    
    // Handle cover upload
    const coverPath = req.file ? `/covers/${req.file.filename}` : null;

    const komikBaru = new Komik({
      judul,
      penulis,
      genre: genreArr,
      sinopsis: sinopsis || '',
      cover: coverPath,
      slug,
      createdBy: req.user.id
    });

    const simpan = await komikBaru.save();

    res.status(201).json({
      success: true,
      data: {
        id: simpan._id,
        judul: simpan.judul,
        penulis: simpan.penulis,
        slug: simpan.slug,
        cover: simpan.cover,
        createdAt: simpan.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error createKomik:', error);
    res.status(500).json({ 
      success: false,
      error: 'Terjadi kesalahan server saat membuat komik',
      details: error.message 
    });
  }
}

// PUT update data komik
async function updateKomik(req, res) {
  try {
    const { id } = req.params;
    const { judul, penulis, genre, sinopsis } = req.body;

    const komik = await Komik.findById(id);
    if (!komik) {
      return res.status(404).json({ 
        success: false,
        error: 'Komik tidak ditemukan' 
      });
    }

    // Update fields
    if (judul && judul !== komik.judul) {
      komik.judul = judul;
      komik.slug = await buatSlugUnik(judul);
    }
    if (penulis) komik.penulis = penulis;
    if (genre) komik.genre = processGenreInput(genre);
    if (sinopsis) komik.sinopsis = sinopsis;

    // Handle cover update
    if (req.file) {
      // Hapus cover lama jika ada
      if (komik.cover) {
        const pathLama = path.join(__dirname, '../../public', komik.cover);
        fs.unlink(pathLama, err => {
          if (err) console.error('⚠️ Gagal hapus cover lama:', err.message);
        });
      }
      komik.cover = `/covers/${req.file.filename}`;
    }

    const updatedKomik = await komik.save();

    res.json({
      success: true,
      message: 'Komik berhasil diperbarui',
      data: {
        id: updatedKomik._id,
        judul: updatedKomik.judul,
        slug: updatedKomik.slug,
        cover: updatedKomik.cover,
        updatedAt: updatedKomik.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error updateKomik:', error);
    res.status(500).json({ 
      success: false,
      error: 'Gagal memperbarui komik',
      details: error.message 
    });
  }
}

// DELETE komik dan seluruh chapters-nya (HARD DELETE)
async function deleteKomik(req, res) {
  try {
    const komik = await Komik.findByIdAndDelete(req.params.id);
    
    if (!komik) {
      return res.status(404).json({ 
        success: false,
        error: 'Komik tidak ditemukan' 
      });
    }

    // Hapus cover jika ada
    if (komik.cover) {
      const filePath = path.join(__dirname, '../../public', komik.cover);
      fs.unlink(filePath, (err) => {
        if (err) console.error('⚠️ Gagal hapus cover:', err.message);
      });
    }

    // Hapus semua chapter terkait
    await Chapter.deleteMany({ komik: komik._id });

    res.json({
      success: true,
      message: 'Komik dan semua chapter berhasil dihapus permanen',
      data: {
        id: komik._id,
        judul: komik.judul
      }
    });

  } catch (error) {
    console.error('❌ Error deleteKomik:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus komik',
      details: error.message
    });
  }
}

// Soft delete komik
async function softDeleteKomik(req, res, next) {
  try {
    const komik = await Komik.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id 
      },
      { new: true }
    );

    if (!komik) {
      return res.status(404).json({ 
        success: false,
        error: 'Komik tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      message: 'Komik berhasil dihapus (soft delete)',
      data: {
        id: komik._id,
        judul: komik.judul,
        deletedAt: komik.deletedAt
      }
    });
  } catch (error) {
    console.error('❌ Error softDeleteKomik:', error);
    res.status(500).json({ 
      success: false,
      error: 'Gagal melakukan soft delete komik',
      details: error.message 
    });
  }
}

// Restore komik yang di-soft delete
async function restoreKomik(req, res) {
  try {
    const komik = await Komik.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: false,
        deletedAt: null,
        deletedBy: null 
      },
      { new: true }
    );

    if (!komik) {
      return res.status(404).json({ 
        success: false,
        error: 'Komik tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      message: 'Komik berhasil direstore',
      data: {
        id: komik._id,
        judul: komik.judul
      }
    });
  } catch (error) {
    console.error('❌ Error restoreKomik:', error);
    res.status(500).json({ 
      success: false,
      error: 'Gagal merestore komik',
      details: error.message 
    });
  }
}

module.exports = {
  getAllKomik,
  getPopularKomik,
  searchKomik,
  getKomikBySlug,
  getKomikById,
  createKomik,
  updateKomik,
  deleteKomik,
  softDeleteKomik,
  restoreKomik
};