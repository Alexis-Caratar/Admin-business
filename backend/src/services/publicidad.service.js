// Publicidad: piezas para estados de WhatsApp (menú del día y promociones).
// La imagen se arma en el navegador; aquí: datos del negocio, carta para llenar el
// menú, diseños guardados y un proxy de imágenes SOLO para fotos del propio negocio
// (para poder dibujarlas en el lienzo sin problemas de CORS, sin abrir un proxy libre).
import { pool } from "../config/db.js";
import { lookup } from "node:dns/promises";
import net from "node:net";

const errorHttp = (status, message) => Object.assign(new Error(message), { status });
const MAX_IMAGEN = 6 * 1024 * 1024;

export const recursos = async ({ id_negocio }) => {
  const { rows: [n] } = await pool.query(
    `SELECT nombre, imagen AS logo, telefono, whatsapp, direccion, ciudad FROM negocios WHERE id = $1`, [id_negocio]
  );
  if (!n) throw errorHttp(404, "Negocio no encontrado");
  const { rows: fotosProductos } = await pool.query(
    `SELECT DISTINCT ON (pi.url) pi.url, p.nombre AS titulo FROM productos_imagenes pi
     JOIN productos p ON p.id = pi.id_producto AND p.estado JOIN categorias c ON c.id = p.id_categoria AND c.id_negocio = $1
     WHERE pi.url ~ '^https://' ORDER BY pi.url LIMIT 60`, [id_negocio]
  );
  const { rows: fotosCategorias } = await pool.query(
    `SELECT imagen AS url, nombre AS titulo FROM categorias WHERE id_negocio = $1 AND activo AND imagen ~ '^https://' ORDER BY nombre`, [id_negocio]
  );
  const { rows: [sitio] } = await pool.query(
    `SELECT imagen_portada, imagen_franja, galeria FROM negocios_sitio WHERE id_negocio = $1`, [id_negocio]
  ).catch(() => ({ rows: [] }));
  const fotosSitio = sitio ? [sitio.imagen_portada, sitio.imagen_franja, ...(sitio.galeria ?? [])]
    .filter((f) => f?.src && /^https:\/\//.test(f.src)).map((f) => ({ url: f.src, titulo: f.alt ?? "Foto del sitio" })) : [];
  // Carta del día: platos de las categorías de almuerzos y sus acompañamientos (complementos)
  const { rows: carta } = await pool.query(
    `SELECT p.nombre, COALESCE(p.es_complemento, false) AS complemento, c.nombre AS categoria
     FROM productos p JOIN categorias c ON c.id = p.id_categoria AND c.id_negocio = $1 AND c.activo
     WHERE p.estado AND (COALESCE(c.tiquetera_elegible, false) OR c.nombre ILIKE '%almuerzo%')
     ORDER BY p.es_complemento, p.nombre`, [id_negocio]
  ).catch(() => ({ rows: [] }));
  return {
    negocio: n,
    fotos: [...fotosSitio, ...fotosCategorias, ...fotosProductos],
    carta: { platos: carta.filter((c) => !c.complemento).map((c) => c.nombre), acompanamientos: carta.filter((c) => c.complemento).map((c) => c.nombre) },
  };
};

export const listar = async ({ id_negocio }) => (await pool.query(
  `SELECT id, plantilla, nombre, datos, updated_at FROM publicidades WHERE id_negocio = $1 ORDER BY updated_at DESC LIMIT 100`, [id_negocio]
)).rows;

export const guardar = async (id, d, ctx) => {
  const plantilla = String(d.plantilla ?? "");
  if (!["menu", "promo"].includes(plantilla)) throw errorHttp(400, "Plantilla no válida");
  const nombre = String(d.nombre ?? "").trim().slice(0, 80);
  if (!nombre) throw errorHttp(400, "Ponle un nombre al diseño");
  if (!d.datos || typeof d.datos !== "object") throw errorHttp(400, "Faltan los datos del diseño");
  // Fotos subidas desde el dispositivo (data:) no se guardan: pesan mucho; se vuelven a elegir al abrir
  const datos = JSON.parse(JSON.stringify(d.datos, (k, v) => (typeof v === "string" && v.startsWith("data:") ? null : v)));
  if (JSON.stringify(datos).length > 60_000) throw errorHttp(400, "El diseño tiene demasiado texto");
  const { rows: [r] } = id
    ? await pool.query(`UPDATE publicidades SET plantilla = $1, nombre = $2, datos = $3, updated_at = now() WHERE id = $4 AND id_negocio = $5 RETURNING *`,
      [plantilla, nombre, datos, id, ctx.id_negocio])
    : await pool.query(`INSERT INTO publicidades (id_negocio, plantilla, nombre, datos, id_usuario) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ctx.id_negocio, plantilla, nombre, datos, ctx.id_usuario]);
  if (!r) throw errorHttp(404, "Diseño no encontrado");
  return r;
};

export const eliminar = async (id, ctx) => {
  const { rowCount } = await pool.query(`DELETE FROM publicidades WHERE id = $1 AND id_negocio = $2`, [id, ctx.id_negocio]);
  if (!rowCount) throw errorHttp(404, "Diseño no encontrado");
  return { ok: true };
};

// ¿La URL es una foto de ESTE negocio? (logo, productos, categorías o su página web)
const esDelNegocio = async (url, id_negocio) => {
  const { rows: [r] } = await pool.query(
    `SELECT (
       EXISTS (SELECT 1 FROM negocios WHERE id = $2 AND imagen = $1)
       OR EXISTS (SELECT 1 FROM productos_imagenes pi JOIN productos p ON p.id = pi.id_producto JOIN categorias c ON c.id = p.id_categoria
                  WHERE c.id_negocio = $2 AND pi.url = $1)
       OR EXISTS (SELECT 1 FROM categorias WHERE id_negocio = $2 AND imagen = $1)
       OR EXISTS (SELECT 1 FROM negocios_sitio ns WHERE ns.id_negocio = $2 AND strpos(to_jsonb(ns)::text, $1) > 0)
     ) AS ok`, [url, id_negocio]
  ).catch(() => ({ rows: [{ ok: false }] }));
  return Boolean(r?.ok);
};

// Nunca hacia la red interna (localhost, privadas, metadatos de la nube), aunque la URL sea "del negocio"
const ipPrivada = (ip) => {
  if (net.isIPv6(ip)) return /^(::1|::|fc|fd|fe8|fe9|fea|feb|::ffff:(127|10|192\.168|169\.254|172\.(1[6-9]|2\d|3[01]))\.)/i.test(ip);
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
};
const destinoSeguro = async (u) => {
  const { protocol, hostname } = new URL(u);
  if (protocol !== "https:") throw errorHttp(400, "Solo enlaces https");
  const ips = net.isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true }).catch(() => []);
  if (!ips.length || ips.some((i) => ipPrivada(i.address))) throw errorHttp(400, "Enlace de imagen no permitido");
};
const traer = async (u, signal, saltos = 3) => {
  await destinoSeguro(u);
  const r = await fetch(u, { signal, redirect: "manual", headers: { Accept: "image/*" } });
  if (r.status >= 300 && r.status < 400 && r.headers.get("location") && saltos > 0) return traer(new URL(r.headers.get("location"), u).toString(), signal, saltos - 1);
  return r;
};

export const imagen = async (url, ctx) => {
  const u = String(url ?? "");
  if (!/^https:\/\/[^\s]+$/i.test(u) || u.length > 1000) throw errorHttp(400, "Enlace de imagen no válido");
  if (!(await esDelNegocio(u, ctx.id_negocio))) throw errorHttp(403, "Solo se pueden usar fotos del negocio");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await traer(u, ctrl.signal);
    if (!r.ok) throw errorHttp(502, "No se pudo traer la imagen");
    const tipo = r.headers.get("content-type") ?? "";
    if (!/^image\/(png|jpe?g|webp|gif)/i.test(tipo)) throw errorHttp(415, "El enlace no es una imagen");
    const largo = Number(r.headers.get("content-length") ?? 0);
    if (largo > MAX_IMAGEN) throw errorHttp(413, "La imagen es muy pesada");
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_IMAGEN) throw errorHttp(413, "La imagen es muy pesada");
    return { tipo, buf };
  } catch (e) {
    if (e.status) throw e;
    throw errorHttp(502, "No se pudo traer la imagen");
  } finally {
    clearTimeout(t);
  }
};
