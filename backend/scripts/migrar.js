// Aplica o revierte migraciones SQL, cada una en su transacción, y las anota en
// schema_migraciones (el mismo registro que usa produccion/actualizacion.sql).
// Uso:
//   node scripts/migrar.js estado                 → qué migraciones están aplicadas
//   node scripts/migrar.js pendientes             → aplica todas las pendientes, en orden
//   node scripts/migrar.js up|down <nombre>       → una sola (ej: 001_tienda_pedidos)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../src/config/db.js";

const dirMig = path.join(path.dirname(fileURLToPath(import.meta.url)), "../migrations");
const todas = [...new Set(fs.readdirSync(dirMig).filter((f) => /^\d{3}_.+\.up\.sql$/.test(f)).map((f) => f.replace(/\.up\.sql$/, "")))].sort();
const [accion, nombre] = process.argv.slice(2);

const REGISTRO = `CREATE TABLE IF NOT EXISTS public.schema_migraciones (
  nombre character varying(100) PRIMARY KEY,
  aplicada_en timestamp without time zone NOT NULL DEFAULT now())`;

const aplicadas = async (client) => {
  await client.query(REGISTRO);
  return new Set((await client.query(`SELECT nombre FROM public.schema_migraciones`)).rows.map((r) => r.nombre));
};

const ejecutar = async (client, n, dir) => {
  const sql = fs.readFileSync(path.join(dirMig, `${n}.${dir}.sql`), "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    if (dir === "up") await client.query(`INSERT INTO public.schema_migraciones (nombre) VALUES ($1) ON CONFLICT DO NOTHING`, [n]);
    else await client.query(`DELETE FROM public.schema_migraciones WHERE nombre = $1`, [n]);
    await client.query("COMMIT");
    console.log(`Migración ${n} (${dir}) aplicada`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw Object.assign(err, { migracion: n });
  }
};

if (!["estado", "pendientes", "up", "down"].includes(accion) || (["up", "down"].includes(accion) && !nombre)) {
  console.error("Uso: node scripts/migrar.js estado | pendientes | up <nombre> | down <nombre>");
  process.exit(1);
}

const client = await pool.connect();
try {
  const hechas = await aplicadas(client);
  if (accion === "estado") {
    for (const n of todas) console.log(`${hechas.has(n) ? "aplicada " : "pendiente"}  ${n}`);
    if (!hechas.size) console.log("\n(Registro vacío: si la base ya tenía cambios aplicados a mano, usa produccion/actualizacion.sql, que los detecta y los registra.)");
  } else if (accion === "pendientes") {
    const faltan = todas.filter((n) => !hechas.has(n));
    if (!faltan.length) console.log("No hay migraciones pendientes");
    for (const n of faltan) await ejecutar(client, n, "up");
  } else {
    await ejecutar(client, nombre, accion);
  }
} catch (err) {
  console.error(`Error${err.migracion ? ` en ${err.migracion}` : ""}, no se aplicó esa migración:`, err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
