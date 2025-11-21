import { db } from "../config/db.js";
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
    WHERE u.id_negocio = ?
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

  // Validar que la persona tenga identificacion, nombres y apellidos
  if (!persona.identificacion || !persona.nombres || !persona.apellidos) {
    const err = new Error("Los datos de la persona son obligatorios");
    err.status = 400;
    throw err;
  }

  // Validar que el usuario tenga rol
  if (!usuario.rol) {
    const err = new Error("El rol del usuario es obligatorio");
    err.status = 400;
    throw err;
  }

  // Validar email duplicado
  const [exists] = await db.query(
    `SELECT id FROM ${TABLE} WHERE email = ?`,
    [usuario.email]
  );

  if (exists.length > 0) {
    const err = new Error("El email ya está registrado");
    err.status = 400;
    throw err;
  }

  // Encriptar contraseña
  if (usuario.password) {
    usuario.password = await bcrypt.hash(usuario.password, SALT_ROUNDS);
  }

  // -----------------------------
  // 1️⃣ Insertar Persona
  // -----------------------------
  const personaKeys = Object.keys(persona).join(", ");
  const personaPlaceholders = Object.keys(persona).map(() => "?").join(", ");
  const personaValues = Object.values(persona);

  const sqlPersona = `INSERT INTO ${TABLE_PERSONAS} (${personaKeys}, fecha_creacion) VALUES (${personaPlaceholders}, NOW())`;

  const [personaResult] = await db.query(sqlPersona, personaValues);
  const id_persona = personaResult.insertId;

  // -----------------------------
  // 2️⃣ Insertar Usuario
  // -----------------------------
  const usuarioData = {
    ...usuario,
    id_persona,
  };

  const usuarioKeys = Object.keys(usuarioData).join(", ");
  const usuarioPlaceholders = Object.keys(usuarioData).map(() => "?").join(", ");
  const usuarioValues = Object.values(usuarioData);

  const sqlUsuario = `INSERT INTO ${TABLE} (${usuarioKeys}, fecha_creacion) VALUES (${usuarioPlaceholders}, NOW())`;

  const [usuarioResult] = await db.query(sqlUsuario, usuarioValues);

  return {
    persona: { id: id_persona, ...persona },
    usuario: { id: usuarioResult.insertId, ...usuarioData },
  };
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
  console.log("payload", payload);

  const { persona, usuario } = payload;

  // ================================
  // 1️⃣ Validar existencia del usuario
  // ================================
  const [exist] = await db.query(
    `SELECT id, id_persona FROM ${TABLE} WHERE id = ?`,
    [usuario.id]
  );

  if (exist.length === 0) {
    const err = new Error("El usuario no existe");
    err.status = 404;
    throw err;
  }

  const id_usuario = usuario.id;
  const id_persona = exist[0].id_persona;

  // ================================
  // 2️⃣ Validar email duplicado
  // ================================
  if (usuario.email) {
    const [checkEmail] = await db.query(
      `SELECT id FROM ${TABLE} WHERE email = ? AND id <> ?`,
      [usuario.email, id_usuario]
    );

    if (checkEmail.length > 0) {
      const err = new Error("El correo ya está registrado por otro usuario");
      err.status = 400;
      throw err;
    }
  }

  // ================================
  // 3️⃣ Actualizar Persona
  // ================================
  if (persona && Object.keys(persona).length > 0) {
    // eliminar ID para no actualizarlo
    const { id, ...personaClean } = persona;

    const personaFields = Object.keys(personaClean)
      .map((key) => `${key} = ?`)
      .join(", ");

    const personaValues = Object.values(personaClean);

    const sqlPersona = `
      UPDATE ${TABLE_PERSONAS}
      SET ${personaFields}
      WHERE id = ?
    `;

    console.log("SQL PERSONA:", sqlPersona, [...personaValues, id_persona]);

    await db.query(sqlPersona, [...personaValues, id_persona]);
  }

  // ================================
  // 4️⃣ Actualizar Usuario
  // ================================
  if (usuario && Object.keys(usuario).length > 0) {
    // eliminar campos que no deben actualizarse
    let { id, id_persona: ignore, ...usuarioClean } = usuario;

    // Si llega una contraseña, encriptar
    if (usuarioClean.password) {
      usuarioClean.password = await bcrypt.hash(
        usuarioClean.password,
        SALT_ROUNDS
      );
    }

    const usuarioFields = Object.keys(usuarioClean)
      .map((key) => `${key} = ?`)
      .join(", ");

    const usuarioValues = Object.values(usuarioClean);

    const sqlUsuario = `
      UPDATE ${TABLE}
      SET ${usuarioFields}
      WHERE id = ?
    `;

    console.log("SQL USUARIO:", sqlUsuario, [...usuarioValues, id_usuario]);

    await db.query(sqlUsuario, [...usuarioValues, id_usuario]);
  }

  return {
    mensaje: "Usuario actualizado correctamente",
    id_usuario,
    id_persona,
  };
};



// -----------------------------
// ELIMINAR
// -----------------------------
export const eliminar = async (id) => {
  await db.query(
    `DELETE FROM ${TABLE} WHERE id = ?`,
    [id]
  );
};
