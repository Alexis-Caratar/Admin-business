import * as service from "../services/menusistema.service.js";
export const listar = async (req, res) => {
  try {
    const { id_negocio, rol } = req.query; 
    const data = await service.listar(id_negocio, rol);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

