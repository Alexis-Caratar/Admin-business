import { db } from "../config/db.js";

export const VentasService = {
  // Crear una venta con sus items
  crearVenta: async (venta, items) => {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // Insertar venta
      const [ventaResult] = await conn.query(
        `INSERT INTO ventas (
          id_negocio, id_cliente, fecha, subtotal, descuento, 
          descuento_porcentaje, impuesto, total, estado, metodo_pago, nota
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          venta.id_negocio,
          venta.id_cliente,
          venta.subtotal,
          venta.descuento,
          venta.descuento_porcentaje,
          venta.impuesto,
          venta.total,
          venta.estado,
          venta.metodo_pago,
          venta.nota
        ]
      );

      const idVentaGenerado = ventaResult.insertId;

      // Insertar items
      for (const item of items) {
        await conn.query(
          `INSERT INTO ventas_items (
            id_venta, id_producto, cantidad, precio_unitario, descuento,
            descuento_porcentaje, impuesto, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idVentaGenerado,
            item.id_producto,
            item.cantidad,
            item.precio_unitario,
            item.descuento,
            item.descuento_porcentaje,
            item.impuesto,
            item.subtotal
          ]
        );
      }

      await conn.commit();
      return { ok: true, id_venta: idVentaGenerado };

    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  // Obtener todas las ventas
  listarVentas: async () => {
    const [rows] = await db.query(
      `SELECT * FROM ventas ORDER BY fecha DESC`
    );
    return rows;
  },

  // Obtener una venta con sus items
  obtenerVenta: async (id) => {
    const [[venta]] = await db.query(
      `SELECT * FROM ventas WHERE id = ?`,
      [id]
    );

    const [items] = await db.query(
      `SELECT * FROM ventas_items WHERE id_venta = ?`,
      [id]
    );

    return { venta, items };
  },

  // Eliminar una venta
  eliminarVenta: async (id) => {
    await db.query(`DELETE FROM ventas_items WHERE id_venta = ?`, [id]);
    await db.query(`DELETE FROM ventas WHERE id = ?`, [id]);
    return { ok: true };
  }
};
