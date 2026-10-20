import { Router } from "express";
import * as controller from "../controllers/sitio.controller.js";
import { limitarPeticiones } from "../middlewares/rateLimit.middleware.js";

const router = Router();
const lectura = limitarPeticiones({ ventanaMs: 60_000, max: 120 });

// Sitio público: por dominio (puntourbano.co) o por url_negocio / id
router.get("/dominio/:host", lectura, controller.porDominio);
router.get("/:ref", lectura, controller.porReferencia);

export default router;
