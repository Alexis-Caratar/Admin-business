import type { ResultadoImpresion } from "../components/impresion/ticket";
import axios from "./axios";

export type EstadoPedido = "PENDIENTE" | "CONFIRMADO" | "EN_PREPARACION" | "LISTO" | "EN_CAMINO" | "ENTREGADO" | "CANCELADO";
export type EstadoPago = "PENDIENTE" | "APROBADO" | "RECHAZADO" | "ANULADO" | "REEMBOLSO_PENDIENTE";

export type PedidoResumen = {
  id: number;
  codigo: string;
  created_at: string;
  nombre_cliente: string;
  telefono: string;
  tipo_entrega: "DOMICILIO" | "RECOGER";
  direccion: string | null;
  barrio: string | null;
  observacion: string | null;
  subtotal: number;
  costo_domicilio: number;
  total: number;
  metodo_pago: "EN_LINEA" | "CONTRAENTREGA";
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  id_venta: number | null;
  id_caja: number | null;
  version: number;
  numero_factura: string | null;
  items: { nombre: string; cantidad: number; adicional: boolean }[];
};

export type ItemPedido = { id: number; nombre: string; cantidad: number; precio_unitario: number; subtotal: number; adicionales: ItemPedido[] };

export type PedidoDetalle = Omit<PedidoResumen, "items" | "numero_factura"> & {
  email: string | null;
  referencias: string | null;
  updated_at: string;
  items: ItemPedido[];
  historial: { campo: string; valor_anterior: string | null; valor_nuevo: string | null; origen: string; nota: string | null; created_at: string; usuario: string | null }[];
  transacciones: { referencia: string; id_transaccion_proveedor: string | null; estado: string; metodo: string | null; monto_centavos: number; created_at: string }[];
  venta: { numero_factura: string; estado: string; metodo_pago: string; estado_pago: boolean } | null;
  siguientes_estados: EstadoPedido[];
  whatsapp: {
    automatico: boolean;
    autorizado: boolean;
    mensajes: { evento: string; estado: "PENDIENTE" | "ENVIADO" | "ERROR"; intentos: number; error: string | null; created_at: string; enviado_at: string | null }[];
    manual: { evento: string; texto: string; url: string } | null;
  };
};

export type FiltrosPedidos = {
  fecha?: string;
  desde?: string;
  hasta?: string;
  pendientes?: "1";
  estado?: string;
  estado_pago?: string;
  metodo_pago?: string;
  tipo_entrega?: string;
  q?: string;
};

const datos = <T,>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

export type ResumenPedidos = {
  totales: {
    pedidos: number; cancelados: number; entregados: number; en_curso: number;
    ventas_pagadas: number; por_cobrar: number; ticket_promedio: number;
    en_linea: number; contraentrega: number; domicilios: number;
    reembolsos_pendientes: number; pagos_rechazados: number;
  };
  por_dia: { fecha: string; pedidos: number; total: number }[];
  por_estado: { estado: EstadoPedido; cantidad: number }[];
  productos: { nombre: string; cantidad: number; total: number }[];
};

export const resumenPedidos = (desde: string, hasta: string) =>
  datos<ResumenPedidos>(axios.get("/pedidos/resumen", { params: { desde, hasta } }));

export const listarPedidos = (filtros: FiltrosPedidos) => datos<PedidoResumen[]>(axios.get("/pedidos", { params: filtros }));
export const detallePedido = (id: number) => datos<PedidoDetalle>(axios.get(`/pedidos/${id}`));
export const cambiarEstadoPedido = (id: number, estado: EstadoPedido, version: number, nota?: string) =>
  datos<PedidoDetalle>(axios.patch(`/pedidos/${id}/estado`, { estado, version, nota }));
export const registrarPagoPedido = (id: number, metodo_pago: string, monto_recibido: number, version: number) =>
  datos<PedidoDetalle>(axios.post(`/pedidos/${id}/pago`, { metodo_pago, monto_recibido, version }));
export const agregarNotaPedido = (id: number, nota: string) => datos<PedidoDetalle>(axios.post(`/pedidos/${id}/notas`, { nota }));
export const imprimirPedido = (id: number) => datos<ResultadoImpresion>(axios.post(`/pedidos/${id}/imprimir`));

/** Mensaje de error del backend (409: conflicto de versión, caja cerrada, etc.) */
export const mensajeError = (e: unknown) =>
  (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "No se pudo completar la acción";
