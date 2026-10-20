import * as service from "../services/inventarios.service.js";

// LISTAR
export const listar = async (req, res) => {
  try {
    
    const data = await service.listar(req.user.id_negocio);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// CREAR
export const crear = async (req, res) => {
  try {    
    const data = await service.crear(req.body,req.user.id_negocio);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ACTUALIZAR
export const actualizar = async (req, res) => {
  try {
    const data = await service.actualizar(req.params.id, req.body, req.user.id_negocio);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ELIMINAR
export const eliminar = async (req, res) => {
  try {
    await service.eliminar(req.params.id, req.user.id_negocio);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};


// Crear movimiento
export const crearMovimiento = async (req, res) => {
  try {
    const data = await service.crearMovimiento(req.body, req.user.id, req.user.id_negocio);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Listar movimientos
export const listarMovimientos = async (req, res) => {
  try {
    const data = await service.listarMovimientos(req.params.inventario_id, req.user.id_negocio);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Eliminar movimiento
export const eliminarMovimiento = async (req, res) => {
  try {
    await service.eliminarMovimiento(req.params.id, req.user.id_negocio);
    res.json({ ok: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};