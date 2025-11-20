import { db } from "../config/db.js";

const TABLE = "reservas";

// Listar todas las reservas
export const listar = async () => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE}`);
  return rows;
};

// Obtener una reserva por ID
export const obtener = async (id) => {
  const [rows] = await db.query(
    `SELECT * FROM ${TABLE} WHERE id = ?`,
    [id]
  );
  return rows[0];
};

// Crear una reserva
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

// Actualizar una reserva
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

// Eliminar una reserva
export const eliminar = async (id) => {
  await db.query(
    `DELETE FROM ${TABLE} WHERE id = ?`,
    [id]
  );
};
