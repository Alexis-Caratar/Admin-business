/*
 * API pública de la tienda. Los precios que se muestran son informativos:
 * el backend recalcula todo al crear el pedido.
 */
import { API } from "../landing/siteConfig";

export type Complemento = {
  id_producto_complemento: number;
  nombre: string;
  precio_venta: number;
  obligatorio: boolean;
  tipo_seleccion: string;
  orden: number;
};

export type PlatoTienda = {
  id: number;
  nombre: string;
  descripcion: string | null;
  marca?: string | null;
  precio_venta: number;
  /** Solo viene si es una promoción real (mayor que el precio de venta) */
  precio_anterior?: number | null;
  stock_actual: number | null;
  destacado?: boolean;
  id_producto_base?: number | null;
  variante_nombre?: string | null;
  variante_color?: string | null;
  imagenes: string[];
  productos_complementos: Complemento[];
};

export type Variante = {
  id: number; nombre: string; variante_nombre: string | null; variante_color: string | null; sku: string | null;
  precio_venta: number; precio_anterior: number | null; stock_actual: number | null; disponible: boolean; imagen: string | null;
};

export type ProductoDetalle = Omit<PlatoTienda, "stock_actual"> & {
  descripcion_detallada: string | null; sku: string | null;
  caracteristicas: string[]; atributos: { nombre: string; valor: string }[];
  modo_uso: string | null; ingredientes: string | null; cuidados: string | null; advertencias: string | null; fabricante: string | null;
  id_categoria: number; categoria: string; stock_actual: number | null; disponible: boolean; en_horario: boolean;
  variantes: Variante[];
};

export type CategoriaTienda = { id: number; categoria: string; imagen: string | null; platos: PlatoTienda[] };

export type EstadoTienda = {
  nombre: string;
  activa?: boolean;
  abierta: boolean;
  motivo: string | null;
  horarios: { dia_semana: number; hora_apertura: string; hora_cierre: string }[];
  entrega: { domicilio: boolean; recoger: boolean; costo_domicilio: number; domicilio_gratis_desde: number | null };
  pedido_minimo: number | null;
  pagos: { en_linea: boolean; contraentrega: boolean };
};

export type SolicitudPedido = {
  cliente: { nombre: string; telefono: string; email?: string };
  entrega: { tipo: "DOMICILIO" | "RECOGER"; direccion?: string; barrio?: string; referencias?: string };
  metodo_pago: "EN_LINEA" | "CONTRAENTREGA";
  observacion?: string;
  /** El cliente acepta recibir avisos del pedido por WhatsApp */
  avisos_whatsapp?: boolean;
  items: { id_producto: number; cantidad: number; complementos: number[] }[];
};

export type PedidoCreado = {
  codigo: string;
  token: string;
  estado: string;
  estado_pago: string;
  metodo_pago: string;
  total: number;
  pago: { checkout_url: string } | null;
};

export type PedidoPublico = {
  codigo: string;
  url_negocio: string | null;
  fecha: string;
  nombre_cliente: string;
  estado: string;
  estado_pago: string;
  metodo_pago: "EN_LINEA" | "CONTRAENTREGA";
  tipo_entrega: "DOMICILIO" | "RECOGER";
  direccion: string | null;
  subtotal: number;
  costo_domicilio: number;
  total: number;
  items: { nombre: string; cantidad: number; precio_unitario: number; subtotal: number; adicionales: { nombre: string; subtotal: number }[] }[];
  pago_en_proceso: boolean;
  puede_reintentar_pago: boolean;
};

/** Error de la API con el detalle por campo que devuelve el backend */
export class ErrorTienda extends Error {
  status: number;
  errores?: Record<string, string>;
  idProducto?: number;
  constructor(status: number, mensaje: string, errores?: Record<string, string>, idProducto?: number) {
    super(mensaje);
    this.status = status;
    this.errores = errores;
    this.idProducto = idProducto;
  }
}

async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${ruta}`, {
      ...init,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  } catch {
    throw new ErrorTienda(0, "No hay conexión. Revisa tu internet e intenta de nuevo.");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ErrorTienda(res.status, json.error ?? "Ocurrió un error, intenta de nuevo.", json.errores, json.id_producto);
  }
  return json as T;
}

/* `negocio` es la url_negocio del sitio (ej. "punto-urbano") */
export const obtenerCatalogo = (negocio: string, signal?: AbortSignal) =>
  pedir<{ tienda: EstadoTienda; productos: CategoriaTienda[] }>(`/tienda/${encodeURIComponent(negocio)}/catalogo`, { signal });

export const obtenerProducto = (negocio: string, id: number, signal?: AbortSignal) =>
  pedir<{ tienda: EstadoTienda; producto: ProductoDetalle; relacionados: PlatoTienda[] }>(
    `/tienda/${encodeURIComponent(negocio)}/productos/${id}`, { signal });

export const crearPedido = (negocio: string, solicitud: SolicitudPedido, claveIdempotencia: string) =>
  pedir<{ pedido: PedidoCreado }>(`/tienda/${encodeURIComponent(negocio)}/pedidos`, {
    method: "POST",
    body: JSON.stringify(solicitud),
    headers: { "Idempotency-Key": claveIdempotencia },
  }).then((r) => r.pedido);

export const consultarPedido = (codigo: string, token: string, idTransaccion?: string | null) =>
  pedir<{ pedido: PedidoPublico }>(
    `/tienda/pedidos/${encodeURIComponent(codigo)}/${encodeURIComponent(token)}${idTransaccion ? `?id=${encodeURIComponent(idTransaccion)}` : ""}`
  ).then((r) => r.pedido);

export const reintentarPago = (codigo: string, token: string) =>
  pedir<{ pago: { checkout_url: string } }>(
    `/tienda/pedidos/${encodeURIComponent(codigo)}/${encodeURIComponent(token)}/pago`,
    { method: "POST" }
  ).then((r) => r.pago);

/* Pedidos recientes del visitante (solo en este navegador) */
const CLAVE_MIS_PEDIDOS = "pu_mis_pedidos";
export type PedidoGuardado = { codigo: string; token: string; fecha: string };

export function guardarPedido(p: PedidoGuardado) {
  try {
    const lista = misPedidos().filter((x) => x.codigo !== p.codigo);
    localStorage.setItem(CLAVE_MIS_PEDIDOS, JSON.stringify([p, ...lista].slice(0, 5)));
  } catch {
    // sin almacenamiento: el enlace del pedido sigue funcionando
  }
}

export function misPedidos(): PedidoGuardado[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_MIS_PEDIDOS) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
