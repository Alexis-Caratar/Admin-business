import * as service from "../services/impresion/impresion.service.js";

const responder = (fn) => async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data: await fn(req) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message, errores: err.errores });
    console.error("Error impresión:", err.message);
    res.status(500).json({ ok: false, error: "No se pudo procesar la impresión" });
  }
};

// URL del WebSocket a la que se conecta el agente (la misma del backend)
const urlWs = (req) => `${req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "wss" : "ws"}://${req.get("host")}`;

export const obtener = responder(async (req) => ({ ...(await service.obtenerAdmin(Number(req.params.id))), ws_url: urlWs(req) }));
export const guardar = responder(async (req) => ({ ...(await service.guardarAdmin(Number(req.params.id), req.body)), ws_url: urlWs(req) }));
export const token = responder(async (req) => ({ ...(await service.nuevoTokenAgente(Number(req.params.id))), ws_url: urlWs(req) }));
export const prueba = responder((req) => service.imprimirPrueba(Number(req.params.id), req.body?.rol));
