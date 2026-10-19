import { Router } from "express";
import * as controller from "../controllers/negocios.controller.js";
import { soloAdminSistema } from "../middlewares/auth.middleware.js";
const router = Router();
// Gestión de negocios: solo administración del sistema
router.use(soloAdminSistema);
router.get("/", controller.listar);
router.get("/:id", controller.obtener);
router.post("/", controller.crear);
router.put("/:id", controller.actualizar);
router.delete("/:id", controller.eliminar);
router.post("/menusnegocio", controller.menus_negocio);
router.get("/menus_usuario/:idNegocio", controller.modulos_usuario);
router.post("/menus_usuariocrear", controller.modulos_usuariocrear);
export default router;
