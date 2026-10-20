// Sitio web público de cada negocio: datos, horarios, contenido y configuración de la tienda.
import { pool } from "../config/db.js";

const errorHttp = (status, message, errores) => Object.assign(new Error(message), { status, errores });

// Rutas del frontend que no pueden usarse como url_negocio
const RESERVADAS = ["admin", "login", "tienda", "api", "assets", "public", "static"];

// ------------------------------------------------------------------
// RESOLVER EL NEGOCIO (id, url_negocio o dominio)
// ------------------------------------------------------------------
export const resolverNegocio = async (ref, db = pool) => {
  const valor = String(ref ?? "").trim().toLowerCase();
  if (!valor) throw errorHttp(404, "Negocio no encontrado");
  const { rows: [n] } = /^\d+$/.test(valor)
    ? await db.query(`SELECT id FROM negocios WHERE id = $1`, [Number(valor)])
    : await db.query(`SELECT id FROM negocios WHERE url_negocio = $1`, [valor]);
  if (!n) throw errorHttp(404, "Negocio no encontrado");
  return n.id;
};

export const normalizarDominio = (v) => {
  if (!v) return null;
  const d = String(v).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "").replace(/^www\./, "");
  return d || null;
};

// ------------------------------------------------------------------
// LECTURA
// ------------------------------------------------------------------
const SQL_SITIO = `
  SELECT n.id, n.url_negocio, n.dominio, n.nombre, n.nit, n.direccion, n.ciudad, n.telefono, n.correo,
         n.descripcion, n.imagen AS logo, n.tipo, n.tipo_negocio, n.activo, n.whatsapp,
         COALESCE(t.perfil, (SELECT perfil FROM tipos_negocio WHERE codigo = 'otros')) AS perfil,
         n.latitud::float AS latitud, n.longitud::float AS longitud, n.google_maps_url,
         s.publicado, s.nombre_publico, s.eslogan, s.frases, s.imagen_portada, s.nosotros_titulo, s.nosotros_texto, s.nosotros_items,
         s.imagen_franja, s.franja_texto, s.galeria, s.servicios, s.redes, s.mensaje_whatsapp, s.seo_titulo, s.seo_descripcion,
         s.tema, s.mostrar_fotos_productos, s.tienda_activa, s.tienda_permite_domicilio, s.tienda_permite_recoger,
         s.tienda_permite_contraentrega, s.tienda_costo_domicilio::float AS tienda_costo_domicilio,
         s.tienda_domicilio_gratis_desde::float AS tienda_domicilio_gratis_desde,
         s.tienda_pedido_minimo::float AS tienda_pedido_minimo, s.tienda_requiere_caja_abierta,
         (SELECT COALESCE(json_agg(json_build_object(
                    'dia_semana', h.dia_semana,
                    'hora_apertura', to_char(h.hora_apertura, 'HH24:MI'),
                    'hora_cierre', to_char(h.hora_cierre, 'HH24:MI')) ORDER BY h.dia_semana, h.hora_apertura), '[]')
          FROM negocios_horarios h WHERE h.id_negocio = n.id) AS horarios
  FROM negocios n
  LEFT JOIN negocios_sitio s ON s.id_negocio = n.id
  LEFT JOIN tipos_negocio t ON t.codigo = n.tipo_negocio`;

const cargar = async (where, valor, db = pool) => {
  const { rows: [r] } = await db.query(`${SQL_SITIO} WHERE ${where}`, [valor]);
  return r;
};

// Lo que ve el público: solo si el negocio está activo y el sitio publicado
const vistaPublica = (r) => {
  if (!r || !r.activo || !r.publicado) throw errorHttp(404, "Sitio no encontrado");
  return {
    negocio: {
      id: r.id, url_negocio: r.url_negocio, dominio: r.dominio,
      nombre: r.nombre_publico || r.nombre, razon_social: r.nombre, nit: r.nit, tipo: r.tipo,
      direccion: r.direccion, ciudad: r.ciudad, telefono: r.telefono, whatsapp: r.whatsapp, correo: r.correo,
      descripcion: r.descripcion, logo: r.logo, tipo_negocio: r.tipo_negocio,
      latitud: r.latitud, longitud: r.longitud, google_maps_url: r.google_maps_url,
    },
    horarios: r.horarios,
    sitio: {
      eslogan: r.eslogan, frases: r.frases, imagen_portada: r.imagen_portada,
      nosotros_titulo: r.nosotros_titulo, nosotros_texto: r.nosotros_texto, nosotros_items: r.nosotros_items, imagen_franja: r.imagen_franja,
      franja_texto: r.franja_texto,
      galeria: r.galeria, servicios: r.servicios, redes: r.redes, mensaje_whatsapp: r.mensaje_whatsapp,
      seo_titulo: r.seo_titulo, seo_descripcion: r.seo_descripcion, tema: r.tema,
      mostrar_fotos_productos: r.mostrar_fotos_productos,
    },
    tienda: { activa: r.tienda_activa },
    // Vocabulario, vista del catálogo e íconos según el tipo de negocio
    perfil: { vista_catalogo: r.perfil.vista_catalogo, schema: r.perfil.schema, iconos: r.perfil.iconos, textos: r.perfil.textos },
  };
};

export const sitioPublico = async (ref) => vistaPublica(await cargar("n.id = $1", await resolverNegocio(ref)));

export const sitioPorDominio = async (host) => {
  const dominio = normalizarDominio(host);
  return vistaPublica(dominio ? await cargar("n.dominio = $1", dominio) : null);
};

// Configuración de la tienda de un negocio (la usa tienda.service)
export const configuracionTienda = async (id_negocio, db = pool) => {
  const r = await cargar("n.id = $1", id_negocio, db);
  if (!r) return null;
  return {
    activa: Boolean(r.tienda_activa && r.activo),
    // Sitio visible al público (el catálogo se puede ver aunque la tienda no reciba pedidos)
    publicado: Boolean(r.publicado && r.activo),
    nombre: r.nombre_publico || r.nombre,
    dominio: r.dominio,
    url_negocio: r.url_negocio,
    horarios: r.horarios,
    permiteDomicilio: r.tienda_permite_domicilio ?? true,
    permiteRecoger: r.tienda_permite_recoger ?? true,
    permiteContraentrega: r.tienda_permite_contraentrega ?? true,
    costoDomicilio: r.tienda_costo_domicilio ?? 0,
    domicilioGratisDesde: r.tienda_domicilio_gratis_desde ?? 0,
    pedidoMinimo: r.tienda_pedido_minimo ?? 0,
    requiereCajaAbierta: r.tienda_requiere_caja_abierta ?? true,
  };
};

// Para el editor del admin: todo, publicado o no
export const sitioAdmin = async (id) => {
  const r = await cargar("n.id = $1", id);
  if (!r) throw errorHttp(404, "Negocio no encontrado");
  return r;
};

// ------------------------------------------------------------------
// VALIDACIÓN Y GUARDADO
// ------------------------------------------------------------------
const texto = (v, max) => (v === null || v === undefined ? null : String(v).trim().slice(0, max) || null);
const urlSegura = (v) => {
  if (!v) return null;
  try {
    const u = new URL(String(v).trim());
    return u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
};
const foto = (v, errores, campo) => {
  if (!v || !v.src) return null;
  const src = urlSegura(v.src);
  if (!src) { errores[campo] = "La imagen debe ser una URL https"; return null; }
  return { src, alt: texto(v.alt, 160) ?? "" };
};
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const validar = (p) => {
  const e = {};
  const n = p.negocio ?? {};
  const s = p.sitio ?? {};

  const url = String(n.url_negocio ?? "").trim().toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(url) || url.length < 3 || url.length > 80) {
    e.url_negocio = "Solo minúsculas, números y guiones (3 a 80 caracteres), ej: punto-urbano";
  } else if (RESERVADAS.includes(url)) {
    e.url_negocio = "Esa dirección está reservada por el sistema";
  }
  const dominio = normalizarDominio(n.dominio);
  if (dominio && !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(dominio)) e.dominio = "Dominio inválido, ej: puntourbano.co";
  const whatsapp = n.whatsapp ? String(n.whatsapp).replace(/\D/g, "") : null;
  if (whatsapp && !/^\d{10,15}$/.test(whatsapp)) e.whatsapp = "Número con indicativo, ej: 573001234567";
  const lat = n.latitud === "" || n.latitud == null ? null : Number(n.latitud);
  const lng = n.longitud === "" || n.longitud == null ? null : Number(n.longitud);
  if (lat !== null && !(lat >= -90 && lat <= 90)) e.latitud = "Latitud inválida";
  if (lng !== null && !(lng >= -180 && lng <= 180)) e.longitud = "Longitud inválida";
  const maps = urlSegura(n.google_maps_url);
  if (maps === undefined) e.google_maps_url = "Debe ser un enlace https";

  const horarios = (Array.isArray(p.horarios) ? p.horarios : []).slice(0, 21).map((h) => ({
    dia_semana: Number(h.dia_semana), hora_apertura: String(h.hora_apertura ?? ""), hora_cierre: String(h.hora_cierre ?? ""),
  }));
  if (horarios.some((h) => !(h.dia_semana >= 0 && h.dia_semana <= 6) || !HORA.test(h.hora_apertura) || !HORA.test(h.hora_cierre) || h.hora_apertura === h.hora_cierre)) {
    e.horarios = "Revisa los horarios: formato HH:MM y la apertura distinta del cierre";
  }

  const num = (v, campo) => {
    const x = Number(v ?? 0);
    if (!(x >= 0)) e[campo] = "Debe ser un valor positivo";
    return x;
  };

  const sitio = {
    publicado: Boolean(s.publicado),
    nombre_publico: texto(s.nombre_publico, 150),
    eslogan: texto(s.eslogan, 200),
    frases: (Array.isArray(s.frases) ? s.frases : []).map((f) => texto(f, 120)).filter(Boolean).slice(0, 10),
    imagen_portada: foto(s.imagen_portada, e, "imagen_portada"),
    nosotros_titulo: texto(s.nosotros_titulo, 120),
    nosotros_texto: texto(s.nosotros_texto, 600),
    nosotros_items: (Array.isArray(s.nosotros_items) ? s.nosotros_items : []).slice(0, 6).map((it, i) => ({
      titulo: texto(it.titulo, 80) ?? "", texto: texto(it.texto, 200) ?? "", foto: foto(it.foto, e, `nosotros_${i}`),
    })).filter((it) => it.titulo || it.texto),
    imagen_franja: foto(s.imagen_franja, e, "imagen_franja"),
    franja_texto: texto(s.franja_texto, 160),
    galeria: (Array.isArray(s.galeria) ? s.galeria : []).slice(0, 24).map((g, i) => {
      const f = foto(g, e, `galeria_${i}`);
      return f && { ...f, forma: ["alta", "ancha"].includes(g.forma) ? g.forma : "normal" };
    }).filter(Boolean),
    servicios: texto(s.servicios, 300),
    redes: (Array.isArray(s.redes) ? s.redes : []).slice(0, 10).map((r, i) => {
      const u = urlSegura(r.url);
      if (r.url && !u) e[`red_${i}`] = "El enlace de la red debe ser https";
      return u && { nombre: texto(r.nombre, 40) ?? "Red", url: u };
    }).filter(Boolean),
    mensaje_whatsapp: texto(s.mensaje_whatsapp, 300),
    seo_titulo: texto(s.seo_titulo, 160),
    seo_descripcion: texto(s.seo_descripcion, 300),
    tema: s.tema === "light" ? "light" : "dark",
    mostrar_fotos_productos: Boolean(s.mostrar_fotos_productos),
    tienda_activa: Boolean(s.tienda_activa),
    tienda_permite_domicilio: s.tienda_permite_domicilio !== false,
    tienda_permite_recoger: s.tienda_permite_recoger !== false,
    tienda_permite_contraentrega: s.tienda_permite_contraentrega !== false,
    tienda_costo_domicilio: num(s.tienda_costo_domicilio, "tienda_costo_domicilio"),
    tienda_domicilio_gratis_desde: num(s.tienda_domicilio_gratis_desde, "tienda_domicilio_gratis_desde"),
    tienda_pedido_minimo: num(s.tienda_pedido_minimo, "tienda_pedido_minimo"),
    tienda_requiere_caja_abierta: s.tienda_requiere_caja_abierta !== false,
  };
  if (sitio.tienda_activa && !sitio.tienda_permite_domicilio && !sitio.tienda_permite_recoger) {
    e.tienda_entrega = "Activa al menos domicilio o recoger en el local";
  }

  if (Object.keys(e).length) throw errorHttp(400, "Revisa los datos del sitio", e);
  return { negocio: { url_negocio: url, dominio, whatsapp, latitud: lat, longitud: lng, google_maps_url: maps }, horarios, sitio };
};

export const guardarSitio = async (id, payload) => {
  const datos = validar(payload);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const n = datos.negocio;
    await client.query(
      `UPDATE negocios SET url_negocio = $1, dominio = $2, whatsapp = $3, latitud = $4, longitud = $5, google_maps_url = $6
       WHERE id = $7`,
      [n.url_negocio, n.dominio, n.whatsapp, n.latitud, n.longitud, n.google_maps_url, id]
    );

    const cols = Object.keys(datos.sitio);
    const jsonb = ["frases", "imagen_portada", "nosotros_items", "imagen_franja", "galeria", "redes"];
    const valores = cols.map((c) => (jsonb.includes(c) && datos.sitio[c] !== null ? JSON.stringify(datos.sitio[c]) : datos.sitio[c]));
    await client.query(
      `INSERT INTO negocios_sitio (id_negocio, ${cols.join(", ")}, updated_at)
       VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(", ")}, NOW())
       ON CONFLICT (id_negocio) DO UPDATE SET ${cols.map((c) => `${c} = EXCLUDED.${c}`).join(", ")}, updated_at = NOW()`,
      [id, ...valores]
    );

    await client.query(`DELETE FROM negocios_horarios WHERE id_negocio = $1`, [id]);
    for (const h of datos.horarios) {
      await client.query(
        `INSERT INTO negocios_horarios (id_negocio, dia_semana, hora_apertura, hora_cierre) VALUES ($1, $2, $3, $4)`,
        [id, h.dia_semana, h.hora_apertura, h.hora_cierre]
      );
    }
    await client.query("COMMIT");
    return sitioAdmin(id);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if (err.code === "23505") {
      const campo = String(err.constraint).includes("dominio") ? "dominio" : "url_negocio";
      throw errorHttp(409, "Ya está en uso por otro negocio", { [campo]: "Ya está en uso por otro negocio" });
    }
    if (err.code === "23503") throw errorHttp(404, "Negocio no encontrado");
    throw err;
  } finally {
    client.release();
  }
};

// Tipos de negocio para el selector del admin (con sus textos sugeridos)
export const tiposNegocio = async () => {
  const { rows } = await pool.query(`SELECT codigo, nombre, perfil FROM tipos_negocio WHERE activo ORDER BY orden, nombre`);
  return rows;
};
