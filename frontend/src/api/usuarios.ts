import axios from "./axios";
import type { User } from "../types";

export const getUsuarios = async () => {
  try {
    const id_negocio=localStorage.getItem("id_negocio") ?? "";
     const { data } = await axios.get<User[]>("/usuarios", {
      params: { id_negocio }
    });
    return data;
  } catch (error) {
    console.error("Error GET /usuarios:", error);
    return [];
  }
};

export const createUsuarioCompleto = async (data:any) => {
  const res = await axios.post("/usuarios", data);
  return res.data;
};


export const updateUsuario = async (id: number, payload: Partial<User>) => {
  try {
    const { data } = await axios.put(`/usuarios/${id}`, payload);
    return data;
  } catch (error) {
    console.error(`Error PUT /usuarios/${id}:`, error);
    throw error;
  }
};

export const deleteUsuario = async (id: number) => {
  try {
    const { data } = await axios.delete(`/usuarios/${id}`);
    return data;
  } catch (error) {
    console.error(`Error DELETE /usuarios/${id}:`, error);
    throw error;
  }
};
