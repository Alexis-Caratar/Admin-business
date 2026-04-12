import { db, pool } from "../config/db.js";

const TABLE = "productos";
const TABLE_IMAGENES = "productos_imagenes";
const TABLE_PRECIOS = "productos_precios";
const TABLE_RECETA = "recetas";

export const listar = async (id_categoria) => {

  // 1️⃣ PRODUCTOS
  const { rows: productos } = await pool.query(
    `SELECT * FROM ${TABLE} WHERE id_categoria = $1 ORDER BY id DESC`,
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

  // 4️⃣ MAPEO FINAL
  const productosFinal = productos.map(p => {
    const precio = precios.find(pr => pr.id_producto === p.id) || null;
    const imgs = imagenes.filter(img => img.id_producto === p.id);
    const rec = recetas.filter(r => r.producto_id === p.id);

    return {
      ...p,
      precios: precio,
      imagenes: imgs,
      receta: rec

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

export const obtener_inventario = async (datos) => {
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
    ORDER BY nombre;
    `,
    [ tipo]
  );
 

  return inventario;
};


// Crear producto completo
export const crear = async (payload) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { producto, productos_imagenes, productos_precios, receta } = payload;

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
export const actualizar = async (id, payload) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { producto, productos_imagenes, productos_precios,receta } = payload;

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
