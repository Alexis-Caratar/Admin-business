import { db } from "../config/db.js";

const CajeroService = {
listarProductos: async () => {
  // 1. OBTENER CATEGORÍAS
  const [categorias] = await db.query(`
    SELECT id, nombre, imagen
    FROM categorias
    WHERE id_negocio = 1
  `);

  // 2. OBTENER PRODUCTOS
  const [productos] = await db.query(`
    SELECT 
      p.id as id_producto,
      p.nombre as nombre_producto,
      p.id_categoria,
      pp.precio_venta,
      img.url as imagen
    FROM productos p
    LEFT JOIN productos_precios pp ON pp.id_producto = p.id
    LEFT JOIN productos_imagenes img ON img.id_producto = p.id
    WHERE p.estado = true
  `);

  // 3. ARMAR EL JSON AGRUPADO POR CATEGORÍA
  const resultado = categorias.map(cat => {
    const platos = productos.filter(p => p.id_categoria === cat.id);

    return {
      id: cat.id,
      categoria: cat.nombre,
      imagen: cat.imagen,
      platos: platos.map(pl => ({
        id_producto: pl.id_producto,
        nombre: pl.nombre_producto,
        precio_venta: pl.precio_venta,
        imagen_plato: pl.imagen
      }))
    };
  });

  return resultado;
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
