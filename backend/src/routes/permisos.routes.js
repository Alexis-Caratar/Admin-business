import { Router } from "express";
import * as c from "../controllers/permisos.controller.js";
import { negocioConModulo, requierePermiso } from "../middlewares/auth.middleware.js";

// authenticate en app.js. /mios lo usa cualquier usuario (para su propia interfaz).
const router = Router();
router.get("/mios", c.mios);
router.use(negocioConModulo("permisos"));
const ver = requierePermiso("permisos.ver");
const admin = requierePermiso("permisos.administrar");
router.get("/modulos", ver, c.catalogo);
router.put("/modulos/:id", admin, c.guardarModulo);          // además, solo admin del sistema (servicio)
router.get("/perfiles", ver, c.perfiles);
router.post("/perfiles", admin, c.crearPerfil);
router.put("/perfiles/:id", admin, c.editarPerfil);
router.delete("/perfiles/:id", admin, c.eliminarPerfil);
router.get("/usuarios", ver, c.usuarios);
router.put("/usuarios/:id/perfil", admin, c.asignarPerfil);
router.get("/auditoria", ver, c.auditoria);
export default router;
