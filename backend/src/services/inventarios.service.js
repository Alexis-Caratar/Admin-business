import { db } from "../config/db.js";


/** =========================================================
 *  CREAR INVENTARIO FÍSICO
 * ========================================================= */
export const crearInventario = async (body) => {
  const { id_persona , id_negocio , tipo, nombre  } = body;

  console.log("datos",body);
  
  const query = `
    INSERT INTO inventario_fisico (id_persona, id_negocio, tipo, nombre)
    VALUES (?, ?, ?, ?)
  `;

  const conn = await db.getConnection();
  try {

    console.log(query, [
      id_persona,
      id_negocio,
      tipo,
      nombre
    ]);
    
    const [result] = await conn.execute(query, [
      id_persona,
      id_negocio,
      tipo,
      nombre,
    ]);

    const insertedId = result.insertId;

    const [rows] = await conn.execute(
      "SELECT * FROM inventario_fisico WHERE id = ?",
      [insertedId]
    );

    return rows[0];
  } finally {
    conn.release();
  }
};

/** =========================================================
 *  AGREGAR DETALLE
 * ========================================================= */
export const agregarDetalle = async (idInventario, body) => {
  const {
    id_producto = null,
    id_activo = null,
    cantidad_sistema = 0,
    cantidad_fisica = 0,
    observacion = null,
  } = body;

  const query = `
    INSERT INTO inventario_fisico_detalles
    (id_inventario_fisico, id_producto, id_activo, cantidad_sistema, cantidad_fisica, observacion)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const conn = await db.getConnection();
  try {
    const [result] = await conn.execute(query, [
      idInventario,
      id_producto,
      id_activo,
      cantidad_sistema,
      cantidad_fisica,
      observacion,
    ]);

    const insertedId = result.insertId;

    const [rows] = await conn.execute(
      "SELECT * FROM inventario_fisico_detalles WHERE id = ?",
      [insertedId]
    );

    return rows[0];
  } finally {
    conn.release();
  }
};

/** =========================================================
 *  LISTAR INVENTARIOS
 * ========================================================= */
export const listarInventarios = async () => {
  const query = `
    SELECT *
    FROM inventario_fisico
    ORDER BY fecha DESC
  `;

  const [rows] = await db.execute(query);
  return rows;
};

/** =========================================================
 *  OBTENER INVENTARIO + DETALLES
 * ========================================================= */
export const obtenerInventario = async (id) => {
  const [inv] = await db.execute(
    "SELECT * FROM inventario_fisico WHERE id = ?",
    [id]
  );
  console.log("inv[0]");
  

  const [detalles] = await db.execute(
    "SELECT * FROM inventario_fisico_detalles ifd INNER JOIN productos p on ifd.id_producto=p.id WHERE id_inventario_fisico = ?",
    [id]
  );

  return {
    inventario: inv[0],
    detalles,
  };
};

/** =========================================================
 *  ELIMINAR INVENTARIO
 * ========================================================= */
export const eliminarInventario = async (id) => {
  await db.execute("DELETE FROM inventario_fisico WHERE id = ?", [id]);
};
