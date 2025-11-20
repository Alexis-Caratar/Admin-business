import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// No usar await en el top-level, solo crear el pool (no requiere await)
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});
