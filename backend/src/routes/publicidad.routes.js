import { Router } from "express";
import * as service from "../services/publicidad.service.js";
import { negocioConModulo, requierePermiso } from "../middlewares/auth.middleware.js";

// Publicidad (módulo 'publicidad'). authenticate en app.js; siempre el negocio del token.
const ctx = (req) => ({ id_negocio: req.user.id_negocio, id_usuario: req.user.id });
const r = (fn) => async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data: await fn(req) });
  } catch (err) {
    if (err.status && err.status < 600 && err.status !== 500) return res.status(err.status).json({ ok: false, error: err.message });
    console.error("Error publicidad:", err);
    res.status(500).json({ ok: false, error: "No se pudo procesar la publicidad" });
  }
};
const router = Router();
router.use(negocioConModulo("publicidad"));
const ver = requierePermiso("publicidad.ver");
const guardar = requierePermiso("publicidad.guardar");
router.get("/recursos", ver, r((req) => service.recursos(ctx(req))));
router.get("/", ver, r((req) => service.listar(ctx(req))));
router.post("/", guardar, r((req) => service.guardar(null, req.body ?? {}, ctx(req))));
router.put("/:id", guardar, r((req) => service.guardar(Number(req.params.id), req.body ?? {}, ctx(req))));
router.delete("/:id", guardar, r((req) => service.eliminar(Number(req.params.id), ctx(req))));
// Foto del negocio servida desde aquí (mismo origen de la API, con CORS) para dibujarla en el lienzo
router.get("/imagen", ver, async (req, res) => {
  try {
    const { tipo, buf } = await service.imagen(req.query.url, ctx(req));
    res.set("Content-Type", tipo).set("Cache-Control", "private, max-age=3600").send(buf);
  } catch (err) {
    res.status(err.status && err.status !== 500 ? err.status : 502).json({ ok: false, error: err.message });
  }
});
export default router;
