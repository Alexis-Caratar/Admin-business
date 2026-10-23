// Módulos, perfiles y permisos por acción (sobre app_modulos / app_usuario_modulos existentes).
//
// · Un perfil agrupa acciones ("cajero.cobrar", "meseros.crear"…). Al asignarlo a un
//   usuario se sincronizan sus módulos (app_usuario_modulos), así el menú de siempre
//   sigue funcionando y solo muestra lo que el perfil permite.
// · Usuarios sin perfil: como antes (todas las acciones de los módulos asignados).
// · El perfil "Administrador" (es_admin) tiene siempre todas las acciones y no se
//   edita ni se borra; nadie puede quitarse a sí mismo la administración de permisos
//   ni dejar el negocio sin administradores.
import { pool } from "../config/db.js";
import { esAdminSistema, tienePermiso } from "../middlewares/auth.middleware.js";

const errorHttp = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });

const enTransaccion = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await fn(client);
    await client.query("COMMIT");
    return r;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const auditar = (client, { id_negocio, tabla, id_registro = null, accion, antes = null, despues = null, id_usuario = null }) =>
  client.query(
    `INSERT INTO app_auditoria (id_negocio, tabla, id_registro, accion, antes, despues, id_usuario) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id_negocio, tabla, id_registro, accion, antes && JSON.stringify(antes), despues && JSON.stringify(despues), id_usuario]
  );

// Perfiles por defecto (se crean la primera vez que el negocio abre esta sección)
const DEFECTO = [
  { nombre: "Cajero", descripcion: "Caja, cobro de mesas y comandas, egresos y pedidos web",
    acciones: ["home.ver", "cajero.ver", "cajero.abrir_caja", "cajero.cerrar_caja", "cajero.cobrar", "cajero.anular", "cajero.egresos", "pedidos.ver", "inventario.ver", "meseros.ver", "meseros.todas"] },
  { nombre: "Mesero", descripcion: "Toma pedidos en las mesas y envía las comandas",
    acciones: ["meseros.ver", "meseros.crear", "meseros.adicionar", "meseros.imprimir"] },
];

export const asegurarPerfiles = async (client, id_negocio) => {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext('app_perfiles'), $1)`, [id_negocio]);
  const { rows: [admin] } = await client.query(
    `INSERT INTO app_perfiles (id_negocio, nombre, descripcion, es_admin) VALUES ($1, 'Administrador', 'Todas las acciones de todos los módulos', true)
     ON CONFLICT (id_negocio) WHERE es_admin DO UPDATE SET es_admin = true RETURNING id`, [id_negocio]
  );
  // El administrador recibe siempre todas las acciones (también las de módulos nuevos)
  await client.query(
    `INSERT INTO app_perfiles_permisos (id_perfil, id_accion)
     SELECT $1, a.id FROM app_modulos_acciones a JOIN app_modulos m ON m.id = a.id_modulo AND NOT m.modulo_sistema
     ON CONFLICT DO NOTHING`, [admin.id]
  );
  const { rows: [{ n }] } = await client.query(`SELECT count(*)::int AS n FROM app_perfiles WHERE id_negocio = $1 AND NOT es_admin`, [id_negocio]);
  if (n === 0) {
    for (const p of DEFECTO) {
      const { rows: [pf] } = await client.query(
        `INSERT INTO app_perfiles (id_negocio, nombre, descripcion) VALUES ($1, $2, $3) ON CONFLICT (id_negocio, nombre) DO NOTHING RETURNING id`,
        [id_negocio, p.nombre, p.descripcion]
      );
      if (pf) await client.query(
        `INSERT INTO app_perfiles_permisos (id_perfil, id_accion)
         SELECT $1, a.id FROM app_modulos_acciones a JOIN app_modulos m ON m.id = a.id_modulo
         WHERE (m.url || '.' || a.codigo) = ANY($2) ON CONFLICT DO NOTHING`, [pf.id, p.acciones]
      );
    }
  }
  return admin.id;
};

/* ------------------------- Permisos del usuario ------------------------- */
// Lo que el frontend usa para mostrar u ocultar acciones (el backend valida igual)
export const misPermisos = async (user) => {
  if (esAdminSistema(user)) return { admin_sistema: true, perfil: null, modulos: {} };
  const { rows } = await pool.query(
    `SELECT m.url, a.codigo, pf.nombre AS perfil
     FROM app_usuario_modulos um
     JOIN app_modulos m ON m.id = um.id_modulo_negocio_rol AND m.activo
     JOIN app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = $2 AND mn.activo
     JOIN usuarios u ON u.id = um.id_usuario AND u.id_negocio = $2
     JOIN app_modulos_acciones a ON a.id_modulo = m.id
     LEFT JOIN app_perfiles pf ON pf.id = u.id_perfil
     WHERE um.id_usuario = $1 AND um.activo
       AND (u.id_perfil IS NULL OR (pf.activo AND EXISTS (SELECT 1 FROM app_perfiles_permisos pp WHERE pp.id_perfil = pf.id AND pp.id_accion = a.id)))
     ORDER BY m.orden, a.orden`, [user.id, user.id_negocio]
  );
  const modulos = {};
  for (const r of rows) (modulos[r.url] ??= []).push(r.codigo);
  return { admin_sistema: false, perfil: rows[0]?.perfil ?? null, modulos };
};

// Usuarios del negocio que hoy pueden administrar permisos (sin contar admin del sistema)
const administradores = async (client, id_negocio) => {
  const { rows } = await client.query(
    `SELECT DISTINCT u.id FROM usuarios u
     JOIN app_usuario_modulos um ON um.id_usuario = u.id AND um.activo
     JOIN app_modulos m ON m.id = um.id_modulo_negocio_rol AND m.url = 'permisos' AND m.activo
     JOIN app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = u.id_negocio AND mn.activo
     JOIN app_modulos_acciones a ON a.id_modulo = m.id AND a.codigo = 'administrar'
     LEFT JOIN app_perfiles pf ON pf.id = u.id_perfil
     WHERE u.id_negocio = $1
       AND (u.id_perfil IS NULL OR (pf.activo AND EXISTS (SELECT 1 FROM app_perfiles_permisos pp WHERE pp.id_perfil = pf.id AND pp.id_accion = a.id)))`,
    [id_negocio]
  );
  return rows.map((r) => r.id);
};

// Ejecuta un cambio y comprueba que no deje al negocio sin administradores ni
// quite la administración a quien lo hace (el admin del sistema queda exento)
const conProteccion = async (client, ctx, fn) => {
  const antes = await administradores(client, ctx.id_negocio);
  const r = await fn();
  const despues = await administradores(client, ctx.id_negocio);
  if (antes.length > 0 && despues.length === 0) throw errorHttp(409, "El negocio quedaría sin ningún administrador de permisos");
  if (!esAdminSistema(ctx.user) && antes.includes(ctx.user.id) && !despues.includes(ctx.user.id)) {
    throw errorHttp(409, "No puedes quitarte a ti mismo la administración de permisos");
  }
  return r;
};

// Los módulos del usuario quedan como los permita su perfil
const sincronizar = async (client, id_usuario, id_perfil, id_negocio) => {
  await client.query(
    `INSERT INTO app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo)
     SELECT DISTINCT $1::int, a.id_modulo, true FROM app_perfiles_permisos pp
     JOIN app_modulos_acciones a ON a.id = pp.id_accion
     JOIN app_modulos_negocio mn ON mn.id_modulo = a.id_modulo AND mn.id_negocio = $3 AND mn.activo
     WHERE pp.id_perfil = $2
     ON CONFLICT (id_usuario, id_modulo_negocio_rol) DO UPDATE SET activo = true, updated_at = now()`,
    [id_usuario, id_perfil, id_negocio]
  );
  await client.query(
    `UPDATE app_usuario_modulos um SET activo = false, updated_at = now()
     FROM app_modulos m
     WHERE um.id_usuario = $1 AND um.activo AND m.id = um.id_modulo_negocio_rol AND NOT m.modulo_sistema
       AND NOT EXISTS (SELECT 1 FROM app_perfiles_permisos pp JOIN app_modulos_acciones a ON a.id = pp.id_accion
                       WHERE pp.id_perfil = $2 AND a.id_modulo = m.id)`,
    [id_usuario, id_perfil]
  );
};

/* ------------------------------ Catálogo ------------------------------ */
export const catalogo = async ({ id_negocio }) => {
  const { rows } = await pool.query(
    `SELECT m.id, m.url, m.nombre, m.descripcion, m.icono, m.orden, m.grupo, m.activo, m.modulo_sistema,
            COALESCE(mn.activo, false) AS habilitado,
            COALESCE((SELECT json_agg(json_build_object('id', a.id, 'codigo', a.codigo, 'nombre', a.nombre) ORDER BY a.orden)
                      FROM app_modulos_acciones a WHERE a.id_modulo = m.id), '[]') AS acciones
     FROM app_modulos m LEFT JOIN app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = $1
     ORDER BY m.modulo_sistema, m.grupo NULLS LAST, m.orden, m.nombre`, [id_negocio]
  );
  return rows;
};

// Datos globales de un módulo (solo administración del sistema; la URL no se cambia)
export const guardarModulo = async (id, d, ctx) => {
  if (!esAdminSistema(ctx.user)) throw errorHttp(403, "Solo la administración del sistema edita el catálogo de módulos");
  return enTransaccion(async (client) => {
    const { rows: [antes] } = await client.query(`SELECT * FROM app_modulos WHERE id = $1 FOR UPDATE`, [id]);
    if (!antes) throw errorHttp(404, "Módulo no encontrado");
    const nombre = String(d.nombre ?? antes.nombre).trim().slice(0, 100);
    if (!nombre) throw errorHttp(400, "El nombre es obligatorio");
    const { rows: [m] } = await client.query(
      `UPDATE app_modulos SET nombre = $1, descripcion = $2, icono = $3, orden = $4, grupo = $5, activo = $6 WHERE id = $7 RETURNING *`,
      [nombre, d.descripcion === undefined ? antes.descripcion : String(d.descripcion ?? "").slice(0, 255) || null,
        d.icono === undefined ? antes.icono : String(d.icono ?? "").slice(0, 100) || null,
        Number.isInteger(Number(d.orden)) ? Number(d.orden) : antes.orden,
        d.grupo === undefined ? antes.grupo : String(d.grupo ?? "").slice(0, 40) || null,
        d.activo === undefined ? antes.activo : Boolean(d.activo), id]
    );
    await auditar(client, { id_negocio: null, tabla: "app_modulos", id_registro: id, accion: "EDITAR", antes, despues: m, id_usuario: ctx.user.id });
    return m;
  });
};

/* ------------------------------ Perfiles ------------------------------ */
export const perfiles = async (ctx) => {
  await enTransaccion((client) => asegurarPerfiles(client, ctx.id_negocio));
  const { rows } = await pool.query(
    `SELECT pf.id, pf.nombre, pf.descripcion, pf.es_admin, pf.activo,
            COALESCE((SELECT array_agg(pp.id_accion ORDER BY pp.id_accion) FROM app_perfiles_permisos pp WHERE pp.id_perfil = pf.id), '{}') AS acciones,
            (SELECT count(*)::int FROM usuarios u WHERE u.id_perfil = pf.id) AS usuarios
     FROM app_perfiles pf WHERE pf.id_negocio = $1 ORDER BY pf.es_admin DESC, pf.nombre`, [ctx.id_negocio]
  );
  return rows;
};

export const guardarPerfil = async (id, d, ctx) => enTransaccion(async (client) => {
  await asegurarPerfiles(client, ctx.id_negocio);
  const nombre = String(d.nombre ?? "").trim().slice(0, 60);
  if (!nombre) throw errorHttp(400, "El nombre del perfil es obligatorio");
  // Solo acciones de módulos habilitados en el negocio
  const ids = [...new Set((Array.isArray(d.acciones) ? d.acciones : []).map(Number).filter(Number.isInteger))];
  const { rows: validas } = await client.query(
    `SELECT a.id FROM app_modulos_acciones a JOIN app_modulos m ON m.id = a.id_modulo AND m.activo AND NOT m.modulo_sistema
     JOIN app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = $2 AND mn.activo WHERE a.id = ANY($1)`, [ids, ctx.id_negocio]
  );
  if (validas.length !== ids.length) throw errorHttp(400, "Hay acciones de módulos que no están habilitados en el negocio");
  const activo = d.activo === undefined ? true : Boolean(d.activo);

  return conProteccion(client, ctx, async () => {
    let antes = null, perfil;
    if (id) {
      const { rows: [p] } = await client.query(`SELECT * FROM app_perfiles WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, ctx.id_negocio]);
      if (!p) throw errorHttp(404, "Perfil no encontrado");
      if (p.es_admin) throw errorHttp(409, "El perfil Administrador tiene siempre todos los permisos y no se modifica");
      const { rows: acc } = await client.query(`SELECT id_accion FROM app_perfiles_permisos WHERE id_perfil = $1 ORDER BY 1`, [id]);
      antes = { ...p, acciones: acc.map((a) => a.id_accion) };
      ({ rows: [perfil] } = await client.query(
        `UPDATE app_perfiles SET nombre = $1, descripcion = $2, activo = $3 WHERE id = $4 RETURNING *`,
        [nombre, String(d.descripcion ?? "").slice(0, 255) || null, activo, id]
      ));
      await client.query(`DELETE FROM app_perfiles_permisos WHERE id_perfil = $1`, [id]);
    } else {
      ({ rows: [perfil] } = await client.query(
        `INSERT INTO app_perfiles (id_negocio, nombre, descripcion, activo) VALUES ($1, $2, $3, $4) RETURNING *`,
        [ctx.id_negocio, nombre, String(d.descripcion ?? "").slice(0, 255) || null, activo]
      ).catch((e) => { throw e.code === "23505" ? errorHttp(409, "Ya existe un perfil con ese nombre") : e; }));
    }
    if (ids.length) await client.query(`INSERT INTO app_perfiles_permisos (id_perfil, id_accion) SELECT $1, unnest($2::int[])`, [perfil.id, ids]);
    // Los usuarios con este perfil quedan con los módulos que ahora permite
    const { rows: us } = await client.query(`SELECT id FROM usuarios WHERE id_perfil = $1`, [perfil.id]);
    for (const u of us) await sincronizar(client, u.id, perfil.id, ctx.id_negocio);
    await auditar(client, { id_negocio: ctx.id_negocio, tabla: "app_perfiles", id_registro: perfil.id, accion: id ? "EDITAR" : "CREAR", antes, despues: { ...perfil, acciones: ids }, id_usuario: ctx.user.id });
    return { ...perfil, acciones: ids, usuarios: us.length };
  });
});

export const eliminarPerfil = async (id, ctx) => enTransaccion(async (client) => {
  const { rows: [p] } = await client.query(`SELECT * FROM app_perfiles WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, ctx.id_negocio]);
  if (!p) throw errorHttp(404, "Perfil no encontrado");
  if (p.es_admin) throw errorHttp(409, "El perfil Administrador no se puede eliminar");
  const { rows: [{ n }] } = await client.query(`SELECT count(*)::int AS n FROM usuarios WHERE id_perfil = $1`, [id]);
  if (n) throw errorHttp(409, `El perfil tiene ${n} usuario(s): asígnales otro perfil antes de eliminarlo`);
  await client.query(`DELETE FROM app_perfiles WHERE id = $1`, [id]);
  await auditar(client, { id_negocio: ctx.id_negocio, tabla: "app_perfiles", id_registro: id, accion: "ELIMINAR", antes: p, id_usuario: ctx.user.id });
  return { ok: true };
});

/* --------------------------- Usuarios y perfil --------------------------- */
export const usuarios = async (ctx) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.rol, u.id_perfil, pf.nombre AS perfil, TRIM(CONCAT(pe.nombres, ' ', pe.apellidos)) AS nombre,
            COALESCE((SELECT array_agg(m.url ORDER BY m.orden) FROM app_usuario_modulos um JOIN app_modulos m ON m.id = um.id_modulo_negocio_rol
                      WHERE um.id_usuario = u.id AND um.activo), '{}') AS modulos
     FROM usuarios u LEFT JOIN personas pe ON pe.id = u.id_persona LEFT JOIN app_perfiles pf ON pf.id = u.id_perfil
     WHERE u.id_negocio = $1 ORDER BY nombre`, [ctx.id_negocio]
  );
  return rows;
};

export const asignarPerfil = async (id_usuario, id_perfil, ctx) => enTransaccion(async (client) => {
  await asegurarPerfiles(client, ctx.id_negocio);
  const { rows: [u] } = await client.query(`SELECT id, id_perfil FROM usuarios WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id_usuario, ctx.id_negocio]);
  if (!u) throw errorHttp(404, "Usuario no encontrado en este negocio");
  let perfil = null;
  if (id_perfil) {
    ({ rows: [perfil] } = await client.query(`SELECT * FROM app_perfiles WHERE id = $1 AND id_negocio = $2`, [id_perfil, ctx.id_negocio]));
    if (!perfil || !perfil.activo) throw errorHttp(400, "Elige un perfil activo del negocio");
  }
  return conProteccion(client, ctx, async () => {
    await client.query(`UPDATE usuarios SET id_perfil = $1 WHERE id = $2`, [perfil?.id ?? null, u.id]);
    if (perfil) await sincronizar(client, u.id, perfil.id, ctx.id_negocio);
    await auditar(client, { id_negocio: ctx.id_negocio, tabla: "usuarios", id_registro: u.id, accion: "ASIGNAR_PERFIL", antes: { id_perfil: u.id_perfil }, despues: { id_perfil: perfil?.id ?? null, perfil: perfil?.nombre ?? null }, id_usuario: ctx.user.id });
    return { ok: true, id_usuario: u.id, id_perfil: perfil?.id ?? null };
  });
});

export const auditoria = async (ctx, f = {}) => {
  const { rows } = await pool.query(
    `SELECT a.id, a.created_at AS fecha, a.tabla, a.id_registro, a.accion, a.antes, a.despues,
            TRIM(CONCAT(pe.nombres, ' ', pe.apellidos)) AS usuario
     FROM app_auditoria a LEFT JOIN usuarios u ON u.id = a.id_usuario LEFT JOIN personas pe ON pe.id = u.id_persona
     WHERE (a.id_negocio = $1 OR (a.id_negocio IS NULL AND $2)) ORDER BY a.created_at DESC LIMIT $3`,
    [ctx.id_negocio, esAdminSistema(ctx.user), Math.min(Number(f.limite) || 300, 1000)]
  );
  return rows;
};

export { tienePermiso };
