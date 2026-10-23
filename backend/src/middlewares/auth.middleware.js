import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token faltante" });

  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token inválido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Los tokens de agentes de impresión solo sirven para el WebSocket
    if (payload.tipo === "agente_impresion") {
      return res.status(401).json({ error: "Token inválido" });
    }
    req.user = payload; // Aquí guardamos los datos del usuario logueado
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expirado o inválido" });
  }
};

// Usuario con rol global (Administración del Sistema)
export const esAdminSistema = (user) =>
  Array.isArray(user?.roles_sistema) && user.roles_sistema.length > 0;

export const soloAdminSistema = (req, res, next) => {
  if (!esAdminSistema(req.user)) {
    return res.status(403).json({ error: "No autorizado" });
  }
  next();
};

// Negocio sobre el que puede operar el usuario: el admin del sistema puede
// elegir cualquiera, los demás siempre usan el de su token.
export const negocioPermitido = (req, solicitado) => {
  if (esAdminSistema(req.user) && solicitado && solicitado !== "SISTEMA") {
    return solicitado;
  }
  return req.user.id_negocio;
};

// Exige que el usuario tenga asignado el módulo (app_usuario_modulos), no solo
// que lo vea en el menú. Acepta uno o varios ("pedidos" o ["pedidos", "cajero"]).
// El admin del sistema pasa siempre.
// Con un perfil asignado (usuarios.id_perfil), el módulo cuenta solo si el perfil
// tiene alguna de sus acciones. Sin perfil, como siempre: basta con tenerlo asignado.
// (Nota: app_usuario_modulos.id_modulo_negocio_rol guarda el id de app_modulos.)
export const SQL_PERFIL_PERMITE_MODULO = `(u.id_perfil IS NULL
  OR NOT EXISTS (SELECT 1 FROM app_modulos_acciones a0 WHERE a0.id_modulo = m.id)
  OR EXISTS (SELECT 1 FROM app_perfiles_permisos pp JOIN app_modulos_acciones a ON a.id = pp.id_accion
             JOIN app_perfiles pf ON pf.id = pp.id_perfil AND pf.activo
             WHERE pp.id_perfil = u.id_perfil AND a.id_modulo = m.id))`;

export const requiereModulo = (urls) => async (req, res, next) => {
  const lista = Array.isArray(urls) ? urls : [urls];
  try {
    if (esAdminSistema(req.user)) return next();
    const { rows } = await pool.query(
      `SELECT 1 FROM app_usuario_modulos um
       JOIN app_modulos m ON m.id = um.id_modulo_negocio_rol AND m.url = ANY($2) AND m.activo
       JOIN app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = $3 AND mn.activo
       JOIN usuarios u ON u.id = um.id_usuario AND u.id_negocio = $3   -- el usuario debe ser de ese negocio
       WHERE um.id_usuario = $1 AND um.activo AND ${SQL_PERFIL_PERMITE_MODULO}
       LIMIT 1`,
      [req.user.id, lista, req.user.id_negocio]
    );
    if (!rows.length) return res.status(403).json({ ok: false, error: "No tienes acceso a este módulo" });
    next();
  } catch (err) {
    next(err);
  }
};

// El NEGOCIO debe tener el módulo activo (Admin > Negocios > módulos), igual que
// el menú. Así, si se desactiva Pedidos, tampoco se usa desde la caja.
// Acepta uno o varios módulos (basta con que el negocio tenga uno activo).
export const negocioConModulo = (urls) => async (req, res, next) => {
  const lista = Array.isArray(urls) ? urls : [urls];
  try {
    if (esAdminSistema(req.user)) return next();
    const { rows } = await pool.query(
      `SELECT 1 FROM app_modulos m
       JOIN app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = $2 AND mn.activo
       WHERE m.url = ANY($1) AND m.activo LIMIT 1`,
      [lista, req.user.id_negocio]
    );
    if (!rows.length) return res.status(403).json({ ok: false, error: "El módulo no está activo para este negocio", modulo_inactivo: lista[0] });
    next();
  } catch (err) {
    next(err);
  }
};

// Permiso por acción: "modulo.accion" (uno o varios; basta con uno).
// El módulo debe estar asignado al usuario y activo en su negocio; si el usuario
// tiene perfil, el perfil debe incluir la acción. Sin perfil: todas las acciones
// de sus módulos (compatibilidad con los usuarios de antes).
export const tienePermiso = async (user, permisos) => {
  if (esAdminSistema(user)) return true;
  const pares = (Array.isArray(permisos) ? permisos : [permisos]).map((p) => String(p).split("."));
  const { rows } = await pool.query(
    `SELECT 1 FROM app_usuario_modulos um
     JOIN app_modulos m ON m.id = um.id_modulo_negocio_rol AND m.activo
     JOIN app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = $2 AND mn.activo
     JOIN usuarios u ON u.id = um.id_usuario AND u.id_negocio = $2
     JOIN app_modulos_acciones a ON a.id_modulo = m.id
     JOIN unnest($3::text[], $4::text[]) AS p(modulo, accion) ON p.modulo = m.url AND p.accion = a.codigo
     LEFT JOIN app_perfiles pf ON pf.id = u.id_perfil
     WHERE um.id_usuario = $1 AND um.activo
       AND (u.id_perfil IS NULL OR (pf.activo AND EXISTS (SELECT 1 FROM app_perfiles_permisos pp WHERE pp.id_perfil = pf.id AND pp.id_accion = a.id)))
     LIMIT 1`,
    [user.id, user.id_negocio, pares.map((p) => p[0]), pares.map((p) => p[1])]
  );
  return rows.length > 0;
};

export const requierePermiso = (permisos) => async (req, res, next) => {
  try {
    if (await tienePermiso(req.user, permisos)) return next();
    return res.status(403).json({ ok: false, error: "No tienes permiso para esta acción", permiso: [].concat(permisos)[0] });
  } catch (err) {
    next(err);
  }
};
