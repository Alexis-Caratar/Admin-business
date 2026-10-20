import { Router } from "express";
import * as controller from "../controllers/tienda.controller.js";
import { limitarPeticiones } from "../middlewares/rateLimit.middleware.js";

const router = Router();

const lectura = limitarPeticiones({ ventanaMs: 60_000, max: 120 });
// TIENDA_LIMITE_PEDIDOS: pedidos por IP cada 10 minutos (por defecto 15)
const escritura = limitarPeticiones({ ventanaMs: 10 * 60_000, max: Number(process.env.TIENDA_LIMITE_PEDIDOS) || 15, mensaje: "Demasiados pedidos seguidos, intenta en unos minutos" });

// Rutas públicas de la tienda web (sin token)
router.get("/:id_negocio/catalogo", lectura, controller.catalogo);
router.get("/:id_negocio/estado", lectura, controller.estado);
router.get("/:id_negocio/productos/:id", lectura, controller.producto);
router.post("/:id_negocio/pedidos", escritura, controller.crearPedido);
router.get("/pedidos/:codigo/:token", lectura, controller.consultarPedido);
router.post("/pedidos/:codigo/:token/pago", escritura, controller.reintentarPago);
router.post("/pagos/wompi/eventos", limitarPeticiones({ ventanaMs: 60_000, max: 300 }), controller.webhookWompi);

export default router;
