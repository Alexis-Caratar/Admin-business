import * as InventarioService from "../services/inventarios.service.js";

// Crear inventario
export const crearInventario = async (req, res) => {
  try {
    const data = await InventarioService.crearInventario(req.body);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

// Agregar detalle
export const agregarDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await InventarioService.agregarDetalle(id, req.body);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

// Listar inventarios
export const listarInventarios = async (req, res) => {
  try {
    const data = await InventarioService.listarInventarios();
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

// Obtener inventario con detalles
export const obtenerInventario = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await InventarioService.obtenerInventario(id);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

// Eliminar inventario
export const eliminarInventario = async (req, res) => {
  try {
    const { id } = req.params;
    await InventarioService.eliminarInventario(id);
    res.json({ ok: true, msg: "Inventario eliminado" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
