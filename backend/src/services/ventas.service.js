import { db } from "../config/db.js";

export const VentasService = {
  // Crear una venta con sus items

      // Obtener  resumen todas las ventas
 resumenventas: async ({id_negocio,tipoFiltro,fechaInicio = null,fechaFin = null}) => {

    console.log("{id_negocio,tipoFiltro,fechaInicio = null,fechaFin = null}",id_negocio,tipoFiltro,fechaInicio ,fechaFin);
    
  let filtroFecha = "";

  switch (tipoFiltro) {

    case "hoy":
      filtroFecha = `AND (v.fecha AT TIME ZONE 'America/Bogota')::date =
            (NOW() AT TIME ZONE 'America/Bogota')::date
      `;
      break;

    case "ayer":
      filtroFecha = `AND (v.fecha AT TIME ZONE 'America/Bogota')::date =
            ((NOW() AT TIME ZONE 'America/Bogota')::date - INTERVAL '1 day')
      `;
      break;

    case "semana_actual":
      filtroFecha = `AND DATE_TRUNC(
              'week',
              (v.fecha AT TIME ZONE 'America/Bogota')
            ) =
            DATE_TRUNC(
              'week',
              (NOW() AT TIME ZONE 'America/Bogota')
            )
      `;
      break;

    case "semana_anterior":
      filtroFecha = `AND DATE_TRUNC(
              'week',
              (v.fecha AT TIME ZONE 'America/Bogota')
            ) =
            DATE_TRUNC(
              'week',
              (NOW() AT TIME ZONE 'America/Bogota')
            ) - INTERVAL '1 week'
      `;
      break;

    case "mes_actual":
      filtroFecha = `
        AND EXTRACT(MONTH FROM (v.fecha AT TIME ZONE 'America/Bogota'))
            =
            EXTRACT(MONTH FROM (NOW() AT TIME ZONE 'America/Bogota'))
        AND EXTRACT(YEAR FROM (v.fecha AT TIME ZONE 'America/Bogota'))
            =
            EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'America/Bogota'))
      `;
      break;

    case "mes_anterior":
      filtroFecha = `
        AND DATE_TRUNC(
              'month',
              (v.fecha AT TIME ZONE 'America/Bogota')
            ) =
            DATE_TRUNC(
              'month',
              (NOW() AT TIME ZONE 'America/Bogota')
            ) - INTERVAL '1 month'
      `;
      break;

    case "anio":
      filtroFecha = `
        AND EXTRACT(YEAR FROM (v.fecha AT TIME ZONE 'America/Bogota'))
            =
            EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'America/Bogota'))
      `;
      break;

    case "fecha_fecha":
      if (fechaInicio && fechaFin) {
        filtroFecha = `
          AND (v.fecha AT TIME ZONE 'America/Bogota')::date
              BETWEEN '${fechaInicio}' AND '${fechaFin}'
        `;
      }
      break;
  }

  const [rows] = await db.query(
    `
    SELECT
        v.fecha,
        TO_CHAR(v.fecha, 'TMDay') AS dia,
        v.total,
        COALESCE(e.egresos, 0) AS egresos,
        v.cantidad
    FROM (
        SELECT
            (v.fecha AT TIME ZONE 'America/Bogota')::date AS fecha,
            SUM(v.total) AS total,
            COUNT(v.id) AS cantidad
        FROM ventas v
        INNER JOIN caja c ON v.id_caja = c.id
        INNER JOIN usuarios u ON c.id_usuario = u.id
        INNER JOIN negocios n ON u.id_negocio = n.id
        WHERE n.id = $1
          AND v.estado <> 'cancelado'
          ${filtroFecha}
        GROUP BY (v.fecha AT TIME ZONE 'America/Bogota')::date
    ) v

    LEFT JOIN (
        SELECT
            (e.created_at AT TIME ZONE 'America/Bogota')::date AS fecha,
            SUM(e.monto) AS egresos
        FROM egresos e
        GROUP BY (e.created_at AT TIME ZONE 'America/Bogota')::date
    ) e ON v.fecha = e.fecha

    ORDER BY v.fecha ASC
    `,
    [id_negocio]
  );

  return rows;
},
 
    // Obtener todas las ventas por fecha
  
    listarVentas: async (id_negocio, fecha) => {

    const [rows] = await db.query(
      `SELECT  DISTINCT
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
          c.id as id_caja
      FROM ventas v
      INNER JOIN pagos p ON p.id_venta = v.id
      INNER JOIN personas per ON per.id = v.id_cliente
      INNER JOIN caja c on v.id_caja=c.id
      INNER JOIN usuarios u on c.id_usuario=u.id
      INNER JOIN negocios n on u.id_negocio=n.id
      INNER JOIN personas p2 on u.id_persona=p2.id
      LEFT JOIN mesas m on v.id_mesa=m.id
      WHERE n.id = $1
        AND DATE(v.fecha) = $2
      ORDER BY p.id DESC`,
      [id_negocio, fecha]
    );

    return rows;
},
 
};
