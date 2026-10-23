// Comandas de meseros: Mesero → Comanda → Impresora → Caja → Venta.
//
// · La comanda se guarda (transacción) ANTES de imprimir: si la impresora falla,
//   el pedido queda y se reintenta sin duplicar nada.
// · Cada envío a cocina es una "tanda" (1 = pedido inicial, 2… = adiciones): una
//   adición imprime solo lo nuevo; las reimpresiones quedan registradas.
// · Precios: los pone el servidor desde la carta (el mesero no los envía ni cambia).
// · Cobro: el cajero la "pasa a cobro" (una sola vez, con la comanda bloqueada) y
//   se convierte en la venta pendiente de la mesa; desde ahí sigue el cobro de
//   siempre (medios de pago, tiquetera, factura). Un trigger la marca PAGADA solo
//   cuando el pago se confirma, y ANULADA si se anula la venta.
import { pool } from "../config/db.js";
import CajeroService, { insertarVenta } from "./cajero.service.js";
import { imprimirComanda } from "./impresion/impresion.service.js";
import { notificarCaja, notificarComanda, notificarMesas } from "../websockets.js";
import { tienePermiso } from "../middlewares/auth.middleware.js";
import { pendienteEnMesa, mesasConEstado } from "./mesas.service.js";

const errorHttp = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const redondear = (n) => Math.round(Number(n) * 100) / 100;

const enTransaccion = async (fn, ctx) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (ctx?.id_usuario) await client.query(`SELECT set_config('app.id_usuario', $1, true)`, [String(ctx.id_usuario)]);
    const r = await fn(client);
    await client.query("COMMIT");
    return r;
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "P0001") throw errorHttp(409, e.message);       // p. ej. stock insuficiente (trigger de inventario)
    throw e;
  } finally {
    client.release();
  }
};

// Reintento (doble toque, red lenta): la misma clave devuelve lo mismo sin repetir
const conClave = async (client, clave, id_negocio, fn) => {
  if (!clave) return fn();
  const k = `${id_negocio}:${String(clave).slice(0, 70)}`;
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [k]);
  const { rows: [r] } = await client.query(`SELECT resultado FROM comandas_idempotencia WHERE clave = $1`, [k]);
  if (r?.resultado) return { ...r.resultado, repetido: true };
  const resultado = await fn();
  await client.query(`INSERT INTO comandas_idempotencia (clave, id_negocio, resultado) VALUES ($1, $2, $3)`, [k, id_negocio, JSON.stringify(resultado)]);
  return resultado;
};

const historial = (client, id_comanda, evento, detalle, id_usuario) =>
  client.query(`INSERT INTO comandas_historial (id_comanda, evento, detalle, id_usuario) VALUES ($1, $2, $3, $4)`,
    [id_comanda, evento, detalle ? JSON.stringify(detalle) : null, id_usuario]);

// Ve y atiende comandas de otros meseros (la caja, el administrador)
const atiendeTodas = (user) => tienePermiso(user, ["meseros.todas", "cajero.cobrar", "mesas.editar"]);

// Productos pedidos → precio y nombre de la carta del negocio
const prepararItems = async (client, items, id_negocio) => {
  if (!Array.isArray(items) || !items.length) throw errorHttp(400, "Agrega al menos un producto");
  if (items.length > 80) throw errorHttp(400, "Demasiados productos en un solo envío");
  const lista = items.map((i) => ({
    id_producto: Number(i.id_producto), cantidad: Number(i.cantidad),
    nota: i.nota ? String(i.nota).trim().slice(0, 200) || null : null,
  }));
  if (lista.some((i) => !Number.isInteger(i.id_producto) || !Number.isInteger(i.cantidad) || i.cantidad < 1 || i.cantidad > 99)) {
    throw errorHttp(400, "Cantidades enteras entre 1 y 99");
  }
  const { rows } = await client.query(
    `SELECT p.id, p.nombre, COALESCE((SELECT pp.precio_venta FROM productos_precios pp WHERE pp.id_producto = p.id ORDER BY pp.id DESC LIMIT 1), 0)::float AS precio
     FROM productos p JOIN categorias c ON c.id = p.id_categoria AND c.id_negocio = $2
     WHERE p.id = ANY($1) AND p.estado`, [lista.map((i) => i.id_producto), id_negocio]
  );
  const carta = new Map(rows.map((r) => [r.id, r]));
  const falta = lista.find((i) => !carta.has(i.id_producto));
  if (falta) throw errorHttp(400, "Hay un producto que no está disponible en la carta");
  return lista.map((i) => ({ ...i, nombre: carta.get(i.id_producto).nombre, precio_unitario: carta.get(i.id_producto).precio }));
};

const comandaBloqueada = async (client, id, id_negocio) => {
  const { rows: [c] } = await client.query(`SELECT * FROM comandas WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, id_negocio]);
  if (!c) throw errorHttp(404, "Comanda no encontrada");
  return c;
};

/* ------------------------------ Impresión ------------------------------ */
const TITULOS = { NUEVA: "COMANDA", ADICION: "ADICIÓN", REIMPRESION: "REIMPRESIÓN", ANULACION: "COMANDA ANULADA" };
const PIE = { NUEVA: "EN PREPARACIÓN", ADICION: "AGREGAR A LA MESA", REIMPRESION: "COPIA - NO PREPARAR DE NUEVO", ANULACION: "NO PREPARAR" };

// Envía al agente existente y registra el resultado. Nunca lanza: un fallo de la
// impresora no deshace la comanda (queda ERROR y se puede reintentar).
const imprimir = async (id_comanda, { tanda = null, tipo }, id_usuario) => {
  const { rows: [c] } = await pool.query(
    `SELECT c.*, m.nombre AS mesa, TRIM(CONCAT(pe.nombres, ' ', pe.apellidos)) AS mesero
     FROM comandas c LEFT JOIN mesas m ON m.id = c.id_mesa LEFT JOIN usuarios u ON u.id = c.id_mesero LEFT JOIN personas pe ON pe.id = u.id_persona
     WHERE c.id = $1`, [id_comanda]
  );
  const { rows: items } = await pool.query(
    `SELECT nombre, cantidad, nota FROM comandas_items WHERE id_comanda = $1 AND ($2::int IS NULL OR tanda = $2) ORDER BY tanda, id`, [id_comanda, tanda]
  );
  const { rows: [reg] } = await pool.query(
    `INSERT INTO comandas_impresiones (id_comanda, tanda, tipo, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id`, [id_comanda, tanda, tipo, id_usuario]
  );
  const base = tipo === "REINTENTO" ? (tanda > 1 ? "ADICION" : "NUEVA") : tipo;
  let r;
  try {
    r = await imprimirComanda(c.id_negocio, {
      numero: `#${c.numero}${tanda > 1 ? ` (adición ${tanda - 1})` : ""}`, etiqueta: "Comanda", mesa: c.mesa, mesero: c.mesero,
      productos: items, nota: base === "ADICION" ? null : c.nota, titulo: TITULOS[base], estado: PIE[base],
    });
  } catch (err) {
    r = { ok: false, confirmado: false, mensaje: err.message || "No se pudo imprimir" };
  }
  const estado = !r.ok ? "ERROR" : r.confirmado ? "CONFIRMADA" : "ENVIADA";
  await pool.query(`UPDATE comandas_impresiones SET estado = $1, mensaje = $2, actualizado_en = now() WHERE id = $3`, [estado, String(r.mensaje ?? "").slice(0, 255), reg.id]);
  return { id_impresion: reg.id, tipo, tanda, estado, ok: r.ok, confirmado: Boolean(r.confirmado), mensaje: r.mensaje, documento: r.documento };
};

/* ------------------------------- Consultas ------------------------------- */
export const catalogo = (ctx) => CajeroService.listarProductos(ctx.id_negocio);
export const mesas = (ctx) => mesasConEstado(ctx.id_negocio);

const RESUMEN = `
  SELECT c.id, c.numero, c.estado, c.nota, c.created_at, c.updated_at, c.id_mesa, m.nombre AS mesa, c.id_mesero,
         TRIM(CONCAT(pm.nombres, ' ', pm.apellidos)) AS mesero, c.id_venta, v.numero_factura, pg.estado_pago, pg.metodo_pago,
         (SELECT COALESCE(sum(ci.cantidad * ci.precio_unitario), 0)::float FROM comandas_items ci WHERE ci.id_comanda = c.id) AS total,
         (SELECT COALESCE(sum(ci.cantidad), 0)::int FROM comandas_items ci WHERE ci.id_comanda = c.id) AS unidades,
         (SELECT COALESCE(max(ci.tanda), 1) FROM comandas_items ci WHERE ci.id_comanda = c.id) AS tandas,
         (SELECT ci2.estado FROM comandas_impresiones ci2 WHERE ci2.id_comanda = c.id ORDER BY ci2.id DESC LIMIT 1) AS impresion
  FROM comandas c LEFT JOIN mesas m ON m.id = c.id_mesa
  LEFT JOIN usuarios um ON um.id = c.id_mesero LEFT JOIN personas pm ON pm.id = um.id_persona
  LEFT JOIN ventas v ON v.id = c.id_venta LEFT JOIN pagos pg ON pg.id_venta = c.id_venta`;

// Filtros: pendientes=1 (abiertas o en cobro), estado, fecha (YYYY-MM-DD), mias=1
export const listar = async (ctx, f = {}) => {
  const todas = await atiendeTodas(ctx.user);
  const params = [ctx.id_negocio];
  const w = ["c.id_negocio = $1"];
  if (!todas || f.mias === "1") { params.push(ctx.id_usuario); w.push(`c.id_mesero = $${params.length}`); }
  if (f.pendientes === "1") w.push(`c.estado IN ('ABIERTA', 'EN_COBRO')`);
  else if (f.estado) { params.push(String(f.estado)); w.push(`c.estado = $${params.length}`); }
  if (f.fecha) { params.push(String(f.fecha)); w.push(`(c.created_at AT TIME ZONE 'America/Bogota')::date = $${params.length}::date`); }
  if (f.pendientes !== "1" && !f.fecha) w.push(`c.created_at > now() - interval '2 days'`);
  const { rows } = await pool.query(`${RESUMEN} WHERE ${w.join(" AND ")} ORDER BY c.created_at DESC LIMIT 300`, params);
  return rows;
};

export const detalle = async (id, ctx) => {
  const { rows: [c] } = await pool.query(`${RESUMEN} WHERE c.id = $1 AND c.id_negocio = $2`, [id, ctx.id_negocio]);
  if (!c) throw errorHttp(404, "Comanda no encontrada");
  const todas = await atiendeTodas(ctx.user);
  if (!todas && c.id_mesero !== ctx.id_usuario) throw errorHttp(403, "Esta comanda es de otro mesero");
  const [items, impresiones, hist] = await Promise.all([
    pool.query(`SELECT id, tanda, id_producto, nombre, cantidad, precio_unitario::float, nota, created_at FROM comandas_items WHERE id_comanda = $1 ORDER BY tanda, id`, [id]),
    pool.query(`SELECT id, tanda, tipo, estado, mensaje, created_at FROM comandas_impresiones WHERE id_comanda = $1 ORDER BY id`, [id]),
    pool.query(`SELECT h.evento, h.detalle, h.created_at, TRIM(CONCAT(pe.nombres, ' ', pe.apellidos)) AS usuario FROM comandas_historial h
                LEFT JOIN usuarios u ON u.id = h.id_usuario LEFT JOIN personas pe ON pe.id = u.id_persona WHERE h.id_comanda = $1 ORDER BY h.id`, [id]),
  ]);
  return { ...c, propia: c.id_mesero === ctx.id_usuario, items: items.rows, impresiones: impresiones.rows, historial: hist.rows };
};

/* ------------------------------ Operaciones ------------------------------ */
// d: { id_mesa, items: [{ id_producto, cantidad, nota }], nota }
export const crear = async (d, ctx, clave) => {
  const r = await enTransaccion((client) => conClave(client, clave, ctx.id_negocio, async () => {
    const { rows: [mesa] } = await client.query(`SELECT * FROM mesas WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [Number(d.id_mesa) || 0, ctx.id_negocio]);
    if (!mesa) throw errorHttp(400, "Elige la mesa");
    if (!mesa.activo) throw errorHttp(409, "La mesa está desactivada");
    const pendiente = await pendienteEnMesa(client, mesa.id);
    if (pendiente) throw errorHttp(409, pendiente);
    if (mesa.estado === "Ocupada") throw errorHttp(409, "La mesa está ocupada (la atiende la caja)");
    const items = await prepararItems(client, d.items, ctx.id_negocio);
    await client.query(`SELECT pg_advisory_xact_lock(hashtext('comandas'), $1)`, [ctx.id_negocio]);
    const { rows: [{ n }] } = await client.query(`SELECT COALESCE(max(numero), 0) + 1 AS n FROM comandas WHERE id_negocio = $1`, [ctx.id_negocio]);
    const { rows: [c] } = await client.query(
      `INSERT INTO comandas (id_negocio, numero, id_mesa, id_mesero, nota) VALUES ($1, $2, $3, $4, $5) RETURNING id, numero`,
      [ctx.id_negocio, n, mesa.id, ctx.id_usuario, d.nota ? String(d.nota).trim().slice(0, 300) || null : null]
    ).catch((e) => { throw e.code === "23505" ? errorHttp(409, "La mesa ya tiene una comanda abierta") : e; });
    for (const i of items) {
      await client.query(
        `INSERT INTO comandas_items (id_comanda, tanda, id_producto, nombre, cantidad, precio_unitario, nota, id_usuario) VALUES ($1, 1, $2, $3, $4, $5, $6, $7)`,
        [c.id, i.id_producto, i.nombre, i.cantidad, i.precio_unitario, i.nota, ctx.id_usuario]
      );
    }
    await client.query(`UPDATE mesas SET estado = 'Ocupada' WHERE id = $1`, [mesa.id]);
    await historial(client, c.id, "CREADA", { mesa: mesa.nombre, productos: items.length }, ctx.id_usuario);
    return { id: c.id, numero: c.numero };
  }), ctx);
  let impresion = null;
  if (!r.repetido) {
    impresion = await imprimir(r.id, { tanda: 1, tipo: "NUEVA" }, ctx.id_usuario);
    notificarComanda(ctx.id_negocio, "comanda_nueva", r.id);
    notificarMesas(ctx.id_negocio).catch(() => {});
  }
  return { ...(await detalle(r.id, ctx)), impresion, repetido: Boolean(r.repetido) };
};

// Agregar productos a una comanda abierta (o en cobro, si aún no se ha pagado)
export const adicionar = async (id, d, ctx, clave) => {
  const todas = await atiendeTodas(ctx.user);
  const r = await enTransaccion((client) => conClave(client, clave, ctx.id_negocio, async () => {
    const c = await comandaBloqueada(client, id, ctx.id_negocio);
    if (!["ABIERTA", "EN_COBRO"].includes(c.estado)) throw errorHttp(409, `La comanda está ${c.estado === "PAGADA" ? "pagada" : "anulada"}`);
    if (!todas && c.id_mesero !== ctx.id_usuario) throw errorHttp(403, "Esta comanda es de otro mesero");
    const items = await prepararItems(client, d.items, ctx.id_negocio);
    const { rows: [{ t }] } = await client.query(`SELECT COALESCE(max(tanda), 0) + 1 AS t FROM comandas_items WHERE id_comanda = $1`, [id]);
    let pago = null;
    if (c.estado === "EN_COBRO") {
      ({ rows: [pago] } = await client.query(`SELECT id, estado_pago FROM pagos WHERE id_venta = $1 FOR UPDATE`, [c.id_venta]));
      if (!pago || pago.estado_pago) throw errorHttp(409, "La cuenta ya se pagó: abre una comanda nueva");
    }
    let suma = 0;
    for (const i of items) {
      const sub = redondear(i.precio_unitario * i.cantidad);
      suma += sub;
      let idItemVenta = null;
      if (pago) {
        ({ rows: [{ id: idItemVenta }] } = await client.query(
          `INSERT INTO ventas_items (id_venta, id_producto, cantidad, precio_unitario, descuento, descuento_porcentaje, impuesto, subtotal)
           VALUES ($1, $2, $3, $4, 0, 0, 0, $5) RETURNING id`, [c.id_venta, i.id_producto, i.cantidad, i.precio_unitario, sub]
        ));
      }
      await client.query(
        `INSERT INTO comandas_items (id_comanda, tanda, id_producto, nombre, cantidad, precio_unitario, nota, id_usuario, id_venta_item) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [id, t, i.id_producto, i.nombre, i.cantidad, i.precio_unitario, i.nota, ctx.id_usuario, idItemVenta]
      );
    }
    if (pago) {
      await client.query(`UPDATE ventas SET subtotal = subtotal + $1, total = total + $1 WHERE id = $2`, [redondear(suma), c.id_venta]);
      await client.query(`UPDATE pagos SET monto_pagado = COALESCE(monto_pagado, 0) + $1 WHERE id = $2`, [redondear(suma), pago.id]);
    }
    await client.query(`UPDATE comandas SET updated_at = now() WHERE id = $1`, [id]);
    await historial(client, id, "ADICION", { tanda: t, productos: items.length, en_cobro: Boolean(pago) }, ctx.id_usuario);
    return { id, tanda: t, en_cobro: Boolean(pago) };
  }), ctx);
  let impresion = null;
  if (!r.repetido) {
    impresion = await imprimir(id, { tanda: r.tanda, tipo: "ADICION" }, ctx.id_usuario);
    notificarComanda(ctx.id_negocio, "comanda_actualizada", id);
  }
  return { ...(await detalle(id, ctx)), impresion, tanda: r.tanda, repetido: Boolean(r.repetido) };
};

// Reimprimir (copia) o reintentar una impresión fallida; nunca crea ni duplica productos
export const reimprimir = async (id, d, ctx) => {
  const { rows: [c] } = await pool.query(`SELECT id, id_mesero, estado FROM comandas WHERE id = $1 AND id_negocio = $2`, [id, ctx.id_negocio]);
  if (!c) throw errorHttp(404, "Comanda no encontrada");
  if (!(await atiendeTodas(ctx.user)) && c.id_mesero !== ctx.id_usuario) throw errorHttp(403, "Esta comanda es de otro mesero");
  const tanda = d.tanda ? Number(d.tanda) : null;
  let tipo = "REIMPRESION";
  if (tanda) {
    const { rows: [u] } = await pool.query(`SELECT estado FROM comandas_impresiones WHERE id_comanda = $1 AND tanda = $2 ORDER BY id DESC LIMIT 1`, [id, tanda]);
    if (!u || u.estado === "ERROR" || u.estado === "PENDIENTE") tipo = "REINTENTO";   // nunca llegó a cocina: va como original
  }
  await pool.query(`INSERT INTO comandas_historial (id_comanda, evento, detalle, id_usuario) VALUES ($1, $2, $3, $4)`,
    [id, tipo, JSON.stringify({ tanda }), ctx.id_usuario]);
  const impresion = await imprimir(id, { tanda, tipo }, ctx.id_usuario);
  notificarComanda(ctx.id_negocio, "comanda_actualizada", id);
  return { impresion };
};

export const anular = async (id, motivo, ctx) => {
  const texto = String(motivo ?? "").trim();
  if (texto.length < 3) throw errorHttp(400, "Escribe el motivo de la anulación");
  const todas = await atiendeTodas(ctx.user);
  await enTransaccion(async (client) => {
    const c = await comandaBloqueada(client, id, ctx.id_negocio);
    if (c.estado === "EN_COBRO" || c.estado === "PAGADA") throw errorHttp(409, "La comanda ya está en caja: se anula la factura desde la caja");
    if (c.estado !== "ABIERTA") throw errorHttp(409, "La comanda ya está anulada");
    if (!todas && c.id_mesero !== ctx.id_usuario) throw errorHttp(403, "Esta comanda es de otro mesero");
    await client.query(`UPDATE comandas SET estado = 'ANULADA', anulada_en = now(), anulada_por = $1, motivo_anulacion = $2, updated_at = now() WHERE id = $3`,
      [ctx.id_usuario, texto.slice(0, 300), id]);
    if (c.id_mesa && !(await pendienteEnMesa(client, c.id_mesa))) await client.query(`UPDATE mesas SET estado = 'Disponible' WHERE id = $1`, [c.id_mesa]);
    await historial(client, id, "ANULADA", { motivo: texto.slice(0, 300) }, ctx.id_usuario);
  }, ctx);
  const impresion = await imprimir(id, { tipo: "ANULACION" }, ctx.id_usuario);
  notificarComanda(ctx.id_negocio, "comanda_anulada", id);
  notificarMesas(ctx.id_negocio).catch(() => {});
  return { ok: true, impresion };
};

// La caja toma la comanda: se crea la venta pendiente de la mesa en la caja abierta
// del cajero, con los mismos productos (una sola vez: la comanda queda bloqueada).
export const pasarACobro = async (id, ctx) => {
  const r = await enTransaccion(async (client) => {
    const c = await comandaBloqueada(client, id, ctx.id_negocio);
    if (c.estado === "EN_COBRO") throw errorHttp(409, "Otra caja ya tomó esta comanda para cobrarla", { id_venta: c.id_venta });
    if (c.estado !== "ABIERTA") throw errorHttp(409, `La comanda está ${c.estado === "PAGADA" ? "pagada" : "anulada"}`);
    const { rows: [caja] } = await client.query(
      `SELECT c.id FROM caja c JOIN usuarios u ON u.id = c.id_usuario WHERE c.id_usuario = $1 AND u.id_negocio = $2 AND c.estado = 'ABIERTA'
       ORDER BY c.fecha_apertura DESC LIMIT 1`, [ctx.id_usuario, ctx.id_negocio]
    );
    if (!caja) throw errorHttp(409, "Abre tu caja para cobrar");
    const { rows: items } = await client.query(`SELECT * FROM comandas_items WHERE id_comanda = $1 ORDER BY id`, [id]);
    if (!items.length) throw errorHttp(409, "La comanda no tiene productos");
    const { rows: [final] } = await client.query(`SELECT id FROM personas WHERE identificacion LIKE '%22222222%' ORDER BY id LIMIT 1`);
    const productos = items.map((i) => ({
      id_producto: i.id_producto, cantidad: i.cantidad, precio_unitario: Number(i.precio_unitario),
      descuento: 0, descuento_porcentaje: 0, impuesto: 0, subtotal: redondear(Number(i.precio_unitario) * i.cantidad),
    }));
    const total = redondear(productos.reduce((a, p) => a + p.subtotal, 0));
    const id_venta = await insertarVenta(client, {
      id_cliente: final?.id ?? null, id_caja: caja.id, id_mesa: c.id_mesa, subtotal: total, total, estado: "activa",
      nota: `Comanda #${c.numero}${c.nota ? ` · ${c.nota}` : ""}`.slice(0, 500), productos,
      metodo_pago: "PENDIENTE", monto_pagado: total, monto_recibido: null, cambio: null,
    });
    // Mismo orden de inserción: cada producto de la comanda queda ligado a su ítem de venta
    const { rows: vi } = await client.query(`SELECT id FROM ventas_items WHERE id_venta = $1 ORDER BY id`, [id_venta]);
    for (let k = 0; k < items.length; k++) await client.query(`UPDATE comandas_items SET id_venta_item = $1 WHERE id = $2`, [vi[k]?.id ?? null, items[k].id]);
    await client.query(`UPDATE comandas SET estado = 'EN_COBRO', id_venta = $1, id_cajero = $2, en_cobro_en = now(), updated_at = now() WHERE id = $3`, [id_venta, ctx.id_usuario, id]);
    if (c.id_mesa) await client.query(`UPDATE mesas SET estado = 'Ocupada' WHERE id = $1`, [c.id_mesa]);
    await historial(client, id, "EN_COBRO", { id_venta, total }, ctx.id_usuario);
    return { id_venta, id_mesa: c.id_mesa, total };
  }, ctx);
  notificarComanda(ctx.id_negocio, "comanda_en_cobro", id);
  notificarMesas(ctx.id_negocio).catch(() => {});
  notificarCaja(ctx.id_usuario).catch(() => {});
  return r;
};
