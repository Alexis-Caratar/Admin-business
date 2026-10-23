import { Router } from "express";
import { ComprasController } from "../controllers/compras.controller.js";
import { requiereModulo } from "../middlewares/auth.middleware.js";

const router = Router();
// authenticate se aplica en app.js; módulo Compras o Finanzas
// Compras o Ventas (las compras también se ven dentro de Ventas)
router.use(requiereModulo(["compras", "ventas", "finanzas"]));

router.get("/listar", ComprasController.listarCompras);
router.get("/detalle", ComprasController.detalleCompra);
router.get("/proveedores", ComprasController.proveedores);
router.get("/metodos-pago", ComprasController.metodosPago);
router.post("/crear", ComprasController.crearCompra);
router.get("/:id", ComprasController.detalleCompra);
router.post("/:id/pagos", ComprasController.pagar);
router.delete("/:id/pagos/:id_pago", ComprasController.anularPago);
router.post("/:id/anular", ComprasController.anular);

export default router;
