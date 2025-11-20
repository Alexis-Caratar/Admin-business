// menusistema.service.js
import { db } from "../config/db.js";

export const listar = async (id_negocio, rol) => {
  const [rows] = await db.query(
    `SELECT m.*
     FROM app_modulos m
     JOIN app_modulos_negocio mn ON m.id = mn.id_modulo
     JOIN app_modulos_negocio_rol mr ON mn.id = mr.id_app_modulos_negocio
     WHERE mr.rol = ?
       AND mn.id_negocio = ?
       AND m.activo = 1
       AND mr.estado = 1
     ORDER BY m.orden`,
    [rol, id_negocio]
  );

  return rows;
};
