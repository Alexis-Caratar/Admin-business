import * as service from "../services/usuarios.service.js";

// Listar todos
export const listar = async (req, res) => {
  try {
    const { id_negocio } = req.query;

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
    const data = await service.crear(req.body);
    res.status(201).json(data);
  } catch (err) {
    console.error("ERROR crear usuario:", err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar usuario
export const actualizar = async (req, res) => {
  try {
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
    await service.eliminar(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("ERROR eliminar usuario:", err);
    res.status(500).json({ error: err.message });
  }
};
