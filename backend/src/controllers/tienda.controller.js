import * as service from "../services/tienda.service.js";

// Errores con status propio (validación, tienda cerrada…) se devuelven tal cual;
// los inesperados no exponen detalles internos al público.
const responderError = (res, err) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ ok: false, error: err.message, errores: err.errores, id_producto: err.id_producto });
  }
  console.error("Error tienda:", err);
  return res.status(500).json({ ok: false, error: "No pudimos procesar la solicitud. Intenta de nuevo." });
};

export const catalogo = async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=30");
    res.json(await service.catalogo(await service.idNegocio(req.params.id_negocio)));
  } catch (err) { responderError(res, err); }
};

export const producto = async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=30");
    res.json(await service.detalleProducto(await service.idNegocio(req.params.id_negocio), req.params.id));
  } catch (err) { responderError(res, err); }
};

export const estado = async (req, res) => {
  try { res.json({ ok: true, tienda: await service.estadoTienda(await service.idNegocio(req.params.id_negocio)) }); }
  catch (err) { responderError(res, err); }
};

export const crearPedido = async (req, res) => {
  try {
    const pedido = await service.crearPedido(await service.idNegocio(req.params.id_negocio), req.body, req.get("Idempotency-Key"));
    res.status(pedido.repetido ? 200 : 201).json({ ok: true, pedido });
  } catch (err) { responderError(res, err); }
};

export const consultarPedido = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, pedido: await service.consultarPedido(req.params.codigo, req.params.token, req.query.id) });
  } catch (err) { responderError(res, err); }
};

export const reintentarPago = async (req, res) => {
  try { res.json({ ok: true, pago: await service.reintentarPago(req.params.codigo, req.params.token) }); }
  catch (err) { responderError(res, err); }
};

// Wompi reintenta si no recibe 200: solo se responde error ante firma inválida
export const webhookWompi = async (req, res) => {
  try {
    const r = await service.recibirEventoWompi(req.body);
    res.json({ ok: true, ...r });
  } catch (err) {
    if (err.status === 401) return res.status(401).json({ ok: false });
    console.error("Error webhook Wompi:", err);
    res.status(500).json({ ok: false });
  }
};
