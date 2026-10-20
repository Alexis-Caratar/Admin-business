import * as service from "../services/sitio.service.js";

const responder = (fn, { cache = false } = {}) => async (req, res) => {
  try {
    if (cache) res.set("Cache-Control", "public, max-age=60");
    res.json({ ok: true, ...(await fn(req)) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message, errores: err.errores });
    console.error("Error sitio:", err);
    res.status(500).json({ ok: false, error: "No se pudo cargar el sitio" });
  }
};

// Públicas
export const porReferencia = responder((req) => service.sitioPublico(req.params.ref), { cache: true });
export const porDominio = responder((req) => service.sitioPorDominio(req.params.host), { cache: true });

// Admin del sistema
export const obtener = responder(async (req) => ({ data: await service.sitioAdmin(Number(req.params.id)) }));
export const tipos = responder(async () => ({ data: await service.tiposNegocio() }));
export const guardar = responder(async (req) => ({ data: await service.guardarSitio(Number(req.params.id), req.body) }));
