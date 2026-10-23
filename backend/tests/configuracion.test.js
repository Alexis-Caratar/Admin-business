// Configuración → Mi negocio: datos y página web del propio negocio, con permiso.
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
const negocio = async (s) => (await q(`INSERT INTO negocios (nombre, url_negocio, nit) VALUES ($1, $2, $3) RETURNING id`, [`ZZ CFG ${s} ${RUN}`, `zz-cfg-${s}-${RUN}`, `ZF${s}${RUN}`]))[0].id;
const usuario = async (neg, nombre, modulos) => {
  const [p] = await q(`INSERT INTO personas (identificacion, nombres, apellidos, tipo) VALUES ($1, $2, 'ZZ', 'Empleado') RETURNING id`, [`ZZF${nombre}${RUN}`, nombre]);
  const [u] = await q(`INSERT INTO usuarios (email, password, id_negocio, id_persona) VALUES ($1, 'x', $2, $3) RETURNING id`, [`zzf${nombre}${RUN}@prueba.co`.toLowerCase(), neg, p.id]);
  for (const url of modulos) await q(`INSERT INTO app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo) SELECT $1, id, true FROM app_modulos WHERE url = $2`, [u.id, url]);
  return jwt.sign({ id: u.id, id_negocio: neg, roles_sistema: [] }, process.env.JWT_SECRET);
};

before(async () => {
  server = http.createServer(app).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  F.neg = await negocio("a"); F.neg2 = await negocio("b");
  for (const n of [F.neg, F.neg2]) await q(`INSERT INTO app_modulos_negocio (id_modulo, id_negocio, activo) SELECT id, $1, true FROM app_modulos WHERE url IN ('negocio', 'usuarios', 'cajero')`, [n]);
  F.admin = await usuario(F.neg, "Admin", ["negocio", "usuarios"]);
  F.cajero = await usuario(F.neg, "Caja", ["cajero"]);
});
after(async () => { server.close(); await pool.end(); });

test("el administrador ve su negocio; quien no tiene el módulo, no", async () => {
  const r = await api("GET", "/mi-negocio", { t: F.admin });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.data.nombre, `ZZ CFG a ${RUN}`);
  assert.equal(r.json.data.puede_cambiar_url, false);
  assert.equal((await api("GET", "/mi-negocio", { t: F.cajero })).status, 403);
  assert.equal((await api("PUT", "/mi-negocio/datos", { t: F.cajero, body: { nombre: "hack" } })).status, 403);
});

test("edita los datos de SU negocio (no el NIT), con auditoría", async () => {
  assert.equal((await api("PUT", "/mi-negocio/datos", { t: F.admin, body: { nombre: "" } })).status, 400);
  assert.equal((await api("PUT", "/mi-negocio/datos", { t: F.admin, body: { nombre: "x", imagen: "http://inseguro.co/a.png" } })).status, 400);
  const r = await api("PUT", "/mi-negocio/datos", { t: F.admin, body: { nombre: "Punto ZZ", telefono: "3001234567", ciudad: "Pasto", nit: "999", id: F.neg2 } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const [n] = await q(`SELECT nombre, telefono, ciudad, nit FROM negocios WHERE id = $1`, [F.neg]);
  assert.deepEqual([n.nombre, n.telefono, n.ciudad, n.nit], ["Punto ZZ", "3001234567", "Pasto", `ZFa${RUN}`]);
  assert.equal((await q(`SELECT nombre FROM negocios WHERE id = $1`, [F.neg2]))[0].nombre, `ZZ CFG b ${RUN}`, "otro negocio intacto");
  const [a] = await q(`SELECT accion FROM app_auditoria WHERE tabla = 'negocios' AND id_registro = $1`, [F.neg]);
  assert.equal(a.accion, "EDITAR_DATOS");
});

test("página web: guarda textos pero conserva la URL y el dominio", async () => {
  const actual = (await api("GET", "/mi-negocio", { t: F.admin })).json.data;
  const r = await api("PUT", "/mi-negocio/sitio", { t: F.admin, body: {
    negocio: { url_negocio: "otra-url", dominio: "hack.co", whatsapp: actual.whatsapp, latitud: null, longitud: null, google_maps_url: null },
    horarios: actual.horarios, sitio: { ...actual, eslogan: "Comida de casa" },
  } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const [n] = await q(`SELECT url_negocio, dominio FROM negocios WHERE id = $1`, [F.neg]);
  assert.deepEqual([n.url_negocio, n.dominio], [`zz-cfg-a-${RUN}`, null]);
  assert.equal((await api("GET", "/mi-negocio", { t: F.admin })).json.data.eslogan, "Comida de casa");
});

test("con perfil sin la acción 'sitio', no edita la página web", async () => {
  const [pf] = await q(`INSERT INTO app_perfiles (id_negocio, nombre) VALUES ($1, 'Solo datos') RETURNING id`, [F.neg]);
  await q(`INSERT INTO app_perfiles_permisos (id_perfil, id_accion) SELECT $1, a.id FROM app_modulos_acciones a JOIN app_modulos m ON m.id = a.id_modulo
           WHERE m.url = 'negocio' AND a.codigo IN ('ver', 'editar')`, [pf.id]);
  const t = await usuario(F.neg, "Datos", ["negocio"]);
  const id = jwt.decode(t).id;
  await q(`UPDATE usuarios SET id_perfil = $1 WHERE id = $2`, [pf.id, id]);
  assert.equal((await api("GET", "/mi-negocio", { t })).status, 200);
  assert.equal((await api("PUT", "/mi-negocio/sitio", { t, body: {} })).status, 403);
});

test("factura e impresión: el negocio configura su ticket y si la factura sale al cobrar", async () => {
  let r = await api("GET", "/mi-negocio/impresion", { t: F.admin });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.data.config.factura_al_cobrar, "preguntar", "por defecto se pregunta");
  assert.ok(r.json.data.vista_previa.includes("TOTAL"));
  assert.equal((await api("PUT", "/mi-negocio/impresion", { t: F.admin, body: { factura_al_cobrar: "a veces" } })).status, 400);
  r = await api("PUT", "/mi-negocio/impresion", { t: F.admin, body: { factura_al_cobrar: "siempre", pie: "Gracias ZZ" } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const [cfg] = await q(`SELECT factura_al_cobrar, pie FROM negocios_impresion WHERE id_negocio = $1`, [F.neg]);
  assert.deepEqual([cfg.factura_al_cobrar, cfg.pie], ["siempre", "Gracias ZZ"]);
  assert.equal((await q(`SELECT count(*)::int n FROM negocios_impresion WHERE id_negocio = $1`, [F.neg2]))[0].n, 0, "otro negocio intacto");
  // La caja lee la preferencia de su negocio
  const p = await api("GET", "/cajero/preferencia-factura", { t: F.cajero });
  assert.equal(p.json.factura_al_cobrar, "siempre");
  // Sin la acción 'impresion' (perfil Solo datos) o sin el módulo, no se configura
  assert.equal((await api("GET", "/mi-negocio/impresion", { t: F.cajero })).status, 403);
  const t = await usuario(F.neg, "Datos2", ["negocio"]);
  await q(`UPDATE usuarios SET id_perfil = (SELECT id FROM app_perfiles WHERE id_negocio = $1 AND nombre = 'Solo datos') WHERE id = $2`, [F.neg, jwt.decode(t).id]);
  assert.equal((await api("PUT", "/mi-negocio/impresion", { t, body: { factura_al_cobrar: "nunca" } })).status, 403);
  assert.equal((await api("POST", "/mi-negocio/impresion/token", { t })).status, 403, "ni genera token de agente");
});
