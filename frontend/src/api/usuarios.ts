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


export const updateUsuarioCompleto = async (data: any) => {
  try {
    const res = await axios.put("/usuarios/actualizar", data);
    return res.data;
  } catch (error: any) {
    console.error("Error PUT /actualizar:", error);
    throw error.response?.data || error;
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


export const getMenusNegocio = async (id: number) => {
  try {
    const { data } = await axios.get(`/usuarios/menusnegocio/${id}`);
    return data;
  } catch (error) {
    console.error(`Error llamar menusnegocio /usuarios/${id}:`, error);
    throw error;
  }
};


export const getMenusUsuario = async (id: number,idNegocio:number) => {
  try {
    const { data } = await axios.get(`/usuarios/menus_usuario/${id}/${idNegocio}`);
    console.log("data",data);
    
    return data;
  } catch (error) {
    console.error(`Error llamaer menus_usuarios /usuarios/${id}:`, error);
    throw error;
  }
};

export const asignarMenuUsuario = async (id: number, id_menu: number[]) => {
  try {
    console.log("id", id);
    console.log("id_menu", id_menu);

    const { data } = await axios.post(`/usuarios/menus_usuariocrear`, {
      id,
      id_menu
    });

    console.log("data", data);
    return data;
  } catch (error) {
    console.error(`Error llamar menus_usuarios /usuarios/${id}:`, error);
    throw error;
  }
};