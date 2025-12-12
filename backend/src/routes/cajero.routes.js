import { Router } from "express";
import * as CajeroController from "../controllers/cajero.controller.js";

const router = Router();

router.post("/estado-caja", CajeroController.estadoCaja);
router.get("/productos", CajeroController.listarProductos);
router.post("/abrir-caja", CajeroController.abrirCaja);
router.post("/cerrar-caja", CajeroController.cerrarCaja);
router.post("/arqueo", CajeroController.arqueo);
router.post("/finalizar-venta", CajeroController.finalizarVenta);
router.post("/buscar-cliente", CajeroController.buscarCliente);
router.post("/mesas", CajeroController.mesas);




export default router;
