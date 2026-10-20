// Pruebas de impresión (factura/comanda/pedido), agente local por WebSocket,
// token revocable y módulo Pedidos por negocio.
//   DB_NAME=zz_tienda_test npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

if (!/test|prueba/i.test(process.env.DB_NAME ?? "")) {
  throw new Error("Las pruebas solo corren contra una BD desechable (DB_NAME debe contener 'test')");
}

const { default: app } = await import("../src/app.js");
const { pool } = await import("../src/config/db.js");
const { initWebSockets } = await import("../src/websockets.js");
const { default: WebSocket } = await import("ws");
const jwt = (await import("jsonwebtoken")).default;

let server, base, wsUrl;
const q = async (sql, p) => (await pool.query(sql, p)).rows;
const tokenDe = (id, id_negocio = 1, roles = []) => jwt.sign({ id, id_negocio, nombre: "Prueba", roles_sistema: roles }, process.env.JWT_SECRET);
const admin = () => tokenDe(1, 1, ["SUPERADMIN"]);
const api = async (metodo, ruta, { body, token } = {}) => {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
};

// Agente simulado: registra, recibe órdenes y (si es v2) confirma
const conectarAgente = (token, { protocolo = 2, responder = { ok: true, impresora: "Caja" } } = {}) => new Promise((resolve, reject) => {
  const ws = new WebSocket(wsUrl);
  const recibidos = [];
  ws.on("open", () => {
    ws.send(JSON.stringify({ tipo: "register_agent", token, ...(protocolo >= 2 ? { protocolo, punto: "Caja de prueba", version: "2.0.0" } : {}) }));
    setTimeout(() => resolve({ ws, recibidos }), 150);
  });
  ws.on("message", (m) => {
    const d = JSON.parse(m.toString());
    recibidos.push(d);
    if (d.tipo === "imprimir_documento" && responder) ws.send(JSON.stringify({ tipo: "resultado_impresion", id: d.id, ...responder }));
  });
  ws.on("close", (code) => recibidos.push({ tipo: "cerrado", code }));
  ws.on("error", reject);
});
const cerrar = (a) => new Promise((r) => { if (a.ws.readyState === WebSocket.CLOSED) return r(); a.ws.once("close", () => setTimeout(r, 50)); a.ws.close(); });

let F = {};
before(async () => {
  server = http.createServer(app).listen(0);
  initWebSockets(server);
  const port = server.address().port;
  base = `http://127.0.0.1:${port}/api`;
  wsUrl = `ws://127.0.0.1:${port}`;
  await q(`DELETE FROM negocios_impresion`).catch(() => {});
  const [v] = await q(`SELECT v.id FROM ventas v JOIN caja c ON c.id = v.id_caja JOIN usuarios u ON u.id = c.id_usuario
                       WHERE u.id_negocio = 1 AND EXISTS (SELECT 1 FROM ventas_items vi WHERE vi.id_venta = v.id) ORDER BY v.id DESC LIMIT 1`);
  F.venta = v?.id;
  F.cajero = tokenDe(10);
});

after(async () => {
  server.close();
  await pool.end();
});

test("factura sin agente: no se da por impresa y devuelve el ticket para el navegador, armado desde la base", async () => {
  assert.ok(F.venta, "la copia de la base necesita al menos una venta del negocio 1");
  const r = await api("POST", "/cajero/imprimirfactura", { token: F.cajero, body: { id_venta: F.venta } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.impreso, false);
  assert.match(r.json.mensaje, /No hay agente/);
  const items = await q(`SELECT count(*)::int n FROM ventas_items WHERE id_venta = $1`, [F.venta]);
  const lineasProducto = r.json.documento.lineas.filter((l) => l.t === "cols" && /^\s+\d+(\.\d+)? x /.test(l.i));
  assert.equal(lineasProducto.length, items[0].n, "una línea por ítem (antes se repetía por cada foto)");
  assert.ok(r.json.texto.includes("TOTAL"));
  assert.ok(r.json.documento.lineas.every((l) => l.t !== "texto" || l.v.length <= r.json.documento.ancho));
});

test("factura de otro negocio o sin id → no se imprime", async () => {
  assert.equal((await api("POST", "/cajero/imprimirfactura", { token: tokenDe(10, 9), body: { id_venta: F.venta } })).status, 404);
  assert.equal((await api("POST", "/cajero/imprimirfactura", { token: F.cajero, body: {} })).status, 400);
});

test("agente v2: recibe el ticket armado, confirma y la caja sabe que se imprimió", async () => {
  const agente = await conectarAgente(jwt.sign({ tipo: "agente_impresion", id_negocio: 1 }, process.env.JWT_SECRET));
  try {
    const r = await api("POST", "/cajero/imprimirfactura", { token: F.cajero, body: { id_venta: F.venta } });
    assert.equal(r.json.impreso, true, JSON.stringify(r.json));
    assert.match(r.json.mensaje, /Impreso en Caja/);
    const orden = agente.recibidos.find((m) => m.tipo === "imprimir_documento");
    assert.equal(orden.documento.rol, "factura");
    // El admin ve el agente conectado
    const a = await api("GET", "/negocios/1/impresion", { token: admin() });
    assert.equal(a.json.data.agentes[0].punto, "Caja de prueba");
    // Error de impresora: se informa
    const c = await api("POST", "/cajero/imprimirComanda", { token: F.cajero, body: { productos: [{ cantidad: 2, nombre: "Café" }], mesa: "Mesa 3" } });
    assert.equal(c.json.impreso, true);
    assert.equal(agente.recibidos.filter((m) => m.tipo === "imprimir_documento").at(-1).documento.rol, "comanda");
  } finally {
    await cerrar(agente);
  }
});

test("agente antiguo: recibe el formato anterior (sigue funcionando sin actualizar)", async () => {
  const agente = await conectarAgente(jwt.sign({ tipo: "agente_impresion", id_negocio: 1 }, process.env.JWT_SECRET), { protocolo: 1 });
  try {
    const r = await api("POST", "/cajero/imprimirfactura", { token: F.cajero, body: { id_venta: F.venta } });
    assert.equal(r.json.impreso, true);
    assert.match(r.json.mensaje, /sin confirmación/);
    await new Promise((res) => setTimeout(res, 100));
    const legado = agente.recibidos.find((m) => m.tipo === "imprimir_venta");
    assert.ok(legado?.payload?.negocio?.nombre && Array.isArray(legado.payload.productos));
  } finally {
    await cerrar(agente);
  }
});

test("token del agente: generar uno nuevo revoca el anterior", async () => {
  const viejo = jwt.sign({ tipo: "agente_impresion", id_negocio: 1 }, process.env.JWT_SECRET);
  const t = await api("POST", "/negocios/1/impresion/token", { token: admin() });
  assert.equal(t.status, 200, JSON.stringify(t.json));
  assert.match(t.json.data.ws_url, /^ws:\/\//);
  const rechazado = await conectarAgente(viejo);
  await new Promise((res) => setTimeout(res, 150));
  assert.ok(rechazado.recibidos.some((m) => m.tipo === "cerrado" && m.code === 4003));
  const nuevo = await conectarAgente(t.json.data.token);
  try {
    const p = await api("POST", "/negocios/1/impresion/prueba", { token: admin(), body: { rol: "comanda" } });
    assert.equal(p.json.data.ok, true, JSON.stringify(p.json));
  } finally {
    await cerrar(nuevo);
    await q(`DELETE FROM negocios_impresion WHERE id_negocio = 1`);
  }
  assert.equal((await api("POST", "/negocios/1/impresion/token", { token: F.cajero })).status, 403, "solo admin del sistema");
});

test("configuración: valida y el ticket usa el ancho y los textos del negocio", async () => {
  try {
    let r = await api("PUT", "/negocios/1/impresion", { token: admin(), body: { ancho_caracteres: 40 } });
    assert.equal(r.status, 400);
    r = await api("PUT", "/negocios/1/impresion", { token: admin(), body: { ancho_caracteres: 48, pie: "Gracias, vuelve pronto", qr_contenido: "factura", documento_consumidor: "999" } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.ok(r.json.data.vista_previa.includes("Gracias, vuelve pronto"));
    const f = await api("POST", "/cajero/imprimirfactura", { token: F.cajero, body: { id_venta: F.venta } });
    assert.equal(f.json.documento.ancho, 48);
    assert.ok(f.json.documento.lineas.some((l) => l.t === "qr" && l.v.startsWith("Factura:")));
  } finally {
    await q(`DELETE FROM negocios_impresion WHERE id_negocio = 1`);
  }
});

test("módulo Pedidos: si el negocio no lo tiene activo, la caja tampoco lo usa", async () => {
  const [m] = await q(`SELECT mn.id FROM app_modulos_negocio mn JOIN app_modulos m ON m.id = mn.id_modulo WHERE m.url = 'pedidos' AND mn.id_negocio = 1`);
  assert.ok(m, "el negocio 1 tiene el módulo Pedidos en la copia");
  try {
    assert.equal((await api("GET", "/pedidos", { token: F.cajero })).status, 200);
    await q(`UPDATE app_modulos_negocio SET activo = false WHERE id = $1`, [m.id]);
    const r = await api("GET", "/pedidos", { token: F.cajero });
    assert.equal(r.status, 403);
    assert.equal(r.json.modulo_inactivo, "pedidos");
  } finally {
    await q(`UPDATE app_modulos_negocio SET activo = true WHERE id = $1`, [m.id]);
  }
});
