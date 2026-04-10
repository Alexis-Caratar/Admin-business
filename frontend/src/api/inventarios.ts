import axios from "./axios";
import type {
  InventarioFisico} from "../types/inventario";

// Helper para manejar respuestas
const handleResponse = (res: any) => res?.data?.data ?? res?.data;

// Crear inventario
export const crearInventario = async (
  payload: Partial<InventarioFisico>
): Promise<InventarioFisico> => {
  try {
    const res = await axios.post("/inventario", payload);
    return handleResponse(res);
  } catch (error) {
    console.error("Error creando inventario:", error);
    throw error;
  }
};

// Listar inventarios
export const getInventarios = async (): Promise<InventarioFisico[]> => {
  try {
    const res = await axios.get("/inventario");
    return handleResponse(res);
  } catch (error) {
    console.error("Error obteniendo inventarios:", error);
    throw error;
  }
};

// Actualizar inventario
export const actualizarInventario = async (
  id: number,
  payload: Partial<InventarioFisico>
): Promise<InventarioFisico> => {
  try {
    const res = await axios.put(`/inventario/${id}`, payload);
    return handleResponse(res);
  } catch (error) {
    console.error("Error actualizando inventario:", error);
    throw error;
  }
};

// Eliminar inventario
export const deleteInventario = async (id: number): Promise<any> => {
  try {
    const res = await axios.delete(`/inventario/${id}`);
    return handleResponse(res);
  } catch (error) {
    console.error("Error eliminando inventario:", error);
    throw error;
  }
};


// 📋 Listar movimientos por inventario
export const getMovimientos = async (inventario_id: number) => {
  const { data } = await axios.get(`/inventario/movimientos/${inventario_id}`);
  return data;
};

// ➕ Crear movimiento (ENTRADA / SALIDA)
export const crearMovimiento = async (payload: {
  inventario_id: number;
  tipo: string;
  cantidad: number;
  costo_unitario?: number;
  observacion?: string;
}) => {
  const { data } = await axios.post(`/inventario/movimientos`, payload);
  return data;
};

// ❌ Eliminar movimiento
export const eliminarMovimiento = async (id: number) => {
  const { data } = await axios.delete(`/inventario/movimientos/${id}`);
  return data;
};
