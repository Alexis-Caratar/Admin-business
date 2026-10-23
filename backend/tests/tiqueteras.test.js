// Tiqueteras integradas con Ventas: venta de la tiquetera, pago de almuerzos,
// venta mixta, saldo, idempotencia, concurrencia, mesas, anulación, permisos,
// portal y flujo de caja. Negocio de prueba propio ("ZZ TIQ").
//   DB_NAME=zz_tienda_test npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";

if (!/test|prueba/i.test(process.env.DB_NAME ?? "")) {
  throw new Error("Las pruebas solo corren contra una BD desechable (DB_NAME debe contener 'test')");
}
const { default: app } = await import("../src/app.js");
const { pool } = await import("../src/config/db.js");
const jwt = (await import("jsonwebtoken")).default;

const RUN = crypto.randomBytes(3).toString("hex");
const q = async (sql, p) => (await pool.query(sql, p)).rows;
let server, base;
const F = {};
const tok = (id, neg, roles = []) => jwt.sign({ id, id_negocio: neg, nombre: "ZZ", roles_sistema: roles }, process.env.JWT_SECRET);
const api = async (metodo, ruta, { body, t = F.cajero, clave } = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { "content-type": "application/json", authorization: `Bearer ${t}`, ...(clave ? { "Idempotency-Key": clave } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const tiq = async (id) => (await q(`SELECT consumidos, estado FROM tiqueteras WHERE id = $1`, [id]))[0];
const ventaCarrito = (items) => ({
  id_caja: F.caja, id_cliente: null, nota: null,
  subtotal: items.reduce((a, [, c, p]) => a + c * p, 0), total: items.reduce((a, [, c, p]) => a + c * p, 0),
  productos: items.map(([id, c, p]) => ({ id_producto: id, cantidad: c, precio_unitario: p, descuento: 0, descuento_porcentaje: 0, impuesto: 0, subtotal: c * p })),
});

before(async () => {
  server = http.createServer(app).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  const [n] = await q(`INSERT INTO negocios (nombre, url_negocio, nit) VALUES ($1, $2, $3) RETURNING id`, [`ZZ TIQ ${RUN}`, `zz-tiq-${RUN}`, `ZT${RUN}`]);
  F.negocio = n.id;
  const persona = async (doc, nombres, apellidos, tel) => (await q(`INSERT INTO personas (identificacion, nombres, apellidos, tipo, telefono) VALUES ($1, $2, $3, 'Cliente', $4) RETURNING id`, [doc, nombres, apellidos, tel]))[0].id;
  const usuario = async (doc) => (await q(`INSERT INTO usuarios (email, password, id_negocio, id_persona) VALUES ($1, 'x', $2, $3) RETURNING id`, [`zz${doc}${RUN}@prueba.co`, F.negocio, await persona(`ZZU${doc}${RUN}`, "ZZ", `Cajero ${doc}`, null)]))[0].id;
  F.ucaja = await usuario("c"); F.usin = await usuario("s");
  const [m] = await q(`SELECT id FROM app_modulos WHERE url = 'cajero'`);
  await q(`INSERT INTO app_modulos_negocio (id_modulo, id_negocio, activo) VALUES ($1, $2, true)`, [m.id, F.negocio]);
  await q(`INSERT INTO app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo) VALUES ($1, $2, true)`, [F.ucaja, m.id]);
  F.cajero = tok(F.ucaja, F.negocio); F.sinModulo = tok(F.usin, F.negocio); F.admin = tok(F.ucaja, F.negocio, ["SUPERADMIN"]); F.otro = tok(1, 1, ["SUPERADMIN"]);
  F.caja = (await q(`INSERT INTO caja (id_usuario, monto_inicial, estado, fecha_apertura) VALUES ($1, 50000, 'ABIERTA', NOW()) RETURNING id`, [F.ucaja]))[0].id;
  F.cliente = await persona(`ZZM${RUN}`, "María Fernanda", "López", `300${RUN}`);
  F.final = await persona(`2222222222${RUN}`, "Consumidor", "Final", null);
  const cat = async (nombre, eleg) => (await q(`INSERT INTO categorias (id_negocio, nombre, activo, tiquetera_elegible) VALUES ($1, $2, true, $3) RETURNING id`, [F.negocio, nombre, eleg]))[0].id;
  const cAlm = await cat("2. Almuerzos", true), cBeb = await cat("6. Bebidas", false);
  const prod = async (nombre, c, precio) => {
    const [p] = await q(`INSERT INTO productos (nombre, id_categoria, estado, publicacion_web, es_complemento, usa_receta, controla_inventario, hora_inicio, hora_fin) VALUES ($1, $2, true, false, false, false, false, '00:00', '23:59:59') RETURNING id`, [nombre, c]);
    await q(`INSERT INTO productos_precios (id_producto, precio_costo, precio_venta) VALUES ($1, 0, $2)`, [p.id, precio]);
    return p.id;
  };
  F.almuerzo = await prod("ZZ Pollo plancha", cAlm, 12000);
  F.gaseosa = await prod("ZZ Gaseosa", cBeb, 3000);
  // Complemento de $0 dentro de Almuerzos (como "Sopa del dia"): acompaña al plato, no es otro almuerzo
  F.sopa = await prod("ZZ Sopa del dia", cAlm, 0);
  await q(`UPDATE productos SET es_complemento = true WHERE id = $1`, [F.sopa]);
});
after(async () => { server.close(); await pool.end(); });

test("tipos y venta de la tiquetera en la caja (entra el dinero; consumidor final no)", async () => {
  assert.equal((await api("POST", "/tiqueteras/tipos", { body: { nombre: "x", almuerzos: 0, precio: -1 } })).status, 403, "el cajero no configura tipos");
  let r = await api("POST", "/tiqueteras/tipos", { t: F.admin, body: { nombre: "x", almuerzos: 0, precio: -1 } });
  assert.equal(r.status, 400);
  r = await api("POST", "/tiqueteras/tipos", { t: F.admin, body: { nombre: "Tiquetera 30 almuerzos", almuerzos: 30, precio: 330000 } });
  assert.equal(r.status, 200, JSON.stringify(r.json)); F.tipo30 = r.json.data.id;
  F.tipo2 = (await api("POST", "/tiqueteras/tipos", { t: F.admin, body: { nombre: "Prueba 2", almuerzos: 2, precio: 24000, vigencia_dias: 30 } })).json.data.id;

  assert.equal((await api("POST", "/tiqueteras", { body: { id_cliente: F.final, id_tipo: F.tipo30, metodo_pago: "EFECTIVO" } })).status, 400, "no a consumidor final");
  r = await api("POST", "/tiqueteras", { body: { id_cliente: F.cliente, id_tipo: F.tipo30, metodo_pago: "EFECTIVO", monto_recibido: 350000 } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  F.t30 = r.json.data.tiquetera;
  assert.equal(F.t30.codigo, "TQ-000001");
  assert.equal(F.t30.valor_almuerzo, 11000); // 330.000 / 30
  assert.equal(F.t30.disponibles, 30);
  assert.equal(r.json.data.cambio, 20000);
  const a = await api("POST", "/cajero/arqueo", { body: { id_caja: F.caja } });
  assert.equal(a.json.result.tiqueteras_efectivo, 330000, "el dinero de la tiquetera entra a la caja");
});

test("búsqueda por nombre, documento, teléfono, código y enlace (QR)", async () => {
  for (const q_ of ["María Fernanda", `ZZM${RUN}`, `300${RUN}`, "tq-1", `https://x.co/tiquetera/${F.t30.token_portal}`]) {
    const r = await api("GET", `/tiqueteras/buscar?q=${encodeURIComponent(q_)}`);
    assert.ok(r.json.data.some((t) => t.id === F.t30.id), `no encontró con "${q_}"`);
  }
});

test("venta mixta: los almuerzos con tiquetera, la gaseosa se cobra aparte; sin segundo cobro", async () => {
  const venta = ventaCarrito([[F.almuerzo, 2, 12000], [F.gaseosa, 1, 3000]]);
  let r = await api("POST", "/tiqueteras/consumir", { body: { id_tiquetera: F.t30.id, venta } });
  assert.equal(r.status, 400); assert.equal(r.json.requiere_metodo_resto, true);
  r = await api("POST", "/tiqueteras/consumir", { clave: `mix-${RUN}`, body: { id_tiquetera: F.t30.id, venta, metodo_resto: "EFECTIVO", monto_recibido_resto: 5000 } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const d = r.json.data; F.ventaA = d.venta.id_venta;
  assert.deepEqual([d.antes.disponibles, d.despues.disponibles, d.despues.consumidos], [30, 28, 2]);
  assert.equal(d.venta.total, 22000, "2 × 11.000 prepagado");
  assert.equal(d.venta_resto.total, 3000);
  const pagos = await q(`SELECT v.id, pg.metodo_pago, pg.monto_pagado::float m, pg.estado_pago, (SELECT count(*)::int FROM ventas_items WHERE id_venta = v.id) items FROM ventas v JOIN pagos pg ON pg.id_venta = v.id WHERE v.id IN ($1, $2) ORDER BY v.id`, [d.venta.id_venta, d.venta_resto.id_venta]);
  assert.deepEqual(pagos.map((p) => [p.metodo_pago, p.m, p.estado_pago, p.items]), [["TIQUERERA", 22000, true, 1], ["EFECTIVO", 3000, true, 1]]);
  const [c] = await q(`SELECT count(*)::int n, sum(cantidad)::int u FROM tiqueteras_consumos WHERE id_venta = $1`, [d.venta.id_venta]);
  assert.deepEqual([c.n, c.u], [1, 2], "consumo vinculado a la venta");
  // Arqueo: no entra dinero por los almuerzos (solo la gaseosa)
  const a = (await api("POST", "/cajero/arqueo", { body: { id_caja: F.caja } })).json.result;
  const met = Object.fromEntries(a.ventas_metodos.map((m) => [m.metodo_pago, Number(m.total)]));
  assert.equal(met.TIQUERERA, 22000); assert.equal(met.EFECTIVO, 3000);
  // Reintento con la misma clave: mismo resultado, nada nuevo
  const rep = await api("POST", "/tiqueteras/consumir", { clave: `mix-${RUN}`, body: { id_tiquetera: F.t30.id, venta, metodo_resto: "EFECTIVO" } });
  assert.equal(rep.json.data.repetido, true);
  assert.equal((await tiq(F.t30.id)).consumidos, 2);
});

test("saldo insuficiente, solo productos no elegibles y tiquetera vencida: no se registra nada", async () => {
  const t2 = (await api("POST", "/tiqueteras", { body: { id_cliente: F.cliente, id_tipo: F.tipo2, metodo_pago: "NEQUI" } })).json.data.tiquetera;
  F.t2 = t2;
  const antes = (await q(`SELECT count(*)::int n FROM ventas WHERE id_caja = $1`, [F.caja]))[0].n;
  let r = await api("POST", "/tiqueteras/consumir", { body: { id_tiquetera: t2.id, venta: ventaCarrito([[F.almuerzo, 3, 12000]]) } });
  assert.equal(r.status, 409); assert.equal(r.json.disponibles, 2);
  r = await api("POST", "/tiqueteras/consumir", { body: { id_tiquetera: t2.id, venta: ventaCarrito([[F.gaseosa, 1, 3000]]) } });
  assert.equal(r.status, 400);
  assert.equal((await q(`SELECT count(*)::int n FROM ventas WHERE id_caja = $1`, [F.caja]))[0].n, antes, "sin ventas a medias");
  await q(`UPDATE tiqueteras SET fecha_vencimiento = CURRENT_DATE - 2 WHERE id = $1`, [t2.id]);
  r = await api("POST", "/tiqueteras/consumir", { body: { id_tiquetera: t2.id, venta: ventaCarrito([[F.almuerzo, 1, 12000]]) } });
  assert.equal(r.status, 409); assert.match(r.json.error, /venció/);
  await q(`UPDATE tiqueteras SET fecha_vencimiento = CURRENT_DATE + 30 WHERE id = $1`, [t2.id]);
});

test("concurrencia: dos cobros a la vez sobre el último saldo, solo uno pasa", async () => {
  await q(`UPDATE tiqueteras SET consumidos = 1 WHERE id = $1`, [F.t2.id]); // queda 1 almuerzo
  const v = () => api("POST", "/tiqueteras/consumir", { clave: crypto.randomUUID(), body: { id_tiquetera: F.t2.id, venta: ventaCarrito([[F.almuerzo, 1, 12000]]) } });
  const rs = await Promise.all([v(), v()]);
  assert.deepEqual(rs.map((r) => r.status).sort(), [200, 409]);
  const t = await tiq(F.t2.id);
  assert.deepEqual([t.consumidos, t.estado], [2, "AGOTADA"]);
});

test("mesa: se paga con tiquetera una venta que ya existía; no se puede pagar dos veces", async () => {
  const [{ id_venta }] = [await (async () => {
    const { insertarVenta } = await import("../src/services/cajero.service.js");
    const c = await pool.connect();
    try { await c.query("BEGIN"); const id = await insertarVenta(c, { id_cliente: F.cliente, id_caja: F.caja, subtotal: 12000, total: 12000, estado: "activa", productos: ventaCarrito([[F.almuerzo, 1, 12000]]).productos, metodo_pago: "PENDIENTE", monto_pagado: 12000 }); await c.query("COMMIT"); return { id_venta: id }; } finally { c.release(); }
  })()];
  let r = await api("POST", "/tiqueteras/consumir", { body: { id_tiquetera: F.t30.id, id_venta } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.data.despues.consumidos, 3);
  r = await api("POST", "/tiqueteras/consumir", { body: { id_tiquetera: F.t30.id, id_venta } });
  assert.equal(r.status, 409);
});

test("anulación: reintegra una sola vez, deja constancia y no se puede reactivar", async () => {
  let r = await api("POST", "/cajero/cancelarFactura", { body: { id_venta: F.ventaA, nota: "cliente se arrepintió" } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal((await tiq(F.t30.id)).consumidos, 1, "vuelven los 2 almuerzos");
  const [c] = await q(`SELECT estado, reintegrado_por, motivo_reintegro FROM tiqueteras_consumos WHERE id_venta = $1`, [F.ventaA]);
  assert.deepEqual([c.estado, c.reintegrado_por, c.motivo_reintegro], ["REINTEGRADO", F.ucaja, "cliente se arrepintió"]);
  await api("POST", "/cajero/cancelarFactura", { body: { id_venta: F.ventaA, nota: "otra vez" } });
  assert.equal((await tiq(F.t30.id)).consumidos, 1, "anular otra vez no reintegra de nuevo");
  await assert.rejects(() => q(`UPDATE ventas SET estado = 'activa' WHERE id = $1`, [F.ventaA]), /no se puede reactivar/);
  assert.equal((await api("POST", "/cajero/cancelarFactura", { t: F.otro, body: { id_venta: F.ventaA, nota: "x" } })).status, 404, "otro negocio no anula");
});

test("permisos y aislamiento", async () => {
  const venta = ventaCarrito([[F.almuerzo, 1, 12000]]);
  assert.equal((await api("POST", "/tiqueteras/consumir", { t: F.sinModulo, body: { id_tiquetera: F.t30.id, venta } })).status, 403);
  assert.equal((await api("POST", "/tiqueteras", { t: F.sinModulo, body: { id_cliente: F.cliente, id_tipo: F.tipo30, metodo_pago: "EFECTIVO" } })).status, 403);
  assert.equal((await api("POST", `/tiqueteras/${F.t30.id}/anular`, { body: { motivo: "x" } })).status, 403, "el cajero no anula tiqueteras");
  assert.equal((await api("POST", "/tiqueteras/consumir", { t: F.otro, body: { id_tiquetera: F.t30.id, id_venta: F.ventaA } })).status, 404, "otro negocio no usa esta tiquetera");
  assert.equal((await api("POST", `/tiqueteras/${F.t30.id}/anular`, { t: F.admin, body: { motivo: "x" } })).status, 409, "con consumos no se anula");
});

test("historial y portal del cliente con el mismo saldo", async () => {
  const h = (await api("GET", `/tiqueteras/historial?id_tiquetera=${F.t30.id}`, { t: F.admin })).json.data;
  assert.equal(h.length, 2);
  const re = h.find((x) => x.id_venta === F.ventaA);
  assert.deepEqual([re.estado, re.estado_venta, re.cantidad], ["REINTEGRADO", "cancelado", 2]);
  assert.ok(re.cajero && re.numero_factura);
  const p = await fetch(`${base}/tiqueteras-portal/${F.t30.token_portal}`).then((r) => r.json());
  assert.deepEqual([p.data.disponibles, p.data.consumidos, p.data.cliente], [29, 1, "María"]);
  assert.equal(p.data.consumos.length, 2);
  assert.ok(!JSON.stringify(p.data).includes(`ZZM${RUN}`), "el portal no expone el documento");
  const b = await fetch(`${base}/tiqueteras-portal/buscar`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ negocio: `zz-tiq-${RUN}`, codigo: "1", documento: `ZZM${RUN}` }) }).then((r) => r.json());
  assert.equal(b.data.token, F.t30.token_portal);
  assert.equal((await fetch(`${base}/tiqueteras-portal/buscar`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ negocio: `zz-tiq-${RUN}`, codigo: "1", documento: "malo" }) })).status, 404);
});

test("flujo de caja: entra el dinero de la tiquetera vendida, no el de los almuerzos consumidos", async () => {
  const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })).toISOString().slice(0, 10);
  const f = (await api("GET", `/finanzas/flujo?desde=${hoy}&hasta=${hoy}`, { t: F.admin })).json.data;
  assert.equal(f.entradas_por_medio["TIQUETERAS (EFECTIVO)"], 330000);
  assert.equal(f.entradas_por_medio["TIQUETERAS (NEQUI)"], 24000);
  assert.equal(f.entradas_por_medio.TIQUERERA, undefined, "los consumos no son dinero nuevo");
  assert.equal(f.entradas_por_medio.EFECTIVO, 3000);
});

test("almuerzo completo (bandeja + sopa del día) descuenta 1, no 2", async () => {
  const venta = ventaCarrito([[F.almuerzo, 2, 12000], [F.sopa, 2, 0]]);
  const p = await api("POST", "/tiqueteras/previsualizar", { body: { productos: venta.productos } });
  assert.equal(p.json.data.almuerzos, 2);
  assert.equal(p.json.data.otros.length, 0, "la sopa no se cobra aparte");
  assert.equal(p.json.data.acompanan.length, 1);
  const r = await api("POST", "/tiqueteras/consumir", { body: { id_tiquetera: F.t30.id, venta } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.data.antes.disponibles - r.json.data.despues.disponibles, 2);
  assert.equal(r.json.data.venta_resto, null);
  const [v] = await q(`SELECT count(*)::int n FROM ventas_items WHERE id_venta = $1`, [r.json.data.venta.id_venta]);
  assert.equal(v.n, 2, "bandejas y sopas quedan en la misma factura");
  // Si el administrador marca el complemento como "Siempre", sí descuenta
  await q(`UPDATE productos SET tiquetera_elegible = true WHERE id = $1`, [F.sopa]);
  const p2 = await api("POST", "/tiqueteras/previsualizar", { body: { productos: venta.productos } });
  assert.equal(p2.json.data.almuerzos, 4);
});
