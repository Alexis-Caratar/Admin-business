import { pool } from "../config/db.js";

const TABLE = "inventario";
const TABLE_MOV = "inventario_movimientos";

// LISTAR
export const listar = async () => {
  const { rows } = await pool.query(`
    SELECT *
    FROM ${TABLE}
    ORDER BY id DESC
  `);

  return rows;
};

// CREAR
export const crear = async (data) => {
  const {
    nombre,
    unidad,
    tipo,
    stock_actual,
    stock_minimo,
    stock_maximo,
    costo_unitario
  } = data;

  const { rows } = await pool.query(
    `
    INSERT INTO ${TABLE}
    (
      nombre,
      unidad,
      tipo,
      stock_actual,
      stock_minimo,
      stock_maximo,
      costo_unitario,
      estado,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
    RETURNING *
    `,
    [
      nombre,
      unidad,
      tipo,
      stock_actual,
      stock_minimo,
      stock_maximo,
      costo_unitario
    ]
  );

  return rows[0];
};
// ACTUALIZAR
export const actualizar = async (id, data) => {
  const {
    nombre,
    unidad,
    tipo,
    stock,
    stock_actual,
    stock_minimo,
    stock_maximo,
    costo_unitario,
    estado
  } = data;

  const { rows } = await pool.query(
    `
    UPDATE ${TABLE}
    SET
      nombre = $1,
      unidad = $2,
      tipo = $3,
      stock = $4,
      stock_actual = $5,
      stock_minimo = $6,
      stock_maximo = $7,
      costo_unitario = $8,
      estado = $9
    WHERE id = $10
    RETURNING *
    `,
    [
      nombre,
      unidad,
      tipo,
      Number(stock || 0),
      Number(stock_actual || 0),
      Number(stock_minimo || 0),
      Number(stock_maximo || 0),
      Number(costo_unitario || 0),
      estado,
      id
    ]
  );

  return rows[0];
};

// ELIMINAR
export const eliminar = async (id) => {
  await pool.query(
    `
    DELETE FROM ${TABLE}
    WHERE id = $1
    `,
    [id]
  );
};


// ✅ CREAR MOVIMIENTO (COMPRA / SALIDA)
export const crearMovimiento = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      inventario_id,
      tipo, // ENTRADA | SALIDA
      cantidad,
      observacion
    } = data;

    // 1. Insertar movimiento
    const { rows } = await client.query(
      `
      INSERT INTO ${TABLE_MOV}
      (inventario_id, tipo, cantidad, motivo)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [inventario_id, tipo, cantidad, observacion]
    );

    // 2. Actualizar stock
    const operador = tipo === "ENTRADA" ? "+" : "-";

    await client.query(
      `
      UPDATE ${TABLE}
      SET stock_actual = COALESCE(stock_actual, 0) ${operador} $1
      WHERE id = $2
      `,
      [cantidad, inventario_id]
    );

    await client.query("COMMIT");

    return rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// 📋 LISTAR MOVIMIENTOS
export const listarMovimientos = async (inventario_id) => {
  const { rows } = await pool.query(
    `
    SELECT 
      m.*,
      i.nombre,
      i.unidad
    FROM ${TABLE_MOV} m
    JOIN ${TABLE} i ON i.id = m.inventario_id
    WHERE m.inventario_id = $1
    ORDER BY m.created_at DESC
    `,
    [inventario_id]
  );

  return rows;
};

// ❌ ELIMINAR MOVIMIENTO (OPCIONAL: REVERSA STOCK)
export const eliminarMovimiento = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Obtener movimiento
    const { rows } = await client.query(
      `SELECT * FROM ${TABLE_MOV} WHERE id = $1`,
      [id]
    );

    const mov = rows[0];
    if (!mov) throw new Error("Movimiento no encontrado");

    // Revertir stock
    const operador = mov.tipo === "ENTRADA" ? "-" : "+";

    await client.query(
      `
      UPDATE ${TABLE}
      SET stock_actual = COALESCE(stock_actual, 0) ${operador} $1
      WHERE id = $2
      `,
      [mov.cantidad, mov.inventario_id]
    );

    // Eliminar movimiento
    await client.query(
      `DELETE FROM ${TABLE_MOV} WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};