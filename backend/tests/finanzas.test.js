// Pruebas del módulo financiero con un negocio de prueba propio (datos de prueba
// identificados con el prefijo "ZZ FIN"). Cada resultado se compara con el
// cálculo hecho a mano en el comentario.
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
const token = (id, id_negocio, roles = []) => jwt.sign({ id, id_negocio, nombre: "ZZ FIN", roles_sistema: roles }, process.env.JWT_SECRET);
const api = async (metodo, ruta, { body, t = F.admin } = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { "content-type": "application/json", authorization: `Bearer ${t}` }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const hoy = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })).toISOString().slice(0, 10);
const mes = () => `${hoy().slice(0, 7)}-01`;
const finDeMes = () => { const [y, m] = hoy().split("-").map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };
const mesMenos = (n) => { const [y, m] = hoy().split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 - n, 1)); return d.toISOString().slice(0, 7); };
const cerca = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.02, `${msg}: ${a} ≠ ${b}`);

before(async () => {
  server = http.createServer(app).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  // Negocio de prueba aislado, con usuario, caja abierta y módulo Finanzas activo
  const [n] = await q(`INSERT INTO negocios (nombre, url_negocio, nit) VALUES ($1, $2, $3) RETURNING id`, [`ZZ FIN ${RUN}`, `zz-fin-${RUN}`, `ZZ${RUN}`]);
  F.negocio = n.id;
  const [per] = await q(`INSERT INTO personas (identificacion, nombres, apellidos, tipo) VALUES ($1, 'ZZ', 'Cajero', 'Cliente') RETURNING id`, [`ZZC${RUN}`]);
  F.persona = per.id;
  const [u] = await q(`INSERT INTO usuarios (email, password, id_negocio, id_persona) VALUES ($1, 'x', $2, $3) RETURNING id`, [`zzfin${RUN}@prueba.co`, F.negocio, per.id]);
  F.usuario = u.id;
  const [cj] = await q(`INSERT INTO caja (id_usuario, monto_inicial, estado, fecha_apertura) VALUES ($1, 0, 'ABIERTA', NOW()) RETURNING id`, [F.usuario]);
  F.caja = cj.id;
  // Finanzas vive dentro de Ventas: el negocio y el usuario tienen el módulo Ventas
  const [m] = await q(`SELECT id FROM app_modulos WHERE url = 'ventas'`);
  await q(`INSERT INTO app_modulos_negocio (id_modulo, id_negocio, activo) VALUES ($1, $2, true)`, [m.id, F.negocio]);
  await q(`INSERT INTO app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo) VALUES ($1, $2, true)`, [F.usuario, m.id]);
  F.admin = token(F.usuario, F.negocio, ["SUPERADMIN"]);
  F.usr = token(F.usuario, F.negocio);
  F.otro = token(1, 1, ["SUPERADMIN"]);

  // Catálogo: café (costo de referencia 1.000 → estimado) y hamburguesa con receta
  // (0,2 kg carne × 20.000 + 1 pan × 500 = 4.500 → costo real)
  const [cat] = await q(`INSERT INTO categorias (id_negocio, nombre, activo) VALUES ($1, 'ZZ Comidas', true) RETURNING id`, [F.negocio]);
  const [carne] = await q(`INSERT INTO inventario (nombre, unidad, tipo, stock_actual, costo_unitario, estado, id_negocio) VALUES ('ZZ Carne', 'KG', 'INSUMO', 10, 20000, true, $1) RETURNING id`, [F.negocio]);
  const [pan] = await q(`INSERT INTO inventario (nombre, unidad, tipo, stock_actual, costo_unitario, estado, id_negocio) VALUES ('ZZ Pan', 'UND', 'INSUMO', 50, 500, true, $1) RETURNING id`, [F.negocio]);
  F.carne = carne.id; F.pan = pan.id;
  const prod = async (nombre, precio, costo, receta = null) => {
    const [p] = await q(`INSERT INTO productos (nombre, id_categoria, estado, publicacion_web, es_complemento, usa_receta, controla_inventario, hora_inicio, hora_fin)
                         VALUES ($1, $2, true, false, false, $3, $3, '00:00', '23:59:59') RETURNING id`, [nombre, cat.id, Boolean(receta)]);
    await q(`INSERT INTO productos_precios (id_producto, precio_costo, precio_venta) VALUES ($1, $2, $3)`, [p.id, costo, precio]);
    for (const [inv, cant] of receta ?? []) await q(`INSERT INTO recetas (producto_id, inventario_id, cantidad) VALUES ($1, $2, $3)`, [p.id, inv, cant]);
    return p.id;
  };
  F.cafe = await prod("ZZ Café", 3000, 1000);
  F.hamburguesa = await prod("ZZ Hamburguesa", 12000, 0, [[F.carne, 0.2], [F.pan, 1]]);
  F.malPrecio = await prod("ZZ Mal precio", 1000, 1500);

  // Ventas de hoy: V1 = 2 cafés + 1 hamburguesa = 18.000 · V2 anulada (no suma)
  const venta = async (items, estado = "activa") => {
    const total = items.reduce((a, [, c, p]) => a + c * p, 0);
    const [v] = await q(`INSERT INTO ventas (numero_consecutivo, numero_factura, id_cliente, id_caja, fecha, subtotal, descuento, impuesto, total, estado) VALUES (nextval('ventas_numero_seq'), $1, $4, $2, NOW(), $3, 0, 0, $3, 'activa') RETURNING id`, [`ZZF-${RUN}-${Math.random().toString(36).slice(2, 7)}`, F.caja, total, F.persona]);
    for (const [id, c, p] of items) await q(`INSERT INTO ventas_items (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)`, [v.id, id, c, p, c * p]);
    await q(`INSERT INTO pagos (id_venta, estado_pago, metodo_pago, monto_pagado, monto_recibido, cambio, fecha) VALUES ($1, true, 'EFECTIVO', $2, $2, 0, NOW())`, [v.id, total]);
    if (estado === "cancelado") await q(`UPDATE ventas SET estado = 'cancelado' WHERE id = $1`, [v.id]);
    return v.id;
  };
  await venta([[F.cafe, 2, 3000], [F.hamburguesa, 1, 12000]]);
  await venta([[F.hamburguesa, 1, 12000]], "cancelado");

  // Egresos de caja del cajero (texto libre, como hoy)
  const egreso = async (descripcion, montoE) => (await q(
    `INSERT INTO egresos (id_negocio, id_caja, numero_consecutivo, numero_egreso, fecha, descripcion, metodo_pago, monto, estado)
     VALUES ($1, $2, nextval('egresos_numero_seq'), 'ZZ', NOW(), $3, 'EFECTIVO', $4, 'ACTIVO') RETURNING id`, [F.negocio, F.caja, descripcion, montoE]))[0].id;
  F.egLeche = await egreso("leche", 20000);
  F.egBase = await egreso("aumento de base", 50000);
  F.egSuelto = await egreso("varios sin nombre", 7000);
});

after(async () => {
  server.close();
  await pool.end();
});

const cats = async () => (await api("GET", "/finanzas/categorias")).json.data;
const catId = async (codigo) => (await cats()).find((c) => c.codigo === codigo).id;

test("costo histórico: cada venta guarda su costo (receta = real, referencia = estimado)", async () => {
  const items = await q(`SELECT vi.id_producto, vi.costo_unitario::float, vi.costo_estimado FROM ventas_items vi JOIN ventas v ON v.id = vi.id_venta WHERE v.id_caja = $1`, [F.caja]);
  const h = items.find((i) => i.id_producto === F.hamburguesa);
  assert.equal(h.costo_unitario, 4500); // 0,2 × 20.000 + 1 × 500
  assert.equal(h.costo_estimado, false);
  const c = items.find((i) => i.id_producto === F.cafe);
  assert.equal(c.costo_unitario, 1000);
  assert.equal(c.costo_estimado, true);
  // Cambiar el costo después no cambia lo ya vendido
  await q(`UPDATE inventario SET costo_unitario = 99999 WHERE id = $1`, [F.carne]);
  const [h2] = await q(`SELECT vi.costo_unitario::float FROM ventas_items vi JOIN ventas v ON v.id = vi.id_venta WHERE v.id_caja = $1 AND vi.id_producto = $2 LIMIT 1`, [F.caja, F.hamburguesa]);
  assert.equal(h2.costo_unitario, 4500);
  await q(`UPDATE inventario SET costo_unitario = 20000 WHERE id = $1`, [F.carne]);
});

test("gastos: validación, pago parcial, pago desde caja sin doble conteo y anulación", async () => {
  const arriendo = await catId("arriendo");
  let r = await api("POST", "/finanzas/gastos", { body: { id_categoria: arriendo, concepto: "Arriendo", valor: -5, periodo: "2026-13" } });
  assert.equal(r.status, 400);
  assert.ok(r.json.errores.valor && r.json.errores.periodo);
  r = await api("POST", "/finanzas/gastos", { body: { id_categoria: await catId("base_caja"), concepto: "x", valor: 10, periodo: mes() } });
  assert.equal(r.status, 400, "una categoría no operativa no es gasto");

  r = await api("POST", "/finanzas/gastos", { body: { id_categoria: arriendo, concepto: `ZZ Arriendo ${RUN}`, valor: 900000, periodo: mes(), fecha_vencimiento: hoy() } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  F.gasto = r.json.data.id;
  r = await api("POST", `/finanzas/gastos/${F.gasto}/pagos`, { body: { valor: 400000, medio: "TRANSFERENCIA", fecha: hoy() } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  let d = (await api("GET", `/finanzas/gastos/${F.gasto}`)).json.data;
  assert.equal(d.estado, "PARCIAL");
  assert.equal(d.saldo, 500000);
  r = await api("POST", `/finanzas/gastos/${F.gasto}/pagos`, { body: { valor: 600000 } });
  assert.equal(r.status, 400, "no se paga más del saldo");
  r = await api("POST", `/finanzas/gastos/${F.gasto}/pagos`, { body: { valor: 500000, desde_caja: true } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  d = (await api("GET", `/finanzas/gastos/${F.gasto}`)).json.data;
  assert.equal(d.estado, "PAGADO");
  const caja = d.pagos.find((p) => p.medio === "CAJA");
  assert.ok(caja.id_egreso, "el pago desde caja crea y vincula su egreso");
  // Anular con pagos no se puede
  assert.equal((await api("POST", `/finanzas/gastos/${F.gasto}/anular`, { body: { motivo: "x" } })).status, 409);
  // El egreso vinculado no se puede borrar desde la caja
  const { default: Cajero } = await import("../src/services/cajero.service.js");
  await assert.rejects(() => Cajero.eliminarEgreso(caja.id_egreso, F.usuario, F.negocio), /paga un gasto/);
});

test("egresos de caja: sugerencia por palabras y clasificación", async () => {
  const lista = (await api("GET", `/finanzas/egresos?desde=${mes()}&hasta=${hoy()}`)).json.data;
  const leche = lista.find((e) => e.id === F.egLeche);
  assert.equal(leche.sugerencia?.categoria, "Materias primas e ingredientes");
  assert.equal(lista.find((e) => e.id === F.egBase).sugerencia?.grupo, "NO_OPERATIVO");
  const r = await api("POST", "/finanzas/egresos/clasificar", { body: { egresos: [{ id: F.egLeche, id_categoria: leche.sugerencia.id_categoria }, { id: F.egBase, id_categoria: await catId("base_caja") }] } });
  assert.equal(r.json.data.clasificados, 2);
});

test("recurrentes: proyección y generación sin duplicados", async () => {
  const r = await api("POST", "/finanzas/recurrentes", { body: { id_categoria: await catId("internet"), concepto: `ZZ Internet ${RUN}`, valor_estimado: 100000, periodicidad: "MENSUAL", dia_vencimiento: 10, fecha_inicio: `${mesMenos(2)}-01` } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  F.recurrente = r.json.data.id;
  const p = (await api("GET", `/finanzas/recurrentes/proyeccion?desde=${mesMenos(2)}&hasta=${mesMenos(-2)}`)).json.data;
  assert.equal(p.items.filter((i) => i.id_recurrente === F.recurrente).length, 5);
  assert.ok(p.items.every((i) => i.estado === "PROYECTADO"), "proyectar no crea registros");
  let c = await api("POST", "/finanzas/recurrentes/causar", { body: { hasta: mes() } });
  assert.equal(c.json.data.creados.length, 3); // hace 2 meses, el anterior y este
  c = await api("POST", "/finanzas/recurrentes/causar", { body: { hasta: mes() } });
  assert.equal(c.json.data.creados.length, 0, "repetirlo no duplica");
});

test("resultado del mes: ventas, costo, márgenes, gastos y punto de equilibrio (cálculo manual)", async () => {
  const r = (await api("GET", `/finanzas/resultado?desde=${mes()}&hasta=${finDeMes()}`)).json.data;
  assert.equal(r.ventas.brutas, 18000);
  assert.equal(r.ventas.netas, 18000);
  assert.equal(r.ventas.transacciones, 1);
  assert.equal(r.ventas.anuladas, 1);
  assert.equal(r.ventas.ticket_promedio, 18000);
  cerca(r.ventas.cobertura_costo_real_pct, 66.7, "12.000 de 18.000 con costo real");
  const t = r.costos.teorico;
  assert.equal(t.costo_ventas, 6500); // 2 × 1.000 + 4.500
  assert.equal(t.margen_bruto, 11500); // 18.000 − 6.500
  cerca(t.margen_bruto_pct, 63.9, "11.500 / 18.000");
  // Gastos: arriendo 900.000 (fijo) + internet de este mes 100.000 (servicio). La leche es insumo, la base es traslado, el suelto está por clasificar
  assert.equal(r.gastos.operativos, 1000000);
  assert.equal(r.gastos.fijos, 1000000);
  assert.equal(r.gastos.sin_clasificar, 7000);
  assert.equal(r.costos.compras.detalle.insumos_pagados_por_caja, 20000);
  assert.equal(t.resultado_operativo_estimado, -988500); // 11.500 − 1.000.000
  cerca(t.punto_equilibrio, 1565217.39, "1.000.000 / (11.500 / 18.000)");
});

test("flujo de caja: entradas reales, el pago desde caja cuenta una vez y los traslados se excluyen", async () => {
  const f = (await api("GET", `/finanzas/flujo?desde=${mes()}&hasta=${hoy()}`)).json.data;
  assert.equal(f.totales.entradas, 18000, "solo la venta activa");
  // Operación: transferencia 400.000 + egreso del pago 500.000 + leche 20.000 + suelto 7.000 (la base es traslado)
  assert.equal(f.totales.salidas_operacion, 927000);
  assert.equal(f.totales.traslados_excluidos, 50000);
  assert.equal(f.totales.neto, 18000 - 927000);
});

test("compras: inventario, costo promedio, pagos, duplicados y anulación", async () => {
  const body = {
    proveedor: { identificacion: `ZZP${RUN}`, nombres: "ZZ Carnes del Sur" }, numero_factura: `F-${RUN}`,
    fecha_factura: hoy(), fecha_vencimiento: hoy(), costos_adicionales: 10000,
    items: [{ id_inventario: F.carne, cantidad: 5, costo_unitario: 22000 }],
  };
  let r = await api("POST", "/compras/crear", { body: { ...body, items: [{ id_inventario: F.carne, cantidad: 0, costo_unitario: -1 }] } });
  assert.equal(r.status, 400);
  r = await api("POST", "/compras/crear", { body });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  F.compra = r.json.compra.id;
  assert.equal(Number(r.json.compra.total), 120000); // 5 × 22.000 + flete 10.000
  assert.equal(r.json.compra.estado, "PENDIENTE");
  const [inv] = await q(`SELECT stock_actual::float, costo_unitario::float FROM inventario WHERE id = $1`, [F.carne]);
  assert.equal(inv.stock_actual, 14.8); // 10 − 0,2 vendidos + 5
  // Promedio: (9,8 × 20.000 + 5 × 24.000) / 14,8 = 21.351,35 (el flete entra al costo: 24.000 c/u)
  cerca(inv.costo_unitario, 21351.3514, "costo promedio");
  const [mov] = await q(`SELECT costo_unitario::float FROM inventario_movimientos WHERE inventario_id = $1 AND motivo = 'COMPRA' ORDER BY id DESC LIMIT 1`, [F.carne]);
  assert.equal(mov.costo_unitario, 24000);
  assert.equal((await q(`SELECT count(*)::int n FROM inventario_costos WHERE id_compra = $1`, [F.compra]))[0].n, 1);
  assert.equal((await api("POST", "/compras/crear", { body })).status, 400, "la misma factura del mismo proveedor no se registra dos veces");

  // La compra no es gasto; en la base "compras" sí es costo del período
  const res = (await api("GET", `/finanzas/resultado?desde=${mes()}&hasta=${finDeMes()}`)).json.data;
  assert.equal(res.gastos.operativos, 1000000);
  assert.equal(res.costos.compras.costo_ventas, 140000); // 120.000 compra + 20.000 leche

  r = await api("POST", `/compras/${F.compra}/pagos`, { body: { valor: 50000, desde_caja: true } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const f = (await api("GET", `/finanzas/flujo?desde=${mes()}&hasta=${hoy()}`)).json.data;
  assert.equal(f.totales.salidas_compras, 50000, "el pago de la compra sale una sola vez");
  assert.equal(f.totales.salidas_operacion, 927000, "y no se cuenta como gasto de operación");
  assert.equal((await api("POST", `/compras/${F.compra}/anular`, { body: { motivo: "prueba" } })).status, 409, "con pagos no se anula");
  const pago = (await api("GET", `/compras/${F.compra}`)).json.compra.pagos[0];
  assert.equal((await api("DELETE", `/compras/${F.compra}/pagos/${pago.id}`)).status, 200);
  assert.equal((await api("POST", `/compras/${F.compra}/anular`, { body: { motivo: "prueba" } })).status, 200);
  const [inv2] = await q(`SELECT stock_actual::float, costo_unitario::float FROM inventario WHERE id = $1`, [F.carne]);
  assert.equal(inv2.stock_actual, 9.8);
  cerca(inv2.costo_unitario, 20000, "vuelve al costo anterior");
});

test("rentabilidad: contribución por producto, estimados y precio insuficiente", async () => {
  const r = (await api("GET", `/finanzas/rentabilidad?desde=${mes()}&hasta=${hoy()}&todos=1&orden=contribucion`)).json.data;
  const h = r.productos.find((p) => p.id === F.hamburguesa);
  assert.equal(h.ingresos, 12000);
  assert.equal(h.contribucion, 7500); // 12.000 − 4.500
  cerca(h.contribucion_pct, 62.5, "7.500 / 12.000");
  const c = r.productos.find((p) => p.id === F.cafe);
  assert.equal(c.contribucion, 4000); // 6.000 − 2 × 1.000
  assert.equal(c.costo_estimado, true);
  assert.equal(r.productos[0].id, F.hamburguesa, "ordenado por contribución, no por unidades (el café vende más unidades)");
  const m = r.productos.find((p) => p.id === F.malPrecio);
  assert.ok(m.senales.includes("El precio no cubre el costo"));
});

test("presupuestos, comparación con período anterior y crecimiento sin división por cero", async () => {
  const r = await api("PUT", "/finanzas/presupuestos", { body: { presupuestos: [{ periodo: mes(), tipo: "VENTAS", valor: 36000 }, { periodo: mes(), tipo: "GASTO", valor: 500000 }] } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  await api("PUT", "/finanzas/presupuestos", { body: { presupuestos: [{ periodo: mes(), tipo: "VENTAS", valor: 36000 }] } });
  assert.equal((await q(`SELECT count(*)::int n FROM fin_presupuestos WHERE id_negocio = $1 AND tipo = 'VENTAS'`, [F.negocio]))[0].n, 1, "sin duplicados");
  const s = (await api("GET", `/finanzas/resumen?desde=${mes()}&hasta=${finDeMes()}&base=teorico`)).json.data;
  assert.equal(s.presupuesto.cumplimiento_meta_pct, 50); // 18.000 / 36.000
  assert.equal(s.presupuesto.ejecucion_gastos_pct, 200); // 1.000.000 / 500.000
  assert.equal(s.comparacion.ventas_netas.anterior, 0);
  assert.equal(s.comparacion.ventas_netas.crecimiento_pct, null, "sin período anterior no hay porcentaje");
  assert.equal(s.serie.length, 12);
  assert.ok(s.notas.some((n) => /no es utilidad neta/.test(n)));
});

test("aislamiento: otro negocio no ve ni toca estos datos; sin módulo no hay acceso", async () => {
  assert.equal((await api("GET", `/finanzas/gastos/${F.gasto}`, { t: F.otro })).status, 404);
  assert.ok(!(await api("GET", "/finanzas/gastos", { t: F.otro })).json.data.some((g) => g.id === F.gasto));
  assert.equal((await api("GET", `/compras/${F.compra}`, { t: F.otro })).status, 404);
  assert.equal((await api("POST", `/finanzas/gastos/${F.gasto}/pagos`, { t: F.otro, body: { valor: 1 } })).status, 404);
  // Usuario sin el módulo: 403
  await q(`UPDATE app_usuario_modulos SET activo = false WHERE id_usuario = $1`, [F.usuario]);
  assert.equal((await api("GET", "/finanzas/resumen", { t: F.usr })).status, 403);
  await q(`UPDATE app_usuario_modulos SET activo = true WHERE id_usuario = $1`, [F.usuario]);
  assert.equal((await api("GET", "/finanzas/resumen", { t: F.usr })).status, 200);
});
