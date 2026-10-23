// Cliente de Tiqueteras (/api/tiqueteras) y del portal público (/api/tiqueteras-portal).
// El negocio lo toma el servidor del usuario: nunca se envía desde aquí.
import axios from "./axios";

const datos = <T,>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);
// Una clave por intento: si la red reintenta o hay doble clic, el servidor no repite la operación
const conClave = (clave: string) => ({ headers: { "Idempotency-Key": clave } });
export const nuevaClave = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export type TipoTiquetera = { id: number; nombre: string; almuerzos: number; precio: number; vigencia_dias: number | null; activo: boolean };
export type Tiquetera = {
  id: number; codigo: string; id_cliente: number; cliente: string; identificacion: string; telefono: string | null; tipo: string;
  almuerzos_total: number; consumidos: number; disponibles: number; valor_pagado: number; valor_almuerzo: number; metodo_pago: string;
  fecha_compra: string; fecha_vencimiento: string | null; estado: "ACTIVA" | "AGOTADA" | "ANULADA"; vencida: boolean; utilizable: boolean; token_portal: string;
};
export type ItemCarrito = { id_producto: number; nombre?: string; cantidad: number; precio_unitario: number; descuento: number; descuento_porcentaje: number; impuesto: number; subtotal: number };
export type VentaCarrito = { id_caja: number | null; id_cliente?: number | null; id_mesa?: number | null; mesa?: string | null; nota?: string | null; subtotal: number; total: number; productos: ItemCarrito[] };
export type Previa = {
  almuerzos: number; productos_tiquetera: { id_producto: number; nombre: string; cantidad: number }[];
  acompanan: { id_producto: number; nombre: string; cantidad: number }[];  // complementos incluidos (no descuentan)
  otros: { id_producto: number; nombre: string; cantidad: number; subtotal: number }[]; total_otros: number;
};
export type Consumo = {
  tiquetera: { id: number; codigo: string; cliente: string; almuerzos_total: number };
  venta: { id_venta: number; numero_factura: string; total: number; almuerzos: number };
  venta_resto: { id_venta: number; numero_factura: string; total: number; metodo_pago: string } | null;
  antes: { consumidos: number; disponibles: number }; despues: { consumidos: number; disponibles: number }; fecha: string; repetido?: boolean;
};
export type MovimientoTiquetera = {
  id: number; fecha: string; codigo: string; id_tiquetera: number; cliente: string; producto: string; cantidad: number; valor_almuerzo: number;
  numero_factura: string; id_venta: number; estado_venta: string; estado: "CONSUMIDO" | "REINTEGRADO"; cajero: string | null;
  reintegrado_en: string | null; motivo_reintegro: string | null; reintegrado_por: string | null;
};
export type Elegibilidad = {
  categorias: { id: number; nombre: string; tiquetera_elegible: boolean }[];
  productos: { id: number; nombre: string; categoria: string; excepcion: boolean | null; elegible: boolean; es_complemento: boolean }[];
};
export type Portal = {
  negocio: { nombre: string; url_negocio: string } | null; codigo: string; cliente: string; tipo: string; almuerzos_total: number; consumidos: number; disponibles: number;
  fecha_compra: string; fecha_vencimiento: string | null; estado: "ACTIVA" | "AGOTADA" | "ANULADA" | "VENCIDA";
  consumos: { fecha: string; dia: string; producto: string; cantidad: number; estado: "CONSUMIDO" | "REINTEGRADO" }[];
};

// Mensaje legible de un error del servidor (y datos extra como disponibles / requiere_metodo_resto)
type RespuestaError = { response?: { data?: { error?: string; message?: string; disponibles?: number; requiere_metodo_resto?: boolean } } };
export const errorDe = (e: unknown): { mensaje: string; disponibles?: number; requiere_metodo_resto?: boolean } => {
  const d = (e as RespuestaError)?.response?.data;
  return { mensaje: d?.error ?? d?.message ?? "No se pudo completar la operación", disponibles: d?.disponibles, requiere_metodo_resto: d?.requiere_metodo_resto };
};

// Caja
export const apiTiposTiquetera = () => datos<TipoTiquetera[]>(axios.get("/tiqueteras/tipos"));
export const apiBuscarTiqueteras = (q: string) => datos<Tiquetera[]>(axios.get("/tiqueteras/buscar", { params: { q } }));
export const apiVenderTiquetera = (d: { id_cliente: number; id_tipo: number; metodo_pago: string; monto_recibido?: number }, clave: string) =>
  datos<{ tiquetera: Tiquetera; cambio: number }>(axios.post("/tiqueteras", d, conClave(clave)));
export const apiPrevisualizar = (d: { id_venta?: number; productos?: ItemCarrito[] }) => datos<Previa>(axios.post("/tiqueteras/previsualizar", d));
export const apiConsumir = (d: { id_tiquetera: number; id_venta?: number; venta?: VentaCarrito; metodo_resto?: string; monto_recibido_resto?: number }, clave: string) =>
  datos<Consumo>(axios.post("/tiqueteras/consumir", d, conClave(clave)));

// Administración (módulo Ventas)
export const apiGuardarTipo = (d: Partial<TipoTiquetera>) => datos<TipoTiquetera>(d.id ? axios.put(`/tiqueteras/tipos/${d.id}`, d) : axios.post("/tiqueteras/tipos", d));
export const apiListarTiqueteras = (f: { estado?: string; q?: string } = {}) => datos<Tiquetera[]>(axios.get("/tiqueteras", { params: f }));
export const apiHistorialTiqueteras = (f: { id_tiquetera?: number; desde?: string; hasta?: string } = {}) => datos<MovimientoTiquetera[]>(axios.get("/tiqueteras/historial", { params: f }));
export const apiAnularTiquetera = (id: number, motivo: string) => datos<{ ok: boolean; reembolso: number; nota: string }>(axios.post(`/tiqueteras/${id}/anular`, { motivo }));
export const apiElegibilidad = () => datos<Elegibilidad>(axios.get("/tiqueteras/elegibilidad"));
export const apiGuardarElegibilidad = (d: { categorias: { id: number; tiquetera_elegible: boolean }[]; productos: { id: number; excepcion: boolean | null }[] }) =>
  datos<{ ok: boolean }>(axios.put("/tiqueteras/elegibilidad", d));

// Portal público del cliente
export const apiPortal = (token: string) => datos<Portal>(axios.get(`/tiqueteras-portal/${token}`));
export const apiBuscarPortal = (d: { negocio: string; codigo: string; documento: string }) => datos<{ token: string }>(axios.post("/tiqueteras-portal/buscar", d));
export const enlacePortal = (token: string) => `${window.location.origin}/tiquetera/${token}`;
