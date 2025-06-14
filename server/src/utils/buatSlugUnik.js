const Komik = require('../models/komik'); // pastikan path ini sesuai

async function buatSlugUnik(judul) {
  const slugDasar = judul
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // ganti spasi dan simbol dengan -
    .replace(/^-+|-+$/g, '');     // hapus - di awal/akhir

  let slug = slugDasar;
  let counter = 1;

  while (await Komik.exists({ slug })) {
    slug = `${slugDasar}-${counter++}`;
  }

  return slug;
}

module.exports = buatSlugUnik;
