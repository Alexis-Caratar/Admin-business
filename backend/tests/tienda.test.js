// Pruebas de la tienda web, pedidos, pagos e integración con caja.
// Requieren una base de datos DESECHABLE con el esquema real + migración 001:
//   DB_NAME=zz_tienda_test node --test tests/
// Nunca ejecutar contra la base de producción: crean y modifican datos.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";

process.env.WOMPI_ENTORNO = "pruebas";
process.env.WOMPI_PUBLIC_KEY = "pub_test_prueba";
process.env.WOMPI_INTEGRITY_SECRET = "test_integrity_secret";
process.env.WOMPI_EVENTS_SECRET = "test_events_secret";
process.env.WOMPI_PRIVATE_KEY = "prv_test_prueba";
process.env.TIENDA_URL_PUBLICA = "http://localhost:5173";
process.env.TIENDA_VALIDAR_HORARIO = "false";
process.env.TIENDA_LIMITE_PEDIDOS = "1000";

if (!/test|prueba/i.test(process.env.DB_NAME ?? "")) {
  throw new Error("Las pruebas solo corren contra una BD desechable (DB_NAME debe contener 'test')");
}

const { default: app } = await import("../src/app.js");
const { pool } = await import("../src/config/db.js");
const { default: CajeroService } = await import("../src/services/cajero.service.js");
const jwt = (await import("jsonwebtoken")).default;

let server, base;
const F = {}; // fixtures
// Sufijo por ejecución: las pruebas se pueden repetir sobre la misma BD
const RUN = crypto.randomBytes(4).toString("hex");

const tokenDe = (id, id_negocio = 1) => jwt.sign({ id, id_negocio, nombre: "Prueba", roles_sistema: [] }, process.env.JWT_SECRET);
const api = async (metodo, ruta, { body, token, headers = {} } = {}) => {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};
const q = async (sql, p) => (await pool.query(sql, p)).rows;

const pedidoBase = (extra = {}) => ({
  cliente: { nombre: "Cliente Prueba", telefono: "3001234567", email: "cliente@prueba.co" },
  entrega: { tipo: "DOMICILIO", direccion: "Calle 18 # 20-30", barrio: "Centro" },
  metodo_pago: "CONTRAENTREGA",
  items: [{ id_producto: F.plato, cantidad: 2, complementos: [F.bebida] }],
  ...extra,
});

// Evento de Wompi firmado igual que lo hace la pasarela
const eventoWompi = (tx) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const properties = ["transaction.id", "transaction.status", "transaction.amount_in_cents"];
  const checksum = crypto.createHash("sha256")
    .update(`${tx.id}${tx.status}${tx.amount_in_cents}${timestamp}${process.env.WOMPI_EVENTS_SECRET}`)
    .digest("hex");
  return { event: "transaction.updated", data: { transaction: tx }, environment: "test", signature: { properties, checksum }, timestamp };
};

before(async () => {
  // La copia de la base puede traer credenciales propias guardadas desde el admin:
  // las pruebas usan las del .env de prueba
  await pool.query(`DELETE FROM negocios_integraciones`).catch(() => {});
  server = http.createServer(app).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;

  // Configuración de la tienda del negocio 1 (vive en negocios_sitio)
  await q(`UPDATE negocios_sitio SET tienda_activa = true, publicado = true, tienda_costo_domicilio = 3000,
           tienda_domicilio_gratis_desde = 0, tienda_pedido_minimo = 0, tienda_requiere_caja_abierta = true,
           tienda_permite_domicilio = true, tienda_permite_recoger = true, tienda_permite_contraentrega = true
           WHERE id_negocio = 1`);

  // Fixtures propios en una categoría de prueba del negocio 1
  const [cat] = await q(`INSERT INTO categorias (id_negocio, nombre, activo) VALUES (1, 'ZZ Pruebas tienda', true) RETURNING id`);
  const crearProducto = async (nombre, precio, { web = true, complemento = false, inventario = null } = {}) => {
    const [p] = await q(
      `INSERT INTO productos (nombre, id_categoria, estado, publicacion_web, es_complemento, usa_receta,
                              controla_inventario, inventario_id, hora_inicio, hora_fin)
       VALUES ($1, $2, true, $3, $4, false, $5, $6, '00:00', '23:59:59') RETURNING id`,
      [nombre, cat.id, web, complemento, inventario !== null, inventario]
    );
    await q(`INSERT INTO productos_precios (id_producto, precio_costo, precio_venta) VALUES ($1, 0, $2)`, [p.id, precio]);
    return p.id;
  };
  const [inv0] = await q(`INSERT INTO inventario (nombre, unidad, tipo, stock_actual, estado, id_negocio) VALUES ('ZZ agotado', 'UND', 'PRODUCTO', 0, true, 1) RETURNING id`);
  const [inv3] = await q(`INSERT INTO inventario (nombre, unidad, tipo, stock_actual, estado, id_negocio) VALUES ('ZZ tres', 'UND', 'PRODUCTO', 3, true, 1) RETURNING id`);

  F.plato = await crearProducto("ZZ Hamburguesa", 20000);
  F.bebida = await crearProducto("ZZ Gaseosa", 4000, { complemento: true });
  F.oculto = await crearProducto("ZZ No publicado", 10000, { web: false });
  F.agotado = await crearProducto("ZZ Agotado", 8000, { inventario: inv0.id });
  F.limitado = await crearProducto("ZZ Limitado", 5000, { inventario: inv3.id });
  await q(`INSERT INTO productos_complementos (id_producto, id_producto_complemento, tipo_seleccion, obligatorio, orden, estado)
           VALUES ($1, $2, 'unico', true, 1, true)`, [F.plato, F.bebida]);
  F.categoria = cat.id;

  // Cajero con caja abierta (usuario 10, caja ABIERTA en la copia) y uno sin caja (12)
  F.cajero = tokenDe(10);
  F.sinCaja = tokenDe(12);
  F.sinPermiso = tokenDe(999999);
});

after(async () => {
  server.close();
  await pool.end();
});

const platosDelCatalogo = async () => {
  const { json } = await api("GET", "/tienda/1/catalogo");
  return json.productos.find((c) => c.id === F.categoria)?.platos.map((p) => p.id) ?? [];
};

test("1. producto habilitado para la web aparece en el catálogo (sin datos internos)", async () => {
  const { status, json } = await api("GET", "/tienda/1/catalogo");
  assert.equal(status, 200);
  const cat = json.productos.find((c) => c.id === F.categoria);
  const plato = cat.platos.find((p) => p.id === F.plato);
  assert.ok(plato);
  assert.equal(plato.precio_venta, 20000);
  assert.equal(plato.productos_complementos[0].id_producto_complemento, F.bebida);
  assert.equal("precio_costo" in plato, false);
  assert.equal("codigo_barra" in plato, false);
});

test("2. producto no publicado no aparece y no se puede pedir", async () => {
  assert.equal((await platosDelCatalogo()).includes(F.oculto), false);
  const r = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ items: [{ id_producto: F.oculto, cantidad: 1 }] }) });
  assert.equal(r.status, 409);
});

test("3. producto sin stock no aparece y no permite completar la compra; tampoco pedir más del stock", async () => {
  assert.equal((await platosDelCatalogo()).includes(F.agotado), false);
  let r = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ items: [{ id_producto: F.agotado, cantidad: 1 }] }) });
  assert.equal(r.status, 409);
  r = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ items: [{ id_producto: F.limitado, cantidad: 4 }] }) });
  assert.equal(r.status, 409);
  assert.match(r.json.error, /Solo quedan 3/);
});

test("4. precios manipulados desde el navegador se ignoran: el servidor recalcula", async () => {
  const body = pedidoBase();
  body.items[0].precio_venta = 1;
  body.total = 1;
  body.subtotal = 1;
  const r = await api("POST", "/tienda/1/pedidos", { body });
  assert.equal(r.status, 201);
  // (20000 + 4000) * 2 + 3000 domicilio
  assert.equal(r.json.pedido.total, 51000);
  const [p] = await q(`SELECT subtotal::float, costo_domicilio::float, total::float FROM pedidos WHERE codigo = $1`, [r.json.pedido.codigo]);
  assert.deepEqual(p, { subtotal: 48000, costo_domicilio: 3000, total: 51000 });
});

test("validaciones: datos obligatorios según el tipo de entrega y opción obligatoria", async () => {
  let r = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ entrega: { tipo: "DOMICILIO" } }) });
  assert.equal(r.status, 400);
  assert.ok(r.json.errores.direccion);
  r = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ cliente: { nombre: "A", telefono: "12" } }) });
  assert.ok(r.json.errores.nombre && r.json.errores.telefono);
  r = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ items: [{ id_producto: F.plato, cantidad: 1 }] }) });
  assert.equal(r.status, 400);
  assert.match(r.json.error, /Elige una opción/);
  r = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ entrega: { tipo: "RECOGER" } }) });
  assert.equal(r.status, 201);
  assert.equal(r.json.pedido.total, 48000); // sin domicilio
});

test("idempotencia: el mismo envío repetido no duplica el pedido", async () => {
  const headers = { "Idempotency-Key": `prueba-idem-${RUN}` };
  const a = await api("POST", "/tienda/1/pedidos", { body: pedidoBase(), headers });
  const b = await api("POST", "/tienda/1/pedidos", { body: pedidoBase(), headers });
  assert.equal(a.status, 201);
  assert.equal(b.status, 200);
  assert.equal(a.json.pedido.codigo, b.json.pedido.codigo);
});

test("5. contraentrega: aparece en Pedidos con pago pendiente; confirmar crea la venta en la caja del cajero", async () => {
  const c = await api("POST", "/tienda/1/pedidos", { body: pedidoBase() });
  assert.equal(c.json.pedido.estado_pago, "PENDIENTE");

  const lista = await api("GET", "/pedidos?pendientes=1", { token: F.cajero });
  const p = lista.json.data.find((x) => x.codigo === c.json.pedido.codigo);
  assert.ok(p);
  assert.equal(p.estado_pago, "PENDIENTE");

  const conf = await api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: { estado: "CONFIRMADO", version: p.version } });
  assert.equal(conf.status, 200, conf.json?.error);
  const [venta] = await q(
    `SELECT v.id_caja, v.total::float, pa.metodo_pago, pa.estado_pago, c.id_usuario
     FROM ventas v JOIN pagos pa ON pa.id_venta = v.id JOIN caja c ON c.id = v.id_caja WHERE v.id = $1`,
    [conf.json.data.id_venta]
  );
  assert.equal(venta.id_usuario, 10);
  assert.equal(venta.total, 51000);
  assert.equal(venta.metodo_pago, "PENDIENTE");
  assert.equal(venta.estado_pago, false); // confirmado ≠ pagado

  // Entregar no lo marca como pagado
  let d = conf.json.data;
  for (const estado of ["EN_PREPARACION", "LISTO", "EN_CAMINO", "ENTREGADO"]) {
    const r = await api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: { estado, version: d.version } });
    assert.equal(r.status, 200, r.json?.error);
    d = r.json.data;
  }
  assert.equal(d.estado_pago, "PENDIENTE");

  // Cobro: queda pagado en la venta y en el pedido, una sola vez
  const cobro = await api("POST", `/pedidos/${p.id}/pago`, { token: F.cajero, body: { metodo_pago: "EFECTIVO", monto_recibido: 60000, version: d.version } });
  assert.equal(cobro.status, 200, cobro.json?.error);
  assert.equal(cobro.json.data.estado_pago, "APROBADO");
  const [pago] = await q(`SELECT metodo_pago, estado_pago, cambio FROM pagos WHERE id_venta = $1`, [d.id_venta]);
  assert.deepEqual(pago, { metodo_pago: "EFECTIVO", estado_pago: true, cambio: 9000 });
  const otra = await api("POST", `/pedidos/${p.id}/pago`, { token: F.cajero, body: { metodo_pago: "EFECTIVO", monto_recibido: 60000, version: cobro.json.data.version } });
  assert.equal(otra.status, 409);
});

test("transiciones inválidas se rechazan en el backend", async () => {
  const c = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ entrega: { tipo: "RECOGER" } }) });
  const [p] = await q(`SELECT id, version FROM pedidos WHERE codigo = $1`, [c.json.pedido.codigo]);
  let r = await api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: { estado: "ENTREGADO", version: p.version } });
  assert.equal(r.status, 409);
  r = await api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: { estado: "CANCELADO", version: p.version } });
  assert.equal(r.status, 400); // falta motivo
});

const crearPedidoEnLinea = async () => {
  const c = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ metodo_pago: "EN_LINEA" }) });
  assert.equal(c.status, 201, c.json?.error);
  const url = new URL(c.json.pedido.pago.checkout_url);
  const referencia = url.searchParams.get("reference");
  const monto = Number(url.searchParams.get("amount-in-cents"));
  // La firma de integridad del checkout la calcula el servidor con el secreto
  const esperada = crypto.createHash("sha256").update(`${referencia}${monto}COP${process.env.WOMPI_INTEGRITY_SECRET}`).digest("hex");
  assert.equal(url.searchParams.get("signature:integrity"), esperada);
  assert.equal(monto, 5100000);
  // TIENDA_URL_PUBLICA=localhost en pruebas: Wompi bloquea esa redirección, así que no se envía
  assert.equal(url.searchParams.has("redirect-url"), false);
  const [p] = await q(`SELECT id, version FROM pedidos WHERE codigo = $1`, [c.json.pedido.codigo]);
  return { ...c.json.pedido, referencia, monto, id: p.id };
};

test("6. pago en línea aprobado (webhook firmado) se registra; confirmar no genera un segundo cobro", async () => {
  const p = await crearPedidoEnLinea();

  // No se puede confirmar antes de que el pago esté aprobado
  const [antes] = await q(`SELECT version FROM pedidos WHERE id = $1`, [p.id]);
  let r = await api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: { estado: "CONFIRMADO", version: antes.version } });
  assert.equal(r.status, 409);

  const tx = { id: `tx-aprobada-1-${RUN}`, status: "APPROVED", amount_in_cents: p.monto, currency: "COP", reference: p.referencia, payment_method_type: "CARD" };
  r = await api("POST", "/tienda/pagos/wompi/eventos", { body: eventoWompi(tx) });
  assert.equal(r.status, 200);
  const [ped] = await q(`SELECT estado_pago, version FROM pedidos WHERE id = $1`, [p.id]);
  assert.equal(ped.estado_pago, "APROBADO");

  r = await api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: { estado: "CONFIRMADO", version: ped.version } });
  assert.equal(r.status, 200, r.json?.error);
  const [pago] = await q(`SELECT metodo_pago, estado_pago, monto_pagado::float FROM pagos WHERE id_venta = $1`, [r.json.data.id_venta]);
  assert.deepEqual(pago, { metodo_pago: "WOMPI", estado_pago: true, monto_pagado: 51000 });
  const cobro = await api("POST", `/pedidos/${p.id}/pago`, { token: F.cajero, body: { metodo_pago: "EFECTIVO", monto_recibido: 51000, version: r.json.data.version } });
  assert.equal(cobro.status, 409);
});

test("6b. al volver de Wompi (?id=) el estado se verifica consultando a la pasarela", async () => {
  const p = await crearPedidoEnLinea();
  const original = globalThis.fetch;
  const llamadas = [];
  globalThis.fetch = async (url, opts) => {
    if (String(url).startsWith("https://sandbox.wompi.co/v1/transactions/")) {
      llamadas.push(String(url));
      return new Response(JSON.stringify({ data: { id: `tx-consulta-1-${RUN}`, status: "APPROVED", amount_in_cents: p.monto, currency: "COP", reference: p.referencia } }), { status: 200 });
    }
    return original(url, opts);
  };
  try {
    const r = await api("GET", `/tienda/pedidos/${p.codigo}/${p.token}?id=tx-consulta-1-${RUN}`);
    assert.equal(r.json.pedido.estado_pago, "APROBADO");
    assert.equal(llamadas.length, 1);
    assert.equal("telefono" in r.json.pedido, false);
  } finally {
    globalThis.fetch = original;
  }
});

test("7 y 8. pago pendiente sigue pendiente; rechazado no queda pagado y permite reintentar", async () => {
  const p = await crearPedidoEnLinea();
  const enviar = (status) => api("POST", "/tienda/pagos/wompi/eventos", {
    body: eventoWompi({ id: `tx-${status}-${RUN}`, status, amount_in_cents: p.monto, currency: "COP", reference: p.referencia }),
  });
  await enviar("PENDING");
  let [ped] = await q(`SELECT estado_pago FROM pedidos WHERE id = $1`, [p.id]);
  assert.equal(ped.estado_pago, "PENDIENTE");
  let r = await api("POST", `/tienda/pedidos/${p.codigo}/${p.token}/pago`);
  assert.equal(r.status, 409); // hay un pago en proceso

  await enviar("DECLINED");
  [ped] = await q(`SELECT estado_pago FROM pedidos WHERE id = $1`, [p.id]);
  assert.equal(ped.estado_pago, "RECHAZADO");
  r = await api("POST", `/tienda/pedidos/${p.codigo}/${p.token}/pago`);
  assert.equal(r.status, 200);
  assert.ok(r.json.pago.checkout_url.includes("reference="));
});

test("9. webhook repetido o con firma falsa no duplica nada", async () => {
  const p = await crearPedidoEnLinea();
  const evento = eventoWompi({ id: `tx-dup-1-${RUN}`, status: "APPROVED", amount_in_cents: p.monto, currency: "COP", reference: p.referencia });
  const a = await api("POST", "/tienda/pagos/wompi/eventos", { body: evento });
  const b = await api("POST", "/tienda/pagos/wompi/eventos", { body: evento });
  assert.equal(a.status, 200);
  assert.equal(b.json.duplicado, true);
  const hist = await q(`SELECT 1 FROM pedidos_historial WHERE id_pedido = $1 AND campo = 'estado_pago'`, [p.id]);
  assert.equal(hist.length, 1);

  const falso = structuredClone(evento);
  falso.data.transaction.amount_in_cents = 100;
  const c = await api("POST", "/tienda/pagos/wompi/eventos", { body: falso });
  assert.equal(c.status, 401);
});

test("monto distinto al del pedido no aprueba el pago", async () => {
  const p = await crearPedidoEnLinea();
  await api("POST", "/tienda/pagos/wompi/eventos", {
    body: eventoWompi({ id: `tx-monto-1-${RUN}`, status: "APPROVED", amount_in_cents: 100, currency: "COP", reference: p.referencia }),
  });
  const [ped] = await q(`SELECT estado_pago FROM pedidos WHERE id = $1`, [p.id]);
  assert.equal(ped.estado_pago, "PENDIENTE");
});

test("10. sin caja abierta: la tienda no recibe pedidos y el cajero sin caja no puede confirmar", async () => {
  const c = await api("POST", "/tienda/1/pedidos", { body: pedidoBase() });
  const [p] = await q(`SELECT id, version FROM pedidos WHERE codigo = $1`, [c.json.pedido.codigo]);
  const r = await api("PATCH", `/pedidos/${p.id}/estado`, { token: F.sinCaja, body: { estado: "CONFIRMADO", version: p.version } });
  assert.equal(r.status, 409);
  assert.match(r.json.error, /caja ABIERTA/);

  const abiertas = await q(`UPDATE caja SET estado = 'ZZ_TEMP' WHERE estado = 'ABIERTA' RETURNING id`);
  try {
    const e = await api("GET", "/tienda/1/estado");
    assert.equal(e.json.tienda.abierta, false);
    const n = await api("POST", "/tienda/1/pedidos", { body: pedidoBase() });
    assert.equal(n.status, 409);
  } finally {
    await q(`UPDATE caja SET estado = 'ABIERTA' WHERE id = ANY($1)`, [abiertas.map((x) => x.id)]);
  }
});

test("12. dos actualizaciones simultáneas: solo una gana, la otra recibe 409", async () => {
  const c = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ entrega: { tipo: "RECOGER" } }) });
  const [p] = await q(`SELECT id, version FROM pedidos WHERE codigo = $1`, [c.json.pedido.codigo]);
  const motivo = { estado: "CANCELADO", version: p.version, nota: "Prueba concurrente" };
  const [a, b] = await Promise.all([
    api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: { estado: "CONFIRMADO", version: p.version } }),
    api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: motivo }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  const ventas = await q(`SELECT id_venta FROM pedidos WHERE id = $1`, [p.id]);
  assert.equal(ventas.length, 1);
});

test("13. sin token o sin el módulo Pedidos no hay acceso administrativo", async () => {
  assert.equal((await api("GET", "/pedidos")).status, 401);
  assert.equal((await api("GET", "/pedidos", { token: F.sinPermiso })).status, 403);
  assert.equal((await api("GET", "/pedidos", { token: tokenDe(10, 9) })).status, 403); // otro negocio
});

test("14. cancelar un pedido pagado en línea deja el reembolso pendiente y anula la venta", async () => {
  const p = await crearPedidoEnLinea();
  await api("POST", "/tienda/pagos/wompi/eventos", {
    body: eventoWompi({ id: `tx-cancel-1-${RUN}`, status: "APPROVED", amount_in_cents: p.monto, currency: "COP", reference: p.referencia }),
  });
  let [ped] = await q(`SELECT version FROM pedidos WHERE id = $1`, [p.id]);
  const conf = await api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: { estado: "CONFIRMADO", version: ped.version } });
  const r = await api("PATCH", `/pedidos/${p.id}/estado`, { token: F.cajero, body: { estado: "CANCELADO", version: conf.json.data.version, nota: "Cliente desistió" } });
  assert.equal(r.status, 200, r.json?.error);
  assert.equal(r.json.data.estado_pago, "REEMBOLSO_PENDIENTE");
  const [v] = await q(`SELECT estado FROM ventas WHERE id = $1`, [conf.json.data.id_venta]);
  assert.equal(v.estado, "cancelado");
  assert.ok(r.json.data.historial.some((h) => h.valor_nuevo === "CANCELADO" && h.nota === "Cliente desistió"));
});

test("15. los pedidos persisten en la base: se recuperan por la API sin WebSocket", async () => {
  const c = await api("POST", "/tienda/1/pedidos", { body: pedidoBase() });
  const lista = await api("GET", "/pedidos?pendientes=1", { token: F.cajero });
  assert.ok(lista.json.data.some((x) => x.codigo === c.json.pedido.codigo));
});

test("16. venta presencial (POS) sigue funcionando, usa la secuencia y el arqueo separa WOMPI", async () => {
  const [caja] = await q(`SELECT id FROM caja WHERE id_usuario = 10 AND estado = 'ABIERTA' ORDER BY fecha_apertura DESC LIMIT 1`);
  const [{ antes }] = await q(`SELECT MAX(numero_consecutivo) AS antes FROM ventas`);
  const r = await CajeroService.finalizarVenta({
    idUsuario: 10, id_negocio: 1, id_cliente: 25, id_caja: caja.id, id_mesa: null,
    subtotal: 20000, descuento: 0, descuento_porcentaje: 0, impuesto: 0, total: 20000, estado: "activa",
    nota: "Prueba POS", metodo_pago: "EFECTIVO", monto_pagado: 20000, monto_recibido: 20000, cambio: 0,
    productos: [{ id_producto: F.plato, cantidad: 1, precio_unitario: 20000, descuento: 0, descuento_porcentaje: 0, impuesto: 0, subtotal: 20000 }],
  });
  const [v] = await q(`SELECT numero_consecutivo, numero_factura, metodo_pago FROM ventas WHERE id = $1`, [r.id_venta]);
  assert.equal(v.numero_consecutivo, Number(antes) + 1);
  assert.equal(v.metodo_pago, "EFECTIVO");
  const arqueo = await CajeroService.arqueo({ id_caja: caja.id }, 1);
  const wompiArqueo = arqueo.ventas_metodos.find((m) => m.metodo_pago === "WOMPI");
  assert.ok(Number(wompiArqueo.total) >= 51000);
});

test("sin webhook ni redirección: la página del pedido confirma el pago buscando la referencia en Wompi", async () => {
  const p = await crearPedidoEnLinea();
  await q(`UPDATE pedidos_transacciones SET updated_at = NOW() - INTERVAL '1 minute' WHERE referencia = $1`, [p.referencia]);
  const original = globalThis.fetch;
  let autorizacion = null;
  globalThis.fetch = async (url, opts) => {
    if (String(url).startsWith("https://sandbox.wompi.co/v1/transactions?reference=")) {
      autorizacion = opts.headers.Authorization;
      return new Response(JSON.stringify({ data: [{ id: `tx-busqueda-${RUN}`, status: "APPROVED", amount_in_cents: p.monto, currency: "COP", reference: p.referencia, created_at: new Date().toISOString() }] }), { status: 200 });
    }
    return original(url, opts);
  };
  try {
    const r = await api("GET", `/tienda/pedidos/${p.codigo}/${p.token}`);
    assert.equal(r.json.pedido.estado_pago, "APROBADO");
    assert.equal(autorizacion, "Bearer prv_test_prueba");
  } finally {
    globalThis.fetch = original;
  }
});

test("redirect-url solo se envía si es una URL pública HTTPS", async () => {
  const { esUrlRetornoValida } = await import("../src/services/pagos/wompi.service.js");
  assert.equal(esUrlRetornoValida("http://localhost:5173/tienda"), false);
  assert.equal(esUrlRetornoValida("http://192.168.80.19:5173/tienda"), false);
  assert.equal(esUrlRetornoValida("https://puntourbano.co/tienda/pedido/A/B"), true);
});

// ------------------------------------------------------------------
// SITIO WEB DINÁMICO
// ------------------------------------------------------------------
const adminSistema = () => jwt.sign({ id: 1, id_negocio: 1, nombre: "Admin", roles_sistema: ["SUPERADMIN"] }, process.env.JWT_SECRET);

test("sitio público por url_negocio y por dominio, con datos de la base", async () => {
  const [n] = await q(`SELECT url_negocio, dominio, nit, direccion FROM negocios WHERE id = 1`);
  const a = await api("GET", `/sitio/${n.url_negocio}`);
  assert.equal(a.status, 200);
  assert.equal(a.json.negocio.nit, n.nit);
  assert.equal(a.json.negocio.direccion, n.direccion);
  assert.ok(Array.isArray(a.json.horarios));
  const b = await api("GET", `/sitio/dominio/www.${n.dominio}`);
  assert.equal(b.json.negocio.id, 1);
  // La tienda también acepta url_negocio en lugar del id
  const c = await api("GET", `/tienda/${n.url_negocio}/catalogo`);
  assert.equal(c.status, 200);
});

test("sitio sin publicar o negocio inexistente → 404", async () => {
  assert.equal((await api("GET", "/sitio/no-existe-este-negocio")).status, 404);
  await q(`UPDATE negocios_sitio SET publicado = false WHERE id_negocio = 9`);
  const [n9] = await q(`SELECT url_negocio FROM negocios WHERE id = 9`);
  if (n9) assert.equal((await api("GET", `/sitio/${n9.url_negocio}`)).status, 404);
});

test("editor del sitio: valida, guarda horarios y respeta url única; solo admin del sistema", async () => {
  const actual = (await api("GET", "/negocios/1/sitio", { token: adminSistema() })).json.data;
  const base = {
    negocio: { url_negocio: actual.url_negocio, dominio: actual.dominio, whatsapp: actual.whatsapp, latitud: actual.latitud, longitud: actual.longitud, google_maps_url: actual.google_maps_url },
    horarios: actual.horarios,
    sitio: { ...actual, publicado: true, tienda_activa: true },
  };
  // Un cajero no puede editar sitios
  assert.equal((await api("PUT", "/negocios/1/sitio", { token: F.cajero, body: base })).status, 403);

  let r = await api("PUT", "/negocios/1/sitio", { token: adminSistema(), body: { ...base, negocio: { ...base.negocio, url_negocio: "Con Espacios!" } } });
  assert.equal(r.status, 400);
  assert.ok(r.json.errores.url_negocio);
  r = await api("PUT", "/negocios/1/sitio", { token: adminSistema(), body: { ...base, negocio: { ...base.negocio, url_negocio: "admin" } } });
  assert.equal(r.status, 400);
  r = await api("PUT", "/negocios/1/sitio", { token: adminSistema(), body: { ...base, sitio: { ...base.sitio, imagen_portada: { src: "http://inseguro.com/a.jpg" } } } });
  assert.equal(r.status, 400);

  const [otro] = await q(`SELECT url_negocio FROM negocios WHERE id <> 1 LIMIT 1`);
  if (otro) {
    r = await api("PUT", "/negocios/1/sitio", { token: adminSistema(), body: { ...base, negocio: { ...base.negocio, url_negocio: otro.url_negocio } } });
    assert.equal(r.status, 409);
  }

  const horarios = [{ dia_semana: 1, hora_apertura: "07:00", hora_cierre: "16:00" }, { dia_semana: 5, hora_apertura: "18:00", hora_cierre: "02:00" }];
  r = await api("PUT", "/negocios/1/sitio", { token: adminSistema(), body: { ...base, horarios, sitio: { ...base.sitio, eslogan: "Eslogan de prueba" } } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.deepEqual(r.json.data.horarios, horarios);
  assert.equal((await api("GET", `/sitio/${base.negocio.url_negocio}`)).json.sitio.eslogan, "Eslogan de prueba");

  // Se restaura el contenido original
  r = await api("PUT", "/negocios/1/sitio", { token: adminSistema(), body: base });
  assert.equal(r.status, 200);
});

test("fuera del horario de negocios_horarios la tienda no recibe pedidos", async () => {
  const originales = await q(`SELECT dia_semana, hora_apertura, hora_cierre FROM negocios_horarios WHERE id_negocio = 1`);
  process.env.TIENDA_VALIDAR_HORARIO = "true";
  try {
    // Abierto solo una hora que ya pasó o no ha llegado: 03:00–03:01 de un día que no es hoy
    const [{ dow }] = await q(`SELECT EXTRACT(DOW FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::int AS dow`);
    await q(`DELETE FROM negocios_horarios WHERE id_negocio = 1`);
    await q(`INSERT INTO negocios_horarios (id_negocio, dia_semana, hora_apertura, hora_cierre) VALUES (1, $1, '03:00', '03:01')`, [(dow + 3) % 7]);
    let e = await api("GET", "/tienda/1/estado");
    assert.equal(e.json.tienda.abierta, false);
    assert.match(e.json.tienda.motivo, /horario/);
    // Todo el día de hoy: abierta
    await q(`DELETE FROM negocios_horarios WHERE id_negocio = 1`);
    await q(`INSERT INTO negocios_horarios (id_negocio, dia_semana, hora_apertura, hora_cierre) VALUES (1, $1, '00:00', '23:59:59')`, [dow]);
    e = await api("GET", "/tienda/1/estado");
    assert.equal(e.json.tienda.abierta, true);
  } finally {
    process.env.TIENDA_VALIDAR_HORARIO = "false";
    await q(`DELETE FROM negocios_horarios WHERE id_negocio = 1`);
    for (const h of originales) {
      await q(`INSERT INTO negocios_horarios (id_negocio, dia_semana, hora_apertura, hora_cierre) VALUES (1, $1, $2, $3)`, [h.dia_semana, h.hora_apertura, h.hora_cierre]);
    }
  }
});

test("resumen administrativo: solo con el módulo pedidos", async () => {
  const r = await api("GET", "/pedidos/resumen", { token: F.cajero });
  assert.equal(r.status, 200);
  assert.ok(r.json.data.totales.pedidos > 0);
  assert.ok(Array.isArray(r.json.data.por_dia));
  // Un usuario con solo el módulo cajero opera pedidos, pero no ve el resumen
  await q(`UPDATE app_usuario_modulos SET activo = false WHERE id_usuario = 12 AND id_modulo_negocio_rol = (SELECT id FROM app_modulos WHERE url = 'pedidos')`);
  try {
    assert.equal((await api("GET", "/pedidos/resumen", { token: F.sinCaja })).status, 403);
    assert.equal((await api("GET", "/pedidos?pendientes=1", { token: F.sinCaja })).status, 200);
  } finally {
    await q(`UPDATE app_usuario_modulos SET activo = true WHERE id_usuario = 12 AND id_modulo_negocio_rol = (SELECT id FROM app_modulos WHERE url = 'pedidos')`);
  }
});

test("crear negocio: genera url_negocio única y su sitio sin publicar; luego se edita en el mismo flujo", async () => {
  const token = adminSistema();
  const [n1] = await q(`SELECT nombre FROM negocios WHERE id = 1`);
  await q(`DELETE FROM negocios WHERE nombre LIKE 'Café Ñandú Prueba%'`); // restos de corridas anteriores
  const crear = (nombre, nit) => api("POST", "/negocios", { token, body: { nombre, nit, direccion: "Calle 1", activo: true, hora_apertura: "", columna_inventada: "x" } });
  const a = await crear("Café Ñandú Prueba", `9-${RUN}-a`);
  assert.equal(a.status, 201, JSON.stringify(a.json));
  assert.equal(a.json.url_negocio, "cafe-nandu-prueba");
  const b = await crear("Café Ñandú Prueba", `9-${RUN}-b`);
  assert.equal(b.json.url_negocio, "cafe-nandu-prueba-2");
  // El NIT es único: mensaje claro, no un error interno
  const dup = await crear("Otro nombre", `9-${RUN}-a`);
  assert.equal(dup.status, 409);
  assert.match(dup.json.error, /NIT/);
  try {
    const sitio = (await api("GET", `/negocios/${a.json.id}/sitio`, { token })).json.data;
    assert.equal(sitio.publicado, false);
    assert.equal((await api("GET", `/sitio/${a.json.url_negocio}`)).status, 404);
    const r = await api("PUT", `/negocios/${a.json.id}/sitio`, {
      token,
      body: { negocio: { url_negocio: "cafe-nandu" }, horarios: [{ dia_semana: 2, hora_apertura: "09:00", hora_cierre: "18:00" }], sitio: { ...sitio, publicado: true } },
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal((await api("GET", "/sitio/cafe-nandu")).json.negocio.nombre, "Café Ñandú Prueba");
    assert.equal((await api("POST", "/negocios", { token, body: { nombre: "  " } })).status, 400);
    assert.ok(n1.nombre);
  } finally {
    await q(`DELETE FROM negocios WHERE id = ANY($1)`, [[a.json.id, b.json.id]]);
  }
});

test("tipo de negocio: el sitio trae el vocabulario y la vista de su tipo; uno nuevo arranca con sus textos sugeridos", async () => {
  const token = adminSistema();
  // Restaurante: carta, platos
  const pu = (await api("GET", "/sitio/1")).json;
  assert.equal(pu.perfil.vista_catalogo, "carta");
  assert.equal(pu.perfil.textos.titulo_catalogo, "La carta");
  assert.equal(pu.perfil.schema, "Restaurant");

  // Lista de tipos para el admin (con sesión)
  assert.equal((await api("GET", "/tipos-negocio")).status, 401);
  const tipos = (await api("GET", "/tipos-negocio", { token })).json.data;
  assert.ok(tipos.some((t) => t.codigo === "supermercado") && tipos.some((t) => t.codigo === "tecnologia"));

  await q(`DELETE FROM negocios WHERE nombre LIKE 'Súper Prueba%'`);
  const c = await api("POST", "/negocios", { token, body: { nombre: "Súper Prueba", nit: `8-${RUN}`, ciudad: "Pasto", tipo: "Supermercado", activo: true } });
  assert.equal(c.status, 201, JSON.stringify(c.json));
  try {
    assert.equal(c.json.tipo_negocio, "supermercado");
    const admin = (await api("GET", `/negocios/${c.json.id}/sitio`, { token })).json.data;
    assert.match(admin.seo_titulo, /Súper Prueba \| Supermercado en Pasto/);
    assert.ok(admin.frases.length > 0 && admin.nosotros_items.length === 3);
    await api("PUT", `/negocios/${c.json.id}/sitio`, { token, body: { negocio: { url_negocio: admin.url_negocio }, horarios: [], sitio: { ...admin, publicado: true } } });
    const pub = (await api("GET", `/sitio/${admin.url_negocio}`)).json;
    assert.equal(pub.perfil.vista_catalogo, "cuadricula");
    assert.equal(pub.perfil.textos.item, "producto");
    assert.equal(pub.perfil.schema, "GroceryStore");

    // Cambiar el tipo al editar el negocio → cambia el perfil
    const neg = c.json;
    await api("PUT", `/negocios/${neg.id}`, { token, body: { ...neg, tipo: "Tecnología" } });
    const tec = (await api("GET", `/sitio/${admin.url_negocio}`)).json;
    assert.equal(tec.perfil.schema, "ElectronicsStore");
    assert.equal(tec.perfil.textos.adiciones, "Accesorios");
  } finally {
    await q(`DELETE FROM negocios WHERE id = $1`, [c.json.id]);
  }
});

test("conciliador: confirma un pago aprobado en Wompi aunque nadie tenga abierta la página del pedido", async () => {
  const { conciliarPagosPendientes } = await import("../src/services/tienda.service.js");
  const p = await crearPedidoEnLinea();
  await q(`UPDATE pedidos_transacciones SET updated_at = NOW() - INTERVAL '1 minute' WHERE referencia = $1`, [p.referencia]);
  const original = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (String(url).startsWith("https://sandbox.wompi.co/v1/transactions?reference=")) {
      const ref = new URL(String(url)).searchParams.get("reference");
      const data = ref === p.referencia
        ? [{ id: `tx-conc-${RUN}`, status: "APPROVED", amount_in_cents: p.monto, currency: "COP", reference: p.referencia, created_at: new Date().toISOString() }]
        : [];
      return new Response(JSON.stringify({ data }), { status: 200 });
    }
    return original(url, opts);
  };
  try {
    const r = await conciliarPagosPendientes();
    assert.ok(r.revisados >= 1);
    const [ped] = await q(`SELECT estado_pago FROM pedidos WHERE id = $1`, [p.id]);
    assert.equal(ped.estado_pago, "APROBADO");
    const [h] = await q(`SELECT nota FROM pedidos_historial WHERE id_pedido = $1 AND valor_nuevo = 'APROBADO'`, [p.id]);
    assert.match(h.nota, /CONCILIACION/);
  } finally {
    globalThis.fetch = original;
  }
});

test("sitio publicado con la tienda apagada: el catálogo se ve pero no se reciben pedidos", async () => {
  await q(`UPDATE negocios_sitio SET tienda_activa = false WHERE id_negocio = 1`);
  try {
    const c = await api("GET", "/tienda/1/catalogo");
    assert.equal(c.status, 200);
    assert.equal(c.json.tienda.abierta, false);
    assert.equal(c.json.tienda.activa, false);
    assert.match(c.json.tienda.motivo, /no recibimos pedidos en línea/);
    const p = await api("POST", "/tienda/1/pedidos", { body: pedidoBase() });
    assert.equal(p.status, 409);
    // Sin sitio publicado ni tienda: no existe
    await q(`UPDATE negocios_sitio SET publicado = false WHERE id_negocio = 1`);
    assert.equal((await api("GET", "/tienda/1/catalogo")).status, 404);
  } finally {
    await q(`UPDATE negocios_sitio SET tienda_activa = true, publicado = true WHERE id_negocio = 1`);
  }
});

// ---------------------------------------------------------------------------
// Ficha de producto (migración 006): campos permitidos, variantes y detalle
// ---------------------------------------------------------------------------
const productoAdmin = (extra = {}, precio = { precio_costo: 0, precio_venta: 10000 }, imagenes = []) => ({
  producto: {
    id_categoria: F.categoria, nombre: `ZZ Labial ${RUN}`, estado: true, publicacion_web: true, es_complemento: false,
    controla_inventario: false, usa_receta: false, hora_inicio: "00:00", hora_fin: "23:59:59", ...extra,
  },
  productos_precios: [precio],
  productos_imagenes: imagenes,
});
const idPorNombre = async (nombre) => (await q(`SELECT id FROM productos WHERE nombre = $1`, [nombre]))[0]?.id;

test("ficha: guarda los campos web, ignora columnas no permitidas y valida el color", async () => {
  const nombre = `ZZ Labial rojo ${RUN}`;
  const r = await api("POST", "/productos", {
    token: F.cajero,
    body: productoAdmin({
      nombre, marca: "  Sami Beauty  ", destacado: true, descripcion_detallada: "Labial cremoso de alta pigmentación.",
      caracteristicas: ["Larga duración", "", "Acabado mate"], atributos: [{ nombre: "Tonalidad", valor: "Rojo carmesí" }, { nombre: "", valor: "x" }],
      variante_nombre: "Rojo carmesí", variante_color: "#C1121F", id: 1, creacion: "2000-01-01", columna_inventada: "x",
    }, { precio_costo: 0, precio_venta: 10000, precio_anterior: 12500 }, [
      { url: "https://ejemplo.co/1.jpg", orden: 0, activo: 1 }, { url: "https://ejemplo.co/2.jpg", orden: 1, activo: 1 },
    ]),
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const [p] = await q(`SELECT * FROM productos WHERE nombre = $1`, [nombre]);
  assert.notEqual(p.id, 1);
  assert.equal(p.marca, "Sami Beauty");
  assert.equal(p.destacado, true);
  assert.deepEqual(p.caracteristicas, ["Larga duración", "Acabado mate"]);
  assert.deepEqual(p.atributos, [{ nombre: "Tonalidad", valor: "Rojo carmesí" }]);
  F.labial = p.id;

  const malo = await api("POST", "/productos", { token: F.cajero, body: productoAdmin({ nombre: `ZZ Color malo ${RUN}`, variante_color: "rojo" }) });
  assert.equal(malo.status, 400);
  assert.equal(await idPorNombre(`ZZ Color malo ${RUN}`), undefined);
});

test("ficha: variantes de un solo nivel y del mismo negocio", async () => {
  const rosa = `ZZ Labial rosa ${RUN}`;
  const ok = await api("POST", "/productos", {
    token: F.cajero,
    body: productoAdmin({ nombre: rosa, id_producto_base: F.labial, variante_nombre: "Rosa palo", variante_color: "#D8A7B1" }, { precio_costo: 0, precio_venta: 11000 }),
  });
  assert.equal(ok.status, 201, JSON.stringify(ok.json));
  F.rosa = await idPorNombre(rosa);

  // Variante de una variante: rechazada
  const nieto = await api("POST", "/productos", { token: F.cajero, body: productoAdmin({ nombre: `ZZ Nieto ${RUN}`, id_producto_base: F.rosa }) });
  assert.equal(nieto.status, 400);
  // Producto con variantes no puede volverse variante de otro
  const ciclo = await api("PUT", `/productos/${F.labial}`, { token: F.cajero, body: { producto: { id_categoria: F.categoria, id_producto_base: F.plato } } });
  assert.equal(ciclo.status, 400);
  // Base de otro negocio: rechazada
  const [otraCat] = await q(`SELECT c.id FROM categorias c WHERE c.id_negocio <> 1 LIMIT 1`);
  if (otraCat) {
    const [ajeno] = await q(`SELECT id FROM productos WHERE id_categoria = $1 LIMIT 1`, [otraCat.id]);
    if (ajeno) {
      const r = await api("POST", "/productos", { token: F.cajero, body: productoAdmin({ nombre: `ZZ Ajeno ${RUN}`, id_producto_base: ajeno.id }) });
      assert.equal(r.status, 400);
    }
  }
  // A sí mismo: rechazada
  const propio = await api("PUT", `/productos/${F.rosa}`, { token: F.cajero, body: { producto: { id_categoria: F.categoria, id_producto_base: F.rosa } } });
  assert.equal(propio.status, 400);
});

test("detalle público: ficha completa, promoción real, variantes e imágenes", async () => {
  const r = await api("GET", `/tienda/1/productos/${F.labial}`);
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const p = r.json.producto;
  assert.equal(p.marca, "Sami Beauty");
  assert.equal(p.precio_venta, 10000);
  assert.equal(p.precio_anterior, 12500);
  assert.deepEqual(p.imagenes, ["https://ejemplo.co/1.jpg", "https://ejemplo.co/2.jpg"]);
  assert.deepEqual(p.caracteristicas, ["Larga duración", "Acabado mate"]);
  assert.equal(p.disponible, true);
  assert.deepEqual(p.variantes.map((v) => v.id), [F.labial, F.rosa]);
  assert.equal(p.variantes[1].precio_venta, 11000);
  assert.ok(!("precio_costo" in p), "no expone datos internos");
  // La variante abre con su propio precio y el mismo grupo
  const v = await api("GET", `/tienda/1/productos/${F.rosa}`);
  assert.equal(v.json.producto.precio_venta, 11000);
  assert.equal(v.json.producto.precio_anterior, null);
  assert.equal(v.json.producto.variantes.length, 2);
  // Relacionados: misma categoría, sin el grupo de variantes
  const ids = r.json.relacionados.map((x) => x.id);
  assert.ok(!ids.includes(F.labial) && !ids.includes(F.rosa));
  assert.ok(ids.includes(F.plato));
  assert.ok(!ids.includes(F.agotado) && !ids.includes(F.oculto));
  // En el catálogo, la variante trae su base para agruparse
  const { json } = await api("GET", "/tienda/1/catalogo");
  const rosa = json.productos.find((c) => c.id === F.categoria).platos.find((x) => x.id === F.rosa);
  assert.equal(rosa.id_producto_base, F.labial);
  assert.equal(rosa.variante_color, "#D8A7B1");
});

test("detalle público: precio anterior menor o igual no es promoción; agotado se ve como no disponible", async () => {
  await q(`UPDATE productos_precios SET precio_anterior = 9000 WHERE id_producto = $1`, [F.labial]);
  assert.equal((await api("GET", `/tienda/1/productos/${F.labial}`)).json.producto.precio_anterior, null);
  await q(`UPDATE productos_precios SET precio_anterior = 12500 WHERE id_producto = $1`, [F.labial]);

  const ag = await api("GET", `/tienda/1/productos/${F.agotado}`);
  assert.equal(ag.status, 200);
  assert.equal(ag.json.producto.disponible, false);
  assert.equal(ag.json.producto.stock_actual, 0);
});

test("detalle público: no publicado, complemento, otro negocio o id inválido → 404", async () => {
  assert.equal((await api("GET", `/tienda/1/productos/${F.oculto}`)).status, 404);
  assert.equal((await api("GET", `/tienda/1/productos/${F.bebida}`)).status, 404);
  assert.equal((await api("GET", `/tienda/1/productos/abc`)).status, 404);
  assert.equal((await api("GET", `/tienda/1/productos/999999999`)).status, 404);
  const [otro] = await q(`SELECT id_negocio FROM negocios_sitio WHERE id_negocio <> 1 AND publicado = true LIMIT 1`);
  if (otro) assert.equal((await api("GET", `/tienda/${otro.id_negocio}/productos/${F.labial}`)).status, 404);
});

// ---------------------------------------------------------------------------
// Integraciones por negocio (migración 007): Wompi y WhatsApp desde el admin
// ---------------------------------------------------------------------------
const NEG = { pub: `pub_test_negocio${RUN}`, integ: `test_integrity_negocio${RUN}`, eventos: `test_events_negocio${RUN}`, priv: `prv_test_negocio${RUN}` };
const limpiarIntegraciones = async () => {
  await q(`DELETE FROM negocios_integraciones WHERE id_negocio = 1`);
  (await import("../src/config/integraciones.js")).invalidarIntegraciones(1);
};

test("integraciones: solo admin del sistema; sin datos propios se usa el .env y no se exponen secretos", async () => {
  await limpiarIntegraciones();
  assert.equal((await api("GET", "/negocios/1/integraciones", { token: F.cajero })).status, 403);
  const r = await api("GET", "/negocios/1/integraciones", { token: adminSistema() });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.data.wompi.origen, "servidor");
  assert.equal(r.json.data.wompi.integrity_secret.guardado, false);
  assert.match(r.json.data.wompi.webhook, /\/api\/tienda\/pagos\/wompi\/eventos$/);
  assert.ok(!JSON.stringify(r.json).includes(process.env.WOMPI_INTEGRITY_SECRET));
});

test("integraciones: valida prefijos según el entorno y exige el bloque completo", async () => {
  const admin = adminSistema();
  let r = await api("PUT", "/negocios/1/integraciones", { token: admin, body: { wompi_entorno: "pruebas", wompi_public_key: "pub_prod_abc" } });
  assert.equal(r.status, 400);
  assert.ok(r.json.errores.wompi_public_key && r.json.errores.wompi_integrity_secret && r.json.errores.wompi_events_secret);
  r = await api("PUT", "/negocios/1/integraciones", { token: admin, body: { whatsapp_phone_number_id: "123456789" } });
  assert.equal(r.status, 400);
  assert.ok(r.json.errores.whatsapp_token);
  r = await api("PUT", "/negocios/1/integraciones", { token: admin, body: { tienda_url_retorno: "no es url" } });
  assert.equal(r.status, 400);
  assert.equal((await q(`SELECT 1 FROM negocios_integraciones WHERE id_negocio = 1`)).length, 0);
});

test("integraciones: con llaves propias el checkout y el webhook usan las del negocio; secretos cifrados", async () => {
  const admin = adminSistema();
  try {
    const r = await api("PUT", "/negocios/1/integraciones", {
      token: admin,
      body: { wompi_entorno: "pruebas", wompi_public_key: NEG.pub, wompi_integrity_secret: NEG.integ, wompi_events_secret: NEG.eventos,
        wompi_private_key: NEG.priv, tienda_url_retorno: "https://tienda.ejemplo.co/" },
    });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.data.wompi.origen, "negocio");
    assert.deepEqual(r.json.data.wompi.integrity_secret, { guardado: true, final: NEG.integ.slice(-4) });
    assert.equal(r.json.data.tienda.url_retorno, "https://tienda.ejemplo.co");
    assert.ok(!JSON.stringify(r.json).includes(NEG.integ), "no devuelve el secreto");
    const [fila] = await q(`SELECT * FROM negocios_integraciones WHERE id_negocio = 1`);
    assert.ok(!JSON.stringify(fila).includes(NEG.integ) && !JSON.stringify(fila).includes(NEG.priv), "secretos cifrados en la base");

    // Checkout con la llave pública y la firma del negocio, y retorno a su URL
    const c = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ metodo_pago: "EN_LINEA" }), headers: { "Idempotency-Key": crypto.randomUUID() } });
    assert.equal(c.status, 201, c.json?.error);
    const url = new URL(c.json.pedido.pago.checkout_url);
    const referencia = url.searchParams.get("reference");
    const monto = Number(url.searchParams.get("amount-in-cents"));
    assert.equal(url.searchParams.get("public-key"), NEG.pub);
    assert.equal(url.searchParams.get("signature:integrity"), crypto.createHash("sha256").update(`${referencia}${monto}COP${NEG.integ}`).digest("hex"));
    assert.match(url.searchParams.get("redirect-url"), /^https:\/\/tienda\.ejemplo\.co\/tienda\/pedido\//);

    // Webhook: firmado con el secreto del servidor → rechazado; con el del negocio → aceptado
    const tx = { id: `tx-neg-${RUN}`, status: "APPROVED", amount_in_cents: monto, currency: "COP", reference: referencia, payment_method_type: "CARD" };
    assert.equal((await api("POST", "/tienda/pagos/wompi/eventos", { body: eventoWompi(tx) })).status, 401);
    const ev = eventoWompi(tx);
    ev.signature.checksum = crypto.createHash("sha256").update(`${tx.id}${tx.status}${tx.amount_in_cents}${ev.timestamp}${NEG.eventos}`).digest("hex");
    assert.equal((await api("POST", "/tienda/pagos/wompi/eventos", { body: ev })).status, 200);
    const [ped] = await q(`SELECT estado_pago FROM pedidos WHERE codigo = $1`, [c.json.pedido.codigo]);
    assert.equal(ped.estado_pago, "APROBADO");

    // Guardar sin reescribir los secretos los conserva; null los borra y vuelve al .env
    let g = await api("PUT", "/negocios/1/integraciones", { token: admin, body: { wompi_entorno: "pruebas", wompi_public_key: NEG.pub, wompi_integrity_secret: "" } });
    assert.equal(g.status, 200, JSON.stringify(g.json));
    assert.equal(g.json.data.wompi.integrity_secret.guardado, true);
    g = await api("PUT", "/negocios/1/integraciones", { token: admin, body: { wompi_public_key: null, wompi_integrity_secret: null, wompi_events_secret: null, wompi_private_key: null } });
    assert.equal(g.status, 200, JSON.stringify(g.json));
    assert.equal(g.json.data.wompi.origen, "servidor");
    const c2 = await api("POST", "/tienda/1/pedidos", { body: pedidoBase({ metodo_pago: "EN_LINEA" }), headers: { "Idempotency-Key": crypto.randomUUID() } });
    assert.equal(new URL(c2.json.pedido.pago.checkout_url).searchParams.get("public-key"), process.env.WOMPI_PUBLIC_KEY);
  } finally {
    await limpiarIntegraciones();
  }
});

test("integraciones: WhatsApp propio del negocio se usa para enviar; probar conexión no guarda nada", async () => {
  const admin = adminSistema();
  const original = globalThis.fetch;
  const llamadas = [];
  globalThis.fetch = async (url, op) => {
    if (String(url).startsWith("https://graph.facebook.com/")) {
      llamadas.push({ url: String(url), auth: op?.headers?.Authorization });
      return new Response(JSON.stringify({ verified_name: "Negocio Prueba", display_phone_number: "+57 300" }), { status: 200 });
    }
    return original(url, op);
  };
  try {
    const p = await api("POST", "/negocios/1/integraciones/probar/whatsapp", { token: admin, body: { whatsapp_token: "EAATOKENPRUEBA", whatsapp_phone_number_id: "1234567890" } });
    assert.equal(p.status, 200);
    assert.equal(p.json.data.ok, true);
    assert.equal(llamadas[0].auth, "Bearer EAATOKENPRUEBA");
    assert.equal((await q(`SELECT 1 FROM negocios_integraciones WHERE id_negocio = 1`)).length, 0);

    const g = await api("PUT", "/negocios/1/integraciones", { token: admin, body: { whatsapp_token: "EAATOKENPRUEBA", whatsapp_phone_number_id: "1234567890", whatsapp_idioma: "es_CO" } });
    assert.equal(g.status, 200, JSON.stringify(g.json));
    assert.equal(g.json.data.whatsapp.origen, "negocio");
    const { whatsappNegocio } = await import("../src/config/integraciones.js");
    const cfg = await whatsappNegocio(1);
    assert.equal(cfg.token, "EAATOKENPRUEBA");
    assert.equal(cfg.idioma, "es_CO");
  } finally {
    globalThis.fetch = original;
    await limpiarIntegraciones();
  }
});

test("código de barras: único por negocio (el lector de la caja vende por código)", async () => {
  const codigo = `77${Date.now()}`.slice(0, 13);
  const a = await api("POST", "/productos", { token: F.cajero, body: productoAdmin({ nombre: `ZZ Leche ${RUN}`, codigo_barra: ` ${codigo} ` }) });
  assert.equal(a.status, 201, JSON.stringify(a.json));
  const id = await idPorNombre(`ZZ Leche ${RUN}`);
  assert.equal((await q(`SELECT codigo_barra FROM productos WHERE id = $1`, [id]))[0].codigo_barra, codigo, "se guarda sin espacios");

  const repetido = await api("POST", "/productos", { token: F.cajero, body: productoAdmin({ nombre: `ZZ Leche 2 ${RUN}`, codigo_barra: codigo }) });
  assert.equal(repetido.status, 409);
  assert.match(repetido.json.error, /ya lo tiene/);
  // Guardar el mismo producto con su propio código sí se permite
  const mismo = await api("PUT", `/productos/${id}`, { token: F.cajero, body: { producto: { id_categoria: F.categoria, codigo_barra: codigo, nombre: `ZZ Leche ${RUN}` } } });
  assert.equal(mismo.status, 200, JSON.stringify(mismo.json));
  // Vacío no cuenta como repetido
  const sinCodigo = await api("POST", "/productos", { token: F.cajero, body: productoAdmin({ nombre: `ZZ Sin código ${RUN}`, codigo_barra: "" }) });
  assert.equal(sinCodigo.status, 201);
});
