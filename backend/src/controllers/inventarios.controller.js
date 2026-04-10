import * as service from "../services/inventarios.service.js";

// LISTAR
export const listar = async (req, res) => {
  try {
    const data = await service.listar();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREAR
export const crear = async (req, res) => {
  try {
    const data = await service.crear(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ACTUALIZAR
export const actualizar = async (req, res) => {
  try {
    const data = await service.actualizar(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ELIMINAR
export const eliminar = async (req, res) => {
  try {
    await service.eliminar(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Crear movimiento
export const crearMovimiento = async (req, res) => {
  try {
    const data = await service.crearMovimiento(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar movimientos
export const listarMovimientos = async (req, res) => {
  try {
    const data = await service.listarMovimientos(req.params.inventario_id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar movimiento
export const eliminarMovimiento = async (req, res) => {
  try {
    await service.eliminarMovimiento(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};