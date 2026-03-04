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
router.post("/detallesMesa", CajeroController.detallesMesa);
router.get("/egresos/:id_negocio/:id_caja", CajeroController.listarEgresos);
router.post("/egreso", CajeroController.crearEgreso);
router.put("/egreso/:id", CajeroController.actualizarEgreso);
router.delete("/egreso/:id", CajeroController.eliminarEgreso);
router.post("/actualizar_venta", CajeroController.actualizaventa);
router.get("/liberar_mesa/:id_mesa/:id_negocio", CajeroController.liberar_mesa);




export default router;
