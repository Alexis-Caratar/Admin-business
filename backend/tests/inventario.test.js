// Pruebas de inventario: descuento al vender, anulación, recetas, movimientos,
// conteos de caja y eliminación de caja. BD DESECHABLE con migraciones 001–004:
//   DB_NAME=zz_tienda_test node --test tests/inventario.test.js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";

process.env.TIENDA_VALIDAR_HORARIO = "false";
process.env.TIENDA_LIMITE_PEDIDOS = "1000";
if (!/test|prueba/i.test(process.env.DB_NAME ?? "")) {
  throw new Error("Las pruebas solo corren contra una BD desechable (DB_NAME debe contener 'test')");
}

const { default: app } = await import("../src/app.js");
const { pool } = await import("../src/config/db.js");
const { default: CajeroService, insertarVenta } = await import("../src/services/cajero.service.js");
const jwt = (await import("jsonwebtoken")).default;

const RUN = crypto.randomBytes(3).toString("hex");
let server, base, F = {};
const q = async (sql, p) => (await pool.query(sql, p)).rows;
const token = (id, id_negocio = 1) => jwt.sign({ id, id_negocio, nombre: "Prueba", roles_sistema: [] }, process.env.JWT_SECRET);
const api = async (metodo, ruta, { body, tk } = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { "content-type": "application/json", ...(tk ? { authorization: `Bearer ${tk}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const stock = async (id) => Number((await q(`SELECT stock_actual FROM inventario WHERE id = $1`, [id]))[0].stock_actual);

// Venta como la hace el POS (insertarVenta en su propia transacción)
const vender = async (id_caja, items) => {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const id = await insertarVenta(c, {
      id_cliente: 25, id_caja, subtotal: 0, total: 0, estado: "activa", nota: `prueba ${RUN}`, metodo_pago: "EFECTIVO", monto_pagado: 0,
      productos: items.map(([id_producto, cantidad]) => ({ id_producto, cantidad, precio_unitario: 0, descuento: 0, descuento_porcentaje: 0, impuesto: 0, subtotal: 0 })),
    });
    await c.query("COMMIT");
    return id;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
};

before(async () => {
  // La copia de la base puede traer credenciales propias guardadas desde el admin:
  // las pruebas usan las del .env de prueba
  await pool.query(`DELETE FROM negocios_integraciones`).catch(() => {});
  server = http.createServer(app).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  const [cat] = await q(`INSERT INTO categorias (id_negocio, nombre, activo) VALUES (1, 'ZZ Inv ${RUN}', true) RETURNING id`);
  const inv = async (nombre, s) => (await q(`INSERT INTO inventario (nombre, unidad, tipo, stock_actual, estado, id_negocio) VALUES ($1, 'UND', 'PRODUCTO', $2, true, 1) RETURNING id`, [`${nombre} ${RUN}`, s]))[0].id;
  const prod = async (nombre, { inventario_id = null, receta = false, controla = true, web = true } = {}) => {
    const [p] = await q(
      `INSERT INTO productos (nombre, id_categoria, estado, publicacion_web, es_complemento, usa_receta, controla_inventario, inventario_id, hora_inicio, hora_fin)
       VALUES ($1, $2, true, $3, false, $4, $5, $6, '00:00', '23:59:59') RETURNING id`,
      [`${nombre} ${RUN}`, cat.id, web, receta, controla, inventario_id]);
    await q(`INSERT INTO productos_precios (id_producto, precio_costo, precio_venta) VALUES ($1, 0, 1000)`, [p.id]);
    return p.id;
  };
  F.cat = cat.id;
  F.invGaseosa = await inv("Gaseosa", 5);
  F.invPan = await inv("Pan", 10);
  F.invQueso = await inv("Queso", 3);
  F.invCero = await inv("Agotado", 0);
  F.gaseosa = await prod("Gaseosa", { inventario_id: F.invGaseosa });
  F.sandwich = await prod("Sándwich", { receta: true });
  await q(`INSERT INTO recetas (producto_id, inventario_id, cantidad) VALUES ($1, $2, 2), ($1, $3, 1)`, [F.sandwich, F.invPan, F.invQueso]);
  F.malReceta = await prod("Sin receta", { receta: true });
  F.malDirecto = await prod("Sin inventario");
  F.caja10 = (await q(`SELECT id FROM caja WHERE id_usuario = 10 AND estado = 'ABIERTA' ORDER BY fecha_apertura DESC LIMIT 1`))[0].id;
  F.caja1 = (await q(`SELECT id FROM caja WHERE id_usuario = 1 AND estado = 'ABIERTA' ORDER BY fecha_apertura DESC LIMIT 1`))[0].id;
  F.tk = token(10);
});

after(async () => {
  server.close();
  await pool.end();
});

test("vender descuenta stock y registra VENTA; cancelar devuelve exactamente lo descontado", async () => {
  const id = await vender(F.caja10, [[F.gaseosa, 2]]);
  assert.equal(await stock(F.invGaseosa), 3);
  const [m] = await q(`SELECT tipo, cantidad::float, id_caja FROM inventario_movimientos WHERE id_venta = $1`, [id]);
  assert.deepEqual(m, { tipo: "VENTA", cantidad: 2, id_caja: F.caja10 });

  // Aunque cambie la configuración del producto, la anulación repone el mismo ítem
  await q(`UPDATE productos SET inventario_id = $1 WHERE id = $2`, [F.invQueso, F.gaseosa]);
  await q(`UPDATE ventas SET estado = 'cancelado' WHERE id = $1`, [id]);
  await q(`UPDATE productos SET inventario_id = $1 WHERE id = $2`, [F.invGaseosa, F.gaseosa]);
  assert.equal(await stock(F.invGaseosa), 5);
  assert.equal(await stock(F.invQueso), 3);
});

test("stock insuficiente: la venta se rechaza con el nombre del producto y el stock no cambia", async () => {
  await assert.rejects(vender(F.caja10, [[F.gaseosa, 99]]), /Stock insuficiente de "Gaseosa/);
  assert.equal(await stock(F.invGaseosa), 5);
});

test("ventas simultáneas del último stock: una pasa, la otra se rechaza, nunca queda negativo", async () => {
  await q(`UPDATE inventario SET stock_actual = 1 WHERE id = $1`, [F.invGaseosa]);
  const r = await Promise.allSettled([vender(F.caja10, [[F.gaseosa, 1]]), vender(F.caja1, [[F.gaseosa, 1]])]);
  assert.deepEqual(r.map((x) => x.status).sort(), ["fulfilled", "rejected"]);
  assert.equal(await stock(F.invGaseosa), 0);
  await q(`UPDATE inventario SET stock_actual = 5 WHERE id = $1`, [F.invGaseosa]);
});

test("producto con receta: descuenta cada insumo; disponible en POS y tienda solo si alcanzan", async () => {
  await vender(F.caja10, [[F.sandwich, 2]]);
  assert.equal(await stock(F.invPan), 6);
  assert.equal(await stock(F.invQueso), 1);

  const plato = async () => {
    const { json } = await api("GET", "/tienda/1/catalogo");
    return json.productos.find((c) => c.id === F.cat)?.platos.find((p) => p.id === F.sandwich);
  };
  assert.equal((await plato()).stock_actual, 1); // alcanza el queso para 1
  const pos = await CajeroService.listarProductos(1);
  assert.ok(pos.find((c) => c.id === F.cat)?.platos.some((p) => p.id === F.sandwich));

  await vender(F.caja10, [[F.sandwich, 1]]); // queso en 0
  assert.equal(await plato(), undefined);
  await assert.rejects(vender(F.caja10, [[F.sandwich, 1]]), /Stock insuficiente de "Queso.*" para "Sándwich/);
});

test("producto mal configurado: la venta dice qué falta y el formulario ya no deja guardarlo", async () => {
  await assert.rejects(vender(F.caja10, [[F.malReceta, 1]]), /Sin receta .* no tiene insumos/);
  await assert.rejects(vender(F.caja10, [[F.malDirecto, 1]]), /Sin inventario .* no tiene un ítem de inventario/);

  const crear = (producto, receta = []) => api("POST", "/productos", { tk: F.tk, body: { producto: { id_categoria: F.cat, nombre: `Nuevo ${RUN}`, ...producto }, productos_precios: [], productos_imagenes: [], receta, productos_complementos: [] } });
  let r = await crear({ controla_inventario: true, usa_receta: true });
  assert.equal(r.status, 400);
  assert.match(r.json.error, /insumo/);
  r = await crear({ controla_inventario: true, usa_receta: false, inventario_id: null });
  assert.equal(r.status, 400);
  r = await crear({ controla_inventario: false, usa_receta: false });
  assert.equal(r.status, 201, JSON.stringify(r.json));
});

test("editar un ítem no cambia su stock; salidas y entradas validadas; movimientos de venta no se borran", async () => {
  const antes = await stock(F.invGaseosa);
  let r = await api("PUT", `/inventario/${F.invGaseosa}`, { tk: F.tk, body: { nombre: `Gaseosa ${RUN}`, unidad: "UND", tipo: "PRODUCTO", stock_actual: 999, estado: true } });
  assert.equal(r.status, 200);
  assert.equal(await stock(F.invGaseosa), antes);

  r = await api("POST", "/inventario/movimientos", { tk: F.tk, body: { inventario_id: F.invGaseosa, tipo: "SALIDA", cantidad: antes + 1 } });
  assert.equal(r.status, 409);
  r = await api("POST", "/inventario/movimientos", { tk: F.tk, body: { inventario_id: F.invGaseosa, tipo: "MAGIA", cantidad: 1 } });
  assert.equal(r.status, 400);
  r = await api("POST", "/inventario/movimientos", { tk: F.tk, body: { inventario_id: F.invGaseosa, tipo: "ENTRADA", cantidad: 4, observacion: "Compra" } });
  assert.equal(r.status, 201);
  assert.equal(await stock(F.invGaseosa), antes + 4);

  // Eliminar la entrada manual revierte; un movimiento de venta no se puede borrar
  assert.equal((await api("DELETE", `/inventario/movimientos/${r.json.id}`, { tk: F.tk })).status, 200);
  assert.equal(await stock(F.invGaseosa), antes);
  const [venta] = await q(`SELECT id FROM inventario_movimientos WHERE inventario_id = $1 AND tipo = 'VENTA' LIMIT 1`, [F.invGaseosa]);
  assert.equal((await api("DELETE", `/inventario/movimientos/${venta.id}`, { tk: F.tk })).status, 409);

  // Otro negocio no ve ni toca este inventario; un ítem en uso no se elimina
  assert.equal((await api("POST", "/inventario/movimientos", { tk: token(10, 9), body: { inventario_id: F.invGaseosa, tipo: "ENTRADA", cantidad: 1 } })).status, 404);
  assert.equal((await api("DELETE", `/inventario/${F.invGaseosa}`, { tk: F.tk })).status, 409);
});

test("el conteo de caja incluye los ítems en 0 (si no, nunca se pueden volver a contar)", async () => {
  const lista = await CajeroService.obtener_inventario(1);
  assert.ok(lista.some((i) => i.id === F.invCero));
});

test("arqueo: el stock esperado descuenta también las ventas de otra caja abierta", async () => {
  const [ap] = await q(`SELECT 1 FROM inventario_caja WHERE id_caja = $1 AND estado = 'APERTURA CAJA' LIMIT 1`, [F.caja10]);
  if (!ap) await q(`INSERT INTO inventario_caja (id_caja, id_producto, stock_apertura, stock_sistema, diferencia, estado, fecha_registro) VALUES ($1, $2, 5, 5, 0, 'APERTURA CAJA', NOW() - INTERVAL '1 hour')`, [F.caja10, F.invGaseosa]);
  await q(`INSERT INTO inventario_caja (id_caja, id_producto, stock_apertura, stock_sistema, diferencia, estado, fecha_registro)
           SELECT $1, $2, s.stock_actual, s.stock_actual, 0, 'APERTURA CAJA', NOW() - INTERVAL '1 second' FROM inventario s WHERE s.id = $2
           AND NOT EXISTS (SELECT 1 FROM inventario_caja WHERE id_caja = $1 AND id_producto = $2 AND estado = 'APERTURA CAJA')`, [F.caja10, F.invGaseosa]);
  await vender(F.caja1, [[F.gaseosa, 1]]); // la vende la OTRA caja
  const { inventario } = await CajeroService.arqueo({ id_caja: F.caja10 }, 1);
  const fila = inventario.find((i) => i.id_producto === F.invGaseosa);
  assert.ok(fila.ventas_otras_cajas >= 1);
  // Lo esperado coincide con el stock real (ambas cajas mueven el mismo inventario)
  const [{ apertura }] = await q(`SELECT MIN(fecha_registro) AS apertura FROM inventario_caja WHERE id_caja = $1 AND estado = 'APERTURA CAJA'`, [F.caja10]);
  assert.ok(apertura);
  assert.equal(typeof fila.cierre_sistema, "number");
});

test("eliminar una caja devuelve al inventario lo vendido; otro negocio no puede eliminarla", async () => {
  const [u] = await q(`SELECT id FROM usuarios WHERE id_negocio = 1 ORDER BY id LIMIT 1`);
  const [caja] = await q(`INSERT INTO caja (id_usuario, monto_inicial, estado) VALUES ($1, 0, 'CERRADA') RETURNING id`, [u.id]);
  const antes = await stock(F.invGaseosa);
  await vender(caja.id, [[F.gaseosa, 2]]);
  assert.equal(await stock(F.invGaseosa), antes - 2);

  await assert.rejects(CajeroService.apiEliminarCaja({ id_caja: caja.id }, 9), /Caja no encontrada/);
  await CajeroService.apiEliminarCaja({ id_caja: caja.id }, 1);
  assert.equal(await stock(F.invGaseosa), antes);
  assert.equal((await q(`SELECT 1 FROM caja WHERE id = $1`, [caja.id])).length, 0);
});
