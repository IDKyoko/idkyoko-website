const Komik = require('../models/Komik');

exports.replaceKomikId = async (req, res) => {
  try {
    const oldId = req.params.id;
    const newId = req.body.newId;

    if (!newId) {
      return res.status(400).json({ error: 'Field newId wajib diisi' });
    }

    // Cari dokumen lama
    const oldKomik = await Komik.findById(oldId);
    if (!oldKomik) {
      return res.status(404).json({ error: 'Komik lama tidak ditemukan' });
    }

    // Cek apakah newId sudah dipakai
    const exists = await Komik.findById(newId);
    if (exists) {
      return res.status(400).json({ error: 'newId sudah digunakan' });
    }

    // Buat dokumen baru dengan _id baru dan data sama
    const newKomik = new Komik({
      _id: newId,
      judul: oldKomik.judul,
      penulis: oldKomik.penulis,
      genre: oldKomik.genre,
      cover: oldKomik.cover,
    });

    await newKomik.save();
    await Komik.findByIdAndDelete(oldId);

    res.json({ message: 'ID komik berhasil diganti', newKomik });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
