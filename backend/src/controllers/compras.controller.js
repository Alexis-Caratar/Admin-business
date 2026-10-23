import { ComprasService } from "../services/compras.service.js";

// Siempre el negocio del usuario (no el que mande el navegador)
const ctx = (req) => ({ id_negocio: req.user.id_negocio, id_usuario: req.user.id });

const responder = (fn) => async (req, res) => {
  try {
    res.json({ ok: true, ...(await fn(req)) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message, errores: err.errores });
    console.error("Error compras:", err);
    res.status(500).json({ ok: false, error: "No se pudo procesar la compra" });
  }
};

export const ComprasController = {
  listarCompras: responder(async (req) => ({ compras: await ComprasService.listarCompras(req.user.id_negocio, req.query) })),
  detalleCompra: responder(async (req) => ({ compra: await ComprasService.detalleCompra(Number(req.query.id_compra ?? req.params.id), req.user.id_negocio) })),
  crearCompra: responder(async (req) => ({ compra: await ComprasService.crearCompra(req.body, ctx(req)) })),
  pagar: responder(async (req) => ({ pago: await ComprasService.pagarCompra(Number(req.params.id), req.body, ctx(req)) })),
  anularPago: responder(async (req) => ComprasService.anularPago(Number(req.params.id), Number(req.params.id_pago), ctx(req))),
  anular: responder(async (req) => ComprasService.anularCompra(Number(req.params.id), req.body?.motivo, ctx(req))),
  proveedores: responder(async (req) => ({ proveedores: await ComprasService.proveedores(req.user.id_negocio, req.query.q) })),
  metodosPago: responder(async (req) => ({ metodos: await ComprasService.metodosPago(req.user.id_negocio) })),
};
