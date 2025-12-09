import { Router } from "express";
import * as CajeroController from "../controllers/cajero.controller.js";

const router = Router();

router.get("/productos", CajeroController.listarProductos);
router.post("/abrir-caja", CajeroController.abrirCaja);
router.post("/cerrar-caja", CajeroController.cerrarCaja);
router.post("/arqueo", CajeroController.arqueo);

export default router;
