// Configuración de la tienda web y la pasarela, leída del .env.
// Se lee en cada llamada para que las pruebas puedan cambiar valores.
import dotenv from "dotenv";

dotenv.config();

const bool = (v, def) => (v === undefined || v === "" ? def : ["1", "true", "si", "sí"].includes(String(v).toLowerCase()));

// Ajustes globales. La configuración de cada tienda (domicilio, mínimos, pagos,
// caja abierta) se guarda por negocio en negocios_sitio y se edita desde el admin.
export const configTienda = () => ({
  // Si false, no se valida el horario (útil en pruebas)
  validarHorario: bool(process.env.TIENDA_VALIDAR_HORARIO, true),
  // URL pública del frontend para volver desde la pasarela cuando el negocio no tiene dominio
  urlPublica: (process.env.TIENDA_URL_PUBLICA || "http://localhost:5173").replace(/\/$/, ""),
});

// Arma la configuración de Wompi a partir de valores (del .env o del negocio)
export const armarWompi = ({ entorno: e, publicKey = "", integritySecret = "", eventsSecret = "", privateKey = "" }, origen) => {
  const entorno = e === "produccion" ? "produccion" : "pruebas";
  const cfg = {
    entorno,
    origen, // "negocio" | "servidor"
    publicKey,
    integritySecret,
    eventsSecret,
    // Opcional: permite buscar transacciones por referencia (respaldo del webhook)
    privateKey,
    apiUrl: entorno === "produccion" ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1",
    checkoutUrl: "https://checkout.wompi.co/p/",
  };
  // Evita usar llaves de producción en pruebas y al revés
  const prefijo = entorno === "produccion" ? "pub_prod_" : "pub_test_";
  cfg.habilitado = Boolean(cfg.publicKey && cfg.integritySecret && cfg.eventsSecret && cfg.publicKey.startsWith(prefijo));
  cfg.puedeBuscar = cfg.habilitado && cfg.privateKey.startsWith(entorno === "produccion" ? "prv_prod_" : "prv_test_");
  return cfg;
};

// Credenciales del servidor (.env): se usan cuando el negocio no tiene las suyas
export const configWompi = () => armarWompi({
  entorno: process.env.WOMPI_ENTORNO,
  publicKey: process.env.WOMPI_PUBLIC_KEY || "",
  integritySecret: process.env.WOMPI_INTEGRITY_SECRET || "",
  eventsSecret: process.env.WOMPI_EVENTS_SECRET || "",
  privateKey: process.env.WOMPI_PRIVATE_KEY || "",
}, "servidor");

export const armarWhatsapp = ({ token = "", telefonoId = "", version, idioma }, origen) => ({
  habilitado: Boolean(token && telefonoId),
  origen,
  token,
  telefonoId,
  version: version || "v21.0",
  idioma: idioma || "es",
});

export const configWhatsappServidor = () => armarWhatsapp({
  token: process.env.WHATSAPP_TOKEN || "",
  telefonoId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  version: process.env.WHATSAPP_API_VERSION,
  idioma: process.env.WHATSAPP_IDIOMA,
}, "servidor");
