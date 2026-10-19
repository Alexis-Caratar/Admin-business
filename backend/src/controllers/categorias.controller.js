import {
  obtenerCategorias,
  crearCategoriaService,
  actualizarCategoriaService,
  eliminarCategoriaService,
} from "../services/categorias.service.js";
import { esAdminSistema, negocioPermitido } from "../middlewares/auth.middleware.js";

// null = sin restricción (admin del sistema)
const negocioRestringido = (req) => (esAdminSistema(req.user) ? null : req.user.id_negocio);

export const getCategorias = async (req, res) => {
  try {
    const categorias = await obtenerCategorias(negocioPermitido(req, req.params.id_negocio));

    return res.json({
      ok: true,
      data: categorias,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error obteniendo categorías" });
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const categoria = await crearCategoriaService({ ...req.body, id_negocio: negocioPermitido(req, req.body.id_negocio) });

    return res.json({
      ok: true,
      data: categoria,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error creando categoría" });
  }
};

export const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await actualizarCategoriaService(id, req.body, negocioRestringido(req));

    return res.json({
      ok: true,
      data: categoria,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error actualizando categoría" });
  }
};

export const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await eliminarCategoriaService(id, negocioRestringido(req));

    return res.json({
      ok: true,
      data: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: "Error eliminando categoría" });
  }
};
