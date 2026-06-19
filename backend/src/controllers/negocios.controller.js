import * as service from "../services/negocios.service.js";
export const listar = async (req, res) => {
  try { const data = await service.listar(); res.json(data); } catch (err) { res.status(500).json({ error: err.message }); }
};
export const obtener = async (req, res) => {
  try { const data = await service.obtener(req.params.id); if(!data) return res.status(404).json({ error: "No encontrado" }); res.json(data); } catch (err) { res.status(500).json({ error: err.message }); }
};
export const crear = async (req, res) => {
  try { const data = await service.crear(req.body); res.status(201).json(data); } catch (err) { res.status(500).json({ error: err.message }); }
};
export const actualizar = async (req, res) => {
  try { const data = await service.actualizar(req.params.id, req.body); res.json(data); } catch (err) { res.status(500).json({ error: err.message }); }
};
export const eliminar = async (req, res) => {
  try { await service.eliminar(req.params.id); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: err.message }); }
};

export const menus_negocio= async (req, res) => {
  
  try {
   const data= await service.menus_negocio();
   res.json(data);
  } catch (err) {
    console.error("ERROR eliminar usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

export const modulos_usuario = async (req, res) => {
  try {
   const data= await service.modulos_usuario(req.params.idNegocio);
   res.json(data);
  } catch (err) {
    console.error("ERROR eliminar usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

export const modulos_usuariocrear = async (req, res) => {
  try {
    const { id, id_menu } = req.body;
   const data= await service.modulos_usuariocrear(id,id_menu);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
};