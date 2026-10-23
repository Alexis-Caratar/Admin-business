// Tiqueteras de almuerzos (prepago), integradas con la caja y las ventas.
//
// · Vender una tiquetera: el cliente paga por adelantado en la caja (entra dinero).
// · Pagar con tiquetera: la venta (nueva o la de una mesa) se paga con saldo
//   prepagado. Los productos elegibles (almuerzos) descuentan 1 por unidad (los complementos
//   como la sopa del día no descuentan: van incluidos); si la
//   venta trae otros productos, esos pasan a una segunda factura que se cobra con
//   el medio que elija el cajero (así cada venta conserva un solo pago).
// · El valor de cada almuerzo consumido es el valor prepagado (precio ÷ almuerzos):
//   es ingreso del período pero NO dinero nuevo en la caja.
// · Anular la venta reintegra los almuerzos (trigger trg_tiqueteras_anulacion).
// Todas las validaciones definitivas ocurren aquí, en una transacción, con la
// tiquetera bloqueada (FOR UPDATE) y clave de idempotencia contra doble clic.
import crypto from "crypto";
import { pool } from "../config/db.js";
import { insertarVenta, siguienteConsecutivo } from "./cajero.service.js";
import { notificarCaja, notificarMesas } from "../websockets.js";

const errorHttp = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const MEDIOS = ["EFECTIVO", "NEQUI", "TARJETA", "TRANSFERENCIA", "DAVIPLATA"];
// Un producto descuenta de la tiquetera si su categoría es elegible, salvo los complementos
// (sopa, jugo, fruta… que acompañan al plato): un almuerzo completo = 1, no 2. La excepción
// por producto (Siempre / Nunca) manda sobre todo.
const ELEGIBLE = "COALESCE(p.tiquetera_elegible, c.tiquetera_elegible AND NOT COALESCE(p.es_complemento, false), false)";
// Lo que no descuenta y vale $0 (los complementos incluidos) queda en la factura del almuerzo
const clasificar = (items, mapa, id = (i) => Number(i.id_producto)) => ({
  almuerzos: items.filter((i) => mapa.get(id(i))),
  acompanan: items.filter((i) => !mapa.get(id(i)) && !(Number(i.subtotal) > 0)),
  otros: items.filter((i) => !mapa.get(id(i)) && Number(i.subtotal) > 0),
});
const redondear = (n) => Math.round(Number(n) * 100) / 100;

const enTransaccion = async (fn) => {
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

// Idempotencia: la misma clave devuelve el resultado de la primera vez
const conClave = async (client, clave, id_negocio, fn) => {
  if (!clave) return fn();
  const k = `${id_negocio}:${String(clave).slice(0, 70)}`;
  const { rowCount } = await client.query(`INSERT INTO tiqueteras_idempotencia (clave, id_negocio) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [k, id_negocio]);
  if (!rowCount) {
    const { rows: [r] } = await client.query(`SELECT resultado FROM tiqueteras_idempotencia WHERE clave = $1`, [k]);
    if (r?.resultado) return { ...r.resultado, repetido: true };
    throw errorHttp(409, "Esta operación ya se está procesando");
  }
  const resultado = await fn();
  await client.query(`UPDATE tiqueteras_idempotencia SET resultado = $2 WHERE clave = $1`, [k, resultado]);
  return resultado;
};

const vista = (t) => ({
  id: t.id, codigo: t.codigo, id_cliente: t.id_cliente, cliente: t.cliente, identificacion: t.identificacion, telefono: t.telefono,
  tipo: t.nombre_tipo, almuerzos_total: t.almuerzos_total, consumidos: t.consumidos, disponibles: t.almuerzos_total - t.consumidos,
  valor_pagado: Number(t.valor_pagado), valor_almuerzo: Number(t.valor_almuerzo), metodo_pago: t.metodo_pago,
  fecha_compra: t.fecha_compra, fecha_vencimiento: t.fecha_vencimiento, estado: t.estado,
  vencida: Boolean(t.vencida), utilizable: t.estado === "ACTIVA" && !t.vencida && t.almuerzos_total - t.consumidos > 0,
  token_portal: t.token_portal,
});
const SELECT_T = `SELECT t.*, to_char(t.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento,
  TRIM(CONCAT(pe.nombres, ' ', pe.apellidos)) AS cliente, pe.identificacion, pe.telefono,
  (t.fecha_vencimiento IS NOT NULL AND t.fecha_vencimiento < (now() AT TIME ZONE 'America/Bogota')::date) AS vencida
  FROM tiqueteras t JOIN personas pe ON pe.id = t.id_cliente`;

/* ------------------------------ Tipos ------------------------------ */
export const tipos = async (id_negocio) => (await pool.query(
  `SELECT id, nombre, almuerzos, precio::float, vigencia_dias, activo FROM tiqueteras_tipos WHERE id_negocio = $1 ORDER BY activo DESC, almuerzos`, [id_negocio]
)).rows;

export const guardarTipo = async (id, d, { id_negocio }) => {
  const errores = {};
  const nombre = String(d.nombre ?? "").trim().slice(0, 60);
  const almuerzos = Number(d.almuerzos), precio = Number(d.precio);
  const vigencia = d.vigencia_dias === "" || d.vigencia_dias == null ? null : Number(d.vigencia_dias);
  if (!nombre) errores.nombre = "Obligatorio";
  if (!Number.isInteger(almuerzos) || almuerzos < 1 || almuerzos > 200) errores.almuerzos = "Entre 1 y 200";
  if (!(precio > 0)) errores.precio = "Debe ser mayor que cero";
  if (vigencia !== null && (!Number.isInteger(vigencia) || vigencia < 1)) errores.vigencia_dias = "Días enteros (o vacío = sin vencimiento)";
  if (Object.keys(errores).length) throw errorHttp(400, "Revisa el tipo de tiquetera", { errores });
  const activo = d.activo === undefined ? true : Boolean(d.activo);
  const { rows: [t] } = id
    ? await pool.query(`UPDATE tiqueteras_tipos SET nombre=$1, almuerzos=$2, precio=$3, vigencia_dias=$4, activo=$5 WHERE id=$6 AND id_negocio=$7 RETURNING *`, [nombre, almuerzos, precio, vigencia, activo, id, id_negocio])
    : await pool.query(`INSERT INTO tiqueteras_tipos (id_negocio, nombre, almuerzos, precio, vigencia_dias, activo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [id_negocio, nombre, almuerzos, precio, vigencia, activo]);
  if (!t) throw errorHttp(404, "Tipo no encontrado");
  return t;
};

/* ------------------------- Vender una tiquetera ------------------------ */
export const vender = async (d, { id_negocio, id_usuario }, clave) => enTransaccion((client) => conClave(client, clave, id_negocio, async () => {
  const { rows: [tipo] } = await client.query(`SELECT * FROM tiqueteras_tipos WHERE id = $1 AND id_negocio = $2 AND activo`, [d.id_tipo, id_negocio]);
  if (!tipo) throw errorHttp(400, "Elige un tipo de tiquetera activo");
  const { rows: [cli] } = await client.query(`SELECT id, identificacion FROM personas WHERE id = $1`, [d.id_cliente]);
  if (!cli) throw errorHttp(400, "Elige el cliente");
  if (String(cli.identificacion ?? "").includes("22222222")) throw errorHttp(400, "La tiquetera debe quedar a nombre de un cliente identificado, no de consumidor final");
  const medio = String(d.metodo_pago ?? "").toUpperCase();
  if (!MEDIOS.includes(medio)) throw errorHttp(400, "Medio de pago no válido para vender la tiquetera");
  const precio = Number(tipo.precio);
  const recibido = d.monto_recibido === "" || d.monto_recibido == null ? precio : Number(d.monto_recibido);
  if (medio === "EFECTIVO" && !(recibido >= precio)) throw errorHttp(400, `El efectivo recibido debe cubrir ${precio}`);
  // El dinero entra en la caja abierta del cajero
  const { rows: [caja] } = await client.query(
    `SELECT c.id FROM caja c JOIN usuarios u ON u.id = c.id_usuario WHERE c.id_usuario = $1 AND u.id_negocio = $2 AND c.estado = 'ABIERTA' ORDER BY c.fecha_apertura DESC LIMIT 1`,
    [id_usuario, id_negocio]
  );
  if (!caja) throw errorHttp(409, "Abre tu caja para vender tiqueteras");
  await client.query(`SELECT pg_advisory_xact_lock(hashtext('tiqueteras'), $1)`, [id_negocio]);
  const { rows: [{ n }] } = await client.query(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo, '\\D', '', 'g'), '')::int), 0) + 1 AS n FROM tiqueteras WHERE id_negocio = $1`, [id_negocio]
  );
  const codigo = `TQ-${String(n).padStart(6, "0")}`;
  const { rows: [t] } = await client.query(
    `INSERT INTO tiqueteras (id_negocio, codigo, id_cliente, id_tipo, nombre_tipo, almuerzos_total, valor_pagado, valor_almuerzo, metodo_pago, id_caja,
                             fecha_vencimiento, token_portal, id_usuario)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
             CASE WHEN $11::int IS NULL THEN NULL ELSE ((now() AT TIME ZONE 'America/Bogota')::date + $11::int) END, $12, $13)
     RETURNING id`,
    [id_negocio, codigo, cli.id, tipo.id, tipo.nombre, tipo.almuerzos, precio, redondear(precio / tipo.almuerzos), medio, caja.id,
      tipo.vigencia_dias, crypto.randomBytes(16).toString("hex"), id_usuario]
  );
  const { rows: [fila] } = await client.query(`${SELECT_T} WHERE t.id = $1`, [t.id]);
  return { tiquetera: vista(fila), cambio: medio === "EFECTIVO" ? redondear(recibido - precio) : 0 };
}));

/* ------------------------------ Buscar ------------------------------ */
// Por código (o QR con el enlace del portal), documento, nombre o teléfono del cliente
export const buscar = async (q, { id_negocio }) => {
  let t = String(q ?? "").trim();
  if (t.length < 2) return [];
  const token = /tiquetera\/([a-f0-9]{32})/i.exec(t)?.[1] ?? (/^[a-f0-9]{32}$/i.test(t) ? t : null);
  if (/^tq-?\d+$/i.test(t)) t = `TQ-${t.replace(/\D/g, "").padStart(6, "0")}`;
  const { rows } = await pool.query(
    `${SELECT_T} WHERE t.id_negocio = $1 AND (
       t.codigo = upper($2) OR t.token_portal = $3 OR pe.identificacion ILIKE $4 OR pe.telefono ILIKE $4
       OR CONCAT(pe.nombres, ' ', pe.apellidos) ILIKE $4)
     ORDER BY (t.estado = 'ACTIVA') DESC, t.fecha_compra DESC LIMIT 30`,
    [id_negocio, t, token, `%${t}%`]
  );
  return rows.map(vista);
};

/* -------------------- Qué de una venta paga la tiquetera ------------------ */
const elegibles = async (client, ids) => {
  const { rows } = await client.query(`SELECT p.id, ${ELEGIBLE} AS elegible FROM productos p JOIN categorias c ON c.id = p.id_categoria WHERE p.id = ANY($1)`, [ids]);
  return new Map(rows.map((r) => [r.id, r.elegible]));
};

export const previsualizar = async (d, { id_negocio }) => {
  let items = d.productos ?? [];
  if (d.id_venta) {
    const { rows } = await pool.query(
      `SELECT vi.id_producto, vi.cantidad::float, vi.subtotal::float, pr.nombre FROM ventas_items vi JOIN ventas v ON v.id = vi.id_venta
       JOIN caja c ON c.id = v.id_caja JOIN usuarios u ON u.id = c.id_usuario JOIN productos pr ON pr.id = vi.id_producto
       WHERE v.id = $1 AND u.id_negocio = $2`, [d.id_venta, id_negocio]);
    items = rows;
  }
  const mapa = await elegibles(pool, items.map((i) => Number(i.id_producto)));
  const { almuerzos: conAlmuerzo, acompanan, otros } = clasificar(items, mapa);
  return {
    almuerzos: conAlmuerzo.reduce((a, i) => a + Number(i.cantidad), 0),
    productos_tiquetera: conAlmuerzo.map((i) => ({ id_producto: i.id_producto, nombre: i.nombre, cantidad: Number(i.cantidad) })),
    acompanan: acompanan.map((i) => ({ id_producto: i.id_producto, nombre: i.nombre, cantidad: Number(i.cantidad) })),
    otros: otros.map((i) => ({ id_producto: i.id_producto, nombre: i.nombre, cantidad: Number(i.cantidad), subtotal: Number(i.subtotal) })),
    total_otros: redondear(otros.reduce((a, i) => a + Number(i.subtotal), 0)),
  };
};

/* --------------------------- Pagar con tiquetera -------------------------- */
// d: { id_tiquetera, id_venta? | venta? (carrito), metodo_resto?, monto_recibido_resto? }
export const consumir = async (d, { id_negocio, id_usuario }, clave) => {
  let mesa = null;
  const r = await enTransaccion((client) => conClave(client, clave, id_negocio, async () => {
    // 1) La tiquetera, bloqueada mientras se valida y descuenta (evita consumos simultáneos)
    const { rows: [t] } = await client.query(
      `SELECT t.*, to_char(t.fecha_vencimiento, 'YYYY-MM-DD') AS vence,
              (t.fecha_vencimiento IS NOT NULL AND t.fecha_vencimiento < (now() AT TIME ZONE 'America/Bogota')::date) AS vencida
       FROM tiqueteras t WHERE t.id = $1 AND t.id_negocio = $2 FOR UPDATE`, [d.id_tiquetera, id_negocio]);
    if (!t) throw errorHttp(404, "Tiquetera no encontrada");
    if (t.estado === "ANULADA") throw errorHttp(409, "La tiquetera está anulada");
    if (t.vencida) throw errorHttp(409, `La tiquetera venció el ${t.vence}`);
    const disponiblesAntes = t.almuerzos_total - t.consumidos;
    if (disponiblesAntes <= 0) throw errorHttp(409, "La tiquetera no tiene almuerzos disponibles", { disponibles: 0 });

    // 2) La venta: la de una mesa (ya existe) o una nueva desde el carrito, sin pagar todavía
    let id_venta = Number(d.id_venta) || null;
    if (!id_venta) {
      const v = d.venta ?? {};
      if (!Array.isArray(v.productos) || !v.productos.length) throw errorHttp(400, "La venta no tiene productos");
      const { rows: [caja] } = await client.query(
        `SELECT c.id FROM caja c JOIN usuarios u ON u.id = c.id_usuario WHERE c.id = $1 AND c.id_usuario = $2 AND u.id_negocio = $3 AND c.estado = 'ABIERTA'`,
        [v.id_caja, id_usuario, id_negocio]
      );
      if (!caja) throw errorHttp(409, "Tu caja no está abierta");
      id_venta = await insertarVenta(client, {
        id_cliente: v.id_cliente || t.id_cliente, id_caja: caja.id, id_mesa: v.id_mesa ?? null,
        subtotal: v.subtotal, total: v.total, estado: "activa", nota: v.nota ?? null, productos: v.productos,
        metodo_pago: "PENDIENTE", monto_pagado: v.total, monto_recibido: null, cambio: null,
      });
    }
    const { rows: [venta] } = await client.query(
      `SELECT v.*, pg.id AS id_pago, pg.estado_pago FROM ventas v JOIN caja c ON c.id = v.id_caja JOIN usuarios u ON u.id = c.id_usuario
       JOIN pagos pg ON pg.id_venta = v.id WHERE v.id = $1 AND u.id_negocio = $2 FOR UPDATE OF v`,
      [id_venta, id_negocio]
    );
    if (!venta) throw errorHttp(404, "Venta no encontrada");
    if (venta.estado === "cancelado") throw errorHttp(409, "La venta está anulada");
    if (venta.estado_pago) throw errorHttp(409, "La venta ya está pagada");
    const { rows: [{ n: yaConsumo }] } = await client.query(`SELECT count(*)::int AS n FROM tiqueteras_consumos WHERE id_venta = $1`, [id_venta]);
    if (yaConsumo) throw errorHttp(409, "La venta ya tiene un consumo de tiquetera");


    // 3) Qué paga la tiquetera y qué se cobra aparte
    const { rows: items } = await client.query(`SELECT vi.*, vi.cantidad::float AS cant FROM ventas_items vi WHERE vi.id_venta = $1 ORDER BY vi.id`, [id_venta]);
    const mapa = await elegibles(client, items.map((i) => i.id_producto));
    const { almuerzos, otros } = clasificar(items, mapa);
    const unidades = almuerzos.reduce((a, i) => a + i.cant, 0);
    if (!unidades) throw errorHttp(400, "La venta no tiene almuerzos que se puedan pagar con tiquetera");
    if (almuerzos.some((i) => !Number.isInteger(i.cant))) throw errorHttp(400, "Las cantidades de almuerzos deben ser enteras");
    if (unidades > disponiblesAntes) throw errorHttp(409, `Saldo insuficiente: la venta tiene ${unidades} almuerzo(s) y la tiquetera ${disponiblesAntes}`, { disponibles: disponiblesAntes });

    // 4) Lo que no es almuerzo pasa a otra factura con su propio pago
    let ventaResto = null;
    if (otros.length) {
      const medio = String(d.metodo_resto ?? "").toUpperCase();
      if (![...MEDIOS, "PENDIENTE"].includes(medio)) throw errorHttp(400, "Elige cómo se pagan los productos que no son almuerzo", { requiere_metodo_resto: true });
      const totalResto = redondear(otros.reduce((a, i) => a + Number(i.subtotal), 0));
      const recibido = d.monto_recibido_resto === "" || d.monto_recibido_resto == null ? null : Number(d.monto_recibido_resto);
      if (medio === "EFECTIVO" && recibido !== null && recibido < totalResto) throw errorHttp(400, `El efectivo recibido no cubre ${totalResto}`);
      const consecutivo = await siguienteConsecutivo(client);
      const { rows: [vb] } = await client.query(
        `INSERT INTO ventas (numero_consecutivo, numero_factura, id_cliente, id_caja, id_mesa, subtotal, descuento, descuento_porcentaje, impuesto, total, estado, metodo_pago, nota, fecha)
         VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, $6, 'activa', $7, $8, $9) RETURNING id, numero_factura`,
        [consecutivo, `POS-${String(consecutivo).padStart(6, "0")}`, venta.id_cliente, venta.id_caja, venta.id_mesa, totalResto, medio, `Complemento de ${venta.numero_factura} (tiquetera)`, venta.fecha]
      );
      // Se MUEVEN los ítems (no se vuelven a insertar): el inventario no se descuenta dos veces
      await client.query(`UPDATE ventas_items SET id_venta = $1 WHERE id = ANY($2)`, [vb.id, otros.map((i) => i.id)]);
      await client.query(
        `INSERT INTO pagos (id_venta, estado_pago, metodo_pago, monto_pagado, monto_recibido, cambio, fecha) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [vb.id, medio !== "PENDIENTE", medio, totalResto, recibido, recibido !== null ? redondear(recibido - totalResto) : null, venta.fecha]
      );
      ventaResto = { id_venta: vb.id, numero_factura: vb.numero_factura, total: totalResto, metodo_pago: medio };
    }

    // 5) Los almuerzos valen lo prepagado (sin superar el precio de la carta)
    const valor = Number(t.valor_almuerzo);
    let bruto = 0, neto = 0;
    for (const i of almuerzos) {
      const unit = Math.min(valor, Number(i.precio_unitario));
      const sub = redondear(unit * i.cant);
      bruto += Number(i.precio_unitario) * i.cant; neto += sub;
      await client.query(`UPDATE ventas_items SET subtotal = $1, descuento = $2 WHERE id = $3`, [sub, redondear(Number(i.precio_unitario) * i.cant - sub), i.id]);
      await client.query(
        `INSERT INTO tiqueteras_consumos (id_tiquetera, id_venta, id_venta_item, id_producto, cantidad, valor_almuerzo, id_usuario) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [t.id, id_venta, i.id, i.id_producto, i.cant, unit, id_usuario]
      );
    }
    bruto = redondear(bruto); neto = redondear(neto);
    await client.query(`UPDATE ventas SET subtotal = $1, descuento = $2, total = $3, metodo_pago = 'TIQUERERA' WHERE id = $4`, [bruto, redondear(bruto - neto), neto, id_venta]);
    await client.query(`UPDATE pagos SET estado_pago = true, metodo_pago = 'TIQUERERA', monto_pagado = $1, monto_recibido = NULL, cambio = 0, fecha_actualizacion = NOW() WHERE id = $2`, [neto, venta.id_pago]);
    if (!venta.id_cliente || d.asignar_cliente !== false) await client.query(`UPDATE ventas SET id_cliente = $1 WHERE id = $2`, [t.id_cliente, id_venta]);
    const consumidos = t.consumidos + unidades;
    await client.query(`UPDATE tiqueteras SET consumidos = $1, estado = CASE WHEN $1 >= almuerzos_total THEN 'AGOTADA' ELSE estado END WHERE id = $2`, [consumidos, t.id]);
    // Mesa: queda libre como en un cobro normal
    if (venta.id_mesa) { await client.query(`UPDATE mesas SET estado = 'Disponible' WHERE id = $1`, [venta.id_mesa]); mesa = true; }
    const { rows: [cli] } = await client.query(`SELECT TRIM(CONCAT(nombres, ' ', apellidos)) AS nombre FROM personas WHERE id = $1`, [t.id_cliente]);
    return {
      tiquetera: { id: t.id, codigo: t.codigo, cliente: cli?.nombre, almuerzos_total: t.almuerzos_total },
      venta: { id_venta, numero_factura: venta.numero_factura, total: neto, almuerzos: unidades },
      venta_resto: ventaResto,
      antes: { consumidos: t.consumidos, disponibles: disponiblesAntes },
      despues: { consumidos, disponibles: t.almuerzos_total - consumidos },
      cajero: id_usuario, fecha: new Date().toISOString(),
    };
  }));
  if (!r.repetido) { notificarCaja(id_usuario).catch(() => {}); if (mesa) notificarMesas(id_negocio).catch(() => {}); }
  return r;
};

/* ------------------------- Administración ------------------------------ */
export const listar = async ({ id_negocio }, f = {}) => {
  const params = [id_negocio];
  const w = [];
  if (f.estado) { params.push(f.estado); w.push(`t.estado = $${params.length}`); }
  if (f.q) { params.push(`%${f.q}%`); w.push(`(t.codigo ILIKE $${params.length} OR pe.identificacion ILIKE $${params.length} OR CONCAT(pe.nombres, ' ', pe.apellidos) ILIKE $${params.length} OR pe.telefono ILIKE $${params.length})`); }
  const { rows } = await pool.query(`${SELECT_T} WHERE t.id_negocio = $1 ${w.length ? `AND ${w.join(" AND ")}` : ""} ORDER BY t.fecha_compra DESC LIMIT 1000`, params);
  return rows.map(vista);
};

export const historial = async ({ id_negocio }, f = {}) => {
  const params = [id_negocio];
  const w = [];
  if (f.id_tiquetera) { params.push(Number(f.id_tiquetera)); w.push(`t.id = $${params.length}`); }
  if (f.desde) { params.push(f.desde); w.push(`(tc.created_at AT TIME ZONE 'America/Bogota')::date >= $${params.length}`); }
  if (f.hasta) { params.push(f.hasta); w.push(`(tc.created_at AT TIME ZONE 'America/Bogota')::date <= $${params.length}`); }
  const { rows } = await pool.query(
    `SELECT tc.id, tc.created_at AS fecha, t.codigo, t.id AS id_tiquetera, TRIM(CONCAT(pe.nombres, ' ', pe.apellidos)) AS cliente,
            pr.nombre AS producto, tc.cantidad, tc.valor_almuerzo::float, v.numero_factura, v.id AS id_venta, v.estado AS estado_venta, tc.estado,
            TRIM(CONCAT(pc.nombres, ' ', pc.apellidos)) AS cajero, tc.reintegrado_en, tc.motivo_reintegro,
            TRIM(CONCAT(pr2.nombres, ' ', pr2.apellidos)) AS reintegrado_por
     FROM tiqueteras_consumos tc JOIN tiqueteras t ON t.id = tc.id_tiquetera JOIN personas pe ON pe.id = t.id_cliente
     JOIN productos pr ON pr.id = tc.id_producto JOIN ventas v ON v.id = tc.id_venta
     LEFT JOIN usuarios uc ON uc.id = tc.id_usuario LEFT JOIN personas pc ON pc.id = uc.id_persona
     LEFT JOIN usuarios ur ON ur.id = tc.reintegrado_por LEFT JOIN personas pr2 ON pr2.id = ur.id_persona
     WHERE t.id_negocio = $1 ${w.length ? `AND ${w.join(" AND ")}` : ""} ORDER BY tc.created_at DESC LIMIT 2000`,
    params
  );
  return rows;
};

export const anular = async (id, motivo, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
  const { rows: [t] } = await client.query(`SELECT * FROM tiqueteras WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, id_negocio]);
  if (!t) throw errorHttp(404, "Tiquetera no encontrada");
  if (t.estado === "ANULADA") throw errorHttp(409, "Ya está anulada");
  if (!String(motivo ?? "").trim()) throw errorHttp(400, "Escribe el motivo de la anulación");
  if (t.consumidos > 0) throw errorHttp(409, "La tiquetera tiene almuerzos consumidos: anula primero esas ventas");
  await client.query(`UPDATE tiqueteras SET estado = 'ANULADA', anulada_por = $1, anulada_en = now(), motivo_anulacion = $2 WHERE id = $3`, [id_usuario, String(motivo).trim().slice(0, 500), id]);
  return { ok: true, reembolso: Number(t.valor_pagado), nota: "Si se devuelve el dinero, regístralo como egreso de caja." };
});

/* -------------------------- Elegibilidad -------------------------------- */
export const elegibilidad = async ({ id_negocio }) => {
  const { rows: cats } = await pool.query(`SELECT id, nombre, tiquetera_elegible FROM categorias WHERE id_negocio = $1 ORDER BY nombre`, [id_negocio]);
  const { rows: prods } = await pool.query(
    `SELECT p.id, p.nombre, c.nombre AS categoria, p.tiquetera_elegible AS excepcion, ${ELEGIBLE} AS elegible, COALESCE(p.es_complemento, false) AS es_complemento
     FROM productos p JOIN categorias c ON c.id = p.id_categoria WHERE c.id_negocio = $1 AND p.estado AND NOT p.es_complemento ORDER BY c.nombre, p.nombre`,
    [id_negocio]
  );
  return { categorias: cats, productos: prods };
};

export const guardarElegibilidad = async ({ categorias = [], productos = [] }, { id_negocio }) => enTransaccion(async (client) => {
  for (const c of categorias) await client.query(`UPDATE categorias SET tiquetera_elegible = $1 WHERE id = $2 AND id_negocio = $3`, [Boolean(c.tiquetera_elegible), c.id, id_negocio]);
  for (const p of productos) {
    const v = p.excepcion === null || p.excepcion === undefined ? null : Boolean(p.excepcion);
    await client.query(`UPDATE productos p SET tiquetera_elegible = $1 FROM categorias c WHERE p.id = $2 AND c.id = p.id_categoria AND c.id_negocio = $3`, [v, p.id, id_negocio]);
  }
  return { ok: true };
});

/* --------------------------- Portal del cliente --------------------------- */
export const portal = async (token) => {
  if (!/^[a-f0-9]{32}$/i.test(String(token ?? ""))) throw errorHttp(404, "Tiquetera no encontrada");
  const { rows: [t] } = await pool.query(`${SELECT_T} WHERE t.token_portal = $1`, [token]);
  if (!t) throw errorHttp(404, "Tiquetera no encontrada");
  const { rows: neg } = await pool.query(`SELECT nombre, url_negocio FROM negocios WHERE id = $1`, [t.id_negocio]);
  const { rows: consumos } = await pool.query(
    `SELECT tc.created_at AS fecha, to_char(tc.created_at AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS dia, pr.nombre AS producto, tc.cantidad, tc.estado
     FROM tiqueteras_consumos tc JOIN productos pr ON pr.id = tc.id_producto WHERE tc.id_tiquetera = $1 ORDER BY tc.created_at DESC`,
    [t.id]
  );
  const v = vista(t);
  // Datos mínimos: sin documento ni teléfono completos
  return {
    negocio: neg[0] ?? null, codigo: v.codigo, cliente: String(v.cliente ?? "").split(" ")[0], tipo: v.tipo,
    almuerzos_total: v.almuerzos_total, consumidos: v.consumidos, disponibles: v.disponibles,
    fecha_compra: v.fecha_compra, fecha_vencimiento: v.fecha_vencimiento, estado: v.vencida && v.estado === "ACTIVA" ? "VENCIDA" : v.estado, consumos,
  };
};

// Buscar el portal con código + documento (sin el enlace)
export const buscarPortal = async ({ negocio, codigo, documento }) => {
  const c = `TQ-${String(codigo ?? "").replace(/\D/g, "").padStart(6, "0")}`;
  const { rows: [t] } = await pool.query(
    `SELECT t.token_portal FROM tiqueteras t JOIN personas pe ON pe.id = t.id_cliente JOIN negocios n ON n.id = t.id_negocio
     WHERE (n.url_negocio = $1 OR n.id::text = $1) AND t.codigo = $2 AND TRIM(pe.identificacion) = TRIM($3)`,
    [String(negocio ?? ""), c, String(documento ?? "")]
  );
  if (!t) throw errorHttp(404, "No encontramos una tiquetera con ese código y documento");
  return { token: t.token_portal };
};
