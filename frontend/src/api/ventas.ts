import axios from "./axios";


export const getResumenVentas = async (
  tipoFiltro = "hoy",
  fechaInicio = "",
  fechaFin = ""
) => {
  try {
    const id_negocio = localStorage.getItem("id_negocio") ?? "";
    const { data } = await axios.get("/ventas/resumen", {
      params: {id_negocio,tipoFiltro,fechaInicio,fechaFin,},
    });

    return data;
  } catch (err) {
    console.error("Error GET /ventas/resumen:", err);
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


