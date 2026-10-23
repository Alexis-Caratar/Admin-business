// Meseros → comanda → impresora → caja → venta, mesas y permisos por acción.
// Negocio de prueba propio ("ZZ COM"), agente de impresión simulado y una caja
// conectada por WebSocket.
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
const { initWebSockets } = await import("../src/websockets.js");
const { nuevoTokenAgente } = await import("../src/services/impresion/impresion.service.js");
const { default: WebSocket } = await import("ws");
const jwt = (await import("jsonwebtoken")).default;

const RUN = crypto.randomBytes(3).toString("hex");
const q = async (sql, p) => (await pool.query(sql, p)).rows;
let server, base, wsUrl;
const F = {};
const tok = (id, neg) => jwt.sign({ id, id_negocio: neg, nombre: "ZZ", roles_sistema: [] }, process.env.JWT_SECRET);
const api = async (metodo, ruta, { body, t, clave } = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { "content-type": "application/json", authorization: `Bearer ${t}`, ...(clave ? { "Idempotency-Key": clave } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Agente simulado (v2: confirma lo que imprime)
const conectarAgente = (token) => new Promise((resolve, reject) => {
  const ws = new WebSocket(wsUrl);
  const recibidos = [];
  ws.on("open", () => { ws.send(JSON.stringify({ tipo: "register_agent", token, protocolo: 2, punto: "Cocina", version: "2.0.0" })); setTimeout(() => resolve({ ws, recibidos }), 150); });
  ws.on("message", (m) => {
    const d = JSON.parse(m.toString());
    recibidos.push(d);
    if (d.tipo === "imprimir_documento") ws.send(JSON.stringify({ tipo: "resultado_impresion", id: d.id, ok: true, impresora: "Cocina" }));
  });
  ws.on("error", reject);
});
// Pantalla (caja) conectada: recibe los eventos de comandas
const conectarPantalla = (token) => new Promise((resolve, reject) => {
  const ws = new WebSocket(wsUrl);
  const eventos = [];
  ws.on("open", () => { ws.send(JSON.stringify({ tipo: "register_frontend", token })); setTimeout(() => resolve({ ws, eventos }), 100); });
  ws.on("message", (m) => { const d = JSON.parse(m.toString()); if (d.tipo === "comanda_evento") eventos.push(d); });
  ws.on("error", reject);
});
const cerrar = (c) => new Promise((r) => { if (!c || c.ws.readyState === WebSocket.CLOSED) return r(); c.ws.once("close", () => setTimeout(r, 50)); c.ws.close(); });

const negocio = async (sufijo, modulos) => {
  const [n] = await q(`INSERT INTO negocios (nombre, url_negocio, nit) VALUES ($1, $2, $3) RETURNING id`, [`ZZ COM ${sufijo} ${RUN}`, `zz-com-${sufijo.toLowerCase()}-${RUN}`, `ZC${sufijo}${RUN}`]);
  for (const url of modulos) await q(`INSERT INTO app_modulos_negocio (id_modulo, id_negocio, activo) SELECT id, $2, true FROM app_modulos WHERE url = $1`, [url, n.id]);
  return n.id;
};
const usuario = async (neg, nombre, modulos = []) => {
  const [p] = await q(`INSERT INTO personas (identificacion, nombres, apellidos, tipo) VALUES ($1, $2, 'ZZ', 'Empleado') RETURNING id`, [`ZZC${nombre}${RUN}`, nombre]);
  const [u] = await q(`INSERT INTO usuarios (email, password, id_negocio, id_persona) VALUES ($1, 'x', $2, $3) RETURNING id`, [`zz${nombre}${RUN}@prueba.co`.toLowerCase(), neg, p.id]);
  for (const url of modulos) await q(`INSERT INTO app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo) SELECT $1, id, true FROM app_modulos WHERE url = $2`, [u.id, url]);
  return u.id;
};
const abrirCaja = async (id_usuario) => (await q(`INSERT INTO caja (id_usuario, monto_inicial, estado, fecha_apertura) VALUES ($1, 0, 'ABIERTA', NOW()) RETURNING id`, [id_usuario]))[0].id;

before(async () => {
  server = http.createServer(app).listen(0);
  initWebSockets(server);
  const port = server.address().port;
  base = `http://127.0.0.1:${port}/api`;
  wsUrl = `ws://127.0.0.1:${port}`;
  F.neg = await negocio("A", ["home", "cajero", "meseros", "mesas", "permisos", "usuarios"]);
  F.neg2 = await negocio("B", ["cajero", "meseros", "mesas"]);
  // Admin "de antes" (sin perfil): todas las acciones de sus módulos
  F.uAdmin = await usuario(F.neg, "Admin", ["home", "cajero", "meseros", "mesas", "permisos", "usuarios"]);
  F.uMesero = await usuario(F.neg, "Carlos");
  F.uCaja1 = await usuario(F.neg, "Caja1", ["cajero"]);
  F.uCaja2 = await usuario(F.neg, "Caja2", ["cajero"]);
  F.uOtro = await usuario(F.neg2, "Otro", ["cajero", "meseros", "mesas"]);
  F.admin = tok(F.uAdmin, F.neg); F.mesero = tok(F.uMesero, F.neg); F.caja1 = tok(F.uCaja1, F.neg); F.caja2 = tok(F.uCaja2, F.neg); F.otro = tok(F.uOtro, F.neg2);
  F.caja1Id = await abrirCaja(F.uCaja1); await abrirCaja(F.uCaja2); await abrirCaja(F.uOtro);
  const [c] = await q(`INSERT INTO categorias (id_negocio, nombre, activo) VALUES ($1, 'Platos', true) RETURNING id`, [F.neg]);
  const prod = async (nombre, precio) => {
    const [p] = await q(`INSERT INTO productos (nombre, id_categoria, estado, publicacion_web, es_complemento, usa_receta, controla_inventario, hora_inicio, hora_fin)
                         VALUES ($1, $2, true, false, false, false, false, '00:00', '23:59:59') RETURNING id`, [nombre, c.id]);
    await q(`INSERT INTO productos_precios (id_producto, precio_costo, precio_venta) VALUES ($1, 0, $2)`, [p.id, precio]);
    return p.id;
  };
  F.bandeja = await prod("ZZ Bandeja paisa", 18000);
  F.jugo = await prod("ZZ Jugo de mora", 4000);
  F.agenteToken = (await nuevoTokenAgente(F.neg)).token;
});
after(async () => { server.close(); await pool.end(); });

test("1 · el administrador crea, edita y desactiva mesas", async () => {
  assert.equal((await api("POST", "/mesas", { t: F.admin, body: { nombre: "", capacidad: 4 } })).status, 400);
  let r = await api("POST", "/mesas", { t: F.admin, body: { nombre: "Mesa 1", capacidad: 4 } });
  assert.equal(r.status, 200, JSON.stringify(r.json)); F.mesa1 = r.json.data.id;
  F.mesa2 = (await api("POST", "/mesas", { t: F.admin, body: { nombre: "Mesa 2", capacidad: 2 } })).json.data.id;
  F.mesa3 = (await api("POST", "/mesas", { t: F.admin, body: { nombre: "Terraza", capacidad: 6 } })).json.data.id;
  assert.equal((await api("POST", "/mesas", { t: F.admin, body: { nombre: "mesa 1" } })).status, 409, "nombre repetido");
  assert.equal((await api("PUT", `/mesas/${F.mesa3}`, { t: F.admin, body: { capacidad: 8 } })).json.data.capacidad, 8);
  r = await api("PUT", `/mesas/${F.mesa3}/activo`, { t: F.admin, body: { activo: false } });
  assert.equal(r.json.data.activo, false);
  const lista = (await api("GET", "/mesas", { t: F.admin })).json.data;
  assert.equal(lista.length, 3, "la administración ve también las desactivadas");
  const [{ n }] = await q(`SELECT count(*)::int n FROM app_auditoria WHERE tabla = 'mesas' AND id_negocio = $1`, [F.neg]);
  assert.equal(n, 5, "cada cambio queda en auditoría");
});

test("2 y 16 · el administrador asigna el perfil Mesero y el menú cambia según sus permisos", async () => {
  const perfiles = (await api("GET", "/permisos/perfiles", { t: F.admin })).json.data;
  assert.deepEqual(perfiles.map((p) => p.nombre).sort(), ["Administrador", "Cajero", "Mesero"]);
  F.perfilMesero = perfiles.find((p) => p.nombre === "Mesero");
  F.perfilAdmin = perfiles.find((p) => p.es_admin);
  assert.equal((await api("GET", "/menus_sistema", { t: F.mesero })).json.length, 0, "sin perfil ni módulos: menú vacío");
  const r = await api("PUT", `/permisos/usuarios/${F.uMesero}/perfil`, { t: F.admin, body: { id_perfil: F.perfilMesero.id } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const menu = (await api("GET", "/menus_sistema", { t: F.mesero })).json;
  assert.deepEqual(menu.map((m) => m.url), ["meseros"]);
  const mios = (await api("GET", "/permisos/mios", { t: F.mesero })).json.data;
  assert.deepEqual(mios.modulos.meseros.sort(), ["adicionar", "crear", "imprimir", "ver"]);
  assert.equal(mios.perfil, "Mesero");
  const [a] = await q(`SELECT accion, despues FROM app_auditoria WHERE tabla = 'usuarios' AND id_registro = $1`, [F.uMesero]);
  assert.equal(a.accion, "ASIGNAR_PERFIL");
});

test("3 y 14 · el mesero solo usa sus funciones (validado en el backend)", async () => {
  assert.equal((await api("POST", "/cajero/estado-caja", { t: F.mesero, body: {} })).status, 403, "no abre ni consulta caja");
  assert.equal((await api("POST", "/cajero/abrir-caja", { t: F.mesero, body: { monto_inicial: 0 } })).status, 403);
  assert.equal((await api("GET", "/usuarios", { t: F.mesero })).status, 403, "no administra usuarios");
  assert.equal((await api("POST", "/usuarios/menus_usuariocrear", { t: F.mesero, body: { id: F.uMesero, id_menu: [1] } })).status, 403, "no se asigna módulos");
  assert.equal((await api("GET", "/permisos/perfiles", { t: F.mesero })).status, 403);
  assert.equal((await api("GET", "/mesas", { t: F.mesero })).status, 403, "no gestiona mesas");
  assert.equal((await api("GET", "/comandas/catalogo", { t: F.mesero })).status, 200);
  const mesas = (await api("GET", "/comandas/mesas", { t: F.mesero })).json.data;
  assert.deepEqual(mesas.map((m) => m.nombre), ["Mesa 1", "Mesa 2"], "solo mesas activas");
});

test("4, 5, 6 · el mesero crea la comanda: se guarda, se imprime con los datos correctos y la caja se entera", async () => {
  const agente = await conectarAgente(F.agenteToken);
  const caja = await conectarPantalla(F.caja1);
  try {
    const r = await api("POST", "/comandas", { t: F.mesero, clave: `c1-${RUN}`, body: {
      id_mesa: F.mesa1, nota: "Cliente con prisa",
      items: [{ id_producto: F.bandeja, cantidad: 2, nota: "sin chicharrón", precio_unitario: 1 }, { id_producto: F.jugo, cantidad: 1 }],
    } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const c = r.json.data; F.c1 = c.id;
    assert.equal(c.estado, "ABIERTA");
    assert.equal(c.total, 40000, "precios de la carta, no los del mesero");
    assert.equal(r.json.data.impresion.estado, "CONFIRMADA", "el agente confirmó");
    const doc = agente.recibidos.find((d) => d.tipo === "imprimir_documento").documento;
    const texto = doc.lineas.map((l) => l.v ?? l.i ?? "").join("\n");
    for (const esperado of ["COMANDA", "MESA: Mesa 1", `Comanda: #${c.numero}`, "Carlos", "2 x ZZ Bandeja paisa", "* sin chicharrón", "1 x ZZ Jugo de mora", "Cliente con prisa", `ZZ COM A ${RUN}`]) {
      assert.ok(texto.includes(esperado), `falta "${esperado}" en la comanda impresa`);
    }
    assert.ok(!texto.includes("18.000"), "la comanda no lleva precios");
    assert.ok(doc.lineas.every((l) => l.t !== "texto" || l.v.length <= doc.ancho), "cabe en el ancho del papel configurado");
    await espera(100);
    assert.ok(caja.eventos.some((e) => e.evento === "comanda_nueva" && e.id_comanda === F.c1), "la caja recibe el evento en tiempo real");
    // Reintento con la misma clave: no crea otra
    const rep = await api("POST", "/comandas", { t: F.mesero, clave: `c1-${RUN}`, body: { id_mesa: F.mesa1, items: [{ id_producto: F.jugo, cantidad: 1 }] } });
    assert.equal(rep.json.data.id, F.c1); assert.equal(rep.json.data.repetido, true);
    assert.equal((await api("POST", "/comandas", { t: F.mesero, body: { id_mesa: F.mesa1, items: [{ id_producto: F.jugo, cantidad: 1 }] } })).status, 409, "una comanda abierta por mesa");
    const [{ n }] = await q(`SELECT count(*)::int n FROM comandas WHERE id_negocio = $1`, [F.neg]);
    assert.equal(n, 1);
  } finally { await cerrar(agente); await cerrar(caja); }
});

test("7 y 8 · sin impresora el pedido no se pierde; reintentar y reimprimir no duplican nada; la adición imprime solo lo nuevo", async () => {
  const r = await api("POST", "/comandas", { t: F.mesero, body: { id_mesa: F.mesa2, items: [{ id_producto: F.bandeja, cantidad: 1 }] } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  F.c2 = r.json.data.id;
  assert.equal(r.json.data.impresion.estado, "ERROR");
  assert.match(r.json.data.impresion.mensaje, /No hay agente/);
  assert.ok(r.json.data.impresion.documento, "devuelve el ticket para imprimir desde el navegador");
  const [g] = await q(`SELECT estado FROM comandas WHERE id = $1`, [F.c2]);
  assert.equal(g.estado, "ABIERTA", "la comanda quedó guardada");

  const agente = await conectarAgente(F.agenteToken);
  try {
    const re = await api("POST", `/comandas/${F.c2}/imprimir`, { t: F.mesero, body: { tanda: 1 } });
    assert.equal(re.json.data.impresion.tipo, "REINTENTO"); assert.equal(re.json.data.impresion.estado, "CONFIRMADA");
    const copia = await api("POST", `/comandas/${F.c2}/imprimir`, { t: F.mesero, body: {} });
    assert.equal(copia.json.data.impresion.tipo, "REIMPRESION");
    const ultimo = agente.recibidos.filter((d) => d.tipo === "imprimir_documento").at(-1).documento.lineas.map((l) => l.v ?? "").join("\n");
    assert.ok(ultimo.includes("REIMPRESIÓN") && ultimo.includes("NO PREPARAR DE NUEVO"), "la copia se identifica");
    const [{ n }] = await q(`SELECT count(*)::int n FROM comandas_items WHERE id_comanda = $1`, [F.c2]);
    assert.equal(n, 1, "reimprimir no duplica productos");

    const ad = await api("POST", `/comandas/${F.c2}/items`, { t: F.mesero, body: { items: [{ id_producto: F.jugo, cantidad: 2 }] } });
    assert.equal(ad.status, 200, JSON.stringify(ad.json));
    assert.equal(ad.json.data.tanda, 2);
    const adicion = agente.recibidos.filter((d) => d.tipo === "imprimir_documento").at(-1).documento.lineas.map((l) => l.v ?? "").join("\n");
    assert.ok(adicion.includes("ADICIÓN") && adicion.includes("2 x ZZ Jugo de mora"));
    assert.ok(!adicion.includes("Bandeja"), "la adición no reimprime lo anterior");
    const tipos = (await q(`SELECT tipo, estado FROM comandas_impresiones WHERE id_comanda = $1 ORDER BY id`, [F.c2])).map((x) => `${x.tipo}:${x.estado}`);
    assert.deepEqual(tipos, ["NUEVA:ERROR", "REINTENTO:CONFIRMADA", "REIMPRESION:CONFIRMADA", "ADICION:CONFIRMADA"]);
  } finally { await cerrar(agente); }
});

test("10 · la caja recupera las comandas pendientes desde el backend (al reconectarse)", async () => {
  const r = await api("GET", "/comandas?pendientes=1", { t: F.caja1 });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.deepEqual(r.json.data.map((c) => c.id).sort((a, b) => a - b), [F.c1, F.c2]);
  const c = r.json.data.find((x) => x.id === F.c1);
  assert.equal(c.mesa, "Mesa 1"); assert.match(c.mesero, /Carlos/); assert.equal(c.total, 40000);
  const mesas = (await api("POST", "/cajero/mesas", { t: F.caja1, body: {} })).json.result;
  const m1 = mesas.find((m) => m.id === F.mesa1);
  assert.equal(m1.estado_operativo, "CON_PEDIDO"); assert.equal(m1.id_comanda, F.c1);
});

test("11, 12, 13 · se cobra desde Ventas, queda vinculada a la venta y dos cajas no la cobran a la vez", async () => {
  assert.equal((await api("POST", `/comandas/${F.c1}/cobrar`, { t: F.mesero })).status, 403, "el mesero no cobra");
  // La caja no puede vender aparte sobre una mesa con comanda abierta
  assert.equal((await api("POST", "/cajero/finalizar-venta", { t: F.caja1, body: { id_caja: F.caja1Id, id_mesa: F.mesa1, id_cliente: 25, subtotal: 1, total: 1, estado: "activa", metodo_pago: "PENDIENTE", productos: [] } })).status, 409);
  const [a, b] = await Promise.all([api("POST", `/comandas/${F.c1}/cobrar`, { t: F.caja1 }), api("POST", `/comandas/${F.c1}/cobrar`, { t: F.caja2 })]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409], "solo una caja la toma");
  const tomada = a.status === 200 ? a : b;
  const id_venta = tomada.json.data.id_venta;
  const items = await q(`SELECT ci.cantidad, vi.cantidad::int AS vcant, vi.precio_unitario::float AS precio FROM comandas_items ci JOIN ventas_items vi ON vi.id = ci.id_venta_item WHERE ci.id_comanda = $1 ORDER BY ci.id`, [F.c1]);
  assert.deepEqual(items.map((i) => [i.cantidad, i.vcant, i.precio]), [[2, 2, 18000], [1, 1, 4000]], "mismos productos, sin duplicar");
  const [{ n }] = await q(`SELECT count(*)::int n FROM ventas_items WHERE id_venta = $1`, [id_venta]);
  assert.equal(n, 2);
  assert.equal((await q(`SELECT estado FROM comandas WHERE id = $1`, [F.c1]))[0].estado, "EN_COBRO", "aún no está pagada");
  assert.equal((await api("GET", `/cajero/liberar_mesa/${F.mesa1}/${F.neg}`, { t: F.caja1 })).status, 409, "no se libera con la cuenta pendiente");
  // El cobro de siempre (mesa), por la caja que la tomó; la otra recibe 409 si intenta a la vez
  const quien = a.status === 200 ? F.caja1 : F.caja2;
  const otra = a.status === 200 ? F.caja2 : F.caja1;
  const pago = { id_venta, metodo_pago: "EFECTIVO", monto_recibido: 50000, cambio: 10000, id_cliente: 25 };
  const [p1, p2] = await Promise.all([api("POST", "/cajero/actualizar_venta", { t: quien, body: pago }), api("POST", "/cajero/actualizar_venta", { t: otra, body: pago })]);
  assert.deepEqual([p1.status, p2.status].sort(), [200, 409], "no se cobra dos veces");
  const [c] = await q(`SELECT estado, id_venta FROM comandas WHERE id = $1`, [F.c1]);
  assert.deepEqual([c.estado, Number(c.id_venta)], ["PAGADA", Number(id_venta)]);
  assert.equal((await q(`SELECT estado FROM mesas WHERE id = $1`, [F.mesa1]))[0].estado, "Disponible");
  const hist = (await q(`SELECT evento FROM comandas_historial WHERE id_comanda = $1 ORDER BY id`, [F.c1])).map((h) => h.evento);
  assert.deepEqual(hist, ["CREADA", "EN_COBRO", "PAGADA"]);
});

test("adición con la cuenta en caja: entra a la misma venta; anular la venta anula la comanda", async () => {
  const r = await api("POST", `/comandas/${F.c2}/cobrar`, { t: F.caja1 });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const ad = await api("POST", `/comandas/${F.c2}/items`, { t: F.mesero, body: { items: [{ id_producto: F.jugo, cantidad: 1 }] } });
  assert.equal(ad.status, 200, JSON.stringify(ad.json));
  const [v] = await q(`SELECT total::float, (SELECT count(*)::int FROM ventas_items WHERE id_venta = v.id) n FROM ventas v WHERE id = $1`, [r.json.data.id_venta]);
  assert.deepEqual([v.total, v.n], [18000 + 8000 + 4000, 3]);
  assert.equal((await api("POST", "/cajero/cancelarFactura", { t: F.caja1, body: { id_venta: r.json.data.id_venta, nota: "error de mesa" } })).status, 200);
  const [c] = await q(`SELECT estado, anulada_por FROM comandas WHERE id = $1`, [F.c2]);
  assert.deepEqual([c.estado, c.anulada_por], ["ANULADA", F.uCaja1]);
});

test("14 · permisos por acción: el perfil decide (y el perfil Administrador no se toca)", async () => {
  const c = await api("POST", "/comandas", { t: F.mesero, body: { id_mesa: F.mesa2, items: [{ id_producto: F.jugo, cantidad: 1 }] } });
  assert.equal(c.status, 200, JSON.stringify(c.json));
  F.c3 = c.json.data.id;
  assert.equal((await api("POST", `/comandas/${F.c3}/anular`, { t: F.mesero, body: { motivo: "se fue" } })).status, 403, "el perfil Mesero no anula");
  assert.equal((await api("POST", `/comandas/${F.c3}/anular`, { t: F.admin, body: { motivo: "se fue" } })).status, 200);
  assert.equal((await q(`SELECT estado FROM mesas WHERE id = $1`, [F.mesa2]))[0].estado, "Disponible");
  assert.equal((await api("PUT", `/permisos/perfiles/${F.perfilAdmin.id}`, { t: F.admin, body: { nombre: "x", acciones: [] } })).status, 409);
  assert.equal((await api("DELETE", `/permisos/perfiles/${F.perfilMesero.id}`, { t: F.admin })).status, 409, "tiene usuarios");
  assert.equal((await api("PUT", `/permisos/usuarios/${F.uAdmin}/perfil`, { t: F.admin, body: { id_perfil: F.perfilMesero.id } })).status, 409, "no se quita su propia administración");
  // Quitar al perfil Mesero sus acciones: el mesero pierde el módulo y el menú
  const r = await api("PUT", `/permisos/perfiles/${F.perfilMesero.id}`, { t: F.admin, body: { nombre: "Mesero", acciones: [] } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal((await api("GET", "/comandas/mesas", { t: F.mesero })).status, 403);
  assert.equal((await api("GET", "/menus_sistema", { t: F.mesero })).json.length, 0);
  const restaurar = F.perfilMesero.acciones;
  assert.equal((await api("PUT", `/permisos/perfiles/${F.perfilMesero.id}`, { t: F.admin, body: { nombre: "Mesero", acciones: restaurar } })).status, 200);
  assert.equal((await api("GET", "/comandas/mesas", { t: F.mesero })).status, 200);
  const aud = (await q(`SELECT accion FROM app_auditoria WHERE tabla = 'app_perfiles' AND id_registro = $1`, [F.perfilMesero.id])).map((x) => x.accion);
  assert.deepEqual(aud, ["EDITAR", "EDITAR"]);
});

test("15 · nadie accede a comandas, mesas ni ventas de otro negocio", async () => {
  assert.equal((await api("GET", `/comandas/${F.c1}`, { t: F.otro })).status, 404);
  assert.equal((await api("POST", `/comandas/${F.c3}/imprimir`, { t: F.otro, body: {} })).status, 404);
  assert.equal((await api("POST", "/comandas", { t: F.otro, body: { id_mesa: F.mesa1, items: [{ id_producto: F.jugo, cantidad: 1 }] } })).status, 400, "la mesa no es de su negocio");
  assert.equal((await api("PUT", `/mesas/${F.mesa1}`, { t: F.otro, body: { nombre: "hack" } })).status, 404);
  const [{ id_venta }] = await q(`SELECT id_venta FROM comandas WHERE id = $1`, [F.c1]);
  assert.equal((await api("POST", "/cajero/actualizar_venta", { t: F.otro, body: { id_venta, metodo_pago: "EFECTIVO" } })).status, 404);
  assert.equal((await api("GET", "/comandas?pendientes=1", { t: F.otro })).json.data.length, 0);
});

test("17 · un módulo deshabilitado no se usa ni por acceso directo a su API", async () => {
  await q(`UPDATE app_modulos_negocio SET activo = false WHERE id_negocio = $1 AND id_modulo = (SELECT id FROM app_modulos WHERE url = 'meseros')`, [F.neg]);
  try {
    const r = await api("GET", "/comandas/mesas", { t: F.mesero });
    assert.equal(r.status, 403); assert.equal(r.json.modulo_inactivo, "meseros");
    assert.equal((await api("GET", "/menus_sistema", { t: F.mesero })).json.length, 0, "ni en el menú");
  } finally {
    await q(`UPDATE app_modulos_negocio SET activo = true WHERE id_negocio = $1 AND id_modulo = (SELECT id FROM app_modulos WHERE url = 'meseros')`, [F.neg]);
  }
});

test("liberar mesa con pendientes: solo como excepción autorizada y con motivo", async () => {
  const c = await api("POST", "/comandas", { t: F.mesero, body: { id_mesa: F.mesa2, items: [{ id_producto: F.jugo, cantidad: 1 }] } });
  assert.equal(c.status, 200);
  assert.equal((await api("GET", `/cajero/liberar_mesa/${F.mesa2}/${F.neg}`, { t: F.caja1 })).status, 409);
  assert.equal((await api("GET", `/cajero/liberar_mesa/${F.mesa2}/${F.neg}?forzar=1&motivo=cliente%20se%20fue`, { t: F.caja1 })).status, 403, "la caja sola no fuerza");
  assert.equal((await api("PUT", `/mesas/${F.mesa2}/activo`, { t: F.admin, body: { activo: false } })).status, 409, "no se desactiva en uso");
  assert.equal((await api("GET", `/cajero/liberar_mesa/${F.mesa2}/${F.neg}?forzar=1&motivo=cliente%20se%20fue`, { t: F.admin })).status, 200);
  const [a] = await q(`SELECT accion FROM app_auditoria WHERE tabla = 'mesas' AND id_registro = $1 ORDER BY id DESC LIMIT 1`, [F.mesa2]);
  assert.equal(a.accion, "LIBERAR_FORZADO");
});
