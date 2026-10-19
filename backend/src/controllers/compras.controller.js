import { ComprasService } from "../services/compras.service.js";
import { negocioPermitido } from "../middlewares/auth.middleware.js";

export const ComprasController = {

  crearCompra: async (req, res) => {
    try {

      const compra = await ComprasService.crearCompra({ ...req.body, id_negocio: negocioPermitido(req, req.body.id_negocio) });

      return res.json({
        ok: true,
        compra
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  },

  listarCompras: async (req, res) => {
    try {

      const compras = await ComprasService.listarCompras(
        negocioPermitido(req, req.query.id_negocio)
      );

      return res.json({
        ok: true,
        compras
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  },

  detalleCompra: async (req, res) => {
    try {

      const items = await ComprasService.detalleCompra(
        req.query.id_compra
      );

      return res.json({
        ok: true,
        items
      });

    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }

};