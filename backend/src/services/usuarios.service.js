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
      u.rol,u.email,p.tipo_identificacion,p.identificacion,
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
export const actualizar = async (id, payload) => {
  const data = { ...payload };

  // Si viene nueva contraseña → encriptar
  if (data.password) {
    data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  // Si intenta cambiar el email → validar duplicado
  if (data.email) {
    const [exists] = await db.query(
      `SELECT id FROM ${TABLE} WHERE email = ? AND id != ?`,
      [data.email, id]
    );

    if (exists.length > 0) {
      const err = new Error("El email ya está en uso por otro usuario");
      err.status = 409;
      throw err;
    }
  }

  const sets = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");

  const values = Object.values(data);

  await db.query(
    `UPDATE ${TABLE} SET ${sets} WHERE id = ?`,
    [...values, id]
  );

  return {
    id,
    ...data
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
