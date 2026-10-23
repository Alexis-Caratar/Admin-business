// Impresión de facturas, comandas y pedidos.
// Arma el ticket en el servidor con la configuración del negocio (negocios_impresion)
// y lo envía a los agentes locales del negocio, esperando su confirmación.
// Si no hay agente conectado, devuelve el ticket para imprimirlo desde el navegador.
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";
import { configTienda } from "../../config/tienda.js";
import { configNegocio } from "../../config/integraciones.js";
import { agentesDe, enviarDocumento } from "../../websockets.js";
import { comandaDocumento, comoTexto, facturaDocumento, pedidoDocumento, pruebaDocumento } from "./documentos.js";

const errorHttp = (status, message, errores) => Object.assign(new Error(message), { status, errores });

export const CONFIG_DEFECTO = {
  ancho_caracteres: 32,
  encabezado: null,
  pie: "¡Gracias por tu compra!\nVuelve pronto",
  mostrar_qr: true,
  qr_contenido: "tienda",
  qr_texto: null,
  qr_leyenda: "Escanea y visita nuestra tienda",
  documento_consumidor: "222222222222",
  imprimir_comanda_al_vender: true,
  copias_comanda: 1,
  factura_al_cobrar: "preguntar",
  agente_version: 1,
};

// Sin la migración 008 se usan los valores por defecto (el mismo formato de antes)
export const configImpresion = async (id_negocio, db = pool) => {
  try {
    const { rows: [f] } = await db.query(`SELECT * FROM negocios_impresion WHERE id_negocio = $1`, [id_negocio]);
    return { ...CONFIG_DEFECTO, ...(f ?? {}) };
  } catch (err) {
    if (err.code === "42P01") return { ...CONFIG_DEFECTO };
    throw err;
  }
};

const datosNegocio = async (id_negocio, db = pool) => {
  const { rows: [n] } = await db.query(
    `SELECT id, nombre, nit, direccion, ciudad, telefono, dominio, url_negocio,
            TO_CHAR(NOW() AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY HH12:MI:SS AM') AS fecha_impresion
     FROM negocios WHERE id = $1`,
    [id_negocio]
  );
  if (!n) throw errorHttp(404, "Negocio no encontrado");
  return n;
};

// Dirección de la tienda del negocio (para el QR)
const urlTienda = async (n) => {
  const { tienda } = await configNegocio(n.id);
  const base = tienda.urlRetorno || (n.dominio ? `https://${n.dominio}` : `${configTienda().urlPublica}/${n.url_negocio}`);
  return `${base.replace(/\/+$/, "")}/tienda`;
};

/* ------------------------------------------------------------------
 * Datos de una venta (siempre del negocio de quien imprime)
 * ------------------------------------------------------------------ */
export const datosVenta = async (id_venta, id_negocio) => {
  const { rows: [venta] } = await pool.query(
    `SELECT v.id AS id_venta, v.numero_factura, v.nota, v.descuento,
            TO_CHAR(COALESCE(pg.fecha, v.fecha) AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY HH12:MI:SS AM') AS fecha_completa,
            TO_CHAR(NOW() AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY HH12:MI:SS AM') AS fecha_impresion,
            TRIM(CONCAT(pv.nombres, ' ', pv.apellidos)) AS nombre_vendedor,
            per.identificacion AS identificacion_cliente, TRIM(CONCAT(per.nombres, ' ', per.apellidos)) AS nombre_completo,
            per.telefono, per.email,
            COALESCE(v.total, v.subtotal) AS venta_total,
            pg.metodo_pago, pg.monto_recibido, pg.cambio, m.nombre AS mesa,
            COALESCE((SELECT json_agg(json_build_object('metodo_pago', pm.metodo_pago, 'monto', pm.monto::float) ORDER BY pm.id)
                      FROM pagos_medios pm WHERE pm.id_pago = pg.id), '[]') AS medios
     FROM ventas v
     JOIN caja c ON c.id = v.id_caja
     JOIN usuarios u ON u.id = c.id_usuario
     LEFT JOIN personas pv ON pv.id = u.id_persona
     LEFT JOIN personas per ON per.id = v.id_cliente
     LEFT JOIN LATERAL (SELECT * FROM pagos WHERE id_venta = v.id ORDER BY id DESC LIMIT 1) pg ON TRUE
     LEFT JOIN mesas m ON m.id = v.id_mesa
     WHERE v.id = $1 AND u.id_negocio = $2`,
    [id_venta, id_negocio]
  );
  if (!venta) throw errorHttp(404, "Venta no encontrada");
  // Precio con el que se vendió (no el precio actual del producto); una fila por ítem
  const { rows: productos } = await pool.query(
    `SELECT vi.id_producto, pro.nombre, vi.cantidad, vi.precio_unitario, vi.subtotal
     FROM ventas_items vi JOIN productos pro ON pro.id = vi.id_producto
     WHERE vi.id_venta = $1 ORDER BY vi.id`,
    [id_venta]
  );
  return { venta, productos };
};

/* ------------------------------------------------------------------
 * Envío: agentes del negocio → confirmación. Sin agentes: ticket para el navegador.
 * `legado`: mensaje en el formato antiguo, para agentes que aún no se actualizan.
 * ------------------------------------------------------------------ */
const despachar = async (id_negocio, doc, legado) => {
  const r = await enviarDocumento(id_negocio, doc, legado);
  return {
    ok: r.ok,
    // true solo si el agente confirmó que imprimió (los agentes antiguos no confirman)
    confirmado: Boolean(r.confirmado),
    agentes: r.agentes,
    mensaje: r.mensaje,
    // El navegador puede imprimir este mismo ticket (celular o computador sin agente)
    documento: doc,
    texto: comoTexto(doc),
  };
};

export const imprimirFactura = async (id_venta, id_negocio) => {
  const [negocio, cfg, { venta, productos }] = await Promise.all([datosNegocio(id_negocio), configImpresion(id_negocio), datosVenta(id_venta, id_negocio)]);
  const doc = facturaDocumento({ negocio, cfg, venta, productos, qrTienda: await urlTienda(negocio) });
  const legado = { tipo: "imprimir_venta", payload: { negocio, venta: { ...venta, descuento: venta.descuento ?? 0 }, productos } };
  return despachar(id_negocio, doc, legado);
};

// Solo el ticket (sin enviarlo): para imprimir o compartir desde el navegador
export const ticketFactura = async (id_venta, id_negocio) => {
  const [negocio, cfg, { venta, productos }] = await Promise.all([datosNegocio(id_negocio), configImpresion(id_negocio), datosVenta(id_venta, id_negocio)]);
  const doc = facturaDocumento({ negocio, cfg, venta, productos, qrTienda: await urlTienda(negocio) });
  return { documento: doc, texto: comoTexto(doc) };
};

// Comanda (cocina/barra): viene del carrito o de una venta; no lleva precios
// titulo / etiqueta / estado: comandas de meseros ("ADICIÓN", "REIMPRESIÓN"…); por defecto, como siempre
export const imprimirComanda = async (id_negocio, { numero, mesa, mesero, productos = [], nota, venta, titulo, etiqueta, estado }) => {
  const [negocio, cfg] = await Promise.all([datosNegocio(id_negocio), configImpresion(id_negocio)]);
  const lista = productos.map((p) => ({ cantidad: Number(p.cantidad) || 1, nombre: String(p.nombre ?? "").slice(0, 120), nota: p.nota ? String(p.nota).slice(0, 200) : null }));
  const doc = comandaDocumento({ negocio, cfg, numero: numero ?? venta?.numero_factura, fecha: negocio.fecha_impresion, mesero, mesa, productos: lista, nota, titulo, etiqueta, ...(estado ? { estado } : {}) });
  const legado = {
    tipo: "imprimir_comanda",
    payload: { negocio, mesa: { nombre: mesa || "N/A" }, usuario: { nombre: mesero ?? "" }, fecha: negocio.fecha_impresion, nota: nota ?? "", venta: { numero_factura: numero ?? venta?.numero_factura ?? "" }, productos: lista },
  };
  return despachar(id_negocio, doc, legado);
};

export const imprimirPedido = async (id_negocio, pedido) => {
  const [negocio, cfg] = await Promise.all([datosNegocio(id_negocio), configImpresion(id_negocio)]);
  const doc = pedidoDocumento({ negocio, cfg, pedido, fecha: negocio.fecha_impresion });
  const productos = pedido.items.flatMap((i) => [{ cantidad: i.cantidad, nombre: i.nombre }, ...(i.adicionales ?? []).map((a) => ({ cantidad: a.cantidad ?? 1, nombre: `  + ${a.nombre}` }))]);
  const legado = {
    tipo: "imprimir_comanda",
    payload: { negocio, mesa: { nombre: `${pedido.codigo} ${pedido.tipo_entrega}` }, usuario: { nombre: "Tienda web" }, fecha: negocio.fecha_impresion, nota: pedido.observacion ?? "", venta: { numero_factura: pedido.venta?.numero_factura ?? pedido.codigo }, productos },
  };
  return despachar(id_negocio, doc, legado);
};

/* ------------------------------------------------------------------
 * Admin > Negocios > Impresión
 * ------------------------------------------------------------------ */
const CAMPOS = ["ancho_caracteres", "encabezado", "pie", "mostrar_qr", "qr_contenido", "qr_texto", "qr_leyenda",
  "documento_consumidor", "imprimir_comanda_al_vender", "copias_comanda", "factura_al_cobrar"];

const vista = async (id_negocio) => {
  const [negocio, cfg] = await Promise.all([datosNegocio(id_negocio), configImpresion(id_negocio)]);
  const qrTienda = await urlTienda(negocio);
  const ejemplo = facturaDocumento({
    negocio, cfg, qrTienda,
    venta: { numero_factura: "FV-000123", fecha_completa: negocio.fecha_impresion, nombre_vendedor: "Cajero", venta_total: 25500, metodo_pago: "EFECTIVO", monto_recibido: 30000, cambio: 4500 },
    productos: [{ nombre: "Producto de ejemplo", cantidad: 2, precio_unitario: 8000, subtotal: 16000 }, { nombre: "Otro producto con un nombre largo", cantidad: 1, precio_unitario: 9500, subtotal: 9500 }],
  });
  const { agente_version, ...config } = cfg;
  void agente_version;
  return {
    config: Object.fromEntries(CAMPOS.map((k) => [k, config[k]])),
    url_tienda: qrTienda,
    vista_previa: comoTexto(ejemplo),
    agentes: agentesDe(id_negocio),
  };
};

export const obtenerAdmin = (id_negocio) => vista(id_negocio);

export const guardarAdmin = async (id_negocio, body = {}) => {
  await datosNegocio(id_negocio);
  const actual = await configImpresion(id_negocio);
  const c = { ...actual };
  for (const k of CAMPOS) if (body[k] !== undefined) c[k] = body[k];
  const e = {};
  c.ancho_caracteres = Number(c.ancho_caracteres);
  if (![32, 42, 48].includes(c.ancho_caracteres)) e.ancho_caracteres = "Elige 58 mm (32), 80 mm (42 o 48)";
  c.copias_comanda = Number(c.copias_comanda);
  if (!(c.copias_comanda >= 1 && c.copias_comanda <= 5)) e.copias_comanda = "Entre 1 y 5";
  if (!["tienda", "factura", "texto"].includes(c.qr_contenido)) e.qr_contenido = "Opción no válida";
  if (!["preguntar", "siempre", "nunca"].includes(c.factura_al_cobrar)) e.factura_al_cobrar = "Opción no válida";
  for (const [k, max] of Object.entries({ encabezado: 300, pie: 300, qr_texto: 300, qr_leyenda: 80, documento_consumidor: 20 })) {
    c[k] = c[k] == null ? null : String(c[k]).trim().slice(0, max) || null;
  }
  if (c.qr_contenido === "texto" && c.mostrar_qr && !c.qr_texto) e.qr_texto = "Escribe el texto o enlace del QR";
  if (!c.documento_consumidor) e.documento_consumidor = "Obligatorio";
  if (Object.keys(e).length) throw errorHttp(400, "Revisa los datos marcados", e);
  c.mostrar_qr = Boolean(c.mostrar_qr);
  c.imprimir_comanda_al_vender = Boolean(c.imprimir_comanda_al_vender);

  await pool.query(
    `INSERT INTO negocios_impresion (id_negocio, ${CAMPOS.join(", ")}, updated_at)
     VALUES ($1, ${CAMPOS.map((_, i) => `$${i + 2}`).join(", ")}, NOW())
     ON CONFLICT (id_negocio) DO UPDATE SET ${CAMPOS.map((k) => `${k} = EXCLUDED.${k}`).join(", ")}, updated_at = NOW()`,
    [id_negocio, ...CAMPOS.map((k) => c[k])]
  );
  return vista(id_negocio);
};

// Token del agente: al generarlo sube la versión y los tokens anteriores dejan de funcionar
export const nuevoTokenAgente = async (id_negocio) => {
  await datosNegocio(id_negocio);
  const { rows: [r] } = await pool.query(
    `INSERT INTO negocios_impresion (id_negocio, agente_version) VALUES ($1, 2)
     ON CONFLICT (id_negocio) DO UPDATE SET agente_version = negocios_impresion.agente_version + 1, updated_at = NOW()
     RETURNING agente_version`,
    [id_negocio]
  );
  const token = jwt.sign({ tipo: "agente_impresion", id_negocio, v: r.agente_version }, process.env.JWT_SECRET);
  return { token, version: r.agente_version };
};

export const imprimirPrueba = async (id_negocio, rol = "factura") => {
  const [negocio, cfg] = await Promise.all([datosNegocio(id_negocio), configImpresion(id_negocio)]);
  const doc = pruebaDocumento({ negocio, cfg, qrTienda: await urlTienda(negocio), rol: rol === "comanda" ? "comanda" : "factura" });
  return despachar(id_negocio, doc, null);
};

// Validación del token del agente al conectarse (tokens sin versión = versión 1)
export const tokenAgenteVigente = async (payload) => {
  const cfg = await configImpresion(payload.id_negocio);
  return Number(payload.v ?? 1) === Number(cfg.agente_version);
};
