import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  max: 10,
});

// Wrapper para simular mysql2
export const db = {
  query: async (text, params) => {
    const result = await pool.query(text, params);
    return [result.rows];
  }
};