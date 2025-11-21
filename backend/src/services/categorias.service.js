import { db } from "../config/db.js";

export const obtenerCategorias = async (id_negocio) => {
  const [rows] = await db.query(
    "SELECT * FROM categorias WHERE id_negocio = ? ORDER BY id DESC",
    [id_negocio]
  );
  return rows;
};

export const crearCategoriaService = async (data) => {
  const { id_negocio, nombre, descripcion, imagen, activo } = data;
  const [result] = await db.query(
    `INSERT INTO categorias (id_negocio, nombre, descripcion, imagen, activo)
     VALUES (?, ?, ?, ?, ?)`,
    [id_negocio, nombre, descripcion || "", imagen || "", activo ?? 1]
  );

  const [categoria] = await db.query(
    "SELECT * FROM categorias WHERE id = ?",
    [result.insertId]
  );

  return categoria[0];
};

export const actualizarCategoriaService = async (id, data) => {
  await db.query("UPDATE categorias SET ? WHERE id = ?", [data, id]);

  const [categoria] = await db.query("SELECT * FROM categorias WHERE id = ?", [
    id,
  ]);

  return categoria[0];
};

export const eliminarCategoriaService = async (id) => {
  await db.query("DELETE FROM categorias WHERE id = ?", [id]);
  return true;
};
