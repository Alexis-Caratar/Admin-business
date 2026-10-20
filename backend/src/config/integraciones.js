// Configuración efectiva de cada negocio: lo guardado en negocios_integraciones
// (Admin > Negocios > Pagos y WhatsApp) y, para lo que no tenga, el .env.
// Wompi y WhatsApp se toman como bloque: o todo del negocio o todo del servidor,
// para no mezclar la llave pública de una cuenta con el secreto de otra.
import { pool } from "./db.js";
import { descifrar } from "./cifrado.js";
import { armarWhatsapp, armarWompi, configTienda, configWhatsappServidor, configWompi } from "./tienda.js";

const TTL = 30_000;
const cache = new Map(); // id_negocio → { fila, hasta }

export const invalidarIntegraciones = (id_negocio) => cache.delete(Number(id_negocio));

const leerFila = async (id_negocio, db) => {
  const id = Number(id_negocio);
  const c = cache.get(id);
  if (c && c.hasta > Date.now()) return c.fila;
  let fila = null;
  try {
    ({ rows: [fila = null] } = await db.query(`SELECT * FROM negocios_integraciones WHERE id_negocio = $1`, [id]));
  } catch (err) {
    // Sin la migración 007 todo sigue funcionando con el .env
    if (err.code !== "42P01") throw err;
  }
  cache.set(id, { fila, hasta: Date.now() + TTL });
  return fila;
};

export const wompiDeFila = (f) => (f?.wompi_public_key
  ? armarWompi({
    entorno: f.wompi_entorno,
    publicKey: f.wompi_public_key,
    integritySecret: descifrar(f.wompi_integrity_cifrado),
    eventsSecret: descifrar(f.wompi_events_cifrado),
    privateKey: descifrar(f.wompi_private_cifrado),
  }, "negocio")
  : configWompi());

export const whatsappDeFila = (f) => (f?.whatsapp_token_cifrado && f?.whatsapp_phone_number_id
  ? armarWhatsapp({
    token: descifrar(f.whatsapp_token_cifrado),
    telefonoId: f.whatsapp_phone_number_id,
    version: f.whatsapp_api_version,
    idioma: f.whatsapp_idioma,
  }, "negocio")
  : configWhatsappServidor());

export const configNegocio = async (id_negocio, db = pool) => {
  const f = id_negocio ? await leerFila(id_negocio, db) : null;
  const servidor = configTienda();
  return {
    wompi: wompiDeFila(f),
    whatsapp: whatsappDeFila(f),
    tienda: {
      // TIENDA_VALIDAR_HORARIO=false en el .env lo apaga para todos (pruebas)
      validarHorario: servidor.validarHorario && (f ? f.tienda_validar_horario : true),
      // URL a la que Wompi devuelve al cliente (null = la del servidor o el dominio del negocio)
      urlRetorno: f?.tienda_url_retorno || null,
    },
  };
};

export const wompiNegocio = async (id_negocio, db) => (await configNegocio(id_negocio, db)).wompi;
export const whatsappNegocio = async (id_negocio, db) => (await configNegocio(id_negocio, db)).whatsapp;
