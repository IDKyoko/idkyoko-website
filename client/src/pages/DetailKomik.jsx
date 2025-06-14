import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"

export default function DetailKomik() {
  const { id } = useParams()
  const [komik, setKomik] = useState(null)

  useEffect(() => {
    axios.get(`http://localhost:3000/api/komik/${id}`)
      .then(res => setKomik(res.data))
      .catch(err => console.error(err))
  }, [id])

  if (!komik) return <p>Loading...</p>

  return (
    <div>
      <h1>{komik.judul}</h1>
      <img src={`/covers/${komik.cover}`} alt={komik.judul} width="200px" />
      <p>Deskripsi: {komik.deskripsi}</p>
      {/* Anda bisa tambahkan list chapter di sini */}
    </div>
  )
}
