import { Router } from "express";
import { VentasController } from "../controllers/ventas.controller.js";

const router = Router();

router.get("/resumen", VentasController.resumeventa);
router.get("/listar", VentasController.listarVentas);


export default router;
