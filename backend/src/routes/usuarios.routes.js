import { Router } from "express";
import * as controller from "../controllers/usuarios.controller.js";
import { requierePermiso } from "../middlewares/auth.middleware.js";

// Antes cualquier usuario autenticado podía crear usuarios o asignarse módulos.
// Ahora exige el módulo Usuarios y su acción (además del negocio, en el controlador).
const router = Router();
const ver = requierePermiso("usuarios.ver");
const editar = requierePermiso("usuarios.editar");
router.get("/", ver, controller.listar);
router.get("/:id", ver, controller.obtener);
router.post("/", requierePermiso("usuarios.crear"), controller.crear);
router.put("/actualizar", editar, controller.actualizar);
router.delete("/:id", requierePermiso("usuarios.eliminar"), controller.eliminar);
router.get("/menusnegocio/:id", ver, controller.menus_negocio);
router.get("/menus_usuario/:id/:idNegocio", ver, controller.modulos_usuario);
router.post("/menus_usuariocrear", editar, controller.modulos_usuariocrear);
export default router;
