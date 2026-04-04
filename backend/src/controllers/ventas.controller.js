import { VentasService } from "../services/ventas.service.js";

export const VentasController = {

     resumeventa: async (req, res) => {    
    try {
      const ventas = await VentasService.resumenventas(req.query.id_negocio);
      return res.json({ ok: true, ventas });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  },

    listarVentas: async (req, res) => {    
    try {
      console.log("req query",req.query);
      
      const ventas = await VentasService.listarVentas(req.query.id_negocio,req.query.fecha);
      return res.json({ ok: true, ventas });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
  },



};
