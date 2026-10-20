import { pool } from "../config/db.js";

const TABLE = "inventario";
const TABLE_MOV = "inventario_movimientos";

// LISTAR
export const listar = async (id_negocio) => {
  const { rows } = await pool.query(`
    SELECT  id,
    nombre,
    unidad,
    costo_unitario,
    created_at,
    tipo,
    estado,
    stock_actual::int AS stock_actual,
    stock_minimo,
    stock_maximo,
    id_negocio
    FROM ${TABLE}
    where id_negocio=$1
    ORDER BY id DESC
  `,[id_negocio]);

  return rows;
};

// CREAR
export const crear = async (data,id_negocio) => {
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
      created_at,
      id_negocio
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(),$8 )
    RETURNING *
    `,
    [
      nombre,
      unidad,
      tipo,
      stock_actual,
      stock_minimo,
      stock_maximo,
      costo_unitario,
      id_negocio
    ]
  );

  return rows[0];
};
const errorHttp = (status, message) => Object.assign(new Error(message), { status });

// El ítem debe ser del negocio del usuario
const delNegocio = async (db, id, id_negocio, bloquear = false) => {
  const { rows: [i] } = await db.query(
    `SELECT * FROM ${TABLE} WHERE id = $1 AND id_negocio = $2 ${bloquear ? "FOR UPDATE" : ""}`,
    [id, id_negocio]
  );
  if (!i) throw errorHttp(404, "Ítem de inventario no encontrado");
  return i;
};

// ACTUALIZAR (datos del ítem). El stock NO se edita aquí: solo cambia con
// movimientos (entrada, salida, venta, conteo de caja), así queda auditado
// y no se pierden las ventas hechas mientras el formulario estaba abierto.
export const actualizar = async (id, data, id_negocio) => {
  const { nombre, unidad, tipo, stock_minimo, stock_maximo, costo_unitario, estado } = data;
  await delNegocio(pool, id, id_negocio);
  const { rows } = await pool.query(
    `
    UPDATE ${TABLE}
    SET
      nombre = $1,
      unidad = $2,
      tipo = $3,
      stock_minimo = $4,
      stock_maximo = $5,
      costo_unitario = $6,
      estado = $7
    WHERE id = $8
    RETURNING *
    `,
    [nombre, unidad, tipo, Number(stock_minimo || 0), Number(stock_maximo || 0), Number(costo_unitario || 0), estado, id]
  );
  return rows[0];
};

// ELIMINAR: no se permite si un producto o una receta lo usan
export const eliminar = async (id, id_negocio) => {
  await delNegocio(pool, id, id_negocio);
  const { rows: [uso] } = await pool.query(
    `SELECT
       (SELECT string_agg(nombre, ', ') FROM (SELECT nombre FROM productos WHERE inventario_id = $1 LIMIT 3) a) AS productos,
       (SELECT COUNT(*)::int FROM recetas WHERE inventario_id = $1) AS recetas,
       (SELECT COUNT(*)::int FROM inventario_caja WHERE id_producto = $1) AS conteos`,
    [id]
  );
  if (uso.productos) throw errorHttp(409, `No se puede eliminar: lo usan los productos ${uso.productos}`);
  if (uso.recetas > 0) throw errorHttp(409, "No se puede eliminar: es insumo de una receta");
  if (uso.conteos > 0) throw errorHttp(409, "No se puede eliminar: tiene conteos de caja. Desactívalo en su lugar");
  await pool.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
};

// ✅ CREAR MOVIMIENTO MANUAL (ENTRADA = compra/ingreso, SALIDA = merma/consumo)
export const crearMovimiento = async (data, id_usuario, id_negocio) => {
  const { inventario_id, tipo, cantidad, observacion } = data;
  const n = Number(cantidad);
  if (!["ENTRADA", "SALIDA"].includes(tipo)) throw errorHttp(400, "El tipo debe ser ENTRADA o SALIDA");
  if (!(n > 0)) throw errorHttp(400, "La cantidad debe ser mayor que cero");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const item = await delNegocio(client, inventario_id, id_negocio, true);
    if (tipo === "SALIDA" && Number(item.stock_actual) < n) {
      throw errorHttp(409, `No hay suficiente "${item.nombre}": disponible ${Number(item.stock_actual)}, salida ${n}`);
    }

    const { rows } = await client.query(
      `INSERT INTO ${TABLE_MOV} (inventario_id, tipo, cantidad, motivo, id_usuario)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [inventario_id, tipo, n, observacion || null, id_usuario]
    );
    await client.query(
      `UPDATE ${TABLE} SET stock_actual = COALESCE(stock_actual, 0) ${tipo === "ENTRADA" ? "+" : "-"} $1 WHERE id = $2`,
      [n, inventario_id]
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
export const listarMovimientos = async (inventario_id, id_negocio) => {
  await delNegocio(pool, inventario_id, id_negocio);
  const { rows } = await pool.query(
    `
    SELECT 
       m.id,
      m.inventario_id,
      m.tipo,
      m.cantidad,
      m.motivo,
      m.referencia,
      m.created_at,
      m.id_usuario,
      m.id_caja,
      m.id_venta,
      i.nombre,
      i.unidad,
      -- Solo los movimientos manuales se pueden eliminar
      (m.tipo IN ('ENTRADA', 'SALIDA') AND m.id_venta IS NULL AND m.id_caja IS NULL) AS eliminable
    FROM ${TABLE_MOV} m
    JOIN ${TABLE} i ON i.id = m.inventario_id
    WHERE m.inventario_id = $1
    ORDER BY m.created_at DESC
    `,
    [inventario_id]
  );

  return rows;
};

// ❌ ELIMINAR MOVIMIENTO MANUAL (revierte su efecto en el stock).
// Los de venta, anulación y conteo de caja no se borran: son el registro de lo ocurrido.
export const eliminarMovimiento = async (id, id_negocio) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: [mov] } = await client.query(`SELECT * FROM ${TABLE_MOV} WHERE id = $1 FOR UPDATE`, [id]);
    if (!mov) throw errorHttp(404, "Movimiento no encontrado");
    const item = await delNegocio(client, mov.inventario_id, id_negocio, true);
    if (!["ENTRADA", "SALIDA"].includes(mov.tipo) || mov.id_venta || mov.id_caja) {
      throw errorHttp(409, "Solo se pueden eliminar entradas y salidas manuales. Las ventas se anulan cancelando la factura.");
    }
    // Quitar una entrada no puede dejar el stock en negativo
    if (mov.tipo === "ENTRADA" && Number(item.stock_actual) < Number(mov.cantidad)) {
      throw errorHttp(409, `No se puede eliminar: "${item.nombre}" ya no tiene esas unidades (stock ${Number(item.stock_actual)})`);
    }
    await client.query(
      `UPDATE ${TABLE} SET stock_actual = COALESCE(stock_actual, 0) ${mov.tipo === "ENTRADA" ? "-" : "+"} $1 WHERE id = $2`,
      [mov.cantidad, mov.inventario_id]
    );
    await client.query(`DELETE FROM ${TABLE_MOV} WHERE id = $1`, [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
