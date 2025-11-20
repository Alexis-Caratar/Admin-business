import * as service from "../services/ventas.service.js";
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
