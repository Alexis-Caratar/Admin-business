import * as service from "../services/pedidos.service.js";

const responder = (fn) => async (req, res) => {
  try {
    res.json({ ok: true, data: await fn(req) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message });
    // Errores del trigger de inventario (stock insuficiente, producto mal configurado)
    if (err.code === "P0001") return res.status(409).json({ ok: false, error: err.message });
    console.error("Error pedidos:", err);
    res.status(500).json({ ok: false, error: "Error interno al procesar el pedido" });
  }
};

// Siempre el negocio del token: un usuario solo ve los pedidos de su negocio
export const resumen = responder((req) => service.resumen(req.user.id_negocio, req.query));
export const listar = responder((req) => service.listar(req.user.id_negocio, req.query));
export const detalle = responder((req) => service.detalle(Number(req.params.id), req.user.id_negocio));
export const cambiarEstado = responder((req) => service.cambiarEstado(Number(req.params.id), req.user.id_negocio, req.body, req.user));
export const registrarPago = responder((req) => service.registrarPago(Number(req.params.id), req.user.id_negocio, req.body, req.user));
export const agregarNota = responder((req) => service.agregarNota(Number(req.params.id), req.user.id_negocio, req.body?.nota, req.user));
export const imprimir = responder((req) => service.imprimir(Number(req.params.id), req.user.id_negocio, req.user));
