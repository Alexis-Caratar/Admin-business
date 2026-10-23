import { Router } from "express";
import * as c from "../controllers/tiqueteras.controller.js";
import { requiereModulo } from "../middlewares/auth.middleware.js";

// authenticate en app.js. Operación de caja: módulo Cajero (o Ventas).
// Configuración, anulación e historial: módulo Ventas (administración).
const router = Router();
const caja = requiereModulo(["cajero", "ventas"]);
const admin = requiereModulo("ventas");

router.get("/tipos", caja, c.tipos);
router.post("/tipos", admin, c.crearTipo);
router.put("/tipos/:id", admin, c.editarTipo);
router.get("/buscar", caja, c.buscar);
router.post("/", caja, c.vender);
router.post("/previsualizar", caja, c.previsualizar);
router.post("/consumir", caja, c.consumir);
router.get("/", admin, c.listar);
router.get("/historial", admin, c.historial);
router.post("/:id/anular", admin, c.anular);
router.get("/elegibilidad", admin, c.elegibilidad);
router.put("/elegibilidad", admin, c.guardarElegibilidad);

export default router;
