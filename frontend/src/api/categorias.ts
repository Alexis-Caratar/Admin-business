import axios from "./axios";
import type { Categoria } from "../types/categorias.ts";

// Obtener categorías por negocio
export const getCategorias = async (id_negocio: string) => {
  const { data } = await axios.get(`/categorias/${id_negocio}`);
  return data.data as Categoria[];
};

// Crear categoría
export const crearCategoria = async (payload: Partial<Categoria>) => {
  const { data } = await axios.post("/categorias", payload);
  return data.data as Categoria;
};

// Actualizar categoría
export const actualizarCategoria = async (
  id: number,
  payload: Partial<Categoria>
) => {
  const { data } = await axios.put(`/categorias/${id}`, payload);
  return data.data as Categoria;
};

// Eliminar categoría
export const eliminarCategoria = async (id: number) => {
  const { data } = await axios.delete(`/categorias/${id}`);
  return data;
};
