// Arma los archivos SQL para producción a partir de migrations/.
// Uso: node scripts/armar-produccion.js
// Genera en produccion/:
//   actualizacion.sql  → todas las migraciones pendientes, en orden, en UNA transacción
//   reversion.sql      → las revierte en orden inverso (también en una transacción)
// Cada migración solo se aplica si no está en schema_migraciones (se puede
// ejecutar dos veces sin dañar nada). Si algo falla, no se aplica nada.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dirMig = path.join(raiz, "migrations");
const dirOut = path.join(raiz, "produccion");
const nombres = [...new Set(fs.readdirSync(dirMig).filter((f) => /^\d{3}_.+\.up\.sql$/.test(f)).map((f) => f.replace(/\.up\.sql$/, "")))].sort();
const fecha = new Date().toISOString().slice(0, 10);

const REGISTRO = `CREATE TABLE IF NOT EXISTS public.schema_migraciones (
    nombre character varying(100) PRIMARY KEY,
    aplicada_en timestamp without time zone NOT NULL DEFAULT now()
);`;

// Objeto que deja cada migración: si ya existe (aplicada antes a mano), solo se registra
const HUELLA = {
  "001_tienda_pedidos": "to_regclass('public.pedidos') IS NOT NULL",
  "002_sitio_negocios": "to_regclass('public.negocios_sitio') IS NOT NULL",
  "003_tipos_negocio": "to_regclass('public.tipos_negocio') IS NOT NULL",
  "004_inventario": "EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventario_caja' AND column_name = 'stock_apertura' AND data_type = 'numeric')",
  "005_whatsapp": "to_regclass('public.notificaciones_whatsapp') IS NOT NULL",
  "006_ficha_producto": "EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'productos' AND column_name = 'marca')",
  "007_integraciones": "to_regclass('public.negocios_integraciones') IS NOT NULL",
  "008_impresion": "to_regclass('public.negocios_impresion') IS NOT NULL",
};

// psql: \\if con el resultado de una consulta
const bloque = (nombre, sql, dir) => {
  if (dir === "down") {
    return `
-- ######################################################################
-- ${nombre} (down)
-- ######################################################################
SELECT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '${nombre}') AS pendiente \\gset
\\if :pendiente
\\echo '>> Revirtiendo ${nombre}'
${sql.trim()}

DELETE FROM public.schema_migraciones WHERE nombre = '${nombre}';
\\else
\\echo '-- ${nombre}: no estaba aplicada, se omite'
\\endif
`;
  }
  if (!HUELLA[nombre]) throw new Error(`Falta la huella de ${nombre} en HUELLA (scripts/armar-produccion.js)`);
  return `
-- ######################################################################
-- ${nombre} (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '${nombre}') AS pendiente,
       (${HUELLA[nombre]}) AS existe \\gset
\\if :pendiente
\\if :existe
\\echo '-- ${nombre}: sus cambios ya están en la base (aplicada antes), solo se registra'
\\else
\\echo '>> Aplicando ${nombre}'
${sql.trim()}

\\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('${nombre}');
\\else
\\echo '-- ${nombre}: ya estaba aplicada, se omite'
\\endif
`;
};

const encabezado = (titulo, uso) => `-- =====================================================================
-- ${titulo}
-- Generado: ${fecha} con node scripts/armar-produccion.js (no editar a mano)
-- Migraciones: ${nombres.join(", ")}
--
-- ${uso}
--
-- Todo va en UNA transacción: si algo falla, no se aplica nada.
-- =====================================================================
\\set ON_ERROR_STOP on
\\set QUIET on
SET client_min_messages = warning;
BEGIN;
${REGISTRO}
`;

const up = encabezado("ACTUALIZACIÓN DE LA BASE DE DATOS (producción)",
  "Uso: sudo -u postgres psql -d adminbusiness -f actualizacion.sql")
  + nombres.map((n) => bloque(n, fs.readFileSync(path.join(dirMig, `${n}.up.sql`), "utf8"), "up")).join("")
  + `\nCOMMIT;\n\\echo '== Actualización terminada. Migraciones aplicadas:'\n\\set QUIET off\nSELECT nombre, aplicada_en FROM public.schema_migraciones ORDER BY nombre;\n`;

const down = encabezado("REVERSIÓN DE LA ACTUALIZACIÓN (producción)",
  "Uso (solo si hay que deshacer): sudo -u postgres psql -d adminbusiness -f reversion.sql\n-- ATENCIÓN: borra pedidos web, configuración de sitios, credenciales e impresión.\n-- Antes, saca un respaldo con pg_dump.")
  + [...nombres].reverse().map((n) => bloque(n, fs.readFileSync(path.join(dirMig, `${n}.down.sql`), "utf8"), "down")).join("")
  + `\nCOMMIT;\n\\echo '== Reversión terminada.'\n`;

fs.mkdirSync(dirOut, { recursive: true });
fs.writeFileSync(path.join(dirOut, "actualizacion.sql"), up);
fs.writeFileSync(path.join(dirOut, "reversion.sql"), down);
console.log(`produccion/actualizacion.sql y produccion/reversion.sql generados (${nombres.length} migraciones)`);
