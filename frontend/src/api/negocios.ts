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
