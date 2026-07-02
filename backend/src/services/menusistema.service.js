// menusistema.service.js
import { db } from "../config/db.js";
export const listar = async (id_negocio, id_usuario) => {
  
  if(id_negocio !== "SISTEMA"){
    const [rows] = await db.query(
        `
        SELECT DISTINCT m.*
            FROM app_modulos m
            INNER JOIN app_modulos_negocio mn ON m.id = mn.id_modulo
            LEFT JOIN app_modulos_negocio_rol mr ON mn.id = mr.id_app_modulos_negocio
            INNER JOIN app_usuario_modulos um ON um.id_modulo_negocio_rol = m.id AND um.id_usuario = $2
            WHERE mn.id_negocio = $1
            and modulo_sistema =false
            and mn.activo=true
              AND m.activo = true
            AND  um.activo = true 
            ORDER BY m.orden;
        `,
        [id_negocio, id_usuario]
      );
      
    return rows;

      }else if (id_negocio === "SISTEMA") {

      const [rows] = await db.query(
        `
        SELECT DISTINCT m.*
            FROM usuarios_roles_sistema urs
            INNER JOIN app_modulos m
                ON m.modulo_sistema = TRUE
            WHERE urs.id_usuario = $1
              AND urs.estado = TRUE
              AND m.activo = TRUE
            ORDER BY m.orden;
        `,
        [id_usuario]
      );
      return rows;
      }
  
};