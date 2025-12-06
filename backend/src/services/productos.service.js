import { db } from "../config/db.js";

const TABLE = "productos";
const TABLE_IMAGENES = "productos_imagenes";
const TABLE_PRECIOS = "productos_precios";
// Listar todos los productos
export const listar = async (id_categoria) => {

  // 1️⃣ CONSULTAR PRODUCTOS
  const [productos] = await db.query(
    `SELECT * FROM  ${TABLE} WHERE id_categoria = ? ORDER BY id DESC`,
    [id_categoria]
  );

  if (productos.length === 0) return [];

  const ids = productos.map(p => p.id);

  // 2️⃣ CONSULTAR PRECIOS DE ESOS PRODUCTOS
  const [precios] = await db.query(
    `SELECT * FROM ${TABLE_PRECIOS} WHERE id_producto IN (?)`,
    [ids]
  );

  // 3️⃣ CONSULTAR IMÁGENES DE ESOS PRODUCTOS
  const [imagenes] = await db.query(
    `SELECT * FROM ${TABLE_IMAGENES} WHERE id_producto IN (?) ORDER BY orden ASC`,
    [ids]
  );

  // 4️⃣ ARMAR RESPUESTA FINAL
  const productosFinal = productos.map(p => {
    const precio = precios.find(pr => pr.id_producto === p.id) || null;
    const imgs = imagenes.filter(img => img.id_producto === p.id);

    return {
      ...p,
      precios: precio,
      imagenes: imgs
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
    WHERE p.id = ?
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


// Crear producto completo
export const crear = async (payload) => {
  const { producto, productos_imagenes, productos_precios } = payload;

  // 1️⃣ Insertar producto
  const keys = Object.keys(producto).join(", ");
  const placeholders = Object.keys(producto).map(() => "?").join(", ");
  const values = Object.values(producto);

  const sqlProd = `INSERT INTO ${TABLE} (${keys}) VALUES (${placeholders})`;
  const [result] = await db.query(sqlProd, values);
  const productoId = result.insertId;

  // 2️⃣ Insertar imágenes
  if (productos_imagenes && productos_imagenes.length > 0) {
    for (const img of productos_imagenes) {
      const sqlImg = `INSERT INTO ${TABLE_IMAGENES} (id_producto, url, orden, activo) VALUES (?, ?, ?, ?)`;
      await db.query(sqlImg, [productoId, img.url, img.orden || 0, img.activo || 1]);
    }
  }

  // 3️⃣ Insertar precios
  if (productos_precios && productos_precios.length > 0) {
    for (const precio of productos_precios) {
      const sqlPrecio = `INSERT INTO ${TABLE_PRECIOS} (id_producto, precio_costo, precio_venta, precio_anterior, precio_mayorista, descuento_valor, descuento_porcentaje, activo_promo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      await db.query(sqlPrecio, [
        productoId,
        precio.precio_costo || 0,
        precio.precio_venta || 0,
        precio.precio_anterior || 0,
        precio.precio_mayorista || 0,
        precio.descuento_valor || 0,
        precio.descuento_porcentaje || 0,
        precio.activo_promo || 0
      ]);
    }
  }

  return { id: productoId, ...producto };
};

// Actualizar producto completo
export const actualizar = async (id, payload) => {
  const { producto, productos_imagenes, productos_precios } = payload;

  // 1️⃣ Actualizar producto
  const sets = Object.keys(producto)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(producto);
  const sqlProd = `UPDATE ${TABLE} SET ${sets} WHERE id = ?`;
  console.log(sqlProd, [...values, id])
  
  await db.query(sqlProd, [...values, id]);

  // 2️⃣ Actualizar o insertar imágenes
  if (productos_imagenes && productos_imagenes.length > 0) {
    console.log("ingresando en imagenes");
    
    for (const img of productos_imagenes) {
      if (img.id) {
        const sqlImg = `UPDATE ${TABLE_IMAGENES} SET url = ?, orden = ?, activo = ? WHERE id = ?`;
        await db.query(sqlImg, [img.url, img.orden || 0, img.activo || 1, img.id]);
      } else {
        const sqlImg = `INSERT INTO ${TABLE_IMAGENES} (id_producto, url, orden, activo) VALUES (?, ?, ?, ?)`;
        await db.query(sqlImg, [id, img.url, img.orden || 0, img.activo || 1]);
      }
    }
  }

  // 3️⃣ Actualizar o insertar precios
  if (productos_precios && productos_precios.length > 0) {
    console.log("ingresando en precios");
    for (const precio of productos_precios) {
      if (precio.id) {
        const sqlPrecio = `UPDATE ${TABLE_PRECIOS} SET precio_costo = ?, precio_venta = ?, precio_anterior = ?, precio_mayorista = ?, descuento_valor = ?, descuento_porcentaje = ?, activo_promo = ? WHERE id = ?`;
       
       
        await db.query(sqlPrecio, [
          precio.precio_costo || 0,
          precio.precio_venta || 0,
          precio.precio_anterior || 0,
          precio.precio_mayorista || 0,
          precio.descuento_valor || 0,
          precio.descuento_porcentaje || 0,
          precio.activo_promo || 0,
          precio.id,
        ]);
      } else {
        const sqlPrecio = `INSERT INTO ${TABLE_PRECIOS} (id_producto, precio_costo, precio_venta, precio_anterior, precio_mayorista, descuento_valor, descuento_porcentaje, activo_promo) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sqlPrecio, [
          id,
          precio.precio_costo || 0,
          precio.precio_venta || 0,
          precio.precio_anterior || 0,
          precio.precio_mayorista || 0,
          precio.descuento_valor || 0,
          precio.descuento_porcentaje || 0,
          precio.activo_promo || 0,
        ]);
      }
    }
  }

  return { id, ...producto };
};

// Eliminar un producto
export const eliminar = async (id) => {
  console.log("id a eliminar",id);
  
  await db.query(
    `DELETE FROM ${TABLE} WHERE id = ?`,
    [id]
  );
};
