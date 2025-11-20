import { Router } from "express";
import {
  crearInventario,
  agregarDetalle,
  listarInventarios,
  obtenerInventario,
  eliminarInventario
} from "../controllers/inventarios.controller.js";

const router = Router();

// Crear inventario físico
router.post("/", crearInventario);

// Agregar detalle a un inventario
router.post("/:id/detalle", agregarDetalle);

// Listar inventarios
router.get("/", listarInventarios);

// Obtener inventario con detalles
router.get("/:id", obtenerInventario);

// Eliminar inventario
router.delete("/:id", eliminarInventario);

export default router;
