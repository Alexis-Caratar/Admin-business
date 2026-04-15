import axios from "./axios";

export const estado_caja = (data: any) =>
  axios.post("/cajero/estado-caja", data);

export const apiListarProductos = (id:any) =>
  axios.get(`/cajero/productos/${id}`);

export const apiAbrirCaja = (data: any) =>
  axios.post("/cajero/abrir-caja", data);

export const apiCerrarCaja = (data: any) =>
  axios.post("/cajero/cerrar-caja", data);

export const apiArqueoCaja = (data: any) =>
  axios.post("/cajero/arqueo", data);

export const finalizar_venta = (payload: any) => 
  axios.post("/cajero/finalizar-venta", payload);

export const apibuscar_cliente = (payload: any) => 
  axios.post("/cajero/buscar-cliente", payload);

export const apicrear_cliente = (payload: any) => 
  axios.post("/cajero/crear_cliente", payload);

export const apimesas = (payload: any) => 
  axios.post("/cajero/mesas", payload);

export const apidetallesMesa = (payload: any) => 
  axios.post("/cajero/detallesMesa", payload);

export const egresosListar = async (id_negocio: number,id_caja: number
) => {
  const { data } = await axios.get(`/cajero/egresos/${id_negocio}/${id_caja}` );
  return data;
};

export const egresoCrear = (payload:any ) => {
  return axios.post("/cajero/egreso", payload);
};

export const egresoActualizar = (
  id: number,
  payload:any 
) => {
  return axios.put(`/cajero/egreso/${id}`, payload);
};

export const egresoEliminar = (id: number,idUsuario:number) => {
  return axios.delete(`/cajero/egreso/${id}/${idUsuario}`);
};


export const actualiza_venta = (payload: any) => 
  axios.post("/cajero/actualizar_venta", payload);


export const liberar_mesa = (id_mesa: any,id_negocio:any) => {
  return axios.get(`/cajero/liberar_mesa/${id_mesa}/${id_negocio}`);
};

export const facturaPorCaja = (data:any) => {
  return axios.post(`cajero/factura-por-caja`, data);
};

export const productosPorVenta = (data:any) => {
  return axios.post(`cajero/factura-por-detalle`, data);
};


export const imprimirfactura = (data:any) => {
  return axios.post(`cajero/imprimirfactura`, data);
};

export const imprimircomanda = (data:any) => {
  return axios.post(`cajero/imprimirComanda`, data);
};

export const cancelarFactura = (data:any) => {
  return axios.post(`cajero/cancelarFactura`, data);
};

export const apiObtenerInventario = (data:any) => {
  return axios.post(`cajero/obtener-inventario`, data);
};

export const apiGuardarInventario = (data:any) => {
  return axios.post(`cajero/guardar-inventario`, data);
};
