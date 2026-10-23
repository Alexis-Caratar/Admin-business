// Pago dividido: una cuenta con varios medios (NEQUI + EFECTIVO…), en venta directa y en mesa.
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
const api = async (metodo, ruta, { body, t = F.cajero } = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { "content-type": "application/json", authorization: `Bearer ${t}` }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const venta = (extra) => ({
  id_caja: F.caja, id_cliente: 25, subtotal: 24000, total: 24000, estado: "activa", nota: null,
  productos: [{ id_producto: F.almuerzo, cantidad: 2, precio_unitario: 12000, descuento: 0, descuento_porcentaje: 0, impuesto: 0, subtotal: 24000 }],
  ...extra,
});
const medios = async (id_venta) => (await q(`SELECT pm.metodo_pago, pm.monto::float, pm.cambio::float FROM pagos_medios pm JOIN pagos pg ON pg.id = pm.id_pago WHERE pg.id_venta = $1 ORDER BY pm.id`, [id_venta]));

before(async () => {
  server = http.createServer(app).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  const [n] = await q(`INSERT INTO negocios (nombre, url_negocio, nit) VALUES ($1, $2, $3) RETURNING id`, [`ZZ DIV ${RUN}`, `zz-div-${RUN}`, `ZD${RUN}`]);
  F.neg = n.id;
  await q(`INSERT INTO app_modulos_negocio (id_modulo, id_negocio, activo) SELECT id, $1, true FROM app_modulos WHERE url = 'cajero'`, [F.neg]);
  const [pe] = await q(`INSERT INTO personas (identificacion, nombres, apellidos, tipo) VALUES ($1, 'Caja', 'ZZ', 'Empleado') RETURNING id`, [`ZZD${RUN}`]);
  const [u] = await q(`INSERT INTO usuarios (email, password, id_negocio, id_persona) VALUES ($1, 'x', $2, $3) RETURNING id`, [`zzdiv${RUN}@prueba.co`, F.neg, pe.id]);
  await q(`INSERT INTO app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo) SELECT $1, id, true FROM app_modulos WHERE url = 'cajero'`, [u.id]);
  F.cajero = jwt.sign({ id: u.id, id_negocio: F.neg, roles_sistema: [] }, process.env.JWT_SECRET);
  F.admin = jwt.sign({ id: u.id, id_negocio: F.neg, roles_sistema: ["SUPERADMIN"] }, process.env.JWT_SECRET);
  F.caja = (await q(`INSERT INTO caja (id_usuario, monto_inicial, estado, fecha_apertura) VALUES ($1, 0, 'ABIERTA', NOW()) RETURNING id`, [u.id]))[0].id;
  const [c] = await q(`INSERT INTO categorias (id_negocio, nombre, activo) VALUES ($1, 'Almuerzos', true) RETURNING id`, [F.neg]);
  const [p] = await q(`INSERT INTO productos (nombre, id_categoria, estado, publicacion_web, es_complemento, usa_receta, controla_inventario, hora_inicio, hora_fin)
                       VALUES ('ZZ Almuerzo', $1, true, false, false, false, false, '00:00', '23:59:59') RETURNING id`, [c.id]);
  await q(`INSERT INTO productos_precios (id_producto, precio_costo, precio_venta) VALUES ($1, 0, 12000)`, [p.id]);
  F.almuerzo = p.id;
  F.mesa = (await q(`INSERT INTO mesas (id_negocio, nombre, capacidad, estado) VALUES ($1, 'Mesa ZZ', 4, 'Disponible') RETURNING id`, [F.neg]))[0].id;
});
after(async () => { server.close(); await pool.end(); });

test("venta directa: 10.000 por Nequi y 14.000 en efectivo (recibe 20.000, cambio 6.000)", async () => {
  const r = await api("POST", "/cajero/finalizar-venta", { body: venta({ metodo_pago: "MIXTO", pagos: [{ metodo_pago: "NEQUI", monto: 10000 }, { metodo_pago: "EFECTIVO", monto: 14000, monto_recibido: 20000 }] }) });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  F.v1 = r.json.result.id_venta;
  assert.deepEqual(await medios(F.v1), [{ metodo_pago: "NEQUI", monto: 10000, cambio: null }, { metodo_pago: "EFECTIVO", monto: 14000, cambio: 6000 }]);
  const [pg] = await q(`SELECT metodo_pago, estado_pago, monto_pagado::float, monto_recibido::float, cambio FROM pagos WHERE id_venta = $1`, [F.v1]);
  assert.deepEqual([pg.metodo_pago, pg.estado_pago, pg.monto_pagado, pg.monto_recibido, pg.cambio], ["MIXTO", true, 24000, 30000, 6000]);
});

test("no se registra si los medios no suman el total o el efectivo no alcanza", async () => {
  const antes = (await q(`SELECT count(*)::int n FROM ventas WHERE id_caja = $1`, [F.caja]))[0].n;
  let r = await api("POST", "/cajero/finalizar-venta", { body: venta({ metodo_pago: "MIXTO", pagos: [{ metodo_pago: "NEQUI", monto: 10000 }, { metodo_pago: "EFECTIVO", monto: 10000 }] }) });
  assert.equal(r.status, 400); assert.match(r.json.error, /suman/);
  r = await api("POST", "/cajero/finalizar-venta", { body: venta({ metodo_pago: "MIXTO", pagos: [{ metodo_pago: "NEQUI", monto: 12000 }, { metodo_pago: "EFECTIVO", monto: 12000, monto_recibido: 5000 }] }) });
  assert.equal(r.status, 400);
  r = await api("POST", "/cajero/finalizar-venta", { body: venta({ metodo_pago: "MIXTO", pagos: [{ metodo_pago: "NEQUI", monto: 24000 }] }) });
  assert.equal(r.status, 400, "al menos dos medios");
  r = await api("POST", "/cajero/finalizar-venta", { body: venta({ metodo_pago: "MIXTO", pagos: [{ metodo_pago: "TIQUERERA", monto: 12000 }, { metodo_pago: "EFECTIVO", monto: 12000 }] }) });
  assert.equal(r.status, 400, "la tiquetera no entra en el pago dividido");
  assert.equal((await q(`SELECT count(*)::int n FROM ventas WHERE id_caja = $1`, [F.caja]))[0].n, antes, "nada a medias");
});

test("mesa: la cuenta pendiente se cobra dividida (12.000 Nequi + 12.000 efectivo) contra el total del servidor", async () => {
  const r = await api("POST", "/cajero/finalizar-venta", { body: venta({ metodo_pago: "PENDIENTE", id_mesa: F.mesa }) });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  F.v2 = r.json.result.id_venta;
  const mal = await api("POST", "/cajero/actualizar_venta", { body: { id_venta: F.v2, metodo_pago: "MIXTO", pagos: [{ metodo_pago: "NEQUI", monto: 1 }, { metodo_pago: "EFECTIVO", monto: 1 }], id_cliente: 25 } });
  assert.equal(mal.status, 400, "debe sumar el total real de la venta");
  const ok = await api("POST", "/cajero/actualizar_venta", { body: { id_venta: F.v2, metodo_pago: "MIXTO", pagos: [{ metodo_pago: "NEQUI", monto: 12000 }, { metodo_pago: "EFECTIVO", monto: 12000 }], id_cliente: 25 } });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.deepEqual((await medios(F.v2)).map((m) => [m.metodo_pago, m.monto]), [["NEQUI", 12000], ["EFECTIVO", 12000]]);
  assert.equal((await q(`SELECT estado FROM mesas WHERE id = $1`, [F.mesa]))[0].estado, "Disponible");
});

test("arqueo y flujo de caja suman cada medio donde entró; el ticket muestra el desglose", async () => {
  const a = (await api("POST", "/cajero/arqueo", { body: { id_caja: F.caja } })).json.result;
  const met = Object.fromEntries(a.ventas_metodos.map((m) => [m.metodo_pago, Number(m.total)]));
  assert.equal(met.NEQUI, 22000); assert.equal(met.EFECTIVO, 26000); assert.equal(Number(a.total_ventas), 48000);
  const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })).toISOString().slice(0, 10);
  const f = (await api("GET", `/finanzas/flujo?desde=${hoy}&hasta=${hoy}`, { t: F.admin })).json.data;
  assert.equal(f.entradas_por_medio.NEQUI, 22000); assert.equal(f.entradas_por_medio.EFECTIVO, 26000);
  assert.equal(f.entradas_por_medio.MIXTO, undefined);
  const t = await api("GET", `/cajero/ticket/${F.v1}`);
  const texto = JSON.stringify(t.json);
  assert.ok(texto.includes("Pago dividido") && texto.includes("NEQUI"), "el ticket muestra los medios");
});
