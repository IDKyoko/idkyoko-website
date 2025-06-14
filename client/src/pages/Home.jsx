import React, { useEffect, useState } from "react"
import axios from "axios"
import KomikCard from "../components/KomikCard"

export default function Home() {
  const [komikList, setKomikList] = useState([])

  useEffect(() => {
    axios.get("http://localhost:3000/api/komik") // pastikan backend Anda hidup
      .then(res => setKomikList(res.data))
      .catch(err => console.error(err))
  }, [])

  return (
    <div>
      <h1>Daftar Komik</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {komikList.map(komik => (
          <KomikCard key={komik._id} komik={komik} />
        ))}
      </div>
    </div>
  )
}
