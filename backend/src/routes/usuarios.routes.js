import { Router } from "express";
import * as controller from "../controllers/usuarios.controller.js";
const router = Router();
router.get("/", controller.listar);
router.get("/:id", controller.obtener);
router.post("/", controller.crear);
router.put("/actualizar", controller.actualizar);
router.delete("/:id", controller.eliminar);
export default router;
