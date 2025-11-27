import axios from "./axios";
import type{ Producto } from "../types";

export const getProductos = async (id:number) => {
  const { data } = await axios.get<Producto[]>(`/productos/categorias/${id}`);
  return data;
};

export const crearProducto = async (payload: Partial<Producto>) => {
  const { data } = await axios.post("/productos", payload);
  return data;
};

export const actualizarProducto = async (id: number, payload: Partial<Producto>) => {
  const { data } = await axios.put(`/productos/${id}`, payload);
  return data;
};

export const eliminarProducto = async (id: number) => {
  await axios.delete(`/productos/${id}`);
};
