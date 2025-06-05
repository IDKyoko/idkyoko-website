export async function getServerSideProps(context) {
    const { id } = context.params;
    const res = await fetch(`http://localhost:3001/api/komik/${id}`);
    const data = await res.json();
    return { props: { komik: data } };
  }
  
  export default function DetailKomik({ komik }) {
    return (
      <div>
        <h1>{komik.judul}</h1>
        <img src={komik.cover} alt={komik.judul} />
      </div>
    );
  }