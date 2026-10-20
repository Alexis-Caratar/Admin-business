// Avisos por WhatsApp (API de Meta simulada). BD DESECHABLE con migraciones 001–005:
//   DB_NAME=zz_tienda_test node --test tests/whatsapp.test.js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";

process.env.TIENDA_VALIDAR_HORARIO = "false";
process.env.TIENDA_LIMITE_PEDIDOS = "1000";
process.env.WHATSAPP_TOKEN = "token-prueba";
process.env.WHATSAPP_PHONE_NUMBER_ID = "111222333";
if (!/test|prueba/i.test(process.env.DB_NAME ?? "")) throw new Error("Solo contra una BD desechable");

const { default: app } = await import("../src/app.js");
const { pool } = await import("../src/config/db.js");
const { enviarPendientes } = await import("../src/services/notificaciones/whatsapp.service.js");
const jwt = (await import("jsonwebtoken")).default;

const RUN = crypto.randomBytes(3).toString("hex");
let server, base, plato, cajero;
const enviados = [];
let metaCaida = false;
const original = globalThis.fetch;
const q = async (sql, p) => (await pool.query(sql, p)).rows;
const api = async (metodo, ruta, { body, tk } = {}) => {
  const r = await original(base + ruta, { method: metodo, headers: { "content-type": "application/json", ...(tk ? { authorization: `Bearer ${tk}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const esperar = () => new Promise((r) => setTimeout(r, 150)); // el envío inmediato es asíncrono
const mensajes = async (id) => q(`SELECT evento, estado, plantilla, telefono, parametros, intentos FROM notificaciones_whatsapp WHERE id_pedido = $1 ORDER BY id`, [id]);

before(async () => {
  // La copia de la base puede traer credenciales propias guardadas desde el admin:
  // las pruebas usan las del .env de prueba
  await pool.query(`DELETE FROM negocios_integraciones`).catch(() => {});
  server = http.createServer(app).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  globalThis.fetch = async (url, opts) => {
    if (String(url).startsWith("https://graph.facebook.com/")) {
      if (metaCaida) return new Response(JSON.stringify({ error: { message: "Servicio no disponible" } }), { status: 503 });
      enviados.push({ url: String(url), auth: opts.headers.Authorization, body: JSON.parse(opts.body) });
      return new Response(JSON.stringify({ messages: [{ id: `wamid.${enviados.length}` }] }), { status: 200 });
    }
    return original(url, opts);
  };
  await q(`UPDATE negocios_sitio SET tienda_activa = true, publicado = true, tienda_requiere_caja_abierta = true WHERE id_negocio = 1`);
  const [cat] = await q(`INSERT INTO categorias (id_negocio, nombre, activo) VALUES (1, 'ZZ WA ${RUN}', true) RETURNING id`);
  const [p] = await q(`INSERT INTO productos (nombre, id_categoria, estado, publicacion_web, es_complemento, usa_receta, controla_inventario, hora_inicio, hora_fin)
                       VALUES ('ZZ Plato WA ${RUN}', $1, true, true, false, false, false, '00:00', '23:59:59') RETURNING id`, [cat.id]);
  await q(`INSERT INTO productos_precios (id_producto, precio_costo, precio_venta) VALUES ($1, 0, 15000)`, [p.id]);
  plato = p.id;
  cajero = jwt.sign({ id: 10, id_negocio: 1, nombre: "Cajero", roles_sistema: [] }, process.env.JWT_SECRET);
});

after(async () => {
  globalThis.fetch = original;
  server.close();
  await pool.end();
});

const pedido = async (extra = {}) => {
  const r = await api("POST", "/tienda/1/pedidos", { body: {
    cliente: { nombre: "Laura Gómez", telefono: "3001234567" }, entrega: { tipo: "DOMICILIO", direccion: "Calle 1 # 2-3" },
    metodo_pago: "CONTRAENTREGA", items: [{ id_producto: plato, cantidad: 1 }], ...extra } });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const [{ id, version }] = await q(`SELECT id, version FROM pedidos WHERE codigo = $1`, [r.json.pedido.codigo]);
  return { id, version, codigo: r.json.pedido.codigo };
};
const avanzar = async (p, estado) => {
  const [{ version }] = await q(`SELECT version FROM pedidos WHERE id = $1`, [p.id]);
  const r = await api("PATCH", `/pedidos/${p.id}/estado`, { tk: cajero, body: { estado, version, nota: "prueba" } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  await esperar();
};

test("el primer mensaje es el saludo con el pedido recibido, a la plantilla y número correctos", async () => {
  const p = await pedido({ avisos_whatsapp: true });
  await esperar();
  const [m] = await mensajes(p.id);
  assert.equal(m.evento, "RECIBIDO");
  assert.equal(m.estado, "ENVIADO");
  assert.equal(m.telefono, "573001234567");
  const ultimo = enviados.at(-1);
  assert.equal(ultimo.url, "https://graph.facebook.com/v21.0/111222333/messages");
  assert.equal(ultimo.auth, "Bearer token-prueba");
  assert.equal(ultimo.body.template.name, "pedido_recibido");
  assert.deepEqual(ultimo.body.template.components[0].parameters.map((x) => x.text).slice(0, 3), ["Laura", m.parametros[1], p.codigo]);
});

test("un aviso por cada estado (confirmado, en camino, entregado) y nunca duplicado", async () => {
  const p = await pedido({ avisos_whatsapp: true });
  await esperar();
  await avanzar(p, "CONFIRMADO");
  await avanzar(p, "EN_PREPARACION"); // sin aviso
  await avanzar(p, "LISTO");          // domicilio: sin aviso de "listo"
  await avanzar(p, "EN_CAMINO");
  await avanzar(p, "ENTREGADO");
  const ms = await mensajes(p.id);
  assert.deepEqual(ms.map((m) => m.evento), ["RECIBIDO", "CONFIRMADO", "EN_CAMINO", "ENTREGADO"]);
  assert.ok(ms.every((m) => m.estado === "ENVIADO"));

  // El detalle muestra el registro y el enlace manual
  const d = (await api("GET", `/pedidos/${p.id}`, { tk: cajero })).json.data;
  assert.equal(d.whatsapp.mensajes.length, 4);
  assert.match(d.whatsapp.manual.url, /^https:\/\/wa\.me\/573001234567\?text=/);
});

test("si el cliente recoge, se avisa cuando está listo", async () => {
  const p = await pedido({ avisos_whatsapp: true, entrega: { tipo: "RECOGER" } });
  await esperar();
  await avanzar(p, "CONFIRMADO");
  await avanzar(p, "EN_PREPARACION");
  await avanzar(p, "LISTO");
  assert.deepEqual((await mensajes(p.id)).map((m) => m.evento), ["RECIBIDO", "CONFIRMADO", "LISTO"]);
});

test("sin autorización del cliente no se envía nada (pero el aviso manual sigue disponible)", async () => {
  const p = await pedido();
  await esperar();
  await avanzar(p, "CONFIRMADO");
  assert.equal((await mensajes(p.id)).length, 0);
  const d = (await api("GET", `/pedidos/${p.id}`, { tk: cajero })).json.data;
  assert.equal(d.whatsapp.autorizado, false);
  assert.ok(d.whatsapp.manual.texto.includes(p.codigo));
});

test("si Meta falla, el aviso queda en cola y se reintenta", async () => {
  metaCaida = true;
  const p = await pedido({ avisos_whatsapp: true });
  await esperar();
  let [m] = await mensajes(p.id);
  assert.equal(m.estado, "PENDIENTE");
  assert.equal(m.intentos, 1);
  metaCaida = false;
  await enviarPendientes();
  [m] = await mensajes(p.id);
  assert.equal(m.estado, "ENVIADO");
  assert.equal(m.intentos, 2);
});
