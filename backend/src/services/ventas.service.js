import { db } from "../config/db.js";

const TABLE = "ventas";

// Listar todas las ventas
export const listar = async () => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE}`);
  return rows;
};

// Obtener venta por ID
export const obtener = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM ${TABLE} WHERE id = ?`,
    [id]
  );
  return rows[0];
};

// Crear venta
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

// Actualizar venta
export const actualizar = async (id, payload) => {
  const sets = Object.keys(payload)
    .map(k => `${k} = ?`)
    .join(", ");

  const values = Object.values(payload);

  await db.query(
    `UPDATE ${TABLE} SET ${sets} WHERE id = ?`,
    [...values, id]
  );

  return {
    id,
    ...payload
  };
};

// Eliminar venta
export const eliminar = async (id) => {
  await db.query(
    `DELETE FROM ${TABLE} WHERE id = ?`,
    [id]
  );
};
