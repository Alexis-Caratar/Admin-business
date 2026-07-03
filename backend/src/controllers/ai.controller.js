import { preguntarIA } from "../services/ai/ai.service.js";


export const chat = async (req, res) => {
  try {

    const { mensaje } = req.body;
    const respuesta = await preguntarIA(mensaje);

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
