import * as service from "../services/comandas.service.js";
import * as mesas from "../services/mesas.service.js";
import { notificarMesas } from "../websockets.js";

const ctx = (req) => ({ id_negocio: req.user.id_negocio, id_usuario: req.user.id, user: req.user });
const clave = (req) => req.get("Idempotency-Key") || req.body?.clave || null;
const r = (fn) => async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data: await fn(req) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message, id_venta: err.id_venta });
    console.error("Error comandas/mesas:", err);
    res.status(500).json({ ok: false, error: "No se pudo procesar la comanda" });
  }
};

export const catalogo = r((req) => service.catalogo(ctx(req)));
export const mesasMesero = r((req) => service.mesas(ctx(req)));
export const listar = r((req) => service.listar(ctx(req), req.query));
export const detalle = r((req) => service.detalle(Number(req.params.id), ctx(req)));
export const crear = r((req) => service.crear(req.body ?? {}, ctx(req), clave(req)));
export const adicionar = r((req) => service.adicionar(Number(req.params.id), req.body ?? {}, ctx(req), clave(req)));
export const reimprimir = r((req) => service.reimprimir(Number(req.params.id), req.body ?? {}, ctx(req)));
export const anular = r((req) => service.anular(Number(req.params.id), req.body?.motivo, ctx(req)));
export const cobrar = r((req) => service.pasarACobro(Number(req.params.id), ctx(req)));

// Gestión de mesas (administración)
const conAviso = (fn) => async (req) => { const m = await fn(req); notificarMesas(req.user.id_negocio).catch(() => {}); return m; };
export const mesasListar = r((req) => mesas.listar(ctx(req)));
export const mesasCrear = r(conAviso((req) => mesas.crear(req.body ?? {}, ctx(req))));
export const mesasEditar = r(conAviso((req) => mesas.editar(Number(req.params.id), req.body ?? {}, ctx(req))));
export const mesasActivar = r(conAviso((req) => mesas.activar(Number(req.params.id), req.body?.activo !== false, ctx(req))));
