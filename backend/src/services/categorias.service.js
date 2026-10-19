import { db } from "../config/db.js";

export const obtenerCategorias = async (id_negocio) => {
  const [rows] = await db.query(
    "SELECT * FROM categorias WHERE id_negocio = $1 ORDER BY nombre Asc",
    [id_negocio]
  );
  return rows;
};

export const crearCategoriaService = async (data) => {
  const { id_negocio, nombre, descripcion, imagen, activo } = data;

  // 🧹 limpieza
  const cleanData = {
    id_negocio,
    nombre,
    descripcion: descripcion?.trim() || null,
    imagen: imagen?.trim() || null,
    activo: activo ?? true,
  };

  const [rows ] = await db.query(
    `
    INSERT INTO categorias (id_negocio, nombre, descripcion, imagen, activo)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      cleanData.id_negocio,
      cleanData.nombre,
      cleanData.descripcion,
      cleanData.imagen,
      cleanData.activo,
    ]
  );

  return rows[0];
};

export const actualizarCategoriaService = async (id, data, id_negocio = null) => {

  if (!id) {
    throw new Error("El id es obligatorio");
  }

  if (!data || Object.keys(data).length === 0) {
    throw new Error("No hay datos para actualizar");
  }

  // 🧹 LIMPIEZA
  // solo columnas editables
  const cleanData = {
    ...Object.fromEntries(
      ["nombre", "activo"].filter((k) => data[k] !== undefined).map((k) => [k, data[k]])
    ),
    descripcion: data.descripcion?.trim() || null,
    imagen: data.imagen?.trim() || "https://www.partoo.co/wp-content/uploads/2024/09/article_categories_GMB.png",
  };

  const keys = Object.keys(cleanData);
  const values = Object.values(cleanData);

  // armar SET dinámico
  const setClause = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");

  const [rows ] = await db.query(
    `
    UPDATE categorias
    SET ${setClause}
    WHERE id = $${keys.length + 1}
      AND ($${keys.length + 2}::int IS NULL OR id_negocio = $${keys.length + 2})
    RETURNING *
    `,
    [...values, id, id_negocio]
  );

  if (rows.length === 0) {
    throw new Error("Categoría no encontrada");
  }

  return rows[0];
};

export const eliminarCategoriaService = async (id, id_negocio = null) => {
  await db.query(
    "DELETE FROM categorias WHERE id = $1 AND ($2::int IS NULL OR id_negocio = $2)",
    [id, id_negocio]
  );
  return true;
};
