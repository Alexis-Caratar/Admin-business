import { db, pool } from "../config/db.js";
import bcrypt from "bcryptjs";

const TABLE = "usuarios";
const TABLE_PERSONAS = "personas";
const SALT_ROUNDS = 10;

// -----------------------------
// LISTAR
// -----------------------------
export const listar = async (id_negocio) => {
  const [rows] = await db.query(
    `
    SELECT 
     u.id as id_usuario,p.id as id_persona,u.rol,u.email,p.tipo_identificacion,p.identificacion,
      p.telefono,p.direccion,p.nombres,p.apellidos,u.imagen
    FROM usuarios u
    INNER JOIN negocios n ON u.id_negocio = n.id
    INNER JOIN personas p on u.id_persona=p.id
    WHERE u.id_negocio = $1
    order by u.id desc
    `,
    [id_negocio]
  );

  return rows;
};


// -----------------------------
// OBTENER
// -----------------------------
export const obtener = async (id) => {
  const [rows] = await db.query(
    `
    SELECT u.*, n.nombre AS nombre_negocio
    FROM usuarios u
    INNER JOIN negocios n ON u.id_negocio = n.id
    WHERE u.id = ?
  `,
    [id]
  );
  return rows[0];
};

// -----------------------------
// CREAR
// -----------------------------

export const crear = async (payload) => {
  const { persona, usuario } = payload;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ============================
    // VALIDACIONES
    // ============================
    if (!persona.identificacion || !persona.nombres || !persona.apellidos) {
      throw new Error("Los datos de la persona son obligatorios");
    }

    if (!usuario.rol) {
      throw new Error("El rol del usuario es obligatorio");
    }

    if (!usuario.email) {
      throw new Error("El email es obligatorio");
    }

    // ============================
    // VALIDAR EMAIL DUPLICADO
    // ============================
    const { rows: exists } = await client.query(
      `SELECT id FROM ${TABLE} WHERE email = $1`,
      [usuario.email]
    );

    if (exists.length > 0) {
      throw new Error("El email ya está registrado");
    }

    // ============================
    // PASSWORD
    // ============================
    if (usuario.password) {
      usuario.password = await bcrypt.hash(usuario.password, SALT_ROUNDS);
    }

    // ============================
    // IMAGEN DEFAULT
    // ============================
    const DEFAULT_AVATAR =
      "https://e7.pngegg.com/pngimages/340/946/png-clipart-avatar-user-computer-icons-software-developer-avatar-child-face-thumbnail.png";

    usuario.imagen = usuario.imagen || DEFAULT_AVATAR;

    // ============================
    // INSERT PERSONA
    // ============================
    const { rows: personaRows } = await client.query(
      `
      INSERT INTO ${TABLE_PERSONAS}
      (tipo_identificacion, identificacion, nombres, apellidos, telefono, direccion, fecha_creacion,email)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(),$7)
      RETURNING id
      `,
      [
        persona.tipo_identificacion,
        persona.identificacion,
        persona.nombres,
        persona.apellidos,
        persona.telefono,
        persona.direccion,
        persona.email
      ]
    );

    const id_persona = personaRows[0].id;

    // ============================
    // INSERT USUARIO
    // ============================
    const { rows: usuarioRows } = await client.query(
      `
      INSERT INTO ${TABLE}
      (email, password, rol, id_negocio, imagen, id_persona, fecha_creacion)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id
      `,
      [
        usuario.email,
        usuario.password,
        usuario.rol,
        usuario.id_negocio,
        usuario.imagen,
        id_persona,
      ]
    );

    await client.query("COMMIT");

    return {
      persona: { id: id_persona, ...persona },
      usuario: { id: usuarioRows[0].id, ...usuario },
    };

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creando usuario:", error);
    throw error;
  } finally {
    client.release();
  }
};


//crear personas

export const crearPersonaService = async (data) => {
  
  const { identificacion, nombres, apellidos, telefono, direccion } = data;

  // Validación simple para evitar "undefined"
  const valores = [
    identificacion ?? null,
    nombres ?? null,
    apellidos ?? null,
    telefono ?? null,
    direccion ?? null,
  ];

  const query = `
    INSERT INTO personas 
    (identificacion, nombres, apellidos, telefono, direccion)
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await db.query(query, valores);

  return {
    id: result.insertId,
    ...data
  };
};


// -----------------------------
// ACTUALIZAR
// -----------------------------
export const actualizar = async (payload) => {
  const { persona, usuario } = payload;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ================================
    // 1️⃣ Validar existencia
    // ================================
    const { rows: exist } = await client.query(
      `SELECT id, id_persona FROM ${TABLE} WHERE id = $1`,
      [usuario.id]
    );

    if (exist.length === 0) {
      throw new Error("El usuario no existe");
    }

    const id_usuario = usuario.id;
    const id_persona = exist[0].id_persona;

    // ================================
    // 2️⃣ Validar email duplicado
    // ================================
    if (usuario.email) {
      const { rows: checkEmail } = await client.query(
        `SELECT id FROM ${TABLE} WHERE email = $1 AND id <> $2`,
        [usuario.email, id_usuario]
      );

      if (checkEmail.length > 0) {
        throw new Error("El correo ya está registrado por otro usuario");
      }
    }

    // ================================
    // 3️⃣ Actualizar PERSONA (dinámico PG)
    // ================================
    if (persona && Object.keys(persona).length > 0) {
      const { id, ...personaClean } = persona;

      const keys = Object.keys(personaClean);
      const values = Object.values(personaClean);

      const setClause = keys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(", ");

      await client.query(
        `
        UPDATE ${TABLE_PERSONAS}
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        `,
        [...values, id_persona]
      );
    }

    // ================================
    // 4️⃣ Actualizar USUARIO
    // ================================
    if (usuario && Object.keys(usuario).length > 0) {
      const { id, ...usuarioClean } = usuario;

      // encriptar password si viene
      if (usuarioClean.password) {
        usuarioClean.password = await bcrypt.hash(
          usuarioClean.password,
          SALT_ROUNDS
        );
      }

      const keys = Object.keys(usuarioClean);
      const values = Object.values(usuarioClean);

      const setClause = keys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(", ");

      await client.query(
        `
        UPDATE ${TABLE}
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        `,
        [...values, id_usuario]
      );
    }

    await client.query("COMMIT");

    return {
      message: "Usuario actualizado correctamente",
    };

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error actualizando usuario:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const eliminar = async (id) => {
  await db.query(
    `DELETE FROM ${TABLE} WHERE id = $1`,
    [id]
  );
};


export const menus_negocio = async (id) => {
const [rows]= await db.query(
      `
SELECT m.*
FROM app_modulos m
JOIN app_modulos_negocio mn ON m.id = mn.id_modulo
WHERE mn.id_negocio = $1
  AND mn.activo=true
  AND m.activo = true
ORDER BY m.orden;`,
    [id]
  );
  console.log("rows negocio",rows);
  
return rows;
};


export const modulos_usuario = async (id,id_negocio) => {

const [rows]= await db.query(
      `
        SELECT DISTINCT m.*
        FROM app_modulos m
        INNER JOIN app_modulos_negocio mn ON m.id = mn.id_modulo
        INNER JOIN app_modulos_negocio_rol mr 
              ON mn.id = mr.id_app_modulos_negocio
        INNER JOIN app_usuario_modulos um
              ON um.id_modulo_negocio_rol = m.id AND um.id_usuario = $1
        WHERE mn.id_negocio = $2
          AND mn.activo=true
          AND m.activo = true
         AND  um.activo = true 
        ORDER BY m.orden;`,
    [id,id_negocio]
  );
  console.log("rows usuarios",rows);
  
return rows;
};

export const modulos_usuariocrear = async (id, id_menu) => {
  console.log("ingreso 2");
  const client = await pool.connect();
  
console.log("ingreso");

  try {
    await client.query("BEGIN");

    // 🔥 Caso: si no mandan nada → desactiva todo
 if (!id_menu || id_menu.length === 0) {
  console.log("ENTRADO AQUI");
  
  await client.query(
    `
    UPDATE app_usuario_modulos
    SET activo = false
    WHERE id_usuario = $1
    `,
    [id]
  );
  await client.query("COMMIT");
  return { ok: true };
}
    // 1. Desactivar los que no vienen
    await client.query(
      `
      UPDATE app_usuario_modulos
      SET activo = false
      WHERE id_usuario = $1
      AND id_modulo_negocio_rol NOT IN (${id_menu.map((_, i) => `$${i + 2}`).join(",")})
      `,
      [id, ...id_menu]
    );

    // 2. Insertar o reactivar
    for (const menuId of id_menu) {
      await client.query(
        `
        INSERT INTO app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo)
        VALUES ($1, $2, true)
        ON CONFLICT (id_usuario, id_modulo_negocio_rol)
        DO UPDATE SET activo = true
        `,
        [id, menuId]
      );
    }


console.log("salidad");

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