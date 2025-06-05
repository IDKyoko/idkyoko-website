const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, '../../public/uploads');

fs.readdir(folderPath, (err, files) => {
  if (err) {
    return console.error('❌ Gagal membaca folder:', err);
  }

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    fs.unlink(filePath, err => {
      if (err) {
        console.error(`❌ Gagal menghapus file ${file}:`, err);
      } else {
        console.log(`✅ Terhapus: ${file}`);
      }
    });
  }
});
