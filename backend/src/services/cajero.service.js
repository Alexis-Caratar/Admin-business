import { db } from "../config/db.js";
import { notificarMesas } from "../server.js"; // ajusta la ruta según tu proyecto


const CajeroService = {
 estadoCaja: async ({id_usuario}) => {
    try {

        const estado_caja = `
        SELECT 
          c.*,

          -- Ventas
          IFNULL(v.total_ventas, 0) AS total_ventas,
          IFNULL(v.dinero_recaudado, 0) AS dinero_recaudado,

          -- Egresos
          IFNULL(e.total_egresos, 0) AS total_egresos

      FROM caja c

      -- Subconsulta de ventas (agregadas correctamente)
      LEFT JOIN (
          SELECT 
              id_caja,
              COUNT(id) AS total_ventas,
              SUM(total) AS dinero_recaudado
          FROM ventas
          GROUP BY id_caja
      ) v ON v.id_caja = c.id

      -- Subconsulta de egresos (agregados correctamente)
      LEFT JOIN (
          SELECT 
              id_caja,
              SUM(monto) AS total_egresos
          FROM egresos
          GROUP BY id_caja
      ) e ON e.id_caja = c.id

      WHERE c.estado = 'ABIERTA'
        AND c.id_usuario = ?

      ORDER BY c.fecha_apertura DESC
      LIMIT 1;
`

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

        -- Ventas
        IFNULL(v.total_ventas, 0) AS total_ventas,

        -- Egresos
        IFNULL(e.total_egresos, 0) AS total_egresos,

        -- Saldo real en caja
        (
            c.monto_inicial 
            + IFNULL(v.total_ventas, 0)
            - IFNULL(e.total_egresos, 0)
        ) AS saldo_actual

    FROM caja c

    -- Subconsulta ventas
    LEFT JOIN (
        SELECT 
            id_caja,
            SUM(total) AS total_ventas
        FROM ventas
        GROUP BY id_caja
    ) v ON v.id_caja = c.id

    -- Subconsulta egresos
    LEFT JOIN (
        SELECT 
            id_caja,
            SUM(monto) AS total_egresos
        FROM egresos
        GROUP BY id_caja
    ) e ON e.id_caja = c.id

    WHERE c.id = ?;
    `;    
    const  [rows] = await db.query(query, [id_caja]);
    console.log("rows",rows);
    
    return rows[0];
  },


  finalizarVenta: async (payload) => {
    const conn = await db.getConnection();
    try {
     // await conn.beginTransaction();

      console.log("payload",payload);
      
      const { id_negocio,id_cliente, id_caja, subtotal, descuento, descuento_porcentaje, impuesto, total, estado,
          nota, productos, metodo_pago,monto_pagado,monto_recibido,cambio,id_mesa} = payload;


      // 1️⃣ Insertar en tabla ventas
      const [ventaResult] = await conn.query(
        `INSERT INTO ventas (id_cliente, id_caja,id_mesa, subtotal, descuento, descuento_porcentaje, impuesto, total, estado, metodo_pago, nota)
         VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
        [id_cliente, id_caja,id_mesa, subtotal, descuento, descuento_porcentaje, impuesto, total, estado, 'EFECTIVO', nota]
      );

        const [mesas] = await conn.query( `update mesas set estado='Ocupada' where id=?`,[ id_mesa]);
         await notificarMesas(id_negocio);

      const id_venta = ventaResult.insertId;

        
      // 2️⃣ Insertar en tabla ventas_items
      for (const p of productos) {
        console.log("ingresando a guardar platos");
        
        await conn.query(
          `INSERT INTO ventas_items (id_venta, id_producto, cantidad, precio_unitario, descuento, descuento_porcentaje, impuesto, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id_venta, p.id_producto, p.cantidad, p.precio_unitario, p.descuento, p.descuento_porcentaje, p.impuesto, p.subtotal]
        );
      }

console.log(
        `INSERT INTO pagos (id_venta, metodo_pago, monto_pagado, monto_recibido, cambio)
         VALUES ( ?, ?, ?, ?, ?)`,
        [id_venta, metodo_pago,monto_pagado,monto_recibido,cambio]
      );

 const [venta_pago] = await conn.query(
        `INSERT INTO pagos (id_venta, metodo_pago, monto_pagado, monto_recibido, cambio)
         VALUES ( ?, ?, ?, ?, ?)`,
        [id_venta, metodo_pago,monto_pagado,monto_recibido,cambio]
      );

       console.log("venta_pago",venta_pago);

    //  await conn.commit();
      return { id_venta, productos };
    } catch (err) {
    //  await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },


buscarCliente: async (datoscliente) => {

  const query = `
    SELECT *
    FROM personas
    WHERE identificacion LIKE ?
       OR CONCAT(nombres, ' ', apellidos) LIKE ?
    LIMIT 20
  `;

  const valor = `%${datoscliente}%`;

  const [rows] = await db.query(query, [valor, valor]);

  return rows;
},

     mesas: async ( id_negocio ) => {
    
    const query = `
    SELECT *
    FROM mesas
    WHERE id_negocio = ?
    `;    
    const  [rows] = await db.query(query, [id_negocio]);
    
    return rows;
  },

  detallesMesa: async ( id_negocio,mesaId ) => {
    
    const query = `
 SELECT  
    m.id AS id_mesa,
    v.id AS id_venta,
    p.id as id_pago,
    per.identificacion AS identificacion_cliente,
    CONCAT(per.nombres, ' ', per.apellidos) AS nombre_completo,
    v.subtotal AS venta_total,
    p.metodo_pago as estado_pago,
    CONCAT(
        '[',
        GROUP_CONCAT(
            CONCAT(
                '{',
                '"id_producto":', vi.id_producto, ',',
                '"url_imagen":"', prod_i.url, '",',
                '"nombre":"', pro.nombre, '",',
                '"cantidad":', vi.cantidad, ',',
                '"subtotal":', vi.subtotal,
                '}'
            )
        ),
        ']'
    ) AS productos

FROM mesas m
INNER JOIN ventas v ON v.id_mesa = m.id
INNER JOIN ventas_items vi ON v.id = vi.id_venta
INNER JOIN productos pro ON vi.id_producto = pro.id
INNER JOIN productos_imagenes  prod_i on pro.id=prod_i.id_producto
INNER JOIN pagos p ON v.id = p.id_venta
INNER JOIN personas per ON v.id_cliente = per.id

WHERE m.estado = 'ocupada'
  AND m.id_negocio = ?
  AND m.id = ?

GROUP BY 
    m.id,
    v.id,
    per.identificacion,
    per.nombres,
    per.apellidos,
    v.subtotal
    order by p.id desc limit 1;
    `;    
    const  [rows] = await db.query(query, [id_negocio,mesaId]);
    
    return rows;
  },



listarEgresos : async (id_negocio, id_caja) => {
  const [rows] = await db.query(
    `
    SELECT 
      id,
      descripcion,
      metodo_pago,
      monto,
      observacion,
      created_at
    FROM egresos
    WHERE id_negocio = ? 
      AND id_caja = ?
    ORDER BY created_at DESC
    `,
    [id_negocio, id_caja]
  );

  return rows;
},


 crearEgreso : async (data) => {
  
  const sql = `
    INSERT INTO egresos
    (
      id_negocio,
      id_caja,
      fecha,
      descripcion,
      metodo_pago,
      monto,
      estado,
      observacion,
      created_at,
      updated_at
    )
    VALUES (?, ?, NOW(), ?, ?,  ?, 'ACTIVO', ?, NOW(), NOW())
  `;

  const [result] = await db.query(sql, [
    data.id_negocio,
    data.id_caja,
    data.descripcion,
    data.metodo_pago || null,
    data.monto,
    data.observacion || null
  ]);

  return result.insertId;
},


 actualizarEgreso: async (id, data) => {

  const sql = `
    UPDATE egresos
    SET
      descripcion = ?,
      metodo_pago = ?,
      monto = ?,
      observacion = ?,
      updated_at = NOW()
    WHERE id = ?
  `;

  await db.query(sql, [
    data.descripcion,
    data.metodo_pago,
    data.monto,
    data.observacion,
    id
  ]);
},

 eliminarEgreso: async (id) => {

  const sql = `DELETE FROM egresos WHERE id = ?`;
  await db.query(sql, [id]);
},


actualizaventa: async (payload) => {
  const conn = await db.getConnection();
  try {
    const { id_negocio,id_venta, metodo_pago, monto_recibido, cambio,id_mesa } = payload;

    // Actualizar la venta
    const sqlUpdate = `
      UPDATE pagos
      SET metodo_pago = ?,
          monto_recibido = ?,
          cambio = ?,
          fecha_actualizacion = NOW()
      WHERE id = ?;
    `;


    const result = await conn.query(sqlUpdate, [metodo_pago, monto_recibido, cambio, id_venta]);

    if (result[0].affectedRows === 0) {
      throw new Error("No se encontró la venta con el id proporcionado");
    }

    // Traer la fila actualizada
    const rows = await conn.query("update mesas set estado='Disponible' where id = ?", [id_mesa]);
    await notificarMesas(id_negocio);
    console.log("Venta actualizada:", rows[0]);

    return rows[0];
  } catch (err) {
    console.error("Error actualizando venta:", err.message);
    throw err;
  } finally {
    conn.release();
  }
},

liberar_mesa : async (id_mesa,id_negocio) => {
  const conn = await db.getConnection();
  const [mesas] = await conn.query( `update mesas set estado='Disponible' where id=?`,[ id_mesa]);
   await notificarMesas(id_negocio);
  return mesas;
},



}
export default CajeroService;
