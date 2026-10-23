import { Router } from "express";
import * as CajeroController from "../controllers/cajero.controller.js";
import { requiereModulo, requierePermiso } from "../middlewares/auth.middleware.js";

// Antes cualquier usuario autenticado podía usar la caja. Ahora: módulo Cajero
// (o Ventas, que consulta facturas y arqueos desde la administración), y las
// operaciones de dinero exigen su acción. Los usuarios sin perfil conservan todas
// las acciones de sus módulos, así que nada cambia para ellos.
const router = Router();
router.use(requiereModulo(["cajero", "ventas"]));
const cobrar = requierePermiso("cajero.cobrar");

router.post("/estado-caja", CajeroController.estadoCaja);
router.get("/productos/:id", CajeroController.listarProductos);
router.post("/abrir-caja", requierePermiso("cajero.abrir_caja"), CajeroController.abrirCaja);
router.post("/cerrar-caja", requierePermiso("cajero.cerrar_caja"), CajeroController.cerrarCaja);
router.post("/arqueo", CajeroController.arqueo);
router.post("/finalizar-venta", cobrar, CajeroController.finalizarVenta);
router.post("/buscar-cliente", CajeroController.buscarCliente);
router.post("/crear_cliente", cobrar, CajeroController.crearcliente);
router.post("/mesas", CajeroController.mesas);
router.post("/detallesMesa", CajeroController.detallesMesa);
router.get("/egresos/:id_negocio/:id_caja", CajeroController.listarEgresos);
router.post("/egreso", requierePermiso("cajero.egresos"), CajeroController.crearEgreso);
router.put("/egreso/:id/", requierePermiso("cajero.egresos"), CajeroController.actualizarEgreso);
router.delete("/egreso/:id/:idUsuario", requierePermiso("cajero.egresos"), CajeroController.eliminarEgreso);
router.post("/actualizar_venta", cobrar, CajeroController.actualizaventa);
router.get("/liberar_mesa/:id_mesa/:id_negocio", requierePermiso(["cajero.cobrar", "mesas.editar"]), CajeroController.liberar_mesa);
router.post("/factura-por-caja",CajeroController.facturaPorCaja);
router.post("/factura-por-detalle",CajeroController.facturaPordetalle);
router.post("/imprimirfactura",CajeroController.imprimirfactura);
router.get("/preferencia-factura", CajeroController.preferenciaFactura);
router.post("/imprimirComanda",CajeroController.imprimir_comanda);
router.get("/ticket/:id_venta",CajeroController.ticketVenta);
router.post("/cancelarFactura", requierePermiso("cajero.anular"), CajeroController.cancelarFactura);
router.post("/obtener-inventario",CajeroController.obtenerInventario);
router.post("/guardar-inventario", requierePermiso(["cajero.abrir_caja", "cajero.cerrar_caja"]), CajeroController.guardarInventario);
router.post("/apiEliminarCaja", requiereModulo("ventas"), CajeroController.apiEliminarCaja);


export default router;
