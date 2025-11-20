import { db } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const USERS_TABLE = "usuarios";
const SALT_ROUNDS = 10;

export const authService = {
  // Registro de usuario
  register: async ({ nombre, email, password, rol = "cliente", ...rest }) => {
    // Verificar si ya existe
    const [existing] = await db.query(
      `SELECT id FROM ${USERS_TABLE} WHERE email = ?`,
      [email]
    );

    if (existing.length > 0) {
      const error = new Error("El email ya está registrado");
      error.status = 409;
      throw error;
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const keys = ["nombre", "email", "password", "rol", ...Object.keys(rest)].join(", ");
    const valuesArr = [nombre, email, hashedPassword, rol, ...Object.values(rest)];
    const placeholders = valuesArr.map(() => "?").join(",");

    const sql = `INSERT INTO ${USERS_TABLE} (${keys}) VALUES (${placeholders})`;
    const [result] = await db.query(sql, valuesArr);

    return {
      id: result.insertId,
      nombre,
      email,
      rol,
      ...rest
    };
  },

  // Login
  login: async ({ email, password }) => {
    const [rows] = await db.query(
      `SELECT u.*, n.nombre AS nombre_negocio, p.id as id_persona,p.nombres as nombres_persona
       FROM ${USERS_TABLE} u
       LEFT JOIN negocios n ON u.id_negocio = n.id
       LEFT jOIN personas p On u.id_persona=p.id
       WHERE u.email = ?`,
      [email]
    );

    const user = rows[0];
    if (!user) {
      const error = new Error("Credenciales inválidas");
      error.status = 401;
      throw error;
    }

    // Comparar password con BCrypt
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      const error = new Error("Correo o contraseña incorrectos. Por favor verifica e intenta nuevamente.");
      error.status = 401;
      throw error;
    }

    const payload = {
      id: user.id,
      id_persona:user.id_persona,
      email: user.email,
      nombre: user.nombres_persona,
      rol: user.rol,
      id_negocio: user.id_negocio,
      nombre_negocio: user.nombre_negocio || "Mi Negocio",
      imagen: user.imagen || null
    };

    // Generar token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return { token, user: payload };
  }
};
