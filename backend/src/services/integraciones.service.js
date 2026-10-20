// Admin > Negocios > Pagos y WhatsApp: credenciales de Wompi y WhatsApp y ajustes
// de la tienda de cada negocio. Solo administración del sistema.
//
// Secretos: nunca se devuelven; solo si están guardados y sus 4 últimos caracteres.
// Al guardar: texto nuevo = reemplaza · vacío u omitido = se conserva · null = se borra.
import { pool } from "../config/db.js";
import { cifrar, descifrar } from "../config/cifrado.js";
import { configTienda, configWhatsappServidor, configWompi } from "../config/tienda.js";
import { invalidarIntegraciones, whatsappDeFila, wompiDeFila } from "../config/integraciones.js";
import { probarCredenciales as probarWompi } from "./pagos/wompi.service.js";
import { probarCredenciales as probarWhatsapp } from "./notificaciones/whatsapp.service.js";

const errorHttp = (status, message, errores) => Object.assign(new Error(message), { status, errores });

// Secretos: campo del cuerpo → columna cifrada
const SECRETOS = {
  wompi_integrity_secret: "wompi_integrity_cifrado",
  wompi_events_secret: "wompi_events_cifrado",
  wompi_private_key: "wompi_private_cifrado",
  whatsapp_token: "whatsapp_token_cifrado",
};
const TEXTOS = ["wompi_public_key", "whatsapp_phone_number_id", "whatsapp_api_version", "whatsapp_idioma", "tienda_url_retorno"];

const resumenSecreto = (cifrado) => {
  const v = descifrar(cifrado);
  return { guardado: Boolean(v), final: v ? v.slice(-4) : null };
};

const leer = async (id_negocio, db = pool) => {
  const { rows: [n] } = await db.query(`SELECT id FROM negocios WHERE id = $1`, [id_negocio]);
  if (!n) throw errorHttp(404, "Negocio no encontrado");
  const { rows: [f] } = await db.query(`SELECT * FROM negocios_integraciones WHERE id_negocio = $1`, [id_negocio]);
  return f ?? null;
};

const vista = (f, webhook) => {
  const w = wompiDeFila(f);
  const wa = whatsappDeFila(f);
  const servidorWompi = configWompi();
  const servidorWa = configWhatsappServidor();
  return {
    wompi: {
      entorno: f?.wompi_entorno ?? "pruebas",
      public_key: f?.wompi_public_key ?? "",
      integrity_secret: resumenSecreto(f?.wompi_integrity_cifrado),
      events_secret: resumenSecreto(f?.wompi_events_cifrado),
      private_key: resumenSecreto(f?.wompi_private_cifrado),
      // "negocio" = credenciales propias · "servidor" = las del .env · "ninguno"
      origen: w.habilitado ? w.origen : "ninguno",
      habilitado: w.habilitado,
      puede_conciliar: w.puedeBuscar,
      entorno_activo: w.habilitado ? w.entorno : null,
      webhook,
    },
    whatsapp: {
      phone_number_id: f?.whatsapp_phone_number_id ?? "",
      api_version: f?.whatsapp_api_version ?? "",
      idioma: f?.whatsapp_idioma ?? "",
      token: resumenSecreto(f?.whatsapp_token_cifrado),
      origen: wa.habilitado ? wa.origen : "ninguno",
      habilitado: wa.habilitado,
    },
    tienda: {
      url_retorno: f?.tienda_url_retorno ?? "",
      validar_horario: f?.tienda_validar_horario ?? true,
    },
    servidor: {
      wompi: servidorWompi.habilitado ? servidorWompi.entorno : null,
      whatsapp: servidorWa.habilitado,
      url_publica: process.env.TIENDA_URL_PUBLICA ? configTienda().urlPublica : null,
      validar_horario: configTienda().validarHorario,
    },
  };
};

export const obtener = async (id_negocio, webhook) => vista(await leer(id_negocio), webhook);

// Fila resultante de aplicar el cuerpo sobre lo guardado (sin cifrar todavía los secretos nuevos)
const combinar = (f, body) => {
  const r = { ...(f ?? {}), _secretos: {} };
  if (body.wompi_entorno !== undefined) r.wompi_entorno = body.wompi_entorno;
  r.wompi_entorno ??= "pruebas";
  for (const k of TEXTOS) {
    if (body[k] === undefined) continue;
    r[k] = body[k] === null ? null : String(body[k]).trim() || null;
  }
  if (body.tienda_validar_horario !== undefined) r.tienda_validar_horario = Boolean(body.tienda_validar_horario);
  r.tienda_validar_horario ??= true;
  for (const [campo, columna] of Object.entries(SECRETOS)) {
    const v = body[campo];
    if (v === null) { r[columna] = null; r._secretos[campo] = null; }
    else if (typeof v === "string" && v.trim()) r._secretos[campo] = v.trim();
  }
  return r;
};

// Valor efectivo de un secreto (nuevo o guardado)
const secreto = (r, campo) => (campo in r._secretos ? r._secretos[campo] ?? "" : descifrar(r[SECRETOS[campo]]));

const validar = (r) => {
  const e = {};
  const prod = r.wompi_entorno === "produccion";
  const ent = prod ? "prod" : "test";
  if (!["pruebas", "produccion"].includes(r.wompi_entorno)) e.wompi_entorno = "Elige pruebas o producción";

  const pub = r.wompi_public_key ?? "";
  const integ = secreto(r, "wompi_integrity_secret");
  const eventos = secreto(r, "wompi_events_secret");
  const priv = secreto(r, "wompi_private_key");
  const algunoWompi = pub || integ || eventos || priv;
  if (pub && !new RegExp(`^pub_${ent}_[A-Za-z0-9]+$`).test(pub)) e.wompi_public_key = `Debe empezar por pub_${ent}_ (entorno de ${r.wompi_entorno})`;
  if (integ && !new RegExp(`^${ent}_integrity_[A-Za-z0-9]+$`).test(integ)) e.wompi_integrity_secret = `Debe empezar por ${ent}_integrity_`;
  if (eventos && !new RegExp(`^${ent}_events_[A-Za-z0-9]+$`).test(eventos)) e.wompi_events_secret = `Debe empezar por ${ent}_events_`;
  if (priv && !new RegExp(`^prv_${ent}_[A-Za-z0-9]+$`).test(priv)) e.wompi_private_key = `Debe empezar por prv_${ent}_`;
  if (algunoWompi) {
    if (!pub) e.wompi_public_key ??= "Falta la llave pública";
    if (!integ) e.wompi_integrity_secret ??= "Falta el secreto de integridad";
    if (!eventos) e.wompi_events_secret ??= "Falta el secreto de eventos";
  }

  const token = secreto(r, "whatsapp_token");
  const tel = r.whatsapp_phone_number_id ?? "";
  if (tel && !/^\d{5,30}$/.test(tel)) e.whatsapp_phone_number_id = "Solo números (el ID del número, no el teléfono)";
  if (token && token.length > 1000) e.whatsapp_token = "El token es demasiado largo";
  if (token && !tel) e.whatsapp_phone_number_id ??= "Falta el ID del número de teléfono";
  if (tel && !token) e.whatsapp_token = "Falta el token de acceso";
  if (r.whatsapp_api_version && !/^v\d{1,2}\.\d$/.test(r.whatsapp_api_version)) e.whatsapp_api_version = "Formato v21.0";
  if (r.whatsapp_idioma && !/^[a-z]{2,3}(_[A-Z]{2})?$/.test(r.whatsapp_idioma)) e.whatsapp_idioma = "Ej.: es, es_MX, es_CO";

  if (r.tienda_url_retorno) {
    try {
      const u = new URL(r.tienda_url_retorno);
      if (!["http:", "https:"].includes(u.protocol) || r.tienda_url_retorno.length > 255) throw new Error();
      r.tienda_url_retorno = r.tienda_url_retorno.replace(/\/+$/, "");
    } catch {
      e.tienda_url_retorno = "Escribe una URL completa, ej.: https://mitienda.com";
    }
  }
  if (Object.keys(e).length) throw errorHttp(400, "Revisa los datos marcados", e);
};

export const guardar = async (id_negocio, body = {}, id_usuario, webhook) => {
  const f = await leer(id_negocio);
  const r = combinar(f, body);
  validar(r);
  for (const [campo, valor] of Object.entries(r._secretos)) r[SECRETOS[campo]] = valor ? cifrar(valor) : null;

  const columnas = ["wompi_entorno", ...TEXTOS, ...Object.values(SECRETOS), "tienda_validar_horario"];
  const valores = columnas.map((c) => r[c] ?? null);
  valores[columnas.indexOf("tienda_validar_horario")] = r.tienda_validar_horario;
  await pool.query(
    `INSERT INTO negocios_integraciones (id_negocio, ${columnas.join(", ")}, actualizado_por, updated_at)
     VALUES ($1, ${columnas.map((_, i) => `$${i + 2}`).join(", ")}, $${columnas.length + 2}, NOW())
     ON CONFLICT (id_negocio) DO UPDATE SET ${columnas.map((c) => `${c} = EXCLUDED.${c}`).join(", ")},
       actualizado_por = EXCLUDED.actualizado_por, updated_at = NOW()`,
    [id_negocio, ...valores, id_usuario ?? null]
  );
  invalidarIntegraciones(id_negocio);
  return obtener(id_negocio, webhook);
};

// Prueba la conexión con lo escrito en el formulario (aunque no se haya guardado)
export const probar = async (id_negocio, tipo, body = {}) => {
  const r = combinar(await leer(id_negocio), body);
  const fila = { ...r };
  for (const [campo, columna] of Object.entries(SECRETOS)) if (campo in r._secretos) fila[columna] = r._secretos[campo] ? cifrar(r._secretos[campo]) : null;
  try {
    if (tipo === "wompi") {
      const cfg = wompiDeFila(fila);
      if (cfg.origen !== "negocio") return { ok: false, mensaje: "Escribe la llave pública para probar" };
      return await probarWompi(cfg);
    }
    if (tipo === "whatsapp") {
      const cfg = whatsappDeFila(fila);
      if (cfg.origen !== "negocio") return { ok: false, mensaje: "Escribe el token y el ID del número para probar" };
      return await probarWhatsapp(cfg);
    }
  } catch (err) {
    return { ok: false, mensaje: `No se pudo conectar: ${err.message}` };
  }
  throw errorHttp(400, "Tipo de prueba no válido");
};
