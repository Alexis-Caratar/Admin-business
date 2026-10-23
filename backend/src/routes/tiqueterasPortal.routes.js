import { Router } from "express";
import * as c from "../controllers/tiqueteras.controller.js";
import { limitarPeticiones } from "../middlewares/rateLimit.middleware.js";

// Portal público del cliente: solo con el enlace secreto o con código + documento
const router = Router();
router.get("/:token", limitarPeticiones({ ventanaMs: 60_000, max: 60 }), c.portal);
router.post("/buscar", limitarPeticiones({ ventanaMs: 10 * 60_000, max: 20, mensaje: "Demasiados intentos, espera unos minutos" }), c.buscarPortal);
export default router;
