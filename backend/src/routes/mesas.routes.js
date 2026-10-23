import { Router } from "express";
import * as c from "../controllers/comandas.controller.js";
import { negocioConModulo, requierePermiso } from "../middlewares/auth.middleware.js";

// Gestión de mesas (módulo Mesas). authenticate en app.js.
const router = Router();
router.use(negocioConModulo("mesas"));
router.get("/", requierePermiso("mesas.ver"), c.mesasListar);
router.post("/", requierePermiso("mesas.crear"), c.mesasCrear);
router.put("/:id", requierePermiso("mesas.editar"), c.mesasEditar);
router.put("/:id/activo", requierePermiso("mesas.desactivar"), c.mesasActivar);
export default router;
