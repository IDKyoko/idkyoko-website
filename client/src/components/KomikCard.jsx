import React from "react"
import { Link } from "react-router-dom"

export default function KomikCard({ komik }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", width: "200px" }}>
      <Link to={`/komik/${komik._id}`}>
        <img src={`/covers/${komik.cover}`} alt={komik.judul} width="100%" />
        <h3>{komik.judul}</h3>
      </Link>
    </div>
  )
}
