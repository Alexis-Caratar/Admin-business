import { Router } from "express";
import { VentasController } from "../controllers/ventas.controller.js";

const router = Router();

router.post("/", VentasController.crearVenta);
router.get("/", VentasController.listarVentas);
router.get("/:id", VentasController.obtenerVenta);
router.delete("/:id", VentasController.eliminarVenta);

export default router;
