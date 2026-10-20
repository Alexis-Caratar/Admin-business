// Módulo administrativo "Pedidos": gestión de pedidos web e integración con caja.
import { pool } from "../config/db.js";
import CajeroService, { insertarVenta } from "./cajero.service.js";
import { notificarCaja, notificarPedido } from "../websockets.js";
import { avisoManual, encolarAviso, eventoPorEstado, whatsappNegocio } from "./notificaciones/whatsapp.service.js";
import { imprimirPedido } from "./impresion/impresion.service.js";

const errorHttp = (status, message) => Object.assign(new Error(message), { status });

// Flujo operativo permitido. CANCELADO es posible en cualquier punto antes de ENTREGADO.
const TRANSICIONES = {
  PENDIENTE: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["EN_PREPARACION", "CANCELADO"],
  EN_PREPARACION: ["LISTO", "CANCELADO"],
  LISTO: ["EN_CAMINO", "ENTREGADO", "CANCELADO"],
  EN_CAMINO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

export const METODOS_COBRO = ["EFECTIVO", "NEQUI", "DAVIPLATA", "TARJETA", "TRANSFERENCIA"];

// ------------------------------------------------------------------
// LISTADO
// ------------------------------------------------------------------
export const listar = async (id_negocio, f = {}) => {
  const where = ["p.id_negocio = $1"];
  const params = [id_negocio];
  const add = (sql, v) => { params.push(v); where.push(sql.replace("?", `$${params.length}`)); };

  const fechaValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v ?? "");
  if (fechaValida(f.desde) && fechaValida(f.hasta)) {
    add("(p.created_at AT TIME ZONE 'America/Bogota')::date >= ?::date", f.desde);
    add("(p.created_at AT TIME ZONE 'America/Bogota')::date <= ?::date", f.hasta);
  } else if (fechaValida(f.fecha)) {
    add("(p.created_at AT TIME ZONE 'America/Bogota')::date = ?::date", f.fecha);
  } else if (f.pendientes !== "1") {
    where.push("(p.created_at AT TIME ZONE 'America/Bogota')::date = (NOW() AT TIME ZONE 'America/Bogota')::date");
  }
  // Pendientes de atender, sin importar la fecha
  if (f.pendientes === "1") where.push("p.estado NOT IN ('ENTREGADO', 'CANCELADO')");
  if (f.estado) add("p.estado = ?", f.estado);
  if (f.estado_pago) add("p.estado_pago = ?", f.estado_pago);
  if (f.metodo_pago) add("p.metodo_pago = ?", f.metodo_pago);
  if (f.tipo_entrega) add("p.tipo_entrega = ?", f.tipo_entrega);
  if (f.q?.trim()) add("(p.codigo ILIKE ? OR p.nombre_cliente ILIKE $Q OR p.telefono ILIKE $Q)", `%${f.q.trim()}%`);

  const sqlWhere = where.join(" AND ").replace(/\$Q/g, `$${params.length}`);
  const { rows } = await pool.query(
    `SELECT p.id, p.codigo, p.created_at, p.nombre_cliente, p.telefono, p.tipo_entrega, p.direccion, p.barrio,
            p.observacion, p.subtotal::float, p.costo_domicilio::float, p.total::float, p.metodo_pago, p.estado,
            p.estado_pago, p.id_venta, p.id_caja, p.version, v.numero_factura,
            (SELECT COALESCE(json_agg(json_build_object('nombre', i.nombre, 'cantidad', i.cantidad, 'adicional', i.id_item_padre IS NOT NULL) ORDER BY i.id), '[]')
             FROM pedidos_items i WHERE i.id_pedido = p.id) AS items
     FROM pedidos p
     LEFT JOIN ventas v ON v.id = p.id_venta
     WHERE ${sqlWhere}
     ORDER BY p.created_at DESC
     LIMIT 300`,
    params
  );
  return rows;
};

// ------------------------------------------------------------------
// RESUMEN ADMINISTRATIVO (rango de fechas, hora Colombia)
// ------------------------------------------------------------------
export const resumen = async (id_negocio, { desde, hasta } = {}) => {
  const fecha = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v : null);
  const d = fecha(desde), h = fecha(hasta);
  const params = [id_negocio, d, h];
  const rango = `p.id_negocio = $1
    AND (p.created_at AT TIME ZONE 'America/Bogota')::date
        BETWEEN COALESCE($2::date, (NOW() AT TIME ZONE 'America/Bogota')::date - 29)
            AND COALESCE($3::date, (NOW() AT TIME ZONE 'America/Bogota')::date)`;

  const [{ rows: [totales] }, { rows: porDia }, { rows: porEstado }, { rows: productos }] = await Promise.all([
    pool.query(`
      SELECT COUNT(*)::int AS pedidos,
             COUNT(*) FILTER (WHERE estado = 'CANCELADO')::int AS cancelados,
             COUNT(*) FILTER (WHERE estado = 'ENTREGADO')::int AS entregados,
             COUNT(*) FILTER (WHERE estado NOT IN ('ENTREGADO', 'CANCELADO'))::int AS en_curso,
             COALESCE(SUM(total) FILTER (WHERE estado <> 'CANCELADO' AND estado_pago = 'APROBADO'), 0)::float AS ventas_pagadas,
             COALESCE(SUM(total) FILTER (WHERE estado <> 'CANCELADO' AND estado_pago = 'PENDIENTE'), 0)::float AS por_cobrar,
             COALESCE(AVG(total) FILTER (WHERE estado <> 'CANCELADO'), 0)::float AS ticket_promedio,
             COUNT(*) FILTER (WHERE metodo_pago = 'EN_LINEA' AND estado <> 'CANCELADO')::int AS en_linea,
             COUNT(*) FILTER (WHERE metodo_pago = 'CONTRAENTREGA' AND estado <> 'CANCELADO')::int AS contraentrega,
             COUNT(*) FILTER (WHERE tipo_entrega = 'DOMICILIO' AND estado <> 'CANCELADO')::int AS domicilios,
             COUNT(*) FILTER (WHERE estado_pago = 'REEMBOLSO_PENDIENTE')::int AS reembolsos_pendientes,
             COUNT(*) FILTER (WHERE estado_pago = 'RECHAZADO')::int AS pagos_rechazados
      FROM pedidos p WHERE ${rango}`, params),
    pool.query(`
      SELECT to_char((p.created_at AT TIME ZONE 'America/Bogota')::date, 'YYYY-MM-DD') AS fecha,
             COUNT(*)::int AS pedidos,
             COALESCE(SUM(total) FILTER (WHERE estado <> 'CANCELADO'), 0)::float AS total
      FROM pedidos p WHERE ${rango} GROUP BY 1 ORDER BY 1`, params),
    pool.query(`SELECT estado, COUNT(*)::int AS cantidad FROM pedidos p WHERE ${rango} GROUP BY 1 ORDER BY 2 DESC`, params),
    pool.query(`
      SELECT i.nombre, SUM(i.cantidad)::int AS cantidad, SUM(i.subtotal)::float AS total
      FROM pedidos_items i JOIN pedidos p ON p.id = i.id_pedido
      WHERE ${rango} AND p.estado <> 'CANCELADO' AND i.id_item_padre IS NULL
      GROUP BY i.nombre ORDER BY 2 DESC LIMIT 10`, params),
  ]);
  return { totales, por_dia: porDia, por_estado: porEstado, productos };
};

// ------------------------------------------------------------------
// DETALLE
// ------------------------------------------------------------------
const obtenerPedido = async (db, id, id_negocio, bloquear = false) => {
  const { rows: [p] } = await db.query(
    `SELECT * FROM pedidos WHERE id = $1 AND id_negocio = $2 ${bloquear ? "FOR UPDATE" : ""}`,
    [id, id_negocio]
  );
  if (!p) throw errorHttp(404, "Pedido no encontrado");
  return p;
};

export const detalle = async (id, id_negocio) => {
  const p = await obtenerPedido(pool, id, id_negocio);
  const [{ rows: items }, { rows: historial }, { rows: transacciones }, { rows: [venta] }, { rows: mensajes }] = await Promise.all([
    pool.query(`SELECT id, id_item_padre, id_producto, nombre, cantidad, precio_unitario::float, subtotal::float
                FROM pedidos_items WHERE id_pedido = $1 ORDER BY id`, [id]),
    pool.query(`SELECT h.campo, h.valor_anterior, h.valor_nuevo, h.origen, h.nota, h.created_at,
                       NULLIF(CONCAT(pe.nombres, ' ', pe.apellidos), ' ') AS usuario
                FROM pedidos_historial h
                LEFT JOIN usuarios u ON u.id = h.id_usuario
                LEFT JOIN personas pe ON pe.id = u.id_persona
                WHERE h.id_pedido = $1 ORDER BY h.created_at, h.id`, [id]),
    pool.query(`SELECT referencia, id_transaccion_proveedor, estado, metodo, monto_centavos, created_at, updated_at
                FROM pedidos_transacciones WHERE id_pedido = $1 ORDER BY id`, [id]),
    pool.query(`SELECT v.numero_factura, v.estado, pa.metodo_pago, pa.estado_pago
                FROM ventas v LEFT JOIN pagos pa ON pa.id_venta = v.id WHERE v.id = $1`, [p.id_venta]),
    pool.query(`SELECT evento, estado, intentos, error, created_at, enviado_at
                FROM notificaciones_whatsapp WHERE id_pedido = $1 ORDER BY id`, [id]),
  ]);
  // Aviso para enviar a mano según el estado actual (saludo si aún está pendiente)
  const eventoActual = p.estado === "PENDIENTE" ? "RECIBIDO" : eventoPorEstado(p.estado, p.tipo_entrega);
  const { token_consulta, clave_idempotencia, ...pedido } = p;
  return {
    ...pedido,
    subtotal: Number(p.subtotal), costo_domicilio: Number(p.costo_domicilio), total: Number(p.total),
    items: items.filter((i) => !i.id_item_padre).map((i) => ({ ...i, adicionales: items.filter((a) => a.id_item_padre === i.id) })),
    historial,
    transacciones,
    venta: venta ?? null,
    siguientes_estados: TRANSICIONES[p.estado],
    whatsapp: {
      automatico: (await whatsappNegocio(p.id_negocio)).habilitado,
      autorizado: p.avisos_whatsapp,
      mensajes,
      manual: eventoActual ? await avisoManual(p.id, eventoActual) : null,
    },
  };
};

// ------------------------------------------------------------------
// CAMBIO DE ESTADO
// ------------------------------------------------------------------
const registrarHistorial = (db, id_pedido, campo, anterior, nuevo, id_usuario, nota, origen = "ADMIN") =>
  db.query(
    `INSERT INTO pedidos_historial (id_pedido, campo, valor_anterior, valor_nuevo, id_usuario, origen, nota)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id_pedido, campo, anterior, nuevo, id_usuario, origen, nota ? String(nota).slice(0, 500) : null]
  );

// Caja ABIERTA del usuario (mismo criterio que el POS)
const cajaAbiertaDe = async (db, id_usuario) => {
  const { rows: [c] } = await db.query(
    `SELECT id FROM caja WHERE estado = 'ABIERTA' AND id_usuario = $1 ORDER BY fecha_apertura DESC LIMIT 1`,
    [id_usuario]
  );
  return c?.id ?? null;
};

// Convierte el pedido en una venta de la caja del usuario (reutiliza insertarVenta del POS)
const facturar = async (db, pedido, id_caja) => {
  const { rows: items } = await db.query(
    `SELECT id_producto, cantidad, precio_unitario, subtotal FROM pedidos_items WHERE id_pedido = $1 ORDER BY id`,
    [pedido.id]
  );
  const pagado = pedido.metodo_pago === "EN_LINEA" && pedido.estado_pago === "APROBADO";
  const nota = [
    `Pedido web ${pedido.codigo}`,
    pedido.tipo_entrega === "DOMICILIO" ? "Domicilio" : "Recoger en el local",
    Number(pedido.costo_domicilio) > 0 ? `costo domicilio $${Number(pedido.costo_domicilio).toLocaleString("es-CO")}` : null,
  ].filter(Boolean).join(" · ");

  return insertarVenta(db, {
    id_cliente: pedido.id_cliente,
    id_caja,
    subtotal: pedido.subtotal,
    total: pedido.total,
    estado: "activa",
    nota,
    productos: items.map((i) => ({ ...i, descuento: 0, descuento_porcentaje: 0, impuesto: 0 })),
    // Pago en línea aprobado: ya está pagado, no se cobra otra vez en caja
    metodo_pago: pagado ? "WOMPI" : "PENDIENTE",
    metodo_venta: pagado ? "WOMPI" : "CONTRAENTREGA",
    monto_pagado: pedido.total,
  });
};

export const cambiarEstado = async (id, id_negocio, { estado, version, nota }, user) => {
  if (!Object.hasOwn(TRANSICIONES, estado)) throw errorHttp(400, "Estado inválido");
  const client = await pool.connect();
  let cajaNotificar = null;
  try {
    await client.query("BEGIN");
    const p = await obtenerPedido(client, id, id_negocio, true);

    // Bloqueo optimista: si alguien más lo cambió, se recarga antes de continuar
    if (Number(version) !== p.version) throw errorHttp(409, "El pedido fue modificado por otra persona. Actualiza la vista.");
    if (!TRANSICIONES[p.estado].includes(estado)) throw errorHttp(409, `No se puede pasar de ${p.estado} a ${estado}`);
    if (estado === "EN_CAMINO" && p.tipo_entrega !== "DOMICILIO") throw errorHttp(409, "Solo los domicilios pasan por 'En camino'");

    const cambios = { estado };

    if (estado === "CONFIRMADO") {
      if (p.metodo_pago === "EN_LINEA" && p.estado_pago !== "APROBADO") {
        throw errorHttp(409, "El pago en línea todavía no está aprobado");
      }
      const id_caja = await cajaAbiertaDe(client, user.id);
      if (!id_caja) throw errorHttp(409, "Necesitas una caja ABIERTA para confirmar el pedido");
      cambios.id_venta = await facturar(client, p, id_caja);
      cambios.id_caja = id_caja;
      cajaNotificar = user.id;
    }

    if (estado === "CANCELADO") {
      if (!nota?.trim()) throw errorHttp(400, "Escribe el motivo de la cancelación");
      if (p.id_venta) {
        await client.query(
          `UPDATE ventas SET estado = 'cancelado', nota = CONCAT(nota, ' · Cancelado: ', $2::text) WHERE id = $1`,
          [p.id_venta, nota.trim().slice(0, 200)]
        );
        cajaNotificar = user.id;
      }
      // Dinero ya recibido → se devuelve manualmente (panel de Wompi o caja)
      const pagoNuevo = p.estado_pago === "APROBADO" ? "REEMBOLSO_PENDIENTE" : p.estado_pago === "PENDIENTE" ? "ANULADO" : p.estado_pago;
      if (pagoNuevo !== p.estado_pago) {
        cambios.estado_pago = pagoNuevo;
        await registrarHistorial(client, p.id, "estado_pago", p.estado_pago, pagoNuevo, user.id, "Por cancelación del pedido");
      }
    }

    const sets = Object.keys(cambios).map((k, i) => `${k} = $${i + 1}`);
    await client.query(
      `UPDATE pedidos SET ${sets.join(", ")}, version = version + 1, updated_at = NOW() WHERE id = $${sets.length + 1}`,
      [...Object.values(cambios), p.id]
    );
    await registrarHistorial(client, p.id, "estado", p.estado, estado, user.id, nota);
    await client.query("COMMIT");

    if (cajaNotificar) notificarCaja(cajaNotificar).catch(() => {});
    notificarPedido(id_negocio, estado === "CANCELADO" ? "pedido_cancelado" : "estado_cambiado", p.id);
    const aviso = eventoPorEstado(estado, p.tipo_entrega);
    if (aviso) encolarAviso(p.id, aviso);
    return detalle(p.id, id_negocio);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

// ------------------------------------------------------------------
// COBRO DE UN PEDIDO CONTRAENTREGA (reutiliza actualizaventa del POS)
// ------------------------------------------------------------------
export const registrarPago = async (id, id_negocio, { metodo_pago, monto_recibido, version }, user) => {
  if (!METODOS_COBRO.includes(metodo_pago)) throw errorHttp(400, "Método de cobro inválido");
  const p = await obtenerPedido(pool, id, id_negocio);
  if (Number(version) !== p.version) throw errorHttp(409, "El pedido fue modificado por otra persona. Actualiza la vista.");
  if (p.metodo_pago !== "CONTRAENTREGA") throw errorHttp(409, "Este pedido se paga en línea");
  if (p.estado_pago !== "PENDIENTE") throw errorHttp(409, "Este pedido no tiene un pago pendiente");
  if (!p.id_venta) throw errorHttp(409, "Primero confirma el pedido para registrarlo en caja");
  if (p.estado === "CANCELADO") throw errorHttp(409, "El pedido está cancelado");

  const total = Number(p.total);
  const recibido = metodo_pago === "EFECTIVO" ? Number(monto_recibido) : total;
  if (!(recibido >= total)) throw errorHttp(400, "El monto recibido es menor que el total");

  // actualizaventa marca el pago, deja el pedido en APROBADO y registra el historial
  await CajeroService.actualizaventa({
    idUsuario: user.id,
    id_negocio,
    id_venta: p.id_venta,
    metodo_pago,
    monto_recibido: recibido,
    cambio: Math.round(recibido - total),
    id_mesa: null,
    id_cliente: p.id_cliente,
  });
  return detalle(p.id, id_negocio);
};

export const agregarNota = async (id, id_negocio, nota, user) => {
  if (!nota?.trim()) throw errorHttp(400, "La nota está vacía");
  const p = await obtenerPedido(pool, id, id_negocio);
  await registrarHistorial(pool, p.id, "nota", null, null, user.id, nota.trim());
  return detalle(p.id, id_negocio);
};

// ------------------------------------------------------------------
// IMPRESIÓN (usa el formato de comanda del agente local)
// ------------------------------------------------------------------
export const imprimir = async (id, id_negocio, user) => {
  const d = await detalle(id, id_negocio);
  const r = await imprimirPedido(id_negocio, d);
  if (r.ok) await registrarHistorial(pool, d.id, "nota", null, null, user.id, "Comprobante impreso");
  return { ok: true, impreso: r.ok, mensaje: r.mensaje, documento: r.documento, texto: r.texto };
};
