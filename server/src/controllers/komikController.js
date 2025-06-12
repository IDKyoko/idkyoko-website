const slugify = require('slugify');
const Komik = require('../models/Komik');
const Chapter = require('../models/Chapter');
const fs = require('fs');
const path = require('path');

// Fungsi bantu generate slug unik
async function buatSlugUnik(judul) {
  let baseSlug = slugify(judul, { lower: true, strict: true });
  let slug = baseSlug;
  let hitung = 1;
  while (await Komik.findOne({ slug })) {
    slug = `${baseSlug}-${hitung++}`;
  }
  return slug;
}

// GET semua komik
async function getAllKomik(req, res) {
  try {
    const komiks = await Komik.find();
    console.log('Isi komik:', JSON.stringify(komiks, null, 2)); // Cek log _id di terminal
    res.json(komiks);
  } catch (error) {
    console.error('Error getAllKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// GET komik berdasarkan pencarian judul
async function searchKomik(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Parameter pencarian q wajib diisi' });

    const regex = new RegExp(q, 'i');
    const hasil = await Komik.find({ judul: regex });
    res.json(hasil);
  } catch (error) {
    console.error('Error searchKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// GET komik berdasarkan slug, termasuk data chapters (populate)
async function getKomikBySlug(req, res) {
  try {
    const komik = await Komik.findOne({ slug: req.params.slug })
      .populate({
        path: 'chapters',
        select: 'nomor judulChapter halaman',
        options: { sort: { nomor: 1 } }
      });
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    res.json(komik);
  } catch (error) {
    console.error('Error getKomikBySlug:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// GET komik berdasarkan ID
async function getKomikById(req, res) {
  try {
    const komik = await Komik.findById(req.params.id);
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    res.json(komik);
  } catch (error) {
    console.error('Error getKomikById:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// POST komik baru dengan upload cover dan validasi tipe 'covers'
async function createKomik(req, res) {
  try {
    const { judul, penulis, genre, tipe } = req.body;

    // Validasi tipe harus 'covers'
    if (tipe !== 'covers') {
      return res.status(400).json({ 
        status: "fail",
        errors: [{ message: 'Field tipe harus bernilai "covers"' }]
      });
    }

    if (!judul || !penulis) {
      return res.status(400).json({ error: 'Field judul dan penulis wajib diisi' });
    }

    // Tangani genre bisa string JSON atau array (string dari form-data)
    let genreArr = [];
    if (typeof genre === 'string') {
      try {
        // Coba parsing JSON, jika gagal, fallback ke split comma
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
    const pathCover = req.file ? `/covers/${req.file.filename}` : null;

    const komikBaru = new Komik({
      judul,
      penulis,
      genre: genreArr,
      cover: pathCover,
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
    console.error('Error createKomik:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}



// PUT /api/komik/:id – Update data komik dan upload cover baru (opsional)
async function updateKomik(req, res) {
  try {
    const { id } = req.params;
    const { judul, penulis, genre } = req.body;

    // Cari komik dulu
    const komik = await Komik.findById(id);
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    // Jika ada upload file cover baru, hapus cover lama dulu
    if (req.file) {
      if (komik.cover) {
        const lokasiFile = path.join(__dirname, '../..', 'public', komik.cover);
        fs.unlink(lokasiFile, (err) => {
          if (err) console.error('Gagal hapus file cover lama:', err);
        });
      }
      komik.cover = `/covers/${req.file.filename}`;
    }

    // Update field jika ada
    if (judul && judul !== komik.judul) {
      komik.judul = judul;

      // Update slug jika judul berubah
      komik.slug = await buatSlugUnik(judul);
    }
    if (penulis) komik.penulis = penulis;
    if (genre) komik.genre = genre.split(',').map(g => g.trim());

    // Simpan perubahan
    const simpan = await komik.save();
    res.json(simpan);
  } catch (error) {
    console.error('Error updateKomik:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// PUT update komik (dengan kemungkinan ganti cover)
async function updateKomik(req, res) {
  try {
    const { id } = req.params;
    const { judul, penulis, genre } = req.body;

    const komik = await Komik.findById(id);
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    // Update field jika ada
    if (judul) komik.judul = judul;
    if (penulis) komik.penulis = penulis;
    if (genre) komik.genre = genre.split(',').map(g => g.trim());

    // Jika ada file cover baru, hapus yang lama dan simpan yang baru
    if (req.file) {
      // Hapus cover lama jika ada
      if (komik.cover) {
        const pathLama = path.join(__dirname, '../..', 'public', komik.cover);
        fs.unlink(pathLama, (err) => {
          if (err) console.error('Gagal hapus cover lama:', err);
        });
      }

      komik.cover = `/covers/${req.file.filename}`;
    }

    const hasil = await komik.save();
    res.json(hasil);
  } catch (error) {
    console.error('Error updateKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
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

    // Buat dokumen baru dengan idBaru, data dari komikLama
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
    console.error('Error gantiIdKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

// DELETE komik berdasarkan ID, hapus file cover jika ada
async function deleteKomik(req, res) {
  try {
    const komik = await Komik.findByIdAndDelete(req.params.id);
    if (!komik) return res.status(404).json({ error: 'Komik tidak ditemukan' });

    if (komik.cover) {
      const lokasiFile = path.join(__dirname, '../..', 'public', komik.cover);
      fs.unlink(lokasiFile, (err) => {
        if (err) console.error('Gagal hapus file cover:', err);
      });
    }

    // Hapus chapters terkait juga (opsional, tergantung kebutuhan)
    await Chapter.deleteMany({ komik: komik._id });

    res.json({ pesan: 'Komik dan chapters terkait berhasil dihapus' });
  } catch (error) {
    console.error('Error deleteKomik:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
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
