// Utilidades del módulo financiero: errores, validación de montos y fechas,
// períodos (mes), auditoría y egresos de caja vinculados.
import { pool } from "../../config/db.js";

export const errorHttp = (status, message, errores) => Object.assign(new Error(message), { status, errores });

export const redondear = (n, d = 2) => Math.round(Number(n) * 10 ** d) / 10 ** d;

// Monto válido: número finito, >= 0 (o > 0 si positivo)
export const monto = (v, { positivo = false, campo = "valor", errores } = {}) => {
  const n = Number(v);
  if (v === "" || v === null || v === undefined || !Number.isFinite(n) || n < 0 || (positivo && n === 0)) {
    if (errores) errores[campo] = positivo ? "Debe ser un valor mayor que cero" : "Debe ser un valor igual o mayor que cero";
    return null;
  }
  return redondear(n);
};

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
export const fecha = (v, { campo, errores, requerido = false } = {}) => {
  if (v === undefined || v === null || v === "") {
    if (requerido && errores) errores[campo] = "Obligatorio";
    return null;
  }
  const s = String(v).slice(0, 10);
  if (!FECHA.test(s) || Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())) {
    if (errores) errores[campo] = "Fecha no válida (AAAA-MM-DD)";
    return null;
  }
  return s;
};

// "2026-10" o "2026-10-15" → "2026-10-01"
export const periodo = (v) => {
  const m = /^(\d{4})-(\d{2})/.exec(String(v ?? ""));
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  return `${m[1]}-${m[2]}-01`;
};

export const mesActual = () => {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export const sumarMeses = (p, n) => {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
};

export const texto = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);

export const auditar = (db, { id_negocio, tabla, id_registro, accion, antes = null, despues = null, id_usuario = null }) =>
  db.query(
    `INSERT INTO fin_auditoria (id_negocio, tabla, id_registro, accion, antes, despues, id_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id_negocio, tabla, id_registro, accion, antes, despues, id_usuario]
  );

// Ejecuta en una transacción
export const enTransaccion = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await fn(client);
    await client.query("COMMIT");
    return r;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

// Egreso en la caja abierta del usuario (pago en efectivo desde la caja).
// El flujo de caja cuenta este egreso una sola vez: el pago queda vinculado a él.
export const egresoDeCaja = async (client, { id_negocio, id_usuario, descripcion, monto: valor, id_categoria = null, observacion = null }) => {
  const { rows: [caja] } = await client.query(
    `SELECT c.id FROM caja c JOIN usuarios u ON u.id = c.id_usuario
     WHERE c.id_usuario = $1 AND u.id_negocio = $2 AND c.estado = 'ABIERTA' ORDER BY c.fecha_apertura DESC LIMIT 1`,
    [id_usuario, id_negocio]
  );
  if (!caja) throw errorHttp(409, "Para pagar desde la caja debes tener una caja abierta");
  const { rows: [{ nextval }] } = await client.query(`SELECT nextval('egresos_numero_seq')`);
  const { rows: [e] } = await client.query(
    `INSERT INTO egresos (id_negocio, id_caja, numero_consecutivo, numero_egreso, fecha, descripcion, metodo_pago, monto, estado, observacion,
                          id_categoria, categoria_confirmada, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), $5, 'EFECTIVO', $6, 'ACTIVO', $7, $8, $9, NOW(), NOW()) RETURNING id, id_caja`,
    [id_negocio, caja.id, nextval, `EGR-${String(nextval).padStart(6, "0")}`, String(descripcion).slice(0, 250), valor, observacion, id_categoria, id_categoria !== null]
  );
  return e;
};
