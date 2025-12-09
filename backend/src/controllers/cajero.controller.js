import CajeroService from "../services/cajero.service.js";

export const listarProductos = async (req, res) => {
  try {
    const productos = await CajeroService.listarProductos();
    return res.json({ ok: true, productos });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

export const abrirCaja = async (req, res) => {
  try {
    const result = await CajeroService.abrirCaja(req.body);
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

export const cerrarCaja = async (req, res) => {
  try {
    const result = await CajeroService.cerrarCaja(req.body);
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};

export const arqueo = async (req, res) => {
  try {
    const result = await CajeroService.arqueo(req.body);
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
