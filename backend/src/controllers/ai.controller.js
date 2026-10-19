import { preguntarIA } from "../services/ai/ai.service.js";


export const chat = async (req, res) => {
  try {

    const { mensaje } = req.body;
    if (typeof mensaje !== "string" || !mensaje.trim()) {
      return res.status(400).json({ ok: false, error: "mensaje es requerido" });
    }
    const respuesta = await preguntarIA(mensaje, { id_negocio: req.user.id_negocio });

    res.json({
      ok: true,
      respuesta
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
};
