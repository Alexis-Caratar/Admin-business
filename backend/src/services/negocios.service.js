import { db } from "../config/db.js";

const TABLE = "negocios";

// Listar todos los negocios
export const listar = async () => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE}`);
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
  const keys = Object.keys(payload).join(", ");
  const placeholders = Object.keys(payload).map(() => "?").join(", ");
  const values = Object.values(payload);

  const sql = `INSERT INTO ${TABLE} (${keys}) VALUES (${placeholders})`;

  const [result] = await db.query(sql, values);

  return {
    id: result.insertId,
    ...payload
  };
};

// Actualizar negocio
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

// Eliminar negocio
export const eliminar = async (id) => {
  await db.query(
    `DELETE FROM ${TABLE} WHERE id = ?`,
    [id]
  );
};
