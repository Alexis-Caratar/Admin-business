import * as service from "../services/tiqueteras.service.js";
import { configImpresion, imprimirComanda } from "../services/impresion/impresion.service.js";

const ctx = (req) => ({ id_negocio: req.user.id_negocio, id_usuario: req.user.id });
const clave = (req) => req.get("Idempotency-Key") || req.body?.clave || null;
const r = (fn) => async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data: await fn(req) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message, errores: err.errores, disponibles: err.disponibles, requiere_metodo_resto: err.requiere_metodo_resto });
    console.error("Error tiqueteras:", err);
    res.status(500).json({ ok: false, error: err.code === "P0001" ? err.message : "No se pudo procesar la tiquetera" });
  }
};

export const tipos = r((req) => service.tipos(req.user.id_negocio));
export const crearTipo = r((req) => service.guardarTipo(null, req.body, ctx(req)));
export const editarTipo = r((req) => service.guardarTipo(Number(req.params.id), req.body, ctx(req)));
export const vender = r((req) => service.vender(req.body, ctx(req), clave(req)));
export const buscar = r((req) => service.buscar(req.query.q, ctx(req)));
export const previsualizar = r((req) => service.previsualizar(req.body, ctx(req)));
// Venta nueva desde el carrito: la comanda sale igual que en un cobro normal (nunca deshace el pago)
export const consumir = r(async (req) => {
  const resultado = await service.consumir(req.body, ctx(req), clave(req));
  const v = req.body?.venta;
  if (v && !req.body.id_venta && !resultado.repetido) {
    try {
      const cfg = await configImpresion(req.user.id_negocio);
      if (cfg.imprimir_comanda_al_vender) {
        resultado.impresion = await imprimirComanda(req.user.id_negocio, {
          numero: resultado.venta.numero_factura, mesa: v.mesa && v.mesa !== "N/A" ? v.mesa : null,
          mesero: v.nombre_vendedor, productos: v.productos ?? [], nota: v.nota,
        });
      }
    } catch (err) {
      console.error("Comanda no impresa:", err.message);
    }
  }
  return resultado;
});
export const listar = r((req) => service.listar(ctx(req), req.query));
export const historial = r((req) => service.historial(ctx(req), req.query));
export const anular = r((req) => service.anular(Number(req.params.id), req.body?.motivo, ctx(req)));
export const elegibilidad = r((req) => service.elegibilidad(ctx(req)));
export const guardarElegibilidad = r((req) => service.guardarElegibilidad(req.body, ctx(req)));
export const portal = r((req) => service.portal(req.params.token));
export const buscarPortal = r((req) => service.buscarPortal(req.body ?? {}));
