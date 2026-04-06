import { db } from "../config/db.js";

export const VentasService = {
  // Crear una venta con sus items

      // Obtener  resumen todas las ventas
  resumenventas: async (id_negocio) => {
    const [rows] = await db.query(
   //   `SELECT * FROM ventas ORDER BY fecha DESC`

        `SELECT  
    TO_CHAR(v.fecha, 'YYYY-MM-DD') AS fecha,  -- solo día
    SUM(CAST(v.total AS NUMERIC)) AS total,   -- suma total del día
    SUM(CAST(e.monto AS NUMERIC)) AS egresos,  -- suma egresos
    COUNT(v.id) AS cantidad                    -- cantidad de facturas
    FROM ventas v
    INNER JOIN caja c ON v.id_caja = c.id
    INNER JOIN usuarios u ON c.id_usuario = u.id
    INNER JOIN negocios n ON u.id_negocio = n.id
    LEFT JOIN egresos e on c.id=e.id_caja
    WHERE n.id = $1
    And v.estado!='cancelado'
    GROUP BY TO_CHAR(v.fecha, 'YYYY-MM-DD')
    ORDER BY fecha ASC;`
    ,[id_negocio]);

    
    return rows;
  },
 
    // Obtener todas las ventas por fecha
  
    listarVentas: async (id_negocio, fecha) => {
    console.log("fecha", fecha);

    const [rows] = await db.query(
      `SELECT  
          v.id,
          p.id AS id_pago,
          v.numero_factura,
          TO_CHAR(v.fecha, 'YYYY-MM-DD') AS fecha,
          TO_CHAR(v.fecha, 'HH12:MI:SS AM') AS hora,
          TO_CHAR(NOW() AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY HH12:MI:SS AM')::TEXT AS fecha_impresion, 
          CONCAT(p2.nombres,' ',p2.apellidos) AS nombre_vendedor,
          per.identificacion AS identificacion_cliente,
          CONCAT(per.nombres,' ',per.apellidos) AS nombre_completo,
          per.telefono,
          per.email,
          v.subtotal AS venta_total,
          p.estado_pago,
          p.metodo_pago,
          p.monto_recibido,
          p.cambio,
          m.id as id_mesa,
          m.nombre as mesa,
          v.nota,
          v.estado as estado_venta,
          e.monto,
          c.id as id_caja
      FROM ventas v
      INNER JOIN pagos p ON p.id_venta = v.id
      INNER JOIN personas per ON per.id = v.id_cliente
      INNER JOIN caja c on v.id_caja=c.id
      INNER JOIN usuarios u on c.id_usuario=u.id
      INNER JOIN negocios n on u.id_negocio=n.id
      INNER JOIN personas p2 on u.id_persona=p2.id
      LEFT JOIN mesas m on v.id_mesa=m.id
      LEFT JOIN egresos e on e.id_caja=c.id
      WHERE n.id = $1
        AND DATE(v.fecha) = $2
      ORDER BY p.id DESC`,
      [id_negocio, fecha]
    );

    return rows;
},
 
};
