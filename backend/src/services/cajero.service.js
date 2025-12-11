import { db } from "../config/db.js";


const CajeroService = {
 estadoCaja: async ({id_usuario}) => {
    try {

        const estado_caja = `
     SELECT 
          c.*,
          COUNT(v.id) AS total_ventas,
          IFNULL(SUM(v.total), 0) AS dinero_recaudado
      FROM caja c
      LEFT JOIN ventas v ON v.id_caja = c.id
      WHERE c.estado = 'ABIERTA'
        AND c.id_usuario = ?
      GROUP BY c.id
      ORDER BY c.fecha_apertura DESC
      LIMIT 1;`

    const [rows ] = await db.query(estado_caja, [id_usuario]);
    return rows;

    } catch (error) {
      console.error("Error obteniendo estado de caja:", error);
      return { abierta: false, caja: null, error: "No se pudo consultar la caja" };
    }
  },

  
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
        id: pl.id_producto,
        nombre: pl.nombre_producto,
        precio_venta: pl.precio_venta,
        imagen_plato: pl.imagen
      }))
    };
  });

  return resultado;
},

  abrirCaja: async ({ id_usuario, monto_inicial }) => {
   const query = `
  INSERT INTO caja (id_usuario, monto_inicial, estado, fecha_apertura)
  VALUES (?, ?, 'ABIERTA', NOW());
`;

const [insert] = await db.execute(query, [id_usuario, monto_inicial]);

const [rows] = await db.execute("SELECT * FROM caja WHERE id = ?", [
  insert.insertId,
]);

return rows[0];

  },    

cerrarCaja: async ({ id_caja, monto_final }) => {
  // 1️⃣ Actualizar la caja
  const update = `
    UPDATE caja 
    SET estado='CERRADA', fecha_cierre=NOW(), monto_final=?
    WHERE id=?
  `;
  const [result] = await db.query(update, [monto_final, id_caja]);

  // 2️⃣ Consultar la caja actualizada
  const [rows] = await db.query('SELECT * FROM caja WHERE id=?', [id_caja]);

  // 3️⃣ Retornar la fila actualizada
  return rows[0];
},


  arqueo: async ({ id_caja }) => {
    
    const query = `
      SELECT 
        c.monto_inicial,
        COALESCE(SUM(v.total), 0) AS total_ventas
      FROM caja c
      LEFT JOIN ventas v ON v.id_caja = c.id
      WHERE c.id = ?
      GROUP BY c.monto_inicial;
    `;    
    const  [rows] = await db.query(query, [id_caja]);
    console.log("rows",rows);
    
    return rows[0];
  },


  finalizarVenta: async (payload) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const { id_cliente, id_caja, subtotal, descuento, descuento_porcentaje, impuesto, total, estado,
          nota, productos, metodo_pago,monto_pagado,monto_recibido,cambio} = payload;

      // 1️⃣ Insertar en tabla ventas
      const [ventaResult] = await conn.query(
        `INSERT INTO ventas (id_cliente, id_caja, subtotal, descuento, descuento_porcentaje, impuesto, total, estado, metodo_pago, nota)
         VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_cliente, id_caja, subtotal, descuento, descuento_porcentaje, impuesto, total, estado, 'EFECTIVO', nota]
      );

      const id_venta = ventaResult.insertId;

      // 2️⃣ Insertar en tabla ventas_items
      for (const p of productos) {
        await conn.query(
          `INSERT INTO ventas_items (id_venta, id_producto, cantidad, precio_unitario, descuento, descuento_porcentaje, impuesto, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id_venta, p.id_producto, p.cantidad, p.precio_unitario, p.descuento, p.descuento_porcentaje, p.impuesto, p.subtotal]
        );
      }


 const [venta_pago] = await conn.query(
        `INSERT INTO pagos (id_venta, metodo_pago, monto_pagado, monto_recibido, cambio)
         VALUES ( ?, ?, ?, ?, ?)`,
        [id_venta, metodo_pago,monto_pagado,monto_recibido,cambio]
      );

      
      await conn.commit();
      return { id_venta, productos };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },


   buscarCliente: async ( datoscliente ) => {
    
    
    const query = `
SELECT *
FROM personas
WHERE tipo = 'cliente'
  AND identificacion LIKE CONCAT('%', ?, '%')
LIMIT 20;



    `;    
    const  [rows] = await db.query(query, [datoscliente]);
    
    return rows;
  },

};

export default CajeroService;
