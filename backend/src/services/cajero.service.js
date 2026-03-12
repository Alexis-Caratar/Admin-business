import { db } from "../config/db.js";
import { notificarCaja, notificarMesas } from "../websockets.js"; // ajusta la ruta según tu proyecto


const CajeroService = {
  estadoCaja: async ({ id_usuario }) => {
    try {

      const estado_caja = `
  SELECT 
    c.*,

    -- Ventas
    IFNULL(CAST(v.total_ventas AS UNSIGNED), 0) AS total_ventas,
    IFNULL(CAST(v.dinero_recaudado AS UNSIGNED), 0) AS dinero_recaudado,

    -- Egresos
    IFNULL(CAST(e.total_egresos AS UNSIGNED), 0) AS total_egresos

FROM caja c

-- Subconsulta de ventas
LEFT JOIN (
    SELECT 
        ve.id_caja,
        COUNT(ve.id) AS total_ventas,
        SUM(ve.total) AS dinero_recaudado
    FROM ventas ve
    INNER JOIN pagos pe on ve.id=pe.id_venta
    where pe.estado_pago=1
    GROUP BY ve.id_caja
) v ON v.id_caja = c.id

-- Subconsulta de egresos
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

      const [rows] = await db.query(estado_caja, [id_usuario]);
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

 cerrarCaja: async ({id_caja,monto_final,dinero_esperado,base_caja,venta_libre,diferencia,nota
}) => {
  // 1️⃣ Actualizar la caja con todos los campos
  const update = `
    UPDATE caja 
    SET 
      estado = 'CERRADA',
      fecha_cierre = NOW(),
      monto_final = ?,
      dinero_esperado = ?,
      base_caja = ?,
      venta_libre=?,
      diferencia = ?,
      nota = ?
    WHERE id = ?
  `;
  const [result] = await db.query(update, [
    monto_final,
    dinero_esperado,
    base_caja,
    venta_libre,
    diferencia,
    nota,
    id_caja
  ]);

  // 2️⃣ Consultar la caja actualizada
  const [rows] = await db.query('SELECT * FROM caja WHERE id = ?', [id_caja]);

  // 3️⃣ Retornar la fila actualizada
  return rows[0];
},

arqueo: async ({ id_caja }) => {

  /* ===============================
     1️⃣ RESUMEN DE CAJA
  =============================== */

  const resumenQuery = `
    SELECT 
        c.monto_inicial,

        IFNULL(v.total_ventas,0) AS total_ventas,

        IFNULL(e.total_egresos,0) AS total_egresos,

        (
            c.monto_inicial 
            + IFNULL(v.total_ventas,0)
            - IFNULL(e.total_egresos,0)
        ) AS saldo_actual

    FROM caja c

    LEFT JOIN (
        SELECT 
            ve.id_caja,
            SUM(pe.monto_pagado) AS total_ventas
        FROM ventas ve
        INNER JOIN pagos pe 
            ON pe.id_venta = ve.id
        WHERE pe.estado_pago = 1
        GROUP BY ve.id_caja
    ) v ON v.id_caja = c.id

    LEFT JOIN (
        SELECT 
            id_caja,
            SUM(monto) AS total_egresos
        FROM egresos
        GROUP BY id_caja
    ) e ON e.id_caja = c.id

    WHERE c.id = ?
  `;

  /* ===============================
     2️⃣ PRODUCTOS VENDIDOS
  =============================== */

  const productosQuery = `
    SELECT 
        c.id AS id_categoria,
        c.nombre AS categoria,
        p.id AS id_producto,
        p.nombre AS producto,
        SUM(vd.cantidad) AS cantidad_vendida,
        SUM(vd.subtotal) AS total_vendido
    FROM ventas v
    INNER JOIN pagos pa 
        ON pa.id_venta = v.id
    INNER JOIN ventas_items vd 
        ON vd.id_venta = v.id
    INNER JOIN productos p 
        ON p.id = vd.id_producto
    INNER JOIN categorias c 
        ON c.id = p.id_categoria
    WHERE v.id_caja = ?
    AND pa.estado_pago = 1
    GROUP BY 
        c.id,
        c.nombre,
        p.id,
        p.nombre
    ORDER BY 
        c.nombre,
        p.nombre
  `;

  /* ===============================
     3️⃣ VENTAS POR METODO DE PAGO
  =============================== */

  const pagosQuery = `
    SELECT

    SUM(CASE 
        WHEN pa.metodo_pago = 'EFECTIVO' AND pa.estado_pago = 1
        THEN pa.monto_pagado ELSE 0 END) AS efectivo,

    SUM(CASE 
        WHEN pa.metodo_pago = 'TARJETA' AND pa.estado_pago = 1
        THEN pa.monto_pagado ELSE 0 END) AS tarjeta,

    SUM(CASE 
        WHEN pa.metodo_pago = 'TRANSFERENCIA' AND pa.estado_pago = 1
        THEN pa.monto_pagado ELSE 0 END) AS transferencia,

    SUM(CASE 
        WHEN pa.metodo_pago = 'NEQUI' AND pa.estado_pago = 1
        THEN pa.monto_pagado ELSE 0 END) AS nequi,

    SUM(CASE 
        WHEN pa.metodo_pago = 'DAVIPLATA' AND pa.estado_pago = 1
        THEN pa.monto_pagado ELSE 0 END) AS daviplata,

    SUM(CASE 
        WHEN pa.estado_pago = 0
        THEN pa.monto_pagado ELSE 0 END) AS pendiente,

    SUM(CASE 
        WHEN pa.estado_pago = 1
        THEN pa.monto_pagado ELSE 0 END) AS total_ventas

FROM ventas v
INNER JOIN pagos pa
    ON pa.id_venta = v.id
WHERE v.id_caja = ?
  `;

  /* ===============================
     4️⃣ EGRESOS DETALLADOS
  =============================== */

  const egresosQuery = `
    SELECT 
      id,
      numero_egreso,
      descripcion,
      metodo_pago,
      monto,
      observacion,
      created_at
    FROM egresos
    WHERE id_caja = ?
    ORDER BY created_at DESC
  `;


  /* ===============================
     5 Mesas Ocupadas
  =============================== */

  const mesas_estadoQuery = `
 SELECT ve.*, p.*, m.*
FROM ventas ve
INNER JOIN mesas m ON ve.id_mesa = m.id
LEFT JOIN pagos p ON ve.id = p.id_venta
WHERE ve.id = (
    SELECT MAX(v2.id)
    FROM ventas v2
    WHERE v2.id_mesa = ve.id_mesa
)
AND ve.id_caja = ?
AND (
      p.estado_pago = 0
      OR m.estado != 'DISPONIBLE'
);
  `;

    /* ===============================
     6 facturas_pendientes
  =============================== */

  const facturas_pendientesQuery = `
    selecT DISTINCT *
    from ventas ve 
        INNER JOIN pagos p on ve.id=p.id_venta
        LEFT JOIN mesas m on ve.id_mesa=m.id
        where  p.estado_pago=0
        and ve.id_caja=?
  `;

  const [resumenRows] = await db.query(resumenQuery, [id_caja]);
  const [productosRows] = await db.query(productosQuery, [id_caja]);
  const [pagosRows] = await db.query(pagosQuery, [id_caja]);

    const pagos = pagosRows[0] || {};
   const ventas_metodos = [
    { metodo_pago: "EFECTIVO", total: pagos.efectivo || 0 },
    { metodo_pago: "TARJETA", total: pagos.tarjeta || 0 },
    { metodo_pago: "TRANSFERENCIA", total: pagos.transferencia || 0 },
    { metodo_pago: "NEQUI", total: pagos.nequi || 0 },
    { metodo_pago: "DAVIPLATA", total: pagos.daviplata || 0 },
    { metodo_pago: "PENDIENTE", total: pagos.pendiente || 0 }
  ];


  const [egresosRows] = await db.query(egresosQuery, [id_caja]);
  const [mesasRows] = await db.query(mesas_estadoQuery, [id_caja]);
    const [facturasRows] = await db.query(facturas_pendientesQuery, [id_caja]);


  return {
    ...resumenRows[0],
    ventas_metodos,
    productos: productosRows,
    egresos: egresosRows,
    mesasOcupadas: mesasRows,
    facturasPendientes: facturasRows
  };
},

  finalizarVenta: async (payload) => {
    const conn = await db.getConnection();
    try {


      console.log("payload", payload);

      const {idUsuario, id_negocio, id_cliente, id_caja, subtotal, descuento, descuento_porcentaje, impuesto, total, estado,
        nota, productos, metodo_pago, monto_pagado, monto_recibido, cambio, id_mesa } = payload;


      // 1️⃣ Obtener el siguiente consecutivo
      const [consecutivo] = await conn.query(`
            SELECT IFNULL(MAX(numero_consecutivo),0) + 1 AS siguiente
            FROM ventas
          `);

      const numeroConsecutivo = consecutivo[0].siguiente;
      const numeroFactura = `POS-${numeroConsecutivo.toString().padStart(6, '0')}`;


      // 2️⃣ Insertar en tabla ventas
      const [ventaResult] = await conn.query(
        `INSERT INTO ventas 
            (numero_consecutivo, numero_factura, id_cliente, id_caja, id_mesa, subtotal, descuento, descuento_porcentaje, impuesto, total, estado, metodo_pago, nota)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [numeroConsecutivo, numeroFactura, id_cliente, id_caja, id_mesa, subtotal, descuento, descuento_porcentaje, impuesto, total, estado, 'EFECTIVO', nota]
      );

      const [mesas] = await conn.query(`update mesas set estado='Ocupada' where id=?`, [id_mesa]);
      await notificarMesas(id_negocio);

      const id_venta = ventaResult.insertId;


      // 2️⃣ Insertar en tabla ventas_items
      for (const p of productos) {

        await conn.query(
          `INSERT INTO ventas_items (id_venta, id_producto, cantidad, precio_unitario, descuento, descuento_porcentaje, impuesto, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id_venta, p.id_producto, p.cantidad, p.precio_unitario, p.descuento, p.descuento_porcentaje, p.impuesto, p.subtotal]
        );
      }

      let estado_pago_id = 0
      if (metodo_pago != 'PENDIENTE') estado_pago_id = 1

      const [venta_pago] = await conn.query(
        `INSERT INTO pagos (id_venta,estado_pago, metodo_pago, monto_pagado, monto_recibido, cambio)
            VALUES ( ?,?, ?, ?, ?, ?)`,
        [id_venta, estado_pago_id, metodo_pago, monto_pagado, monto_recibido, cambio]
      );
      await notificarCaja(idUsuario);


      await conn.commit();
      return { id_venta, productos };
    } catch (err) {
      await conn.rollback();
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

  mesas: async (id_negocio) => {

    const query = `
    SELECT *
    FROM mesas
    WHERE id_negocio = ?
    `;
    const [rows] = await db.query(query, [id_negocio]);

    return rows;
  },

  detallesMesa: async (id_negocio, mesaId) => {

    const query = `
      SELECT  
          m.id AS id_mesa,
          v.id AS id_venta,
          p.id_pago,
          v.numero_factura,
          per.identificacion AS identificacion_cliente,
          CONCAT(per.nombres,' ',per.apellidos) AS nombre_completo,
          v.subtotal AS venta_total,
          p.metodo_pago AS estado_pago,

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

      LEFT JOIN (
          SELECT id_producto, MIN(url) AS url
          FROM productos_imagenes
          GROUP BY id_producto
      ) prod_i ON pro.id = prod_i.id_producto

      LEFT JOIN (
          SELECT id_venta, MAX(id) AS id_pago, MAX(metodo_pago) AS metodo_pago
          FROM pagos
          GROUP BY id_venta
      ) p ON v.id = p.id_venta

      INNER JOIN personas per ON v.id_cliente = per.id

      WHERE m.estado = 'ocupada'
      AND m.id_negocio = ?
      AND m.id = ?

      GROUP BY 
          m.id,
          v.id,
          p.id_pago,
          v.numero_factura,
          per.identificacion,
          per.nombres,
          per.apellidos,
          v.subtotal,
          p.metodo_pago

      ORDER BY p.id_pago DESC
      LIMIT 1;
    `;
    const [rows] = await db.query(query, [id_negocio, mesaId]);

    return rows;
  },



  listarEgresos: async (id_negocio, id_caja) => {
    const [rows] = await db.query(
      `
    SELECT 
      id,
      numero_egreso,
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


  crearEgreso: async (data) => {

    // 1️⃣ Obtener el último consecutivo
    const [[row]] = await db.query(
      `SELECT IFNULL(MAX(numero_consecutivo),0) + 1 AS next FROM egresos`
    );

    const numeroConsecutivo = row.next;
    const numeroEgreso = `EGR-${String(numeroConsecutivo).padStart(6, "0")}`;

    // 2️⃣ Insertar egreso
    const sql = `
  INSERT INTO egresos
  (
    id_negocio,
    id_caja,
    numero_consecutivo,
    numero_egreso,
    fecha,
    descripcion,
    metodo_pago,
    monto,
    estado,
    observacion,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 'ACTIVO', ?, NOW(), NOW())
`;

    const [result] = await db.query(sql, [
      data.id_negocio,
      data.id_caja,
      numeroConsecutivo,
      numeroEgreso,
      data.descripcion,
      data.metodo_pago || null,
      data.monto,
      data.observacion || null
    ]);

    await notificarCaja(data.idUsuario);
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

    await db.query(sql, [data.descripcion,data.metodo_pago,data.monto,data.observacion,id
    ]);
     await notificarCaja(idUsuario);
  },

  eliminarEgreso: async (id) => {

    const sql = `DELETE FROM egresos WHERE id = ?`;
    await db.query(sql, [id]);
     await notificarCaja(idUsuario);
  },


  actualizaventa: async (payload) => {
    const conn = await db.getConnection();
    try {
      const {idUsuario, id_negocio, id_venta, metodo_pago, monto_recibido, cambio, id_mesa } = payload;

      // Actualizar la venta
      let estado_pago_id = 0
      if (metodo_pago != 'PENDIENTE') estado_pago_id = 1

      const sqlUpdate = `
      UPDATE pagos
      SET estado_pago=?,
          metodo_pago = ?,
          monto_recibido = ?,
          cambio = ?,
          fecha_actualizacion = NOW()
      WHERE id = ?;
    `;


      const result = await conn.query(sqlUpdate, [estado_pago_id, metodo_pago, monto_recibido, cambio, id_venta]);

      if (result[0].affectedRows === 0) {
        throw new Error("No se encontró la venta con el id proporcionado");
      }

      // Traer la fila actualizada
      const rows = await conn.query("update mesas set estado='Disponible' where id = ?", [id_mesa]);
      await notificarCaja(idUsuario);
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

  liberar_mesa: async (id_mesa, id_negocio) => {
    const conn = await db.getConnection();
    const [mesas] = await conn.query(`update mesas set estado='Disponible' where id=?`, [id_mesa]);
    await notificarMesas(id_negocio);
    return mesas;
  },


facturaPorCaja: async (id_caja) => {

const sql = `
SELECT  
    v.id AS id_venta,
    p.id AS id_pago,
    v.numero_factura,
    DATE_FORMAT(p.fecha,'%H:%i') AS fecha,

    per.identificacion AS identificacion_cliente,
    CONCAT(per.nombres,' ',per.apellidos) AS nombre_completo,

    v.subtotal AS venta_total,
    p.estado_pago,
    p.metodo_pago

FROM ventas v

INNER JOIN pagos p 
    ON p.id_venta = v.id

INNER JOIN personas per 
    ON per.id = v.id_cliente

WHERE v.id_caja = ?

ORDER BY p.id DESC
`;

const [rows] = await db.query(sql,[id_caja]);

return rows.length ? rows : [];

},
facturaPordetalle: async (id_venta) => {

const sql = `
SELECT  
    vi.id_producto,
    pro.nombre,
    vi.cantidad,
    vi.subtotal,
    IFNULL(pi.url,'') AS url_imagen

FROM ventas_items vi

INNER JOIN productos pro 
    ON pro.id = vi.id_producto

LEFT JOIN productos_imagenes pi 
    ON pi.id_producto = pro.id

WHERE vi.id_venta = ?
`;

const [rows] = await db.query(sql,[id_venta]);

return rows;

},
}





export default CajeroService;
