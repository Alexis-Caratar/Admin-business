import { db } from "../config/db.js";

export const ComprasService = {
listarCompras: async (id_negocio) => {
  
  const [rows] = await db.query(`
  
    SELECT
      c.id,
      c.numero_compra,
      c.numero_factura,
      c.fecha_compra,
      c.total,
      c.estado,
      c.tipo_documento,
      p.identificacion,
      CONCAT(p.nombres,' ',COALESCE(p.apellidos,'')) proveedor,
      mp.nombre metodo_pago
    FROM compras c
    INNER JOIN personas p ON p.id = c.id_proveedor
    INNER JOIN metodos_pago mp ON mp.id = c.id_metodo_pago
    WHERE c.id_negocio = $1
    ORDER BY c.id DESC

  `,[id_negocio]);

  return rows;
},detalleCompra: async (id_compra) => {

  const [rows] = await db.query(`
  
    SELECT
      ci.id,
      ci.cantidad,
      ci.costo_unitario,
      ci.subtotal,
      pr.codigo,
      pr.nombre
    FROM compras_items ci

    INNER JOIN productos pr
      ON pr.id = ci.id_producto

    WHERE ci.id_compra = $1

    ORDER BY ci.id

  `,[id_compra]);

  return rows;
},
crearCompra: async (data) => {

  const client = await db.connect();

  try {

    await client.query("BEGIN");

    const total = data.items.reduce(
      (acc,item) =>
      acc + (item.cantidad * item.costo_unitario),
      0
    );

    const compra = await client.query(`
    
      INSERT INTO compras(
        id_negocio,
        id_proveedor,
        id_metodo_pago,
        numero_factura,
        fecha_compra,
        tipo_compra,
        subtotal,
        total,
        observacion,
        estado
      )
      VALUES(
        $1,$2,$3,$4,
        NOW(),
        $5,
        $6,
        $6,
        $7,
        'activa'
      )
      RETURNING *

    `,[
      data.id_negocio,
      data.id_proveedor,
      data.id_metodo_pago,
      data.numero_factura,
      data.tipo_compra,
      total,
      data.observacion
    ]);

    const id_compra = compra.rows[0].id;

    for(const item of data.items){

      const subtotal =
        item.cantidad *
        item.costo_unitario;

      await client.query(`
      
        INSERT INTO compras_items(
          id_compra,
          id_producto,
          cantidad,
          costo_unitario,
          subtotal
        )
        VALUES($1,$2,$3,$4,$5)

      `,[
        id_compra,
        item.id_producto,
        item.cantidad,
        item.costo_unitario,
        subtotal
      ]);

      // ACTUALIZAR STOCK

      await client.query(`
      
        UPDATE productos
        SET stock =
            COALESCE(stock,0) + $1
        WHERE id = $2
      
      `,[
        item.cantidad,
        item.id_producto
      ]);

    }

    await client.query("COMMIT");

    return compra.rows[0];

  } catch(error){

    await client.query("ROLLBACK");
    throw error;

  } finally {

    client.release();

  }

},
 
};
