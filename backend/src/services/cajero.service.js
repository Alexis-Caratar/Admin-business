import { db } from "../config/db.js";
import  {pool} from "../config/db.js";
import { notificarCaja, notificarMesas } from "../websockets.js"; // ajusta la ruta según tu proyecto


const CajeroService = {
  estadoCaja: async ({ id_usuario }) => {
    try {

      const estado_caja = `
SELECT 
    c.*,

    -- Ventas
    COALESCE(v.total_ventas::INTEGER, 0) AS total_ventas,
    COALESCE(v.dinero_recaudado::INTEGER, 0) AS dinero_recaudado,

    -- Egresos
    COALESCE(e.total_egresos::INTEGER, 0) AS total_egresos

FROM caja c

-- Subconsulta de ventas
LEFT JOIN (
    SELECT 
        ve.id_caja,
        COUNT(ve.id) AS total_ventas,
        SUM(ve.total) AS dinero_recaudado
    FROM ventas ve
    INNER JOIN pagos pe ON ve.id = pe.id_venta
    WHERE pe.estado_pago = true
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
  AND c.id_usuario = $1

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


listarProductos: async (id) => {
  const { rows } = await pool.query(`
    SELECT 
      c.id,
      c.nombre AS categoria,
      c.imagen,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', p.id,
            'codigo_barra', p.codigo_barra,
            'stock_actual', p.stock_actual,
            'nombre', p.nombre,
            'precio_venta', pp.precio_venta,
            'imagenes', (
              SELECT COALESCE(json_agg(img.url), '[]')
              FROM productos_imagenes img
              WHERE img.id_producto = p.id
            )
          )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS platos
    FROM categorias c
    LEFT JOIN productos p 
      ON p.id_categoria = c.id 
      AND p.estado = true
    LEFT JOIN productos_precios pp 
      ON pp.id_producto = p.id
    WHERE c.id_negocio = $1
    GROUP BY c.id, c.nombre, c.imagen
    ORDER BY c.nombre;
  `, [id]);

  return rows;
},

abrirCaja: async ({ id_usuario, monto_inicial }) => {

  const query = `
    INSERT INTO caja (id_usuario, monto_inicial, estado, fecha_apertura)
    VALUES ($1, $2, 'ABIERTA', NOW())
    RETURNING *;
  `;

  const [rows] = await db.query(query, [id_usuario, monto_inicial]);

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
      monto_final = $1,
      dinero_esperado = $2,
      base_caja = $3,
      venta_libre=$4,
      diferencia = $5,
      nota = $6
    WHERE id = $7
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
  const [rows] = await db.query('SELECT * FROM caja WHERE id = $1', [id_caja]);

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

        COALESCE(v.total_ventas,0) AS total_ventas,
        COALESCE(e.total_egresos,0) AS total_egresos,

        (
            c.monto_inicial 
            + COALESCE(v.total_ventas,0)
            - COALESCE(e.total_egresos,0)
        ) AS saldo_actual

    FROM caja c

    LEFT JOIN (
        SELECT 
            ve.id_caja,
            SUM(pe.monto_pagado) AS total_ventas
        FROM ventas ve
        INNER JOIN pagos pe 
            ON pe.id_venta = ve.id
        WHERE pe.estado_pago = true
        GROUP BY ve.id_caja
    ) v ON v.id_caja = c.id

    LEFT JOIN (
        SELECT 
            id_caja,
            SUM(monto) AS total_egresos
        FROM egresos
        GROUP BY id_caja
    ) e ON e.id_caja = c.id

    WHERE c.id = $1
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
    WHERE v.id_caja = $1
    AND pa.estado_pago = true
    GROUP BY 
        c.id, c.nombre, p.id, p.nombre
    ORDER BY 
        c.nombre, p.nombre
  `;

  /* ===============================
     3️⃣ VENTAS POR METODO DE PAGO
  =============================== */
  const pagosQuery = `
    SELECT

    SUM(CASE 
        WHEN pa.metodo_pago = 'EFECTIVO' AND pa.estado_pago = true
        THEN pa.monto_pagado ELSE 0 END) AS efectivo,

    SUM(CASE 
        WHEN pa.metodo_pago = 'TARJETA' AND pa.estado_pago = true
        THEN pa.monto_pagado ELSE 0 END) AS tarjeta,

    SUM(CASE 
        WHEN pa.metodo_pago = 'TRANSFERENCIA' AND pa.estado_pago = true
        THEN pa.monto_pagado ELSE 0 END) AS transferencia,

    SUM(CASE 
        WHEN pa.metodo_pago = 'NEQUI' AND pa.estado_pago = true
        THEN pa.monto_pagado ELSE 0 END) AS nequi,

    SUM(CASE 
        WHEN pa.metodo_pago = 'DAVIPLATA' AND pa.estado_pago = true
        THEN pa.monto_pagado ELSE 0 END) AS daviplata,

        SUM(CASE 
        WHEN pa.metodo_pago = 'TIQUERERA' AND pa.estado_pago = true
        THEN pa.monto_pagado ELSE 0 END) AS tiquetera,

    SUM(CASE 
        WHEN pa.estado_pago = false
        THEN pa.monto_pagado ELSE 0 END) AS pendiente,

    SUM(CASE 
        WHEN pa.estado_pago = true
        THEN pa.monto_pagado ELSE 0 END) AS total_ventas

    FROM ventas v
    INNER JOIN pagos pa
        ON pa.id_venta = v.id
    WHERE v.id_caja = $1
  `;

  /* ===============================
     4️⃣ EGRESOS
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
    WHERE id_caja = $1
    ORDER BY created_at DESC
  `;

  /* ===============================
     5️⃣ MESAS OCUPADAS
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
    AND ve.id_caja = $1
    AND (
      p.estado_pago = false
      OR m.estado != 'Disponible'
    )
  `;

  /* ===============================
     6️⃣ FACTURAS PENDIENTES
  =============================== */
  const facturas_pendientesQuery = `
    SELECT DISTINCT *
    FROM ventas ve 
    INNER JOIN pagos p ON ve.id = p.id_venta
    LEFT JOIN mesas m ON ve.id_mesa = m.id
    WHERE p.estado_pago = false
    AND ve.id_caja = $1
  `;

  /* ===============================
     EJECUCIÓN
  =============================== */
  const [resumenRows] = await db.query(resumenQuery, [id_caja]);
  const [productosRows] = await db.query(productosQuery, [id_caja]);
  const [pagosRows] = await db.query(pagosQuery, [id_caja]);
  const [egresosRows] = await db.query(egresosQuery, [id_caja]);
  const [mesasRows] = await db.query(mesas_estadoQuery, [id_caja]);
  const [facturasRows] = await db.query(facturas_pendientesQuery, [id_caja]);

  const pagos = pagosRows[0] || {};

  const ventas_metodos = [
    { metodo_pago: "EFECTIVO", total: pagos.efectivo || 0 },
    { metodo_pago: "TARJETA", total: pagos.tarjeta || 0 },
    { metodo_pago: "TRANSFERENCIA", total: pagos.transferencia || 0 },
    { metodo_pago: "NEQUI", total: pagos.nequi || 0 },
    { metodo_pago: "DAVIPLATA", total: pagos.daviplata || 0 },
    { metodo_pago: "TIQUERERA", total: pagos.tiquetera || 0 },
    { metodo_pago: "PENDIENTE", total: pagos.pendiente || 0 }
  ];

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
  const conn = await pool.connect();

  try {
    await conn.query('BEGIN');

    const {
      idUsuario, id_negocio, id_cliente, id_caja,
      subtotal, descuento, descuento_porcentaje, impuesto, total, estado,
      nota, productos, metodo_pago,
      monto_pagado, monto_recibido, cambio, id_mesa
    } = payload;

    // 1️⃣ consecutivo
    const consecutivoRes = await conn.query(`
      SELECT COALESCE(MAX(numero_consecutivo), 0) + 1 AS siguiente
      FROM ventas
    `);

    const numeroConsecutivo = consecutivoRes.rows[0].siguiente;
    const numeroFactura = `POS-${numeroConsecutivo.toString().padStart(6, '0')}`;

    // 2️⃣ venta
    const ventaResult = await conn.query(`
      INSERT INTO ventas (
        numero_consecutivo, numero_factura, id_cliente, id_caja, id_mesa,
        subtotal, descuento, descuento_porcentaje, impuesto, total,
        estado, metodo_pago, nota
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      ) RETURNING id
    `, [
      numeroConsecutivo, numeroFactura, id_cliente, id_caja, id_mesa,
      subtotal, descuento, descuento_porcentaje, impuesto, total,
      estado, 'EFECTIVO', nota
    ]);

    const id_venta = ventaResult.rows[0].id;

    // 3️⃣ mesa
    await conn.query(
      `UPDATE mesas SET estado='Ocupada' WHERE id=$1`,
      [id_mesa]
    );

    

    // 4️⃣ items
    for (const p of productos) {
      await conn.query(`
        INSERT INTO ventas_items (
          id_venta, id_producto, cantidad, precio_unitario,
          descuento, descuento_porcentaje, impuesto, subtotal
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [
        id_venta, p.id_producto, p.cantidad, p.precio_unitario,
        p.descuento, p.descuento_porcentaje, p.impuesto, p.subtotal
      ]);
    }

    // 5️⃣ pago
    const estado_pago_id = metodo_pago !== 'PENDIENTE' ? 1 : 0;

    await conn.query(`
      INSERT INTO pagos (
        id_venta, estado_pago, metodo_pago,
        monto_pagado, monto_recibido, cambio
      ) VALUES ($1,$2,$3,$4,$5,$6)
    `, [
      id_venta,
      estado_pago_id,
      metodo_pago,
      monto_pagado ? Number(monto_pagado) : null,
      monto_recibido ? Number(monto_recibido) : null,
      cambio ? Number(cambio) : null
    ]);

  

    await conn.query('COMMIT');
    await notificarMesas(id_negocio);
    await notificarCaja(idUsuario);
    

    return { id_venta, productos };

  } catch (err) {
    await conn.query('ROLLBACK');
    console.log("err", err);
    throw err;
  } finally {
    conn.release();
  }
},

 buscarCliente: async (datoscliente) => {

  const query = `
    SELECT *
    FROM personas
    WHERE identificacion ILIKE $1
       OR (nombres || ' ' || apellidos) ILIKE $1
    LIMIT 20
  `;

  const valor = `%${datoscliente}%`;

  const [rows] = await db.query(query, [valor]);

  return rows;
},

crearcliente: async (payload) => {
  try {
    // 🔍 1. VALIDAR SI YA EXISTE
    const existeQuery = `
      SELECT id 
      FROM personas 
      WHERE TRIM(identificacion) = TRIM($1)
      LIMIT 1;
    `;

    const existe = await pool.query(existeQuery, [
      payload.numeroIdentificacion,
    ]);

    const {result}=existe
       

    
    if (existe.rowCount> 0) {      
      return {
        ok: false,
        message: "El cliente ya está registrado",
      };
    }

    // ✅ 2. INSERTAR
    const insertQuery = `
      INSERT INTO personas (
        tipo_identificacion,
        identificacion,
        nombres,
        apellidos,
        tipo,
        email,
        telefono,
        direccion,
        nota
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `;

    const values = [
      payload.tipoIdentificacion,
      payload.numeroIdentificacion,
      payload.nombres,
      payload.apellidos,
      payload.tipoCliente,
      payload.email,
      payload.telefono,
      payload.direccion,
      payload.nota,
    ];

    const { rows } = await pool.query(insertQuery, values);

    return {
      ok: true,
      result: rows[0],
    };

  } catch (error) {
    // 🛡️ 3. VALIDACIÓN DEFINITIVA (UNIQUE INDEX)
    if (error.code === "23505") {
      return {
        ok: false,
        message: "El cliente ya está registrado",
      };
    }

    throw error;
  }
},
  mesas: async (id_negocio) => {

    const query = `
    SELECT 
        m.*
      
    FROM mesas m

    LEFT JOIN (
        SELECT DISTINCT ON (id_mesa) *
        FROM ventas
        ORDER BY id_mesa, fecha DESC
    ) v ON v.id_mesa = m.id

    LEFT JOIN pagos p ON p.id_venta = v.id

    WHERE m.id_negocio = $1
    ORDER BY m.id ASC;
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
    per.nombres || ' ' || per.apellidos AS nombre_completo,
    v.subtotal AS venta_total,
    p.estado_pago as estado_pago_bool,
    p.metodo_pago AS estado_pago,
    v.nota,

    COALESCE(
        json_agg(
            json_build_object(
                'id_producto', vi.id_producto,
                'url_imagen', prod_i.url,
                'nombre', pro.nombre,
                'cantidad', vi.cantidad,
                'subtotal', vi.subtotal
            )
        ) FILTER (WHERE vi.id_producto IS NOT NULL),
        '[]'
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
    SELECT id_venta, MAX(id) AS id_pago, MAX(metodo_pago) AS metodo_pago,estado_pago
    FROM pagos
    GROUP BY id_venta,estado_pago
) p ON v.id = p.id_venta

INNER JOIN personas per ON v.id_cliente = per.id

WHERE m.estado = 'Ocupada'
AND m.id_negocio = $1
AND m.id = $2

GROUP BY 
    m.id,
    v.id,
    p.id_pago,
    v.numero_factura,
    per.identificacion,
    per.nombres,
    per.apellidos,
    v.subtotal,
    p.metodo_pago,
    p.estado_pago,
    v.nota

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
    WHERE id_negocio = $1 
      AND id_caja = $2
    ORDER BY created_at DESC
    `,
      [id_negocio, id_caja]
    );

    return rows;
  },


  crearEgreso: async (data) => {

    // 1️⃣ Obtener el último consecutivo
    const [[row]] = await db.query(
      `SELECT nextval('egresos_numero_seq');`
    );

    
    const numeroConsecutivo = row.nextval;
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
  VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, 'ACTIVO', $8, NOW(), NOW())
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
      descripcion = $1,
      metodo_pago = $2,
      monto = $3,
      observacion = $4,
      updated_at = NOW()
    WHERE id = $5
  `;

    await db.query(sql, [data.descripcion,data.metodo_pago,data.monto,data.observacion,id
    ]);

     await notificarCaja(data.idUsuario); 
  },

  eliminarEgreso: async (id,idUsuario) => {

    const sql = `DELETE FROM egresos WHERE id = $1`;
    await db.query(sql, [id]);
     await notificarCaja(idUsuario);
  },


actualizaventa: async (payload) => {
  const conn = await pool.connect();

  try {
    await conn.query('BEGIN');

    const {
      idUsuario, id_negocio, id_venta,
      metodo_pago, monto_recibido, cambio, id_mesa
    } = payload;

    // estado de pago
    const estado_pago_id = metodo_pago !== 'PENDIENTE' ? 1 : 0;

    // 1️⃣ Actualizar pago
    const result = await conn.query(`
      UPDATE pagos
      SET estado_pago = $1,
          metodo_pago = $2,
          monto_recibido = $3,
          cambio = $4,
          fecha_actualizacion = NOW()
      WHERE id_venta = $5
      RETURNING *
    `, [
      estado_pago_id,
      metodo_pago,
      monto_recibido ? Number(monto_recibido) : null,
      cambio ? Number(cambio) : null,
      id_venta
    ]);

    // 🔥 En PostgreSQL esto reemplaza affectedRows
    if (result.rowCount === 0) {
      throw new Error("No se encontró el pago para la venta");
    }

    // 2️⃣ Liberar mesa
    await conn.query(
      `UPDATE mesas SET estado='Disponible' WHERE id = $1`,
      [id_mesa]
    );
    await conn.query('COMMIT');
    await notificarCaja(idUsuario);
    await notificarMesas(id_negocio);
    return result.rows[0];

  } catch (err) {
    await conn.query('ROLLBACK');
    console.error("Error actualizando venta:", err.message);
    throw err;
  } finally {
    conn.release();
  }
},
liberar_mesa: async (id_mesa, id_negocio) => {
  const conn = await pool.connect();

  try {
    const result = await conn.query(
      `UPDATE mesas SET estado = 'Disponible' WHERE id = $1 RETURNING *`,
      [id_mesa]
    );

    await notificarMesas(id_negocio);

    return result.rows[0]; // devuelve la mesa actualizada

  } catch (err) {
    console.error("Error liberando mesa:", err.message);
    throw err;
  } finally {
    conn.release();
  }
},

facturaPorCaja: async (id_caja) => {

const sql = `
SELECT  
    v.id AS id_venta,
    p.id AS id_pago,
    v.numero_factura,
     TO_CHAR(p.fecha, 'HH24:MI') AS fecha,
     TO_CHAR(p.fecha, 'DD/MM/YYYY HH24:MI:SS') AS fecha_completa,
     TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') AS fecha_impresion,
    CONCAT(p2.nombres,' ',p2.apellidos) AS nombre_vendedor,
    per.identificacion AS identificacion_cliente,
    CONCAT(per.nombres,' ',per.apellidos) AS nombre_completo,
    per.telefono,
    per.email,
    v.subtotal AS venta_total,
    p.estado_pago,
    p.metodo_pago,
    m.id as id_mesa,
    m.nombre as mesa,
    v.nota

FROM ventas v
INNER JOIN pagos p ON p.id_venta = v.id
INNER JOIN personas per ON per.id = v.id_cliente
INNER JOIN caja c on v.id_caja=c.id
INNER JOIN usuarios u on c.id_usuario=u.id
INNER JOIN personas p2 on  u.id_persona=p2.id
LEFT JOIN mesas m on  v.id_mesa=m.id
WHERE v.id_caja = $1
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
    pp.precio_venta as precio_unitario,
    vi.subtotal,
    COALESCE(pi.url, '') AS url_imagen
FROM ventas_items vi
INNER JOIN productos pro  ON pro.id = vi.id_producto
INNER JOIN productos_precios pp on pro.id=pp.id_producto
LEFT JOIN productos_imagenes pi ON pi.id_producto = pro.id

WHERE vi.id_venta = $1
`;

const [rows] = await db.query(sql,[id_venta]);

return rows;

},
}





export default CajeroService;
