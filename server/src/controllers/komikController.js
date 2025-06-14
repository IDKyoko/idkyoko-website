const fs = require('fs');
const path = require('path');
const Komik = require('../models/Komik');
const Chapter = require('../models/Chapter');
const buatSlugUnik = require('../utils/buatSlugUnik');

// GET semua komik
async function getAllKomik(req, res) {
  try {
    const komiks = await Komik.find();
    res.json(komiks);
  } catch (error) {
    console.error('❌ Error getAllKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil data komik' });
  }
}

// GET komik berdasarkan query judul
async function searchKomik(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Parameter pencarian "q" wajib diisi' });
    }

    const regex = new RegExp(q.trim(), 'i');
    const hasil = await Komik.find({ judul: regex });
    res.json(hasil);
  } catch (error) {
    console.error('❌ Error searchKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat melakukan pencarian' });
  }
}

// GET komik berdasarkan slug, termasuk daftar chapters
async function getKomikBySlug(req, res) {
  try {
    const komik = await Komik.findOne({ slug: req.params.slug }).populate({
      path: 'chapters',
      select: 'nomor judulChapter halaman',
      options: { sort: { nomor: 1 } },
    });

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
    const komik = await Komik.findById(req.params.id);
    if (!komik) {
      return res.status(404).json({ error: 'Komik tidak ditemukan' });
    }

    res.json(komik);
  } catch (error) {
    console.error('❌ Error getKomikById:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengambil data komik' });
  }
}

// POST buat komik baru
async function createKomik(req, res) {
  try {
    const { judul, penulis, genre, tipe } = req.body;

    if (!judul || !penulis || !tipe) {
      return res.status(400).json({ error: 'Field judul, penulis, dan tipe wajib diisi' });
    }

    if (tipe !== 'covers') {
      return res.status(400).json({
        status: 'fail',
        errors: [{ message: 'Field tipe harus bernilai "covers"' }],
      });
    }

    let genreArr = [];
    if (typeof genre === 'string') {
      try {
        genreArr = JSON.parse(genre);
        if (!Array.isArray(genreArr) || !genreArr.every(g => typeof g === 'string')) {
          throw new Error();
        }
      } catch {
        genreArr = genre.split(',').map(g => g.trim());
      }
    } else if (Array.isArray(genre)) {
      genreArr = genre;
    }

    const slug = await buatSlugUnik(judul);
    const coverPath = req.file ? `/covers/${req.file.filename}` : null;

    const komikBaru = new Komik({
      judul,
      penulis,
      genre: genreArr,
      cover: coverPath,
      slug,
    });

    const simpan = await komikBaru.save();

    res.status(201).json({
      id: simpan._id,
      judul: simpan.judul,
      penulis: simpan.penulis,
      genre: simpan.genre,
      cover: simpan.cover,
      slug: simpan.slug,
      createdAt: simpan.createdAt,
    });
  } catch (error) {
    console.error('❌ Error createKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat membuat komik' });
  }
}

// PUT update data komik
async function updateKomik(req, res) {
  try {
    const { id } = req.params;
    const { judul, penulis, genre } = req.body;

    const komik = await Komik.findById(id);
    if (!komik) {
      return res.status(404).json({ error: 'Komik tidak ditemukan' });
    }

    if (judul && judul !== komik.judul) {
      komik.judul = judul;
      komik.slug = await buatSlugUnik(judul);
    }

    if (penulis) komik.penulis = penulis;
    if (genre) komik.genre = genre.split(',').map(g => g.trim());

    if (req.file) {
      if (komik.cover) {
        const pathLama = path.join(__dirname, '../..', 'public', komik.cover);
        fs.unlink(pathLama, err => {
          if (err) console.warn('⚠️ Gagal hapus cover lama:', err.message);
        });
      }
      komik.cover = `/covers/${req.file.filename}`;
    }

    const hasil = await komik.save();
    res.json(hasil);
  } catch (error) {
    console.error('❌ Error updateKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat memperbarui komik' });
  }
}

// PATCH ganti _id komik
async function gantiIdKomik(req, res) {
  try {
    const idLama = req.params.id;
    const { idBaru } = req.body;

    if (!idBaru) {
      return res.status(400).json({ error: 'Field idBaru wajib diisi' });
    }

    const komikLama = await Komik.findById(idLama);
    if (!komikLama) return res.status(404).json({ error: 'Komik lama tidak ditemukan' });

    const sudahAda = await Komik.findById(idBaru);
    if (sudahAda) return res.status(400).json({ error: 'idBaru sudah digunakan' });

    const komikBaru = new Komik({
      _id: idBaru,
      judul: komikLama.judul,
      penulis: komikLama.penulis,
      genre: komikLama.genre,
      cover: komikLama.cover,
      slug: komikLama.slug,
    });

    await komikBaru.save();
    await Komik.findByIdAndDelete(idLama);

    res.json({ pesan: 'ID komik berhasil diganti', komikBaru });
  } catch (error) {
    console.error('❌ Error gantiIdKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat mengganti ID komik' });
  }
}

// DELETE komik dan seluruh chapters-nya
async function deleteKomik(req, res) {
  try {
    const komik = await Komik.findByIdAndDelete(req.params.id);
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    if (komik.cover) {
      const lokasiFile = path.join(__dirname, '../..', 'public', komik.cover);
      fs.unlink(lokasiFile, err => {
        if (err) console.warn('⚠️ Gagal hapus file cover:', err.message);
      });
    }

    await Chapter.deleteMany({ komik: komik._id });

    res.json({ pesan: 'Komik dan seluruh chapter terkait berhasil dihapus' });
  } catch (error) {
    console.error('❌ Error deleteKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server saat menghapus komik' });
  }
}

module.exports = {
  getAllKomik,
  searchKomik,
  getKomikBySlug,
  getKomikById,
  createKomik,
  updateKomik,
  gantiIdKomik,
  deleteKomik,
};
