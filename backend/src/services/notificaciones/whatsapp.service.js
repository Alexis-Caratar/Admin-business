// Avisos por WhatsApp del estado de los pedidos web.
//
// Envío automático: WhatsApp Business Cloud API (Meta). Un negocio solo puede
// escribir primero con PLANTILLAS aprobadas en Meta; los nombres y textos de
// cada plantilla están en PLANTILLAS (registrarlas igual en Meta Business).
// Sin credenciales no se envía nada automático, pero el detalle del pedido
// ofrece el botón "Avisar por WhatsApp" con el mismo texto (wa.me).
import { pool } from "../../config/db.js";
import { configWhatsappServidor } from "../../config/tienda.js";
import { whatsappNegocio } from "../../config/integraciones.js";

// Credenciales del servidor (.env). Cada negocio puede tener las suyas: whatsappNegocio(id).
export const configWhatsapp = configWhatsappServidor;
export { whatsappNegocio };

// Estado del pedido → aviso. LISTO solo se avisa si el cliente recoge.
export const eventoPorEstado = (estado, tipo_entrega) =>
  ({ CONFIRMADO: "CONFIRMADO", EN_CAMINO: "EN_CAMINO", ENTREGADO: "ENTREGADO", CANCELADO: "CANCELADO" })[estado]
  ?? (estado === "LISTO" && tipo_entrega === "RECOGER" ? "LISTO" : null);

// Plantillas (nombre en Meta, parámetros {{1}}… y texto). El primer mensaje es el saludo.
export const PLANTILLAS = {
  RECIBIDO: {
    nombre: "pedido_recibido",
    parametros: (d) => [d.cliente, d.negocio, d.codigo, d.total],
    texto: (d) => `¡Hola ${d.cliente}! 👋 Gracias por elegir ${d.negocio}. Recibimos tu pedido ${d.codigo} por ${d.total}. Te avisaremos por aquí cada vez que avance.`,
  },
  CONFIRMADO: {
    nombre: "pedido_confirmado",
    parametros: (d) => [d.cliente, d.codigo],
    texto: (d) => `${d.cliente}, tu pedido ${d.codigo} fue confirmado ✅ y ya estamos trabajando en él.`,
  },
  LISTO: {
    nombre: "pedido_listo",
    parametros: (d) => [d.cliente, d.codigo, d.negocio],
    texto: (d) => `${d.cliente}, tu pedido ${d.codigo} está listo para recoger en ${d.negocio} 🛍️.`,
  },
  EN_CAMINO: {
    nombre: "pedido_en_camino",
    parametros: (d) => [d.cliente, d.codigo],
    texto: (d) => `${d.cliente}, tu pedido ${d.codigo} va en camino 🛵. ¡Prepárate para recibirlo!`,
  },
  ENTREGADO: {
    nombre: "pedido_entregado",
    parametros: (d) => [d.cliente, d.codigo, d.negocio],
    texto: (d) => `${d.cliente}, tu pedido ${d.codigo} fue entregado. ¡Gracias por tu compra en ${d.negocio}! 💚`,
  },
  CANCELADO: {
    nombre: "pedido_cancelado",
    parametros: (d) => [d.cliente, d.codigo],
    texto: (d) => `${d.cliente}, tu pedido ${d.codigo} fue cancelado. Si tienes alguna duda, escríbenos por aquí.`,
  },
};

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

// Teléfono colombiano de 10 dígitos → formato internacional (57…)
export const telefonoInternacional = (t) => {
  const d = String(t ?? "").replace(/\D/g, "");
  return d.length === 10 ? `57${d}` : d;
};

const datosPedido = async (db, id_pedido) => {
  const { rows: [p] } = await db.query(
    `SELECT p.id, p.id_negocio, p.codigo, p.nombre_cliente, p.telefono, p.total, p.tipo_entrega, p.estado, p.avisos_whatsapp,
            COALESCE(s.nombre_publico, n.nombre) AS negocio
     FROM pedidos p JOIN negocios n ON n.id = p.id_negocio LEFT JOIN negocios_sitio s ON s.id_negocio = n.id
     WHERE p.id = $1`,
    [id_pedido]
  );
  if (!p) return null;
  return { ...p, d: { cliente: p.nombre_cliente.split(" ")[0], negocio: p.negocio, codigo: p.codigo, total: cop.format(Number(p.total)) } };
};

// Texto y enlace para avisar a mano (sirve sin la API de Meta)
export const avisoManual = async (id_pedido, evento) => {
  const p = await datosPedido(pool, id_pedido);
  if (!p || !PLANTILLAS[evento]) return null;
  const texto = PLANTILLAS[evento].texto(p.d);
  return { evento, texto, url: `https://wa.me/${telefonoInternacional(p.telefono)}?text=${encodeURIComponent(texto)}` };
};

// Encola el aviso (una sola vez por pedido y evento) e intenta enviarlo ya
export const encolarAviso = async (id_pedido, evento) => {
  try {
    if (!PLANTILLAS[evento]) return;
    const p = await datosPedido(pool, id_pedido);
    if (!p?.avisos_whatsapp || !(await whatsappNegocio(p.id_negocio)).habilitado) return;
    const plantilla = PLANTILLAS[evento];
    const { rowCount } = await pool.query(
      `INSERT INTO notificaciones_whatsapp (id_pedido, evento, telefono, plantilla, parametros)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id_pedido, evento) DO NOTHING`,
      [id_pedido, evento, telefonoInternacional(p.telefono), plantilla.nombre, JSON.stringify(plantilla.parametros(p.d))]
    );
    if (rowCount) enviarPendientes().catch((e) => console.error("WhatsApp:", e.message));
  } catch (err) {
    // Un aviso nunca debe impedir que el pedido avance
    console.error("No se pudo encolar el aviso de WhatsApp:", err.message);
  }
};

const MAX_INTENTOS = 5;
let enviando = false;

// Envía la cola (lo llama encolarAviso y un temporizador del servidor para reintentos)
// Cada mensaje sale con las credenciales del negocio del pedido (o las del servidor).
export const enviarPendientes = async () => {
  if (enviando) return { enviados: 0 };
  enviando = true;
  let enviados = 0;
  try {
    const { rows: negocios } = await pool.query(
      `SELECT DISTINCT p.id_negocio FROM notificaciones_whatsapp w JOIN pedidos p ON p.id = w.id_pedido
       WHERE w.estado = 'PENDIENTE' AND w.intentos < $1`,
      [MAX_INTENTOS]
    );
    for (const { id_negocio } of negocios) {
      const cfg = await whatsappNegocio(id_negocio);
      if (cfg.habilitado) enviados += await enviarDeNegocio(id_negocio, cfg);
    }
  } finally {
    enviando = false;
  }
  return { enviados };
};

const enviarDeNegocio = async (id_negocio, cfg) => {
  let enviados = 0;
  const { rows } = await pool.query(
    `UPDATE notificaciones_whatsapp SET intentos = intentos + 1
     WHERE id IN (SELECT w.id FROM notificaciones_whatsapp w JOIN pedidos p ON p.id = w.id_pedido
                  WHERE w.estado = 'PENDIENTE' AND w.intentos < $1 AND p.id_negocio = $2
                  ORDER BY w.created_at LIMIT 20 FOR UPDATE OF w SKIP LOCKED)
     RETURNING *`,
    [MAX_INTENTOS, id_negocio]
  );
  {
    for (const n of rows) {
      try {
        const res = await fetch(`https://graph.facebook.com/${cfg.version}/${cfg.telefonoId}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: n.telefono,
            type: "template",
            template: {
              name: n.plantilla,
              language: { code: cfg.idioma },
              components: [{ type: "body", parameters: n.parametros.map((text) => ({ type: "text", text: String(text) })) }],
            },
          }),
          signal: AbortSignal.timeout(10000),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
        await pool.query(
          `UPDATE notificaciones_whatsapp SET estado = 'ENVIADO', id_mensaje = $1, error = NULL, enviado_at = NOW() WHERE id = $2`,
          [json?.messages?.[0]?.id ?? null, n.id]
        );
        enviados++;
      } catch (err) {
        await pool.query(
          `UPDATE notificaciones_whatsapp SET error = $1, estado = CASE WHEN intentos >= $2 THEN 'ERROR' ELSE 'PENDIENTE' END WHERE id = $3`,
          [String(err.message).slice(0, 500), MAX_INTENTOS, n.id]
        );
      }
    }
  }
  return enviados;
};

// Prueba de credenciales: Meta devuelve el número asociado al ID
export const probarCredenciales = async (cfg) => {
  if (!cfg.token || !cfg.telefonoId) return { ok: false, mensaje: "Faltan el token o el ID del número" };
  const res = await fetch(`https://graph.facebook.com/${cfg.version}/${encodeURIComponent(cfg.telefonoId)}?fields=display_phone_number,verified_name`, {
    headers: { Authorization: `Bearer ${cfg.token}` }, signal: AbortSignal.timeout(10000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, mensaje: json?.error?.message ?? `Meta respondió ${res.status}` };
  return { ok: true, mensaje: `Conectado: ${json.verified_name ?? ""} ${json.display_phone_number ?? ""}`.trim() };
};
