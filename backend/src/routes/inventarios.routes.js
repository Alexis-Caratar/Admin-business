import { Router } from "express";
import * as controller from "../controllers/inventarios.controller.js";

const router = Router();

// Listar inventarios
router.get("/", controller.listar);

// Crear inventario
router.post("/", controller.crear);

// Actualizar inventario
router.put("/:id", controller.actualizar);

// Eliminar inventario
router.delete("/:id", controller.eliminar);

// Crear movimiento (compra / salida)
router.post("/movimientos", controller.crearMovimiento);

// Listar movimientos por inventario
router.get("/movimientos/:inventario_id", controller.listarMovimientos);

// Eliminar movimiento
router.delete("/movimientos/:id", controller.eliminarMovimiento);


export default router;