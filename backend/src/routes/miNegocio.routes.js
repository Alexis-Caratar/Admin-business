import { Router } from "express";
import * as service from "../services/miNegocio.service.js";
import * as impresion from "../controllers/impresion.controller.js";
import { negocioConModulo, requierePermiso } from "../middlewares/auth.middleware.js";

// Mi negocio (Configuración): el negocio del token, nunca otro. authenticate en app.js.
const ctx = (req) => ({ id_negocio: req.user.id_negocio, user: req.user });
const r = (fn) => async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data: await fn(req) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message, errores: err.errores });
    console.error("Error mi negocio:", err);
    res.status(500).json({ ok: false, error: "No se pudo guardar el negocio" });
  }
};
const router = Router();
router.use(negocioConModulo("negocio"));
router.get("/", requierePermiso("negocio.ver"), r((req) => service.obtener(ctx(req))));
router.put("/datos", requierePermiso("negocio.editar"), r((req) => service.guardarDatos(req.body ?? {}, ctx(req))));
router.put("/sitio", requierePermiso("negocio.sitio"), r((req) => service.guardarSitio(req.body ?? {}, ctx(req))));
// Factura, ticket e impresión del propio negocio (mismos controladores de Negocios, con el negocio del token)
const propio = (fn) => (req, res) => { req.params.id = String(req.user.id_negocio); return fn(req, res); };
const imp = requierePermiso("negocio.impresion");
router.get("/impresion", imp, propio(impresion.obtener));
router.put("/impresion", imp, propio(impresion.guardar));
router.post("/impresion/token", imp, propio(impresion.token));
router.post("/impresion/prueba", imp, propio(impresion.prueba));
export default router;
