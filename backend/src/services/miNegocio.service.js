// "Mi negocio": el administrador del negocio ve y ajusta sus datos y su página web
// (con permiso). La URL pública y el dominio los mantiene la administración del sistema.
import { pool } from "../config/db.js";
import { esAdminSistema } from "../middlewares/auth.middleware.js";
import * as sitio from "./sitio.service.js";
import { auditar } from "./permisos.service.js";

const errorHttp = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const texto = (v, max) => (v === null || v === undefined ? null : String(v).trim().slice(0, max) || null);

export const obtener = async (ctx) => {
  const data = await sitio.sitioAdmin(ctx.id_negocio);
  const { rows: [n] } = await pool.query(`SELECT descripcion, imagen, tipo FROM negocios WHERE id = $1`, [ctx.id_negocio]);
  return { ...data, descripcion: n?.descripcion ?? null, imagen: n?.imagen ?? null, tipo: n?.tipo ?? null, puede_cambiar_url: esAdminSistema(ctx.user) };
};

// Datos básicos (no el NIT, el tipo ni el estado: eso es de la administración del sistema)
export const guardarDatos = async (d, ctx) => {
  const nombre = texto(d.nombre, 150);
  if (!nombre) throw errorHttp(400, "El nombre del negocio es obligatorio", { errores: { nombre: "Obligatorio" } });
  const correo = texto(d.correo, 120);
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw errorHttp(400, "Correo no válido", { errores: { correo: "Correo no válido" } });
  const imagen = texto(d.imagen, 500);
  if (imagen && !/^https:\/\//i.test(imagen)) throw errorHttp(400, "La imagen debe ser un enlace https", { errores: { imagen: "Usa un enlace https" } });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: [antes] } = await client.query(`SELECT nombre, descripcion, telefono, direccion, ciudad, correo, imagen FROM negocios WHERE id = $1 FOR UPDATE`, [ctx.id_negocio]);
    if (!antes) throw errorHttp(404, "Negocio no encontrado");
    const { rows: [despues] } = await client.query(
      `UPDATE negocios SET nombre = $1, descripcion = $2, telefono = $3, direccion = $4, ciudad = $5, correo = $6, imagen = $7 WHERE id = $8
       RETURNING nombre, descripcion, telefono, direccion, ciudad, correo, imagen`,
      [nombre, texto(d.descripcion, 1000), texto(d.telefono, 40), texto(d.direccion, 200), texto(d.ciudad, 100), correo, imagen, ctx.id_negocio]
    );
    await auditar(client, { id_negocio: ctx.id_negocio, tabla: "negocios", id_registro: ctx.id_negocio, accion: "EDITAR_DATOS", antes, despues, id_usuario: ctx.user.id });
    await client.query("COMMIT");
    return obtener(ctx);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

// Página web: textos, fotos, horarios y tienda. URL y dominio se conservan (salvo admin del sistema).
export const guardarSitio = async (payload, ctx) => {
  const { rows: [n] } = await pool.query(`SELECT url_negocio, dominio FROM negocios WHERE id = $1`, [ctx.id_negocio]);
  if (!n) throw errorHttp(404, "Negocio no encontrado");
  const cuerpo = { ...payload, negocio: { ...(payload?.negocio ?? {}) } };
  if (!esAdminSistema(ctx.user)) { cuerpo.negocio.url_negocio = n.url_negocio; cuerpo.negocio.dominio = n.dominio; }
  const r = await sitio.guardarSitio(ctx.id_negocio, cuerpo);
  await auditar(pool, { id_negocio: ctx.id_negocio, tabla: "negocios_sitio", id_registro: ctx.id_negocio, accion: "EDITAR_SITIO", despues: { publicado: r?.publicado, tienda_activa: r?.tienda_activa }, id_usuario: ctx.user.id });
  return r;
};
