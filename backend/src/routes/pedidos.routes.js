import { Router } from "express";
import * as controller from "../controllers/pedidos.controller.js";
import { negocioConModulo, requiereModulo } from "../middlewares/auth.middleware.js";

const router = Router();

// authenticate se aplica en app.js.
// Resumen administrativo: módulo "pedidos". Operación diaria: también desde "cajero".
const operacion = requiereModulo(["pedidos", "cajero"]);
// Primero: el negocio debe tener el módulo Pedidos activo (se activa como los demás menús)
router.use(negocioConModulo("pedidos"));
router.get("/resumen", requiereModulo("pedidos"), controller.resumen);
router.use(operacion);

router.get("/", controller.listar);
router.get("/:id", controller.detalle);
router.patch("/:id/estado", controller.cambiarEstado);
router.post("/:id/pago", controller.registrarPago);
router.post("/:id/notas", controller.agregarNota);
router.post("/:id/imprimir", controller.imprimir);

export default router;
