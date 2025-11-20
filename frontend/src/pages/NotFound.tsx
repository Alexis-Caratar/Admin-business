import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <img
          src="https://franklinbelen.com/wp-content/uploads/cual-es-el-error-404-not-fund.jpg"
          alt="Not found"
          style={styles.image}
        />
        <h1>Not Found - 404</h1>
        <h1 style={styles.title}>Página no encontrada</h1>
        <p style={styles.text}>
          Lo sentimos, no pudimos encontrar la página que buscas.
        </p>

        <button style={styles.btn} onClick={() => navigate("/")}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

const styles: any = {
  container: {
    height: "100vh",
    width: "100vw",
    backgroundColor: "#F5F7FA",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "Inter, sans-serif",
  },
  box: {
    textAlign: "center",
    background: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    maxWidth: "450px",
  },
  image: {
    width: "230px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "26px",
    fontWeight: 700,
    marginBottom: "10px",
    color: "#1e293b",
  },
  text: {
    fontSize: "16px",
    color: "#475569",
    marginBottom: "25px",
  },
  btn: {
    backgroundColor: "#2563eb",
    color: "white",
    padding: "12px 22px",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    cursor: "pointer",
    transition: "0.25s",
  },
};

export default NotFound;
