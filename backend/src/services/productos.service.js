import { db, pool } from "../config/db.js";

const TABLE = "productos";
const TABLE_IMAGENES = "productos_imagenes";
const TABLE_PRECIOS = "productos_precios";
const TABLE_RECETA = "recetas";
const TABLE_COMPLEMENTOS = "productos_complementos ";

const normalizar = (texto = "") => texto.trim().replace(/\s+/g, " ");

// Inventario de un PRODUCTO FINAL desde el formulario del producto:
// - inventario.inventario_id → usa ese ítem (debe ser del negocio)
// - sin id → busca uno con el mismo nombre; si no existe lo crea
// - inventario.cantidad > 0 → registra una ENTRADA y suma al stock
// Devuelve el id del inventario para guardarlo en productos.inventario_id
const prepararInventario = async (client, inventario, producto, costo, { id_negocio, id_usuario }) => {
  let inventarioId = null;
  let nuevo = false;

  if (inventario.inventario_id) {
    const { rows } = await client.query(
      `SELECT id FROM inventario WHERE id = $1 AND id_negocio = $2`,
      [inventario.inventario_id, id_negocio]
    );
    if (!rows.length) throw Object.assign(new Error("El inventario seleccionado no existe"), { status: 400 });
    inventarioId = rows[0].id;
  } else {
    const nombre = normalizar(inventario.nombre || producto.nombre);
    if (!nombre) throw Object.assign(new Error("El producto necesita un nombre para crear su inventario"), { status: 400 });

    const { rows: existentes } = await client.query(
      `SELECT id FROM inventario
       WHERE id_negocio = $1 AND tipo = 'PRODUCTO' AND LOWER(TRIM(nombre)) = LOWER($2)
       ORDER BY id LIMIT 1`,
      [id_negocio, nombre]
    );

    if (existentes.length) {
      inventarioId = existentes[0].id;
    } else {
      const { rows } = await client.query(
        `INSERT INTO inventario
         (nombre, unidad, tipo, stock_actual, stock_minimo, stock_maximo, costo_unitario, estado, created_at, id_negocio)
         VALUES ($1, $2, 'PRODUCTO', 0, $3, 0, $4, true, NOW(), $5)
         RETURNING id`,
        [nombre, inventario.unidad || "UND", Number(inventario.stock_minimo) || 0, Number(costo) || 0, id_negocio]
      );
      inventarioId = rows[0].id;
      nuevo = true;
    }
  }

  const cantidad = Number(inventario.cantidad) || 0;
  if (cantidad < 0) throw Object.assign(new Error("La cantidad a cargar no puede ser negativa"), { status: 400 });

  if (cantidad > 0) {
    await client.query(
      `INSERT INTO inventario_movimientos (inventario_id, tipo, cantidad, motivo, id_usuario)
       VALUES ($1, 'ENTRADA', $2, $3, $4)`,
      [inventarioId, cantidad, nuevo ? "Carga inicial desde producto" : "Entrada desde producto", id_usuario]
    );
    await client.query(
      `UPDATE inventario SET stock_actual = COALESCE(stock_actual, 0) + $1 WHERE id = $2`,
      [cantidad, inventarioId]
    );
  }

  return inventarioId;
};


export const listar = async (id_categoria) => {

  // 1️⃣ PRODUCTOS
  const { rows: productos } = await pool.query(
    `SELECT *, case when usa_receta=true then 'receta' 
    when inventario_id is not null then 'producto' else 'sin_inventario'
     end as tipo_control 
    FROM ${TABLE} WHERE id_categoria = $1 
    ORDER BY id DESC`,
    [id_categoria]
  );

  const ids = productos.map(p => p.id);

  // 2️⃣ PRECIOS (POSTGRES usa ANY)
  const { rows: precios } = await pool.query(
    `SELECT * FROM ${TABLE_PRECIOS} WHERE id_producto = ANY($1)`,
    [ids]
  );

  // 3️⃣ IMÁGENES
  const { rows: imagenes } = await pool.query(
    `SELECT * FROM ${TABLE_IMAGENES} 
     WHERE id_producto = ANY($1) 
     ORDER BY orden ASC`,
    [ids]
  );

  // 4 recetas
  const { rows: recetas } = await pool.query(
    `SELECT r.*, i.nombre as inventario_nombre FROM ${TABLE_RECETA} r 
     inner join inventario i on i.id = r.inventario_id
     WHERE producto_id = ANY($1) 
     ORDER BY id ASC`,
    [ids]
  );

   const { rows: productos_complementos } = await pool.query(
    `SELECT * FROM ${TABLE_COMPLEMENTOS} 
     WHERE id_producto_complemento = ANY($1) 
     and estado=true
     ORDER BY id ASC`,
    [ids]
  );

  // 4️⃣ MAPEO FINAL
  const productosFinal = productos.map(p => {
    const precio = precios.find(pr => pr.id_producto === p.id) || null;
    const imgs = imagenes.filter(img => img.id_producto === p.id);
    const rec = recetas.filter(r => r.producto_id === p.id);
   const comple = productos_complementos.filter(r => r.id_producto === p.id);


    return {
      ...p,
      precios: precio,
      imagenes: imgs,
      receta: rec,
      productos_complementos:comple

    };
  });

  return productosFinal;
};


// Obtener un producto por ID
export const obtener = async (id) => {

  const [[producto]] = await db.query(
    `
    SELECT 
        p.*,
        pp.precio_costo,
        pp.precio_venta,
        pp.precio_anterior,
        pp.precio_mayorista,
        pp.descuento_valor,
        pp.descuento_porcentaje,
        pp.activo_promo
    FROM productos p
    LEFT JOIN productos_precios pp ON pp.id_producto = p.id
    WHERE p.id = $1
    `,
    [id]
  );

  if (!producto) return null;

  // Obtener todas las imágenes
  const [imagenes] = await db.query(
    `
    SELECT url 
    FROM producto_imagenes 
    WHERE id_producto = ? AND activo = 1
    ORDER BY orden ASC
    `,
    [id]
  );

  return {
    ...producto,
    imagenes
  };
};

export const obtener_inventario = async (datos,id_negocio) => {
  const { id, tipo } = datos;

  const [inventario] = await db.query(
    `
    SELECT 
      id,
      nombre,
      stock_actual,
      unidad
    FROM inventario
    WHERE tipo = $1
    AND estado = true
    and id_negocio=$2
    ORDER BY nombre;
    `,
    [ tipo,id_negocio]
  );
 

  return inventario;
};


// Crear producto completo
export const crear = async (payload, ctx) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { producto, productos_imagenes, productos_precios, receta,productos_complementos, inventario } = payload;

    // 0️⃣ INVENTARIO DEL PRODUCTO FINAL (crear / tomar existente / cargar stock)
    if (inventario && !producto.usa_receta) {
      producto.inventario_id = await prepararInventario(
        client, inventario, producto, productos_precios?.[0]?.precio_costo, ctx
      );
    }

    // ============================
    // 1️⃣ INSERTAR PRODUCTO
    // ============================
    const keys = Object.keys(producto);
    const values = Object.values(producto);

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

    const { rows: productoRows } = await client.query(
      `
      INSERT INTO ${TABLE} (${keys.join(", ")})
      VALUES (${placeholders})
      RETURNING *
      `,
      values
    );

    const productoId = productoRows[0].id;

    // 2️⃣ INSERTAR IMÁGENES
    // ============================
    if (productos_imagenes?.length > 0) {
      for (const img of productos_imagenes) {
        await client.query(
          `
          INSERT INTO ${TABLE_IMAGENES}
          (id_producto, url, orden, activo)
          VALUES ($1, $2, $3, $4)
          `,
          [
            productoId,
            img.url?.trim() || null,
            img.orden ?? 0,
            img.activo ?? true,
          ]
        );
      }
    }

    // 3️⃣ INSERTAR PRECIOS
    // ============================
    if (productos_precios?.length > 0) {
      for (const precio of productos_precios) {
        await client.query(
          `
          INSERT INTO ${TABLE_PRECIOS}
          (
            id_producto,
            precio_costo,
            precio_venta,
            precio_anterior,
            precio_mayorista,
            descuento_valor,
            descuento_porcentaje,
            activo_promo
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            productoId,
            precio.precio_costo ?? 0,
            precio.precio_venta ?? 0,
            precio.precio_anterior ?? 0,
            precio.precio_mayorista ?? 0,
            precio.descuento_valor ?? 0,
            precio.descuento_porcentaje ?? 0,
            precio.activo_promo ?? false,
          ]
        );
      }
    }

// 4 INSERTAR receta
    // ============================
     if (receta?.length > 0) {
      for (const rect of receta) {
        await client.query(
          `
          INSERT INTO ${TABLE_RECETA}
          (producto_id, inventario_id, cantidad)
          VALUES ($1, $2, $3)
          `,
          [
            productoId,
            rect.inventario_id,
            rect.cantidad ?? 0,
          ]
        );
      }
    }



// 5 INSERTAR PRODUCTOS COMPLEMENTOS
// ============================

if (productos_complementos?.length > 0) {
  for (const complemento of productos_complementos) {
    await client.query(
      `
      INSERT INTO productos_complementos
      (
        id_producto,
        id_producto_complemento,
        tipo_seleccion,
        obligatorio,
        orden,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        productoId,
        complemento.id_producto_relacionado,
        complemento.tipo_seleccion ?? "unico",
        complemento.obligatorio ?? false,
        complemento.orden ?? 0,
        complemento.estado ?? true
      ]
    );
  }
}
    await client.query("COMMIT");

    return productoRows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creando producto:", error);
    throw error;
  } finally {
    client.release();
  }
};
// Actualizar producto completo
export const actualizar = async (id, payload, ctx) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { producto, productos_imagenes, productos_precios,receta,productos_complementos, inventario } = payload;

    // 0️⃣ INVENTARIO DEL PRODUCTO FINAL (crear / tomar existente / cargar stock)
    if (inventario && producto && !producto.usa_receta) {
      producto.inventario_id = await prepararInventario(
        client, inventario, producto, productos_precios?.[0]?.precio_costo, ctx
      );
    }

    // ============================
    // 1️⃣ ACTUALIZAR PRODUCTO
    // ============================
    if (producto && Object.keys(producto).length > 0) {
      const keys = Object.keys(producto);
      const values = Object.values(producto);

      const setClause = keys
        .map((key, i) => `${key} = $${i + 1}`)
        .join(", ");

      await client.query(
        `
        UPDATE ${TABLE}
        SET ${setClause}
        WHERE id = $${keys.length + 1}
        `,
        [...values, id]
      );
    }

    // ============================
    // 2️⃣ IMÁGENES
    // ============================
    if (productos_imagenes && productos_imagenes.length > 0) {
      for (const img of productos_imagenes) {
        const cleanUrl = img.url?.trim() || null;

        if (img.id) {
          await client.query(
            `
            UPDATE ${TABLE_IMAGENES}
            SET url = $1, orden = $2, activo = $3
            WHERE id = $4
            `,
            [
              cleanUrl,
              img.orden ?? 0,
              img.activo ?? true,
              img.id,
            ]
          );
        } else {
          await client.query(
            `
            INSERT INTO ${TABLE_IMAGENES}
            (id_producto, url, orden, activo)
            VALUES ($1, $2, $3, $4)
            `,
            [
              id,
              cleanUrl,
              img.orden ?? 0,
              img.activo ?? true,
            ]
          );
        }
      }
    }

    // ============================
    // 3️⃣ PRECIOS
    // ============================
    if (productos_precios && productos_precios.length > 0) {
      for (const precio of productos_precios) {
        if (precio.id) {
          await client.query(
            `
            UPDATE ${TABLE_PRECIOS}
            SET 
              precio_costo = $1,
              precio_venta = $2,
              precio_anterior = $3,
              precio_mayorista = $4,
              descuento_valor = $5,
              descuento_porcentaje = $6,
              activo_promo = $7
            WHERE id = $8
            `,
            [
              precio.precio_costo ?? 0,
              precio.precio_venta ?? 0,
              precio.precio_anterior ?? 0,
              precio.precio_mayorista ?? 0,
              precio.descuento_valor ?? 0,
              precio.descuento_porcentaje ?? 0,
              precio.activo_promo ?? false,
              precio.id,
            ]
          );
        } else {
          await client.query(
            `
            INSERT INTO ${TABLE_PRECIOS}
            (
              id_producto,
              precio_costo,
              precio_venta,
              precio_anterior,
              precio_mayorista,
              descuento_valor,
              descuento_porcentaje,
              activo_promo
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [
              id,
              precio.precio_costo ?? 0,
              precio.precio_venta ?? 0,
              precio.precio_anterior ?? 0,
              precio.precio_mayorista ?? 0,
              precio.descuento_valor ?? 0,
              precio.descuento_porcentaje ?? 0,
              precio.activo_promo ?? false,
            ]
          );
        }
      }
    }


      // 4 receta
        
      await client.query(`DELETE FROM ${TABLE_RECETA} WHERE producto_id = $1`, [id]);

      for (const rect of receta) {
        await client.query(
          `
          INSERT INTO ${TABLE_RECETA}
          (producto_id, inventario_id, cantidad)
          VALUES ($1, $2, $3)
          `,
          [id, rect.inventario_id, rect.cantidad]
        );
      }


      // ============================
// GUARDAR PRODUCTOS COMPLEMENTOS
// ============================

// elimina los anteriores
await client.query(
  `
  DELETE FROM productos_complementos 
  WHERE id_producto = $1
  `,
  [id]
);

// inserta los nuevos
if (productos_complementos?.length > 0) {
  for (const complemento of productos_complementos) {
    await client.query(
      `
      INSERT INTO productos_complementos 
      (
        id_producto,
        id_producto_complemento,
        tipo_seleccion,
        obligatorio,
        orden,
        estado
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        id,
        complemento.id_producto_complemento,
        complemento.tipo_seleccion ?? "unico",
        complemento.obligatorio ?? false,
        complemento.orden ?? 0,
        complemento.estado ?? true
      ]
    );
  }
}


    await client.query("COMMIT");

    return { id, ...producto };

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error actualizar producto:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Eliminar un producto
export const eliminar = async (id) => {
  
  await db.query(
    `DELETE FROM ${TABLE} WHERE id = $1`,
    [id]
  );
};
