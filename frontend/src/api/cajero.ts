import axios from "./axios";

export const estado_caja = (data: any) =>
  axios.post("/cajero/estado-caja", data);

export const apiListarProductos = () =>
  axios.get("/cajero/productos");

export const apiAbrirCaja = (data: any) =>
  axios.post("/cajero/abrir-caja", data);

export const apiCerrarCaja = (data: any) =>
  axios.post("/cajero/cerrar-caja", data);

export const apiArqueoCaja = (data: any) =>
  axios.post("/cajero/arqueo", data);

export const finalizar_venta = (payload: any) => 
  axios.post("/cajero/finalizar-venta", payload);