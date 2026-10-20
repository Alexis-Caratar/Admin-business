import { Router } from "express";
import * as controller from "../controllers/negocios.controller.js";
import { soloAdminSistema } from "../middlewares/auth.middleware.js";
import * as sitio from "../controllers/sitio.controller.js";
import * as integraciones from "../controllers/integraciones.controller.js";
import * as impresion from "../controllers/impresion.controller.js";
const router = Router();
// Gestión de negocios: solo administración del sistema
router.use(soloAdminSistema);
router.get("/", controller.listar);
router.get("/:id", controller.obtener);
router.post("/", controller.crear);
router.put("/:id", controller.actualizar);
router.delete("/:id", controller.eliminar);
// Sitio web del negocio (datos públicos, horarios, contenido y tienda)
router.get("/:id/sitio", sitio.obtener);
router.put("/:id/sitio", sitio.guardar);
// Pagos (Wompi), WhatsApp y ajustes de la tienda del negocio. Los secretos van cifrados.
router.get("/:id/integraciones", integraciones.obtener);
router.put("/:id/integraciones", integraciones.guardar);
router.post("/:id/integraciones/probar/:tipo", integraciones.probar);
// Impresión: formato de tickets, token del agente local, agentes conectados y prueba
router.get("/:id/impresion", impresion.obtener);
router.put("/:id/impresion", impresion.guardar);
router.post("/:id/impresion/token", impresion.token);
router.post("/:id/impresion/prueba", impresion.prueba);
router.post("/menusnegocio", controller.menus_negocio);
router.get("/menus_usuario/:idNegocio", controller.modulos_usuario);
router.post("/menus_usuariocrear", controller.modulos_usuariocrear);
export default router;
