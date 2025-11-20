import axios from "./axios";
import type {
  InventarioFisico,
  InventarioFisicoDetalle,
  InventarioConDetalles
} from "../types/inventario";

// Crear inventario
export const crearInventario = async (payload: Partial<InventarioFisico>) => {
  const { data } = await axios.post("/inventario", payload);
  return data.data as InventarioFisico;
};

// Agregar detalle a un inventario
export const agregarDetalleInventario = async (
  idInventario: number,
  payload: Partial<InventarioFisicoDetalle>
) => {
  const { data } = await axios.post(`/inventario/${idInventario}/detalle`, payload);
  return data.data as InventarioFisicoDetalle;
};

// Listar inventarios
export const getInventarios = async () => {
  const { data } = await axios.get("/inventario");
  return data.data as InventarioFisico[];
};

// Obtener un inventario con detalles
export const getInventarioById = async (id: number) => {
  const { data } = await axios.get(`/inventario/${id}`);
  return data.data as InventarioConDetalles;
};

// Eliminar inventario
export const deleteInventario = async (id: number) => {
  const { data } = await axios.delete(`/inventario/${id}`);
  return data;
};
