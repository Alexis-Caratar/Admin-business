import { Router } from "express";
import * as c from "../controllers/finanzas.controller.js";
import { negocioConModulo, requiereModulo } from "../middlewares/auth.middleware.js";

const router = Router();
// authenticate en app.js · Finanzas vive dentro del módulo Ventas: basta con tener Ventas
// (o el antiguo módulo Finanzas) activo en el negocio y asignado al usuario.
const MODULOS = ["ventas", "finanzas"];
router.use(negocioConModulo(MODULOS), requiereModulo(MODULOS));

router.get("/categorias", c.categorias);
router.post("/categorias", c.crearCategoria);

router.get("/gastos", c.listarGastos);
router.post("/gastos", c.crearGasto);
router.get("/gastos/:id", c.detalleGasto);
router.put("/gastos/:id", c.actualizarGasto);
router.post("/gastos/:id/anular", c.anularGasto);
router.post("/gastos/:id/pagos", c.pagarGasto);
router.delete("/gastos/:id/pagos/:id_pago", c.anularPagoGasto);

router.get("/recurrentes", c.listarRecurrentes);
router.post("/recurrentes", c.crearRecurrente);
router.put("/recurrentes/:id", c.actualizarRecurrente);
router.get("/recurrentes/proyeccion", c.proyeccion);
router.post("/recurrentes/causar", c.causarRecurrentes);

router.get("/egresos", c.listarEgresos);
router.post("/egresos/clasificar", c.clasificarEgresos);

router.get("/resumen", c.resumen);
router.get("/resultado", c.resultado);
router.get("/rentabilidad", c.rentabilidad);
router.get("/flujo", c.flujo);
router.get("/alertas", c.alertas);
router.get("/alertas/config", c.configAlertas);
router.put("/alertas/config", c.guardarAlertas);
router.get("/presupuestos", c.listarPresupuestos);
router.put("/presupuestos", c.guardarPresupuestos);

export default router;
