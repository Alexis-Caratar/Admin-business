// Mesas del restaurante (PostgreSQL). Reemplaza la versión anterior, que usaba
// sintaxis de MySQL y no estaba montada en app.js.
//
// El estado que se muestra se calcula con los hechos reales y no depende de que
// el frontend recargue:
//   CON_PEDIDO      comanda abierta (enviada a cocina)
//   PENDIENTE_PAGO  comanda en cobro, o venta de la caja sin pagar en la mesa
//   OCUPADA         mesa marcada ocupada sin pedido registrado
//   RESERVADA / DISPONIBLE
// mesas.estado ('Disponible' / 'Ocupada') se sigue escribiendo como siempre para la caja.
import { pool } from "../config/db.js";
import { auditar } from "./permisos.service.js";

const errorHttp = (status, message) => Object.assign(new Error(message), { status });

export const SQL_MESAS = `
  SELECT m.*,
         c.id AS id_comanda, c.numero AS numero_comanda, c.estado AS estado_comanda, c.created_at AS comanda_desde,
         c.id_mesero, TRIM(CONCAT(pm.nombres, ' ', pm.apellidos)) AS mesero,
         vp.id AS id_venta_pendiente,
         CASE WHEN c.estado = 'EN_COBRO' OR vp.id IS NOT NULL THEN 'PENDIENTE_PAGO'
              WHEN c.estado = 'ABIERTA' THEN 'CON_PEDIDO'
              WHEN m.estado = 'Ocupada' THEN 'OCUPADA'
              WHEN m.estado = 'Reservada' THEN 'RESERVADA'
              ELSE 'DISPONIBLE' END AS estado_operativo
  FROM mesas m
  LEFT JOIN comandas c ON c.id_mesa = m.id AND c.estado IN ('ABIERTA', 'EN_COBRO')
  LEFT JOIN usuarios um ON um.id = c.id_mesero
  LEFT JOIN personas pm ON pm.id = um.id_persona
  LEFT JOIN LATERAL (
    SELECT v.id FROM ventas v JOIN pagos pg ON pg.id_venta = v.id
    WHERE v.id_mesa = m.id AND v.estado = 'activa' AND NOT pg.estado_pago
    ORDER BY v.id DESC LIMIT 1
  ) vp ON true`;

// Mesas del negocio con su estado real (caja, meseros y administración)
export const mesasConEstado = async (id_negocio, { inactivas = false } = {}, db = pool) => {
  const { rows } = await db.query(
    `${SQL_MESAS} WHERE m.id_negocio = $1 ${inactivas ? "" : "AND m.activo"} ORDER BY m.id`, [id_negocio]
  );
  return rows;
};

// ¿Se puede liberar? No, si hay comanda abierta o una venta sin pagar en la mesa
export const pendienteEnMesa = async (client, id_mesa) => {
  const { rows: [r] } = await client.query(`${SQL_MESAS} WHERE m.id = $1`, [id_mesa]);
  if (!r) return null;
  if (r.id_comanda) return `La mesa tiene la comanda #${r.numero_comanda} ${r.estado_comanda === "EN_COBRO" ? "en cobro" : "abierta"}`;
  if (r.id_venta_pendiente) return "La mesa tiene una cuenta pendiente de pago";
  return null;
};

const limpiar = (d) => {
  const nombre = String(d.nombre ?? "").trim().slice(0, 50);
  const capacidad = Number(d.capacidad ?? 4);
  if (!nombre) throw errorHttp(400, "El nombre o número de la mesa es obligatorio");
  if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 50) throw errorHttp(400, "Capacidad entre 1 y 50");
  return { nombre, capacidad };
};

const enTransaccion = async (fn) => {
  const client = await pool.connect();
  try { await client.query("BEGIN"); const r = await fn(client); await client.query("COMMIT"); return r; }
  catch (e) { await client.query("ROLLBACK"); throw e; }
  finally { client.release(); }
};

const nombreRepetido = async (client, id_negocio, nombre, id = 0) => {
  const { rows } = await client.query(`SELECT 1 FROM mesas WHERE id_negocio = $1 AND lower(trim(nombre)) = lower($2) AND id <> $3`, [id_negocio, nombre, id]);
  if (rows.length) throw errorHttp(409, `Ya existe una mesa llamada "${nombre}"`);
};

export const listar = (ctx) => mesasConEstado(ctx.id_negocio, { inactivas: true });

export const crear = (d, ctx) => enTransaccion(async (client) => {
  const v = limpiar(d);
  await nombreRepetido(client, ctx.id_negocio, v.nombre);
  const { rows: [m] } = await client.query(
    `INSERT INTO mesas (id_negocio, nombre, capacidad, estado, activo) VALUES ($1, $2, $3, 'Disponible', true) RETURNING *`,
    [ctx.id_negocio, v.nombre, v.capacidad]
  );
  await auditar(client, { id_negocio: ctx.id_negocio, tabla: "mesas", id_registro: m.id, accion: "CREAR", despues: m, id_usuario: ctx.id_usuario });
  return m;
});

export const editar = (id, d, ctx) => enTransaccion(async (client) => {
  const { rows: [antes] } = await client.query(`SELECT * FROM mesas WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, ctx.id_negocio]);
  if (!antes) throw errorHttp(404, "Mesa no encontrada");
  const v = limpiar({ ...antes, ...d });
  await nombreRepetido(client, ctx.id_negocio, v.nombre, id);
  const { rows: [m] } = await client.query(`UPDATE mesas SET nombre = $1, capacidad = $2 WHERE id = $3 RETURNING *`, [v.nombre, v.capacidad, id]);
  await auditar(client, { id_negocio: ctx.id_negocio, tabla: "mesas", id_registro: id, accion: "EDITAR", antes, despues: m, id_usuario: ctx.id_usuario });
  return m;
});

export const activar = (id, activo, ctx) => enTransaccion(async (client) => {
  const { rows: [antes] } = await client.query(`SELECT * FROM mesas WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, ctx.id_negocio]);
  if (!antes) throw errorHttp(404, "Mesa no encontrada");
  if (!activo) {
    const pendiente = await pendienteEnMesa(client, id);
    if (pendiente || antes.estado === "Ocupada") throw errorHttp(409, `No se puede desactivar: ${pendiente ?? "la mesa está ocupada"}`);
  }
  const { rows: [m] } = await client.query(`UPDATE mesas SET activo = $1 WHERE id = $2 RETURNING *`, [Boolean(activo), id]);
  await auditar(client, { id_negocio: ctx.id_negocio, tabla: "mesas", id_registro: id, accion: activo ? "ACTIVAR" : "DESACTIVAR", antes, despues: m, id_usuario: ctx.id_usuario });
  return m;
});
