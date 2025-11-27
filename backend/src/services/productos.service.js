import { db } from "../config/db.js";

const TABLE = "productos";

// Listar todos los productos
export const listar = async (id) => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE} where id_categoria=?`,
    [id]);
  return rows;
};

// Obtener un producto por ID
export const obtener = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM ${TABLE} WHERE id = ?`,
    [id]
  );
  return rows[0];
};

// Crear un producto
export const crear = async (payload) => {
  const keys = Object.keys(payload).join(", ");
  const placeholders = Object.keys(payload)
    .map(() => "?")
    .join(", ");

  const values = Object.values(payload);

  const sql = `INSERT INTO ${TABLE} (${keys}) VALUES (${placeholders})`;

  const [result] = await db.query(sql, values);

  return {
    id: result.insertId,
    ...payload
  };
};

// Actualizar un producto
export const actualizar = async (id, payload) => {
  const sets = Object.keys(payload)
    .map(key => `${key} = ?`)
    .join(", ");

  const values = Object.values(payload);

  const sql = `UPDATE ${TABLE} SET ${sets} WHERE id = ?`;

  await db.query(sql, [...values, id]);

  return {
    id,
    ...payload
  };
};

// Eliminar un producto
export const eliminar = async (id) => {
  await db.query(
    `DELETE FROM ${TABLE} WHERE id = ?`,
    [id]
  );
};
