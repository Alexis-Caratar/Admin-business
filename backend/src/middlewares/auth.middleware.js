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
export const requiereModulo = (urls) => async (req, res, next) => {
  const lista = Array.isArray(urls) ? urls : [urls];
  try {
    if (esAdminSistema(req.user)) return next();
    const { rows } = await pool.query(
      `SELECT 1 FROM app_usuario_modulos um
       JOIN app_modulos m ON m.id = um.id_modulo_negocio_rol AND m.url = ANY($2) AND m.activo
       JOIN app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = $3 AND mn.activo
       JOIN usuarios u ON u.id = um.id_usuario AND u.id_negocio = $3   -- el usuario debe ser de ese negocio
       WHERE um.id_usuario = $1 AND um.activo
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
export const negocioConModulo = (url) => async (req, res, next) => {
  try {
    if (esAdminSistema(req.user)) return next();
    const { rows } = await pool.query(
      `SELECT 1 FROM app_modulos m
       JOIN app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = $2 AND mn.activo
       WHERE m.url = $1 AND m.activo LIMIT 1`,
      [url, req.user.id_negocio]
    );
    if (!rows.length) return res.status(403).json({ ok: false, error: "El módulo no está activo para este negocio", modulo_inactivo: url });
    next();
  } catch (err) {
    next(err);
  }
};
