// Límite simple de peticiones por IP (ventana fija, en memoria).
// Suficiente para un solo servidor; con varios habría que usar Redis.
export const limitarPeticiones = ({ ventanaMs, max, mensaje = "Demasiadas solicitudes, intenta en un momento" }) => {
  const contadores = new Map();
  setInterval(() => {
    const ahora = Date.now();
    for (const [ip, c] of contadores) if (c.reinicio <= ahora) contadores.delete(ip);
  }, ventanaMs).unref();

  return (req, res, next) => {
    const ahora = Date.now();
    const ip = req.ip;
    let c = contadores.get(ip);
    if (!c || c.reinicio <= ahora) {
      c = { total: 0, reinicio: ahora + ventanaMs };
      contadores.set(ip, c);
    }
    c.total += 1;
    if (c.total > max) {
      res.set("Retry-After", String(Math.ceil((c.reinicio - ahora) / 1000)));
      return res.status(429).json({ ok: false, error: mensaje });
    }
    next();
  };
};
