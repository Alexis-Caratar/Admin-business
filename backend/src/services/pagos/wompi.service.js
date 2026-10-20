// Integración con Wompi (Web Checkout + eventos firmados).
// Documentación: https://docs.wompi.co
import crypto from "crypto";
import { configWompi } from "../../config/tienda.js";

const sha256 = (texto) => crypto.createHash("sha256").update(texto).digest("hex");

const igualSeguro = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// Todas las funciones reciben la configuración del negocio (configNegocio().wompi);
// sin ella usan las credenciales del servidor (.env).

// Firma de integridad del checkout: SHA256(referencia + monto + moneda + secreto)
export const firmaIntegridad = (referencia, montoCentavos, moneda = "COP", cfg = configWompi()) =>
  sha256(`${referencia}${montoCentavos}${moneda}${cfg.integritySecret}`);

// El firewall de Wompi responde 403 si redirect-url apunta a localhost o a una IP
// privada, así que solo se envía cuando es una URL pública con HTTPS.
export const esUrlRetornoValida = (url) => {
  try {
    const { protocol, hostname } = new URL(url);
    const privada = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[?::1\]?$)/.test(hostname);
    return protocol === "https:" && !privada && hostname.includes(".");
  } catch {
    return false;
  }
};

let avisoRetorno = false;

// URL del Web Checkout. El monto y la firma los calcula el servidor.
export const urlCheckout = ({ referencia, montoCentavos, urlRetorno, email }, cfg = configWompi()) => {
  const params = new URLSearchParams({
    "public-key": cfg.publicKey,
    currency: "COP",
    "amount-in-cents": String(montoCentavos),
    reference: referencia,
    "signature:integrity": firmaIntegridad(referencia, montoCentavos, "COP", cfg),
  });
  if (esUrlRetornoValida(urlRetorno)) {
    params.set("redirect-url", urlRetorno);
  } else if (!avisoRetorno) {
    avisoRetorno = true;
    console.warn(`La URL de retorno de la tienda no es una URL pública HTTPS (${urlRetorno}): Wompi no redirigirá de vuelta a la tienda.`);
  }
  if (email) params.set("customer-data:email", email);
  return `${cfg.checkoutUrl}?${params.toString()}`;
};

const valorPorRuta = (obj, ruta) => ruta.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

// Verifica un evento: SHA256(valores de signature.properties + timestamp + secreto de eventos)
export const verificarEvento = (evento, cfg = configWompi()) => {
  const firma = evento?.signature;
  if (!firma?.checksum || !Array.isArray(firma.properties) || !evento.timestamp) return false;
  const concatenado =
    firma.properties.map((p) => String(valorPorRuta(evento.data, p) ?? "")).join("") +
    String(evento.timestamp) +
    cfg.eventsSecret;
  return Boolean(cfg.eventsSecret) && igualSeguro(sha256(concatenado).toLowerCase(), String(firma.checksum).toLowerCase());
};

// Consulta oficial del estado de una transacción (no requiere llave privada)
export const consultarTransaccion = async (idTransaccion, cfg = configWompi()) => {
  const res = await fetch(`${cfg.apiUrl}/transactions/${encodeURIComponent(idTransaccion)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Wompi respondió ${res.status}`);
  const json = await res.json();
  return json.data;
};

// Transacciones de una referencia (requiere la llave privada). La más reciente primero.
export const buscarPorReferencia = async (referencia, cfg = configWompi()) => {
  const res = await fetch(`${cfg.apiUrl}/transactions?reference=${encodeURIComponent(referencia)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${cfg.privateKey}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Wompi respondió ${res.status}`);
  const json = await res.json();
  return (json.data ?? []).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
};

// Estado de Wompi → estado de pago del pedido (null = sigue pendiente)
export const estadoPagoDesdeWompi = (status) =>
  ({ APPROVED: "APROBADO", DECLINED: "RECHAZADO", ERROR: "RECHAZADO", VOIDED: "ANULADO" })[status] ?? null;

// Solo se guardan datos no sensibles de la transacción
export const resumenTransaccion = (tx) => ({
  id: tx.id,
  status: tx.status,
  status_message: tx.status_message ?? null,
  payment_method_type: tx.payment_method_type ?? null,
  amount_in_cents: tx.amount_in_cents,
  currency: tx.currency,
  reference: tx.reference,
  created_at: tx.created_at ?? null,
  finalized_at: tx.finalized_at ?? null,
});

// Prueba de credenciales: el comercio de la llave pública existe en ese entorno
export const probarCredenciales = async (cfg) => {
  if (!cfg.publicKey) return { ok: false, mensaje: "Falta la llave pública" };
  const res = await fetch(`${cfg.apiUrl}/merchants/${encodeURIComponent(cfg.publicKey)}`, {
    headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, mensaje: json?.error?.reason ?? `Wompi respondió ${res.status}: revisa la llave pública y el entorno` };
  return { ok: true, comercio: json?.data?.name ?? null, mensaje: `Conectado con el comercio ${json?.data?.name ?? ""}`.trim() };
};
