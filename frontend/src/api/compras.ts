import type { CompraRequest } from "../types/compras";
import axios from "./axios";

export const getCompras = async () => {
  try {
    const id_negocio =
      localStorage.getItem("id_negocio") ?? "";

    const { data } = await axios.get(
      "/compras/listar",
      {
        params: { id_negocio },
      }
    );

    return data;
  } catch (err) {
    console.error(
      "Error GET /compras/listar:",
      err
    );

    return { compras: [] };
  }
};

export const getDetalleCompra = async (
  id_compra: number
) => {
  try {
    const { data } = await axios.get(
      "/compras/detalle",
      {
        params: { id_compra },
      }
    );

    return data;
  } catch (err) {
    console.error(
      "Error GET /compras/detalle:",
      err
    );

    return { items: [] };
  }
};

export const crearCompra = async (
  compra: CompraRequest
) => {
  try {
    const { data } = await axios.post(
      "/compras/crear",
      compra
    );

    return data;
  } catch (err) {
    console.error(
      "Error POST /compras/crear:",
      err
    );

    throw err;
  }
};