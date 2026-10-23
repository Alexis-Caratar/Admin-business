// Publicidad: recursos del negocio, carta del día, diseños guardados y proxy de imágenes seguro.
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
const api = async (metodo, ruta, { body, t } = {}) => {
  const r = await fetch(base + ruta, { method: metodo, headers: { "content-type": "application/json", authorization: `Bearer ${t}` }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
};
const negocio = async (s) => {
  const [n] = await q(`INSERT INTO negocios (nombre, url_negocio, nit, telefono, direccion, ciudad, imagen) VALUES ($1, $2, $3, '3001112233', 'Cra 1 # 2-3', 'Pasto', 'https://ejemplo.co/logo.png') RETURNING id`,
    [`ZZ PUB ${s} ${RUN}`, `zz-pub-${s}-${RUN}`, `ZP${s}${RUN}`]);
  await q(`INSERT INTO app_modulos_negocio (id_modulo, id_negocio, activo) SELECT id, $1, true FROM app_modulos WHERE url IN ('publicidad', 'cajero')`, [n.id]);
  return n.id;
};
const usuario = async (neg, nombre, modulos) => {
  const [p] = await q(`INSERT INTO personas (identificacion, nombres, apellidos, tipo) VALUES ($1, $2, 'ZZ', 'Empleado') RETURNING id`, [`ZZP${nombre}${RUN}`, nombre]);
  const [u] = await q(`INSERT INTO usuarios (email, password, id_negocio, id_persona) VALUES ($1, 'x', $2, $3) RETURNING id`, [`zzp${nombre}${RUN}@prueba.co`.toLowerCase(), neg, p.id]);
  for (const url of modulos) await q(`INSERT INTO app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo) SELECT $1, id, true FROM app_modulos WHERE url = $2`, [u.id, url]);
  return jwt.sign({ id: u.id, id_negocio: neg, roles_sistema: [] }, process.env.JWT_SECRET);
};

before(async () => {
  server = http.createServer(app).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  F.neg = await negocio("a"); F.neg2 = await negocio("b");
  F.admin = await usuario(F.neg, "Admin", ["publicidad"]);
  F.caja = await usuario(F.neg, "Caja", ["cajero"]);
  F.otro = await usuario(F.neg2, "Otro", ["publicidad"]);
  const [c] = await q(`INSERT INTO categorias (id_negocio, nombre, activo, tiquetera_elegible, imagen) VALUES ($1, '2. Almuerzos', true, true, 'https://127.0.0.1/interna.png') RETURNING id`, [F.neg]);
  for (const [nombre, comp] of [["Pollo plancha", false], ["Carne sudada", false], ["Sopa de quinua", true]]) {
    await q(`INSERT INTO productos (nombre, id_categoria, estado, publicacion_web, es_complemento, usa_receta, controla_inventario, hora_inicio, hora_fin)
             VALUES ($1, $2, true, false, $3, false, false, '00:00', '23:59:59')`, [nombre, c.id, comp]);
  }
});
after(async () => { server.close(); await pool.end(); });

test("recursos: datos del negocio y la carta del día para llenar el menú", async () => {
  const r = await api("GET", "/publicidad/recursos", { t: F.admin });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.data.negocio.telefono, "3001112233");
  assert.deepEqual(r.json.data.carta.platos.sort(), ["Carne sudada", "Pollo plancha"]);
  assert.deepEqual(r.json.data.carta.acompanamientos, ["Sopa de quinua"]);
  assert.equal((await api("GET", "/publicidad/recursos", { t: F.caja })).status, 403, "sin el módulo, no");
});

test("diseños: se guardan sin fotos subidas (data:), y cada negocio ve solo los suyos", async () => {
  assert.equal((await api("POST", "/publicidad", { t: F.admin, body: { plantilla: "otra", nombre: "x", datos: {} } })).status, 400);
  const r = await api("POST", "/publicidad", { t: F.admin, body: { plantilla: "promo", nombre: "Universitarios", datos: { titulo: "ALMUERZO GRATIS", fondo: "data:image/png;base64,AAAA" } } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.data.datos.fondo, null, "la foto subida no se guarda");
  F.id = r.json.data.id;
  assert.equal((await api("PUT", `/publicidad/${F.id}`, { t: F.admin, body: { plantilla: "promo", nombre: "Universitarios 2", datos: { titulo: "2x1" } } })).json.data.nombre, "Universitarios 2");
  assert.equal((await api("GET", "/publicidad", { t: F.otro })).json.data.length, 0);
  assert.equal((await api("PUT", `/publicidad/${F.id}`, { t: F.otro, body: { plantilla: "promo", nombre: "hack", datos: {} } })).status, 404);
  assert.equal((await api("DELETE", `/publicidad/${F.id}`, { t: F.otro })).status, 404);
  assert.equal((await api("DELETE", `/publicidad/${F.id}`, { t: F.admin })).status, 200);
});

test("proxy de imágenes: solo fotos del negocio y nunca la red interna", async () => {
  const pedir = (url, t = F.admin) => fetch(`${base}/publicidad/imagen?url=${encodeURIComponent(url)}`, { headers: { authorization: `Bearer ${t}` } }).then((r) => r.status);
  assert.equal(await pedir("http://ejemplo.co/logo.png"), 400, "solo https");
  assert.equal(await pedir("https://cualquiera.co/foto.png"), 403, "no es del negocio");
  assert.equal(await pedir("https://ejemplo.co/logo.png", F.caja), 403, "sin permiso");
  assert.equal(await pedir("https://127.0.0.1/interna.png"), 400, "es del negocio pero apunta a la red interna");
});
