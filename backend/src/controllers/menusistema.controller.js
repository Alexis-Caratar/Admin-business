import * as service from "../services/menusistema.service.js";
export const listar = async (req, res) => {
  try {
    const { id_negocio, id_usuario } = req.query; 
    console.log("req",req.query);
    
    const data = await service.listar(id_negocio, id_usuario);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

