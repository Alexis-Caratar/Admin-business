import { VentasService } from "../services/ventas.service.js";

export const VentasController = {
  
  crearVenta: async (req, res) => {
    try {
      const { venta, items } = req.body;

      const result = await VentasService.crearVenta(venta, items);
      return res.json(result);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  },

  listarVentas: async (req, res) => {
    try {
      const ventas = await VentasService.listarVentas();
      return res.json({ ok: true, ventas });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  },

  obtenerVenta: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await VentasService.obtenerVenta(id);
      return res.json({ ok: true, ...data });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  },

  eliminarVenta: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await VentasService.eliminarVenta(id);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  }
};
