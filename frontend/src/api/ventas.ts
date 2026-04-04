import axios from "./axios";

// -------------------------------------------------------------------
// GET: Listar ventas
// -------------------------------------------------------------------

export const getResumenVentas = async () => {
  try {
    const id_negocio = localStorage.getItem("id_negocio") ?? "";
    const { data } = await axios.get("/ventas/resumen", {
      params: { id_negocio },
    });
    return data;
  } catch (err) {
    console.error("Error GET /ventas:", err);
    return { ventas: [] };
  }
};

export const getVentasPorDia = async (fecha:string) => {
  try {
    const id_negocio = localStorage.getItem("id_negocio") ?? "";
    const { data } = await axios.get("/ventas/listar", {
      params: { id_negocio,fecha },
    });
    return data;
  } catch (err) {
    console.error("Error GET /ventas:", err);
    return { ventas: [] };
  }
};


