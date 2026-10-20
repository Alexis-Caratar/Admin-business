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

// Columnas que se pueden enviar al crear un negocio
const CAMPOS_CREAR = ["nit", "nombre", "direccion", "descripcion", "telefono", "imagen", "ciudad", "correo",
  "horario", "hora_apertura", "hora_cierre", "tipo", "activo"];

// "Restaurante Punto Urbano" → "restaurante-punto-urbano"
const slug = (t) => String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "negocio";

// Crear un negocio (con su url_negocio única y su sitio web sin publicar)
export const crear = async (payload) => {
  if (!payload?.nombre?.trim()) {
    throw Object.assign(new Error("El nombre es obligatorio"), { status: 400 });
  }

  const datos = Object.fromEntries(
    CAMPOS_CREAR.filter((k) => payload[k] !== undefined).map((k) => [k, payload[k] === "" ? null : payload[k]])
  );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // url_negocio libre: base, base-2, base-3…
    const base = slug(payload.url_negocio || payload.nombre);
    const { rows: usadas } = await client.query(
      `SELECT url_negocio FROM ${TABLE} WHERE url_negocio = $1 OR url_negocio LIKE $1 || '-%'`,
      [base]
    );
    const ocupadas = new Set(usadas.map((r) => r.url_negocio));
    let url = base;
    for (let n = 2; ocupadas.has(url) || ["admin", "login", "tienda", "api", "assets", "public", "static"].includes(url); n++) url = `${base}-${n}`;
    datos.url_negocio = url;

    // Tipo de negocio (por nombre o código); sin coincidencia → "Otros"
    const { rows: [tipo] } = await client.query(
      `SELECT codigo, nombre, perfil FROM tipos_negocio
       WHERE nombre = $1 OR codigo = $1 UNION ALL SELECT codigo, nombre, perfil FROM tipos_negocio WHERE codigo = 'otros' LIMIT 1`,
      [payload.tipo_negocio || payload.tipo || ""]
    );
    datos.tipo_negocio = tipo.codigo;
    datos.tipo = tipo.nombre;

    const keys = Object.keys(datos);
    const { rows } = await client.query(
      `INSERT INTO ${TABLE} (${keys.join(", ")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
      Object.values(datos)
    );
    // El sitio arranca con los textos sugeridos para su tipo (sin publicar)
    const s = tipo.perfil?.sugeridos ?? {};
    const llenar = (v) => (typeof v === "string"
      ? v.replaceAll("{nombre}", rows[0].nombre).replaceAll("{ciudad}", rows[0].ciudad || "tu ciudad")
      : v);
    await client.query(
      `INSERT INTO negocios_sitio (id_negocio, nombre_publico, frases, nosotros_titulo, nosotros_texto, nosotros_items,
         franja_texto, servicios, mensaje_whatsapp, seo_titulo, seo_descripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id_negocio) DO NOTHING`,
      [rows[0].id, rows[0].nombre, JSON.stringify((s.frases ?? []).map(llenar)), llenar(s.nosotros_titulo) ?? null,
        llenar(s.nosotros_texto) ?? null, JSON.stringify((s.nosotros_items ?? []).map((i) => ({ titulo: i.titulo, texto: i.texto, foto: null }))),
        llenar(s.franja_texto) ?? null, llenar(s.servicios) ?? null, llenar(s.mensaje_whatsapp) ?? null,
        llenar(s.seo_titulo) ?? null, llenar(s.seo_descripcion) ?? null]
    );
    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if (err.code === "23505" && String(err.constraint).includes("nit")) {
      throw Object.assign(new Error("Ya existe un negocio con ese NIT"), { status: 409 });
    }
    throw err;
  } finally {
    client.release();
  }
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
      tipo = COALESCE((SELECT nombre FROM tipos_negocio WHERE nombre = $12 OR codigo = $12), 'Otros'),
      tipo_negocio = COALESCE((SELECT codigo FROM tipos_negocio WHERE nombre = $12 OR codigo = $12), 'otros'),
      activo=$13
    WHERE id = $14
    RETURNING *
    `,
    [nit,nombre, direccion, descripcion, telefono,imagen,ciudad,correo,horario,hora_apertura || null,hora_cierre || null,tipo,activo, id]
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