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


export const menus_negocio = async () => {
  
const [rows]= await db.query(
      `
SELECT m.* FROM app_modulos m
WHERE  m.activo = true
ORDER BY m.orden;`
  );
  
return rows;
};

export const modulos_usuario = async (id_negocio) => {
  
const [rows]= await db.query(
      `
SELECT m.*
FROM app_modulos m
JOIN app_modulos_negocio mn ON m.id = mn.id_modulo
WHERE mn.id_negocio = $1
  AND mn.activo=true
  AND m.activo = true
ORDER BY m.orden;`,
    [id_negocio]
  );
  
  
return rows;
};


export const modulos_usuariocrear = async (id, id_menu) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    // 🔥 Caso: si no mandan nada → desactiva todo
 if (!id_menu || id_menu.length === 0) {
  
  await client.query(
    `
    UPDATE app_modulos_negocio
    SET activo = false
    WHERE id_negocio = $1
    `,
    [id]
  );
  await client.query("COMMIT");
  return { ok: true };
}
    // 1. Desactivar los que no vienen
    await client.query(
      `
      UPDATE app_modulos_negocio
      SET activo = false
      WHERE id_negocio = $1
      AND id_modulo NOT IN (${id_menu.map((_, i) => `$${i + 2}`).join(",")})
      `,
      [id, ...id_menu]
    );

    // 2. Insertar o reactivar
    for (const menuId of id_menu) {
      await client.query(
        `
        INSERT INTO app_modulos_negocio (id_negocio,id_modulo,activo)
        VALUES ($1, $2, true)
        ON CONFLICT (id_negocio,id_modulo)
        DO UPDATE SET activo = true
        `,
        [id, menuId]
      );
    }

    await client.query("COMMIT");
    return { ok: true };
  } catch (error) {
    console.log("error",error);

    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};