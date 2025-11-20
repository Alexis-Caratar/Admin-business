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
    req.user = payload; // Aquí guardamos los datos del usuario logueado
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expirado o inválido" });
  }
};
