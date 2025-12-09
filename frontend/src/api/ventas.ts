import axios from "./axios";
import type { Venta, VentaPayload, VentaItem } from "../types/ventas";

// -------------------------------------------------------------------
// GET: Listar ventas
// -------------------------------------------------------------------

export const getVentas = async () => {
  try {
    const id_negocio = localStorage.getItem("id_negocio") ?? "";
    const { data } = await axios.get("/ventas", {
      params: { id_negocio },
    });
    return data;
  } catch (err) {
    console.error("Error GET /ventas:", err);
    return { ventas: [] };
  }
};


// -------------------------------------------------------------------
// GET: Obtener venta por ID
// -------------------------------------------------------------------
export const getVentaById = async (id: number) => {
  try {
    const { data } = await axios.get<Venta>(`/ventas/${id}`);
    return data;
  } catch (error) {
    console.error("Error GET /ventas/:id:", error);
    return null;
  }
};

// -------------------------------------------------------------------
// POST: Crear venta (con items)
// -------------------------------------------------------------------
export const createVenta = async (payload: VentaPayload) => {
  try {
    const id_negocio = localStorage.getItem("id_negocio") ?? "";
    const { data } = await axios.post("/ventas", {
      ...payload,
      id_negocio,
    });

    return data;
  } catch (error) {
    console.error("Error POST /ventas:", error);
    throw error;
  }
};

// -------------------------------------------------------------------
// PUT: Actualizar venta
// -------------------------------------------------------------------
export const updateVenta = async (id: number, payload: VentaPayload) => {
  try {
    const { data } = await axios.put(`/ventas/${id}`, payload);
    return data;
  } catch (error) {
    console.error("Error PUT /ventas/:id:", error);
    throw error;
  }
};

// -------------------------------------------------------------------
// DELETE: Eliminar venta
// -------------------------------------------------------------------
export const deleteVenta = async (id: number) => {
  try {
    const { data } = await axios.delete(`/ventas/${id}`);
    return data;
  } catch (error) {
    console.error("Error DELETE /ventas/:id:", error);
    throw error;
  }
};
