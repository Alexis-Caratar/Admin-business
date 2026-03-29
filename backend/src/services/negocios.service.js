import { db, pool } from "../config/db.js";

const TABLE = "negocios";

// Listar todos los negocios
export const listar = async () => {
  const [rows] = await db.query(`SELECT * FROM ${TABLE}`);
  return rows;
};

// Obtener negocio por ID
export const obtener = async (id) => {
  const [rows] = await db.query(
    `SELECT 
    TO_CHAR(NOW() AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY HH12:MI:SS AM')::TEXT AS fecha_impresion, 
    * FROM ${TABLE} WHERE id = $1`,
    [id]
  );
  return rows[0];
};

// Crear un negocio
export const crear = async (payload) => {
  console.log("payload",payload);
  
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
  const { nit,nombre, direccion, descripcion, telefono,imagen,ciudad,correo,horario,hora_apertura,hora_cierre,tipo,activo } = payload;
  if (!id) {
    throw new Error("El id es obligatorio");
  }

  const  {rows}  = await pool.query(
    `
    UPDATE ${TABLE}
    SET 
      nit=$1,
      nombre = $2,
      direccion = $3,
      descripcion = $4,
      telefono = $5,
      imagen=$6,
      ciudad=$7,
      correo=$8,
      horario=$9,
      hora_apertura=$10,
      hora_cierre=$11,
      tipo=$12,
      activo=$13
    WHERE id = $14
    RETURNING *
    `,
    [nit,nombre, direccion, descripcion, telefono,imagen,ciudad,correo,horario,hora_apertura,hora_cierre,tipo,activo, id]
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
