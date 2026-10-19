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
