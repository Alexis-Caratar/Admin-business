// Conexión del agente con el servidor (WebSocket).
// - Se registra con el token del negocio y el nombre de este punto de venta.
// - Recibe tickets ya armados ("imprimir_documento"), los imprime en la impresora
//   del rol pedido (factura o comanda) y confirma el resultado.
// - Sigue entendiendo los mensajes antiguos (imprimir_venta / imprimir_comanda).
const WebSocket = require("ws");
const { leer } = require("./config/agente");
const { construir } = require("./services/escpos");
const { enviar, usbDetectadas } = require("./services/salida");
const { imprimirFactura, imprimirComanda } = require("./services/imprimir.service.js");

const VERSION = "2.0.0";
let ws;
let intervaloEstado;
let espera = 5000;

const log = (...a) => console.log(new Date().toLocaleString("es-CO"), ...a);

// Impresoras de este punto para un rol ("todo" sirve para ambos)
const impresorasPara = (cfg, rol) => cfg.impresoras.filter((i) => i.rol === rol || i.rol === "todo");

function estado(cfg) {
  const usb = usbDetectadas();
  const impresoras = cfg.impresoras.map((i) => ({
    nombre: i.nombre, rol: i.rol, tipo: i.tipo || "usb",
    conectada: i.tipo === "red" ? null : usb.some((u) => u.vendorId === Number(i.vendorId) && u.productId === Number(i.productId)),
  }));
  const algunaUsb = impresoras.some((i) => i.conectada);
  return {
    ok: impresoras.length > 0 && (algunaUsb || impresoras.some((i) => i.tipo === "red")),
    status: impresoras.length === 0 ? "SIN_IMPRESORA" : algunaUsb || impresoras.some((i) => i.tipo === "red") ? "ONLINE" : "OFFLINE",
    connected: true,
    punto: cfg.punto,
    message: impresoras.length === 0 ? "Agente sin impresoras configuradas" : `${cfg.punto}: ${impresoras.map((i) => `${i.nombre} (${i.rol})`).join(", ")}`,
    impresoras,
  };
}

async function imprimirDocumento(cfg, msg) {
  const documento = msg.documento || {};
  const destino = impresorasPara(cfg, documento.rol || "factura");
  if (!destino.length) return { omitido: true, ok: false };
  const datos = construir(documento, { quitar_tildes: cfg.quitar_tildes !== false });
  const copias = Math.min(Math.max(Number(documento.copias) || 1, 1), 5);
  const errores = [];
  const usadas = [];
  for (const imp of destino) {
    try {
      for (let c = 0; c < copias; c++) await enviar(imp, datos);
      usadas.push(imp.nombre);
    } catch (e) {
      errores.push(`${imp.nombre}: ${e.message}`);
    }
  }
  return usadas.length ? { ok: true, impresora: `${cfg.punto} · ${usadas.join(", ")}` } : { ok: false, error: errores.join(" · ") };
}

function initWS() {
  const cfg = leer();
  if (!cfg.servidor || !cfg.token) {
    log("Falta configurar el servidor o el token. Ejecuta: npm run configurar");
    return setTimeout(initWS, 30000);
  }
  ws = new WebSocket(cfg.servidor);

  ws.on("open", () => {
    espera = 5000;
    log(`Conectado a ${cfg.servidor} como "${cfg.punto}" (${cfg.origen})`);
    ws.send(JSON.stringify({
      tipo: "register_agent", token: cfg.token, protocolo: 2, version: VERSION, punto: cfg.punto,
      impresoras: cfg.impresoras.map((i) => ({ nombre: i.nombre, rol: i.rol, tipo: i.tipo || "usb" })),
    }));
    const reportar = () => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ tipo: "estado_impresora", payload: estado(cfg) }));
    clearInterval(intervaloEstado);
    setTimeout(reportar, 500);
    intervaloEstado = setInterval(reportar, 60000);
  });

  ws.on("message", async (raw) => {
    let data;
    try { data = JSON.parse(raw.toString()); } catch { return; }
    try {
      if (data.tipo === "imprimir_documento") {
        const r = await imprimirDocumento(cfg, data);
        if (r.ok) log(`Impreso ${data.documento?.tipo} en ${r.impresora}`);
        else if (!r.omitido) log(`No se pudo imprimir ${data.documento?.tipo}: ${r.error}`);
        ws.send(JSON.stringify({ tipo: "resultado_impresion", id: data.id, ...r }));
      } else if (data.tipo === "imprimir_venta") {
        await imprimirFactura(data.payload);
      } else if (data.tipo === "imprimir_comanda") {
        await imprimirComanda(data.payload);
      } else if (data.tipo === "error") {
        log("Servidor:", data.message);
      }
    } catch (err) {
      log("Error al imprimir:", err.message);
      if (data.tipo === "imprimir_documento") ws.send(JSON.stringify({ tipo: "resultado_impresion", id: data.id, ok: false, error: err.message }));
    }
  });

  ws.on("close", (code) => {
    clearInterval(intervaloEstado);
    // 4003 = token revocado: hay que pegar el nuevo (npm run configurar)
    if (code === 4003 || code === 4001) log("El servidor rechazó el token del agente. Genera uno en Admin > Negocios > Impresión y ejecuta npm run configurar.");
    espera = code === 4003 || code === 4001 ? 60000 : Math.min(espera * 2, 60000);
    log(`Conexión cerrada (${code}). Reintentando en ${Math.round(espera / 1000)} s…`);
    setTimeout(initWS, espera);
  });

  ws.on("error", (err) => log("Error de conexión:", err.message));
}

initWS();

module.exports = { estado: () => estado(leer()), VERSION };
