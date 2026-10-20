import * as service from "../services/integraciones.service.js";

// URL que se registra en el panel de Wompi (Desarrolladores > Eventos)
const urlWebhook = (req) => `${req.protocol}://${req.get("host")}/api/tienda/pagos/wompi/eventos`;

const responder = (fn) => async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data: await fn(req) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message, errores: err.errores });
    console.error("Error integraciones:", err.message);
    res.status(500).json({ ok: false, error: "No se pudo procesar la configuración" });
  }
};

export const obtener = responder((req) => service.obtener(Number(req.params.id), urlWebhook(req)));
export const guardar = responder((req) => service.guardar(Number(req.params.id), req.body, req.user?.id, urlWebhook(req)));
export const probar = responder((req) => service.probar(Number(req.params.id), req.params.tipo, req.body));
