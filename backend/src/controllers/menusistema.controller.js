import * as service from "../services/menusistema.service.js";
export const listar = async (req, res) => {
  try {
    // Contexto SISTEMA (validado por roles en el servicio) o el negocio del token
    const id_negocio = req.query.id_negocio === "SISTEMA" ? "SISTEMA" : req.user.id_negocio;
    const data = await service.listar(id_negocio, req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

