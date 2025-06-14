document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const form = e.target;
    const formData = new FormData(form);
  
    const files = document.getElementById("images").files;
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
  
    const status = document.getElementById("status");
    status.textContent = "Mengunggah...";
  
    try {
      const response = await fetch("/api/chapters", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        status.textContent = "Upload berhasil!";
        form.reset();
      } else {
        const errorText = await response.text();
        status.textContent = "Upload gagal: " + errorText;
      }
    } catch (err) {
      status.textContent = "Terjadi kesalahan: " + err.message;
    }
  });
  