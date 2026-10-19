import * as service from "../services/usuarios.service.js";
import { esAdminSistema, negocioPermitido } from "../middlewares/auth.middleware.js";

// El admin del sistema gestiona cualquier usuario; los demás solo los de su negocio
const puedeGestionar = async (req, id_usuario) =>
  esAdminSistema(req.user) || service.perteneceANegocio(id_usuario, req.user.id_negocio);

const noAutorizado = (res) => res.status(403).json({ error: "No autorizado" });

// Listar todos
export const listar = async (req, res) => {
  try {
    const id_negocio = negocioPermitido(req, req.query.id_negocio);

    if (!id_negocio) {
      return res.status(400).json({ error: "Falta el parámetro id_negocio" });
    }
    const data = await service.listar(id_negocio);

    res.json(data);

  } catch (err) {
    console.error("ERROR listar usuarios:", err);
    res.status(500).json({ error: err.message });
  }
};


// Obtener uno por ID
export const obtener = async (req, res) => {
  try {
    if (!(await puedeGestionar(req, req.params.id))) return noAutorizado(res);
    const data = await service.obtener(req.params.id);

    if (!data)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(data);
  } catch (err) {
    console.error("ERROR obtener usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

// Crear usuario
export const crear = async (req, res) => {
  try {
    const { persona, usuario } = req.body;
    if (!persona || !usuario) return res.status(400).json({ error: "persona y usuario son requeridos" });
    usuario.id_negocio = negocioPermitido(req, usuario.id_negocio);
    const data = await service.crear({ persona, usuario });
    res.status(201).json(data);
  } catch (err) {
    console.error("ERROR crear usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar usuario
export const actualizar = async (req, res) => {
  try {
    const id_usuario = req.body?.usuario?.id;
    if (!id_usuario) return res.status(400).json({ error: "usuario.id es requerido" });
    if (!(await puedeGestionar(req, id_usuario))) return noAutorizado(res);
    const data = await service.actualizar(req.body);
    res.json(data);
  } catch (err) {
    console.error("ERROR actualizar usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

// Eliminar usuario
export const eliminar = async (req, res) => {
  try {
    if (!(await puedeGestionar(req, req.params.id))) return noAutorizado(res);
    await service.eliminar(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR eliminar usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

export const menus_negocio= async (req, res) => {
  try {
   const data= await service.menus_negocio(negocioPermitido(req, req.params.id));
   res.json(data);
  } catch (err) {
    console.error("ERROR eliminar usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

export const modulos_usuario = async (req, res) => {
  try {
   if (!(await puedeGestionar(req, req.params.id))) return noAutorizado(res);
   const data= await service.modulos_usuario(req.params.id, negocioPermitido(req, req.params.idNegocio));
   res.json(data);
  } catch (err) {
    console.error("ERROR eliminar usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

export const modulos_usuariocrear = async (req, res) => {
  try {
    const { id, id_menu } = req.body;
    if (!(await puedeGestionar(req, id))) return noAutorizado(res);
   const data= await service.modulos_usuariocrear(id,id_menu);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }
};