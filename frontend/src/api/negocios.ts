import axios from "./axios";
import type { Negocio } from "../types";

export const getNegocios = async () => {
  const { data } = await axios.get<Negocio[]>("/negocios");
  return data;
};

export const optenerNegocios = async (id: number) => {
  const { data } = await axios.get<Negocio[]>(`/negocios/${id}`);
  return data;
};

export const crearNegocio = async (payload: Partial<Negocio>) => {
  const { data } = await axios.post("/negocios", payload);
  return data;
};

export const actualizarNegocio = async (id: number, payload: Partial<Negocio>) => {
  const { data } = await axios.put(`/negocios/${id}`, payload);
  return data;
};

export const eliminarNegocio = async (id: number) => {
  await axios.delete(`/negocios/${id}`);
};

export const getMenusempresaTotal = async () => {
  try {
    const { data } = await axios.post(`/negocios/menusnegocio`);    
    return data;
  } catch (error) {
    console.error(`Error llamar menusnegocio /usuarios`, error);
    throw error;
  }
};


export const getMenusEmpresa= async (idNegocio:number) => {
  try {
    const { data } = await axios.get(`/negocios/menus_usuario/${idNegocio}`);    
    return data;
  } catch (error) {
    console.error(`Error llamaer negocios /negocios/:`, error);
    throw error;
  }
};

export const asignarMenuEmpresa = async (id: number, id_menu: number[]) => {
  try {
    const { data } = await axios.post(`/negocios/menus_usuariocrear`, {
      id,
      id_menu
    });

    return data;
  } catch (error) {
    console.error(`Error llamar negocios /negocios/${id}:`, error);
    throw error;
  }
};
