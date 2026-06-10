import { Router } from "express";
import { ComprasController } from "../controllers/compras.controller.js";

const router = Router();

router.get("/listar", ComprasController.listarCompras);
router.get("/detalle", ComprasController.detalleCompra);

router.post("/crear", ComprasController.crearCompra);

export default router;