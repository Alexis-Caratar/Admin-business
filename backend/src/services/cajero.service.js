import db from "../database/db.js";

const CajeroService = {
  listarProductos: async () => {
    const query = `
      SELECT 
        p.id,
        p.nombre,
        pp.precio,
        img.url_imagen
      FROM producto p
      LEFT JOIN productos_precios pp ON pp.id_producto = p.id
      LEFT JOIN producto_imagenes img ON img.id_producto = p.id
      WHERE p.estado = true
    `;

    const { rows } = await db.query(query);
    return rows;
  },

  abrirCaja: async ({ id_usuario, monto_inicial }) => {
    const insert = `
      INSERT INTO caja (id_usuario, monto_inicial, estado, fecha_apertura)
      VALUES ($1, $2, 'ABIERTA', NOW())
      RETURNING *;
    `;
    const { rows } = await db.query(insert, [id_usuario, monto_inicial]);
    return rows[0];
  },

  cerrarCaja: async ({ id_caja, monto_final }) => {
    const update = `
      UPDATE caja 
      SET estado='CERRADA', fecha_cierre=NOW(), monto_cierre=$2
      WHERE id=$1
      RETURNING *;
    `;
    const { rows } = await db.query(update, [id_caja, monto_final]);
    return rows[0];
  },

  arqueo: async ({ id_caja }) => {
    const query = `
      SELECT 
        c.monto_inicial,
        COALESCE(SUM(v.total), 0) AS total_ventas
      FROM caja c
      LEFT JOIN ventas v ON v.id_caja = c.id
      WHERE c.id = $1
      GROUP BY c.monto_inicial;
    `;
    const { rows } = await db.query(query, [id_caja]);
    return rows[0];
  },
};

export default CajeroService;
