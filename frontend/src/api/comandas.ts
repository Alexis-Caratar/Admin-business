// Comandas de meseros (/api/comandas) y gestión de mesas (/api/mesas).
// El negocio y el usuario los toma el servidor del token; los precios también.
import axios from "./axios";
import type { CategoriaCajero } from "../types/cajero";
import type { DocumentoTicket } from "../components/impresion/ticket";

const datos = <T,>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);
const conClave = (clave?: string) => (clave ? { headers: { "Idempotency-Key": clave } } : undefined);
export const nuevaClave = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

type RespuestaError = { response?: { status?: number; data?: { error?: string; message?: string; modulo_inactivo?: string; id_venta?: number } } };
export const errorDe = (e: unknown) => {
  const r = (e as RespuestaError)?.response;
  return { mensaje: r?.data?.error ?? r?.data?.message ?? "No se pudo completar la operación", status: r?.status, modulo_inactivo: r?.data?.modulo_inactivo, id_venta: r?.data?.id_venta };
};

export type EstadoComanda = "ABIERTA" | "EN_COBRO" | "PAGADA" | "ANULADA";
export type EstadoImpresion = "PENDIENTE" | "ENVIADA" | "CONFIRMADA" | "ERROR";
export type EstadoMesa = "DISPONIBLE" | "CON_PEDIDO" | "PENDIENTE_PAGO" | "OCUPADA" | "RESERVADA";

export type MesaEstado = {
  id: number; nombre: string; capacidad: number; estado: string; activo: boolean; estado_operativo: EstadoMesa;
  id_comanda: number | null; numero_comanda: number | null; estado_comanda: EstadoComanda | null; comanda_desde: string | null;
  id_mesero: number | null; mesero: string | null; id_venta_pendiente: number | null;
};
export type ComandaResumen = {
  id: number; numero: number; estado: EstadoComanda; nota: string | null; created_at: string; updated_at: string; id_mesa: number | null; mesa: string | null;
  id_mesero: number; mesero: string; id_venta: number | null; numero_factura: string | null; estado_pago: boolean | null; metodo_pago: string | null;
  total: number; unidades: number; tandas: number; impresion: EstadoImpresion | null;
};
export type ItemComanda = { id: number; tanda: number; id_producto: number; nombre: string; cantidad: number; precio_unitario: number; nota: string | null; created_at: string };
export type Impresion = { id: number; tanda: number | null; tipo: string; estado: EstadoImpresion; mensaje: string | null; created_at: string };
export type ComandaDetalle = ComandaResumen & {
  propia: boolean; items: ItemComanda[]; impresiones: Impresion[];
  historial: { evento: string; detalle: Record<string, unknown> | null; created_at: string; usuario: string | null }[];
};
export type ResultadoImpresionComanda = { id_impresion: number; tipo: string; tanda: number | null; estado: EstadoImpresion; ok: boolean; confirmado: boolean; mensaje: string; documento?: DocumentoTicket };
export type ItemPedido = { id_producto: number; cantidad: number; nota?: string | null };

// Mesero / caja
export const apiCatalogoComandas = () => datos<CategoriaCajero[]>(axios.get("/comandas/catalogo"));
export const apiMesasComandas = () => datos<MesaEstado[]>(axios.get("/comandas/mesas"));
export const apiComandas = (f: { pendientes?: "1"; estado?: string; fecha?: string; mias?: "1" } = {}) => datos<ComandaResumen[]>(axios.get("/comandas", { params: f }));
export const apiComanda = (id: number) => datos<ComandaDetalle>(axios.get(`/comandas/${id}`));
export const apiCrearComanda = (d: { id_mesa: number; nota?: string; items: ItemPedido[] }, clave: string) =>
  datos<ComandaDetalle & { impresion: ResultadoImpresionComanda | null; repetido: boolean }>(axios.post("/comandas", d, conClave(clave)));
export const apiAdicionar = (id: number, items: ItemPedido[], clave: string) =>
  datos<ComandaDetalle & { impresion: ResultadoImpresionComanda | null; tanda: number }>(axios.post(`/comandas/${id}/items`, { items }, conClave(clave)));
export const apiReimprimir = (id: number, tanda?: number) => datos<{ impresion: ResultadoImpresionComanda }>(axios.post(`/comandas/${id}/imprimir`, { tanda }));
export const apiAnularComanda = (id: number, motivo: string) => datos<{ ok: boolean }>(axios.post(`/comandas/${id}/anular`, { motivo }));
export const apiPasarACobro = (id: number) => datos<{ id_venta: number; id_mesa: number; total: number }>(axios.post(`/comandas/${id}/cobrar`));

// Gestión de mesas
export const apiMesasAdmin = () => datos<MesaEstado[]>(axios.get("/mesas"));
export const apiGuardarMesa = (d: { id?: number; nombre: string; capacidad: number }) =>
  datos<MesaEstado>(d.id ? axios.put(`/mesas/${d.id}`, d) : axios.post("/mesas", d));
export const apiActivarMesa = (id: number, activo: boolean) => datos<MesaEstado>(axios.put(`/mesas/${id}/activo`, { activo }));

export const ESTADO_COMANDA: Record<EstadoComanda, { texto: string; color: "warning" | "info" | "success" | "default" }> = {
  ABIERTA: { texto: "En preparación", color: "warning" },
  EN_COBRO: { texto: "Pendiente de pago", color: "info" },
  PAGADA: { texto: "Pagada", color: "success" },
  ANULADA: { texto: "Anulada", color: "default" },
};
export const ESTADO_IMPRESION: Record<EstadoImpresion, { texto: string; color: "success" | "info" | "error" | "default" }> = {
  CONFIRMADA: { texto: "Impresa", color: "success" },
  ENVIADA: { texto: "Enviada (sin confirmar)", color: "info" },
  PENDIENTE: { texto: "Pendiente de impresión", color: "default" },
  ERROR: { texto: "Error de impresión", color: "error" },
};
export const ESTADO_MESA: Record<EstadoMesa, { texto: string; color: string; fondo: string }> = {
  DISPONIBLE: { texto: "Disponible", color: "#166534", fondo: "#DCFCE7" },
  CON_PEDIDO: { texto: "Con pedido", color: "#92400E", fondo: "#FEF3C7" },
  PENDIENTE_PAGO: { texto: "Pendiente de pago", color: "#1E40AF", fondo: "#DBEAFE" },
  OCUPADA: { texto: "Ocupada", color: "#9F1239", fondo: "#FFE4E6" },
  RESERVADA: { texto: "Reservada", color: "#5B21B6", fondo: "#EDE9FE" },
};
