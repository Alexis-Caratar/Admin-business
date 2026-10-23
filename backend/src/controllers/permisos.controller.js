import * as service from "../services/permisos.service.js";

const ctx = (req) => ({ id_negocio: req.user.id_negocio, user: req.user });
const r = (fn) => async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data: await fn(req) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message });
    console.error("Error permisos:", err);
    res.status(500).json({ ok: false, error: "No se pudo procesar la solicitud" });
  }
};

export const mios = r((req) => service.misPermisos(req.user));
export const catalogo = r((req) => service.catalogo(ctx(req)));
export const guardarModulo = r((req) => service.guardarModulo(Number(req.params.id), req.body ?? {}, ctx(req)));
export const perfiles = r((req) => service.perfiles(ctx(req)));
export const crearPerfil = r((req) => service.guardarPerfil(null, req.body ?? {}, ctx(req)));
export const editarPerfil = r((req) => service.guardarPerfil(Number(req.params.id), req.body ?? {}, ctx(req)));
export const eliminarPerfil = r((req) => service.eliminarPerfil(Number(req.params.id), ctx(req)));
export const usuarios = r((req) => service.usuarios(ctx(req)));
export const asignarPerfil = r((req) => service.asignarPerfil(Number(req.params.id), req.body?.id_perfil ? Number(req.body.id_perfil) : null, ctx(req)));
export const auditoria = r((req) => service.auditoria(ctx(req), req.query));
