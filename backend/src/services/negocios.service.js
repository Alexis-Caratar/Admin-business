import { db, pool } from "../config/db.js";

const TABLE = "negocios";

// Listar todos los negocios
export const listar = async () => {
  const [rows] = await db.query(`SELECT id,nombre,direccion,descripcion,telefono,imagen FROM ${TABLE}`);
  return rows;
};

// Obtener negocio por ID
export const obtener = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM ${TABLE} WHERE id = ?`,
    [id]
  );
  return rows[0];
};

// Crear un negocio
export const crear = async (payload) => {
  if (!payload || Object.keys(payload).length === 0) {
    throw new Error("No hay datos para insertar");
  }

  // 🧹 LIMPIEZA DE DATOS
  const cleanPayload = {
    ...payload,
    imagen: payload.imagen?.trim() === "" ? null : payload.imagen,
  };

  const keys = Object.keys(cleanPayload);
  const values = Object.values(cleanPayload);

  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

  const sql = `
    INSERT INTO ${TABLE} (${keys.join(", ")})
    VALUES (${placeholders})
    RETURNING *
  `;

  const { rows } = await pool.query(sql, values);

  console.log("roes",rows);
  
  return rows[0];
};

// Actualizar negocio
export const actualizar = async (id, payload) => {
  const { nombre, direccion, descripcion, telefono,imagen } = payload;
  if (!id) {
    throw new Error("El id es obligatorio");
  }

  const  {rows}  = await pool.query(
    `
    UPDATE ${TABLE}
    SET 
      nombre = $1,
      direccion = $2,
      descripcion = $3,
      telefono = $4,
      imagen=$5
    WHERE id = $6
    RETURNING *
    `,
    [nombre, direccion, descripcion, telefono,imagen, id]
  );

  return rows[0];
};

// Eliminar negocio
export const eliminar = async (id) => {
  await db.query(
    `DELETE FROM ${TABLE} WHERE id = $1`,
    [id]
  );
};
