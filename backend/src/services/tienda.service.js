// Tienda web pública: catálogo, creación de pedidos y pagos en línea.
// Precios, disponibilidad y totales se calculan SIEMPRE aquí, nunca en el navegador.
import crypto from "crypto";
import { pool } from "../config/db.js";
import { configTienda, configWompi } from "../config/tienda.js";
import { configNegocio, wompiNegocio } from "../config/integraciones.js";
import * as wompi from "./pagos/wompi.service.js";
import { notificarPedido } from "../websockets.js";
import { configuracionTienda, resolverNegocio } from "./sitio.service.js";
import { sqlConStock, sqlStockDisponible } from "./disponibilidad.js";
import { encolarAviso } from "./notificaciones/whatsapp.service.js";

const errorHttp = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });

// Misma regla de disponibilidad que el POS (cajero.service listarProductos):
// producto activo, dentro de su horario (hora Colombia) y con stock si lo controla.
const SQL_HORA = `(CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::time`;
const sqlEnHorario = (p) => `(
  (${p}.hora_inicio <= ${p}.hora_fin AND ${SQL_HORA} BETWEEN ${p}.hora_inicio AND ${p}.hora_fin)
  OR (${p}.hora_inicio > ${p}.hora_fin AND (${SQL_HORA} >= ${p}.hora_inicio OR ${SQL_HORA} <= ${p}.hora_fin))
)`;

// "1" o "punto-urbano" → id del negocio
export const idNegocio = (ref) => resolverNegocio(ref);

// ------------------------------------------------------------------
// ESTADO DE LA TIENDA (abierta / cerrada y opciones de compra)
// ------------------------------------------------------------------
// Abierto ahora según negocios_horarios (hora Colombia). Un rango que pasa de
// medianoche (ej. 18:00–02:00) cuenta también en la madrugada del día siguiente.
// Sin horarios registrados se considera abierto.
const SQL_EN_HORARIO = `
  WITH ahora AS (SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota') AS t)
  SELECT NOT EXISTS (SELECT 1 FROM negocios_horarios WHERE id_negocio = $1)
      OR EXISTS (
        SELECT 1 FROM negocios_horarios h, ahora
        WHERE h.id_negocio = $1 AND (
          (h.hora_apertura < h.hora_cierre AND h.dia_semana = EXTRACT(DOW FROM ahora.t)
             AND ahora.t::time >= h.hora_apertura AND ahora.t::time < h.hora_cierre)
          OR (h.hora_apertura > h.hora_cierre AND (
               (h.dia_semana = EXTRACT(DOW FROM ahora.t) AND ahora.t::time >= h.hora_apertura)
            OR (h.dia_semana = (EXTRACT(DOW FROM ahora.t)::int + 6) % 7 AND ahora.t::time < h.hora_cierre)))
        )) AS en_horario,
      EXISTS (SELECT 1 FROM caja c JOIN usuarios u ON u.id = c.id_usuario
              WHERE u.id_negocio = $1 AND c.estado = 'ABIERTA') AS caja_abierta`;

export const estadoTienda = async (id_negocio, db = pool) => {
  const cfg = await configuracionTienda(id_negocio, db);
  // Sin tienda ni sitio publicado no hay nada que mostrar
  if (!cfg || (!cfg.activa && !cfg.publicado)) throw errorHttp(404, "Tienda no encontrada");
  const { rows: [n] } = await db.query(SQL_EN_HORARIO, [id_negocio]);
  const integ = await configNegocio(id_negocio, db);

  let motivo = null;
  // Sitio publicado sin tienda en línea: catálogo visible, sin pedidos
  if (!cfg.activa) motivo = "Por ahora no recibimos pedidos en línea.";
  else if (integ.tienda.validarHorario && !n.en_horario) motivo = "Estamos fuera del horario de atención.";
  else if (cfg.requiereCajaAbierta && !n.caja_abierta) motivo = "En este momento no estamos recibiendo pedidos.";

  return {
    nombre: cfg.nombre,
    activa: cfg.activa,
    abierta: motivo === null,
    motivo,
    horarios: cfg.horarios,
    entrega: {
      domicilio: cfg.permiteDomicilio,
      recoger: cfg.permiteRecoger,
      costo_domicilio: cfg.costoDomicilio,
      domicilio_gratis_desde: cfg.domicilioGratisDesde || null,
    },
    pedido_minimo: cfg.pedidoMinimo || null,
    pagos: { en_linea: integ.wompi.habilitado, contraentrega: cfg.permiteContraentrega },
  };
};

// ------------------------------------------------------------------
// CATÁLOGO PÚBLICO (misma forma que /cajero/productos para la landing)
// ------------------------------------------------------------------
// Precio anterior solo si es una promoción real (mayor que el precio de venta)
const sqlPrecioAnterior = (pp) => `CASE WHEN ${pp}.precio_anterior > ${pp}.precio_venta THEN ${pp}.precio_anterior::float END`;

// Producto tal como lo ve la tienda (catálogo, relacionados). p/pp/i: alias.
const sqlPlatoJson = (p, pp, i) => `jsonb_build_object(
  'id', ${p}.id,
  'nombre', ${p}.nombre,
  'descripcion', ${p}.descripcion,
  'marca', ${p}.marca,
  'precio_venta', ${pp}.precio_venta::float,
  'precio_anterior', ${sqlPrecioAnterior(pp)},
  'stock_actual', ${sqlStockDisponible(p, i)}::int,
  'destacado', ${p}.destacado,
  'id_producto_base', ${p}.id_producto_base,
  'variante_nombre', ${p}.variante_nombre,
  'variante_color', ${p}.variante_color,
  'imagenes', (SELECT COALESCE(json_agg(img.url ORDER BY img.orden), '[]')
               FROM productos_imagenes img WHERE img.id_producto = ${p}.id AND COALESCE(img.activo, TRUE) AND img.url IS NOT NULL),
  'productos_complementos', (
    SELECT COALESCE(json_agg(jsonb_build_object(
        'id_producto_complemento', p2.id,
        'nombre', p2.nombre,
        'precio_venta', COALESCE(pp2.precio_venta, 0)::float,
        'obligatorio', pc.obligatorio,
        'tipo_seleccion', pc.tipo_seleccion,
        'orden', pc.orden,
        'estado', pc.estado
      ) ORDER BY pc.orden), '[]')
    FROM productos_complementos pc
    JOIN productos p2 ON p2.id = pc.id_producto_complemento AND p2.estado = TRUE
    LEFT JOIN inventario i2 ON i2.id = p2.inventario_id
    LEFT JOIN productos_precios pp2 ON pp2.id_producto = p2.id
    WHERE pc.id_producto = ${p}.id AND pc.estado = TRUE AND ${sqlConStock("p2", "i2")}
  )
)`;

export const catalogo = async (id_negocio) => {
  const tienda = await estadoTienda(id_negocio);
  const { rows } = await pool.query(
    `SELECT c.id, c.nombre AS categoria, c.imagen,
       json_agg(${sqlPlatoJson("p", "pp", "i")} ORDER BY p.nombre) AS platos
     FROM categorias c
     JOIN productos p ON p.id_categoria = c.id
       AND p.estado = TRUE AND p.publicacion_web = TRUE AND p.es_complemento = FALSE
     JOIN productos_precios pp ON pp.id_producto = p.id AND pp.precio_venta > 0
     LEFT JOIN inventario i ON i.id = p.inventario_id
     WHERE c.id_negocio = $1
       AND ${sqlEnHorario("p")} AND ${sqlConStock("p", "i")}
     GROUP BY c.id, c.nombre, c.imagen
     ORDER BY c.nombre`,
    [id_negocio]
  );
  return { ok: true, tienda, productos: rows };
};

// ------------------------------------------------------------------
// DETALLE DE PRODUCTO (ficha completa, variantes y relacionados)
// Se muestra aunque esté agotado o fuera de horario: "disponible" lo indica.
// ------------------------------------------------------------------
export const detalleProducto = async (id_negocio, idProducto) => {
  const id = Number(idProducto);
  if (!Number.isInteger(id) || id <= 0) throw errorHttp(404, "Producto no encontrado");
  const tienda = await estadoTienda(id_negocio);

  const { rows: [p] } = await pool.query(
    `SELECT p.id, p.nombre, p.descripcion, p.descripcion_detallada, p.marca, NULLIF(p.codigo_barra, '') AS sku,
            p.caracteristicas, p.atributos, p.modo_uso, p.ingredientes, p.cuidados, p.advertencias, p.fabricante,
            p.destacado, p.id_producto_base, p.variante_nombre, p.variante_color,
            c.id AS id_categoria, c.nombre AS categoria,
            pp.precio_venta::float AS precio_venta, ${sqlPrecioAnterior("pp")} AS precio_anterior,
            ${sqlStockDisponible("p", "i")}::int AS stock_actual,
            (${sqlConStock("p", "i")} AND ${sqlEnHorario("p")}) AS disponible,
            ${sqlEnHorario("p")} AS en_horario,
            (SELECT COALESCE(json_agg(img.url ORDER BY img.orden), '[]') FROM productos_imagenes img
             WHERE img.id_producto = p.id AND COALESCE(img.activo, TRUE) AND img.url IS NOT NULL) AS imagenes,
            ${sqlPlatoJson("p", "pp", "i")} -> 'productos_complementos' AS productos_complementos
     FROM productos p
     JOIN categorias c ON c.id = p.id_categoria AND c.id_negocio = $2
     JOIN productos_precios pp ON pp.id_producto = p.id AND pp.precio_venta > 0
     LEFT JOIN inventario i ON i.id = p.inventario_id
     WHERE p.id = $1 AND p.estado = TRUE AND p.publicacion_web = TRUE AND p.es_complemento = FALSE`,
    [id, id_negocio]
  );
  if (!p) throw errorHttp(404, "Producto no encontrado");

  // Variantes: el producto base y todas las que apuntan a él
  const base = p.id_producto_base ?? p.id;
  const { rows: variantes } = await pool.query(
    `SELECT p.id, p.nombre, p.variante_nombre, p.variante_color, NULLIF(p.codigo_barra, '') AS sku,
            pp.precio_venta::float AS precio_venta, ${sqlPrecioAnterior("pp")} AS precio_anterior,
            ${sqlStockDisponible("p", "i")}::int AS stock_actual,
            (${sqlConStock("p", "i")} AND ${sqlEnHorario("p")}) AS disponible,
            (SELECT img.url FROM productos_imagenes img WHERE img.id_producto = p.id AND COALESCE(img.activo, TRUE) AND img.url IS NOT NULL
             ORDER BY img.orden LIMIT 1) AS imagen
     FROM productos p
     JOIN categorias c ON c.id = p.id_categoria AND c.id_negocio = $2
     JOIN productos_precios pp ON pp.id_producto = p.id AND pp.precio_venta > 0
     LEFT JOIN inventario i ON i.id = p.inventario_id
     WHERE (p.id = $1 OR p.id_producto_base = $1) AND p.estado = TRUE AND p.publicacion_web = TRUE
     ORDER BY (p.id = $1) DESC, p.variante_nombre NULLS FIRST, p.id`,
    [base, id_negocio]
  );

  // Relacionados: misma categoría, disponibles, fuera del grupo de variantes
  const { rows: relacionados } = await pool.query(
    `SELECT ${sqlPlatoJson("p", "pp", "i")} AS plato
     FROM productos p
     JOIN productos_precios pp ON pp.id_producto = p.id AND pp.precio_venta > 0
     LEFT JOIN inventario i ON i.id = p.inventario_id
     WHERE p.id_categoria = $1 AND p.id <> $2 AND COALESCE(p.id_producto_base, 0) <> $3 AND p.id <> $3
       AND p.id_producto_base IS NULL
       AND p.estado = TRUE AND p.publicacion_web = TRUE AND p.es_complemento = FALSE
       AND ${sqlEnHorario("p")} AND ${sqlConStock("p", "i")}
     ORDER BY p.destacado DESC, p.nombre
     LIMIT 8`,
    [p.id_categoria, p.id, base]
  );

  return {
    ok: true,
    tienda,
    producto: { ...p, variantes: variantes.length > 1 ? variantes : [] },
    relacionados: relacionados.map((r) => r.plato),
  };
};

// ------------------------------------------------------------------
// VALIDACIÓN DE LA SOLICITUD
// ------------------------------------------------------------------
const texto = (v, max) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");
const telefonoValido = (v) => {
  const t = String(v ?? "").replace(/[\s\-().]/g, "").replace(/^\+?57/, "");
  return /^\d{7,10}$/.test(t) ? t : null;
};
const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

const validarSolicitud = (body, tienda) => {
  const errores = {};
  const nombre = texto(body?.cliente?.nombre, 150);
  const telefono = telefonoValido(body?.cliente?.telefono);
  const email = texto(body?.cliente?.email, 120).toLowerCase() || null;
  const tipo = body?.entrega?.tipo;
  const direccion = texto(body?.entrega?.direccion, 250) || null;
  const metodo = body?.metodo_pago;

  if (nombre.length < 2) errores.nombre = "Escribe tu nombre";
  if (!telefono) errores.telefono = "Escribe un teléfono válido (7 a 10 dígitos)";
  if (email && !emailValido(email)) errores.email = "El correo no es válido";

  if (tipo === "DOMICILIO") {
    if (!tienda.entrega.domicilio) errores.tipo_entrega = "No hay domicilios disponibles";
    if (!direccion || direccion.length < 5) errores.direccion = "Escribe la dirección de entrega";
  } else if (tipo === "RECOGER") {
    if (!tienda.entrega.recoger) errores.tipo_entrega = "No está disponible recoger en el local";
  } else {
    errores.tipo_entrega = "Elige domicilio o recoger en el local";
  }

  if (metodo === "EN_LINEA") {
    if (!tienda.pagos.en_linea) errores.metodo_pago = "El pago en línea no está disponible";
    if (!email) errores.email = "Para pagar en línea necesitamos tu correo";
  } else if (metodo === "CONTRAENTREGA") {
    if (!tienda.pagos.contraentrega) errores.metodo_pago = "El pago contraentrega no está disponible";
  } else {
    errores.metodo_pago = "Elige un método de pago";
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0 || items.length > 50) errores.items = "El carrito está vacío o tiene demasiados productos";
  const limpios = items.map((it) => ({
    id_producto: Number(it?.id_producto),
    cantidad: Number(it?.cantidad),
    complementos: [...new Set((Array.isArray(it?.complementos) ? it.complementos : []).map(Number))],
  }));
  if (limpios.some((it) => !Number.isInteger(it.id_producto) || !Number.isInteger(it.cantidad) ||
      it.cantidad < 1 || it.cantidad > 50 || it.complementos.length > 10 || it.complementos.some((c) => !Number.isInteger(c)))) {
    errores.items = "Hay productos inválidos en el carrito";
  }

  if (Object.keys(errores).length) throw errorHttp(400, "Revisa los datos del pedido", { errores });

  return {
    nombre, telefono, email, tipo, direccion, metodo, items: limpios,
    barrio: texto(body?.entrega?.barrio, 120) || null,
    referencias: texto(body?.entrega?.referencias, 300) || null,
    observacion: texto(body?.observacion, 500) || null,
    // Autorización expresa del cliente para recibir avisos por WhatsApp
    avisos_whatsapp: body?.avisos_whatsapp === true,
  };
};

// ------------------------------------------------------------------
// PRECIOS Y DISPONIBILIDAD DESDE LA BASE DE DATOS
// ------------------------------------------------------------------
const cotizar = async (client, id_negocio, items) => {
  const ids = [...new Set(items.map((i) => i.id_producto))];
  const { rows: productos } = await client.query(
    `SELECT p.id, p.nombre, pp.precio_venta::numeric AS precio, p.controla_inventario,
            ${sqlStockDisponible("p", "i")}::numeric AS stock
     FROM productos p
     JOIN categorias c ON c.id = p.id_categoria AND c.id_negocio = $2
     JOIN productos_precios pp ON pp.id_producto = p.id AND pp.precio_venta > 0
     LEFT JOIN inventario i ON i.id = p.inventario_id
     WHERE p.id = ANY($1) AND p.estado = TRUE AND p.publicacion_web = TRUE AND p.es_complemento = FALSE
       AND ${sqlEnHorario("p")} AND ${sqlConStock("p", "i")}`,
    [ids, id_negocio]
  );
  const { rows: complementos } = await client.query(
    `SELECT pc.id_producto, p2.id, p2.nombre, COALESCE(pp2.precio_venta, 0)::numeric AS precio,
            pc.obligatorio, p2.controla_inventario, ${sqlStockDisponible("p2", "i2")}::numeric AS stock
     FROM productos_complementos pc
     JOIN productos p2 ON p2.id = pc.id_producto_complemento AND p2.estado = TRUE
     LEFT JOIN inventario i2 ON i2.id = p2.inventario_id
     LEFT JOIN productos_precios pp2 ON pp2.id_producto = p2.id
     WHERE pc.id_producto = ANY($1) AND pc.estado = TRUE AND ${sqlConStock("p2", "i2")}`,
    [ids]
  );

  const porId = new Map(productos.map((p) => [p.id, p]));
  const usoStock = new Map(); // id_producto -> unidades pedidas (platos + adicionales)
  const sumar = (prod, cant) => usoStock.set(prod.id, { prod, cant: (usoStock.get(prod.id)?.cant ?? 0) + cant });

  const lineas = [];
  let subtotal = 0;
  for (const it of items) {
    const p = porId.get(it.id_producto);
    if (!p) throw errorHttp(409, "Uno de los productos ya no está disponible", { id_producto: it.id_producto });

    const permitidos = complementos.filter((c) => c.id_producto === p.id);
    const elegidos = it.complementos.map((idc) => {
      const c = permitidos.find((x) => x.id === idc);
      if (!c) throw errorHttp(409, `Una opción de "${p.nombre}" ya no está disponible`, { id_producto: p.id });
      return c;
    });
    const obligatorios = permitidos.filter((c) => c.obligatorio);
    if (obligatorios.length > 0 && elegidos.filter((c) => c.obligatorio).length !== 1) {
      throw errorHttp(400, `Elige una opción para "${p.nombre}"`, { id_producto: p.id });
    }

    const lineaSub = Number(p.precio) * it.cantidad;
    const adicionales = elegidos.map((c) => {
      sumar(c, it.cantidad);
      return { id_producto: c.id, nombre: c.nombre, cantidad: it.cantidad, precio_unitario: Number(c.precio), subtotal: Number(c.precio) * it.cantidad };
    });
    sumar(p, it.cantidad);
    subtotal += lineaSub + adicionales.reduce((a, x) => a + x.subtotal, 0);
    lineas.push({ id_producto: p.id, nombre: p.nombre, cantidad: it.cantidad, precio_unitario: Number(p.precio), subtotal: lineaSub, adicionales });
  }

  for (const { prod, cant } of usoStock.values()) {
    if (prod.controla_inventario && Number(prod.stock) < cant) {
      throw errorHttp(409, `Solo quedan ${Number(prod.stock)} de "${prod.nombre}"`, { id_producto: prod.id });
    }
  }
  return { lineas, subtotal };
};

const costoDomicilio = (tienda, tipo, subtotal) => {
  if (tipo !== "DOMICILIO") return 0;
  const { costo_domicilio, domicilio_gratis_desde } = tienda.entrega;
  if (domicilio_gratis_desde > 0 && subtotal >= domicilio_gratis_desde) return 0;
  return costo_domicilio;
};

// Cliente: se reutiliza la persona con ese teléfono; si no existe, se crea
const obtenerCliente = async (client, { nombre, telefono, email, direccion }) => {
  const { rows } = await client.query(
    `SELECT id FROM personas WHERE telefono = $1 AND tipo = 'cliente' ORDER BY id LIMIT 1`,
    [telefono]
  );
  if (rows.length) return rows[0].id;
  const { rows: [nueva] } = await client.query(
    `INSERT INTO personas (nombres, apellidos, tipo, telefono, email, direccion, nota, fecha_creacion)
     VALUES ($1, '', 'cliente', $2, $3, $4, 'Registrado desde la tienda web', NOW()) RETURNING id`,
    [nombre, telefono, email, direccion]
  );
  return nueva.id;
};

// ------------------------------------------------------------------
// TRANSACCIÓN DE PAGO EN LÍNEA
// ------------------------------------------------------------------
const crearIntentoPago = async (client, pedido) => {
  const referencia = `${pedido.codigo}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const montoCentavos = Math.round(Number(pedido.total) * 100);
  await client.query(
    `INSERT INTO pedidos_transacciones (id_pedido, proveedor, referencia, monto_centavos) VALUES ($1, 'WOMPI', $2, $3)`,
    [pedido.id, referencia, montoCentavos]
  );
  // Orden: URL de retorno del negocio (Admin) → TIENDA_URL_PUBLICA del .env → dominio del negocio.
  const integ = await configNegocio(pedido.id_negocio, client);
  const { rows: [n] } = await client.query(`SELECT dominio FROM negocios WHERE id = $1`, [pedido.id_negocio]);
  const base = (integ.tienda.urlRetorno
    || (process.env.TIENDA_URL_PUBLICA || !n?.dominio ? configTienda().urlPublica : `https://${n.dominio}`)).replace(/\/$/, "");
  const urlRetorno = `${base}/tienda/pedido/${pedido.codigo}/${pedido.token_consulta}`;
  return { referencia, checkout_url: wompi.urlCheckout({ referencia, montoCentavos, urlRetorno, email: pedido.email }, integ.wompi) };
};

// ------------------------------------------------------------------
// CREAR PEDIDO
// ------------------------------------------------------------------
const respuestaCreacion = (pedido, pago = null) => ({
  codigo: pedido.codigo,
  token: pedido.token_consulta,
  estado: pedido.estado,
  estado_pago: pedido.estado_pago,
  metodo_pago: pedido.metodo_pago,
  total: Number(pedido.total),
  pago,
});

const pedidoPorClave = async (client, clave) => {
  const { rows: [p] } = await client.query(`SELECT * FROM pedidos WHERE clave_idempotencia = $1`, [clave]);
  return p;
};

export const crearPedido = async (id_negocio, body, claveIdempotencia) => {
  const clave = /^[A-Za-z0-9_-]{8,64}$/.test(claveIdempotencia ?? "") ? `${id_negocio}:${claveIdempotencia}` : null;
  const client = await pool.connect();
  try {
    // Reintento con la misma clave: se devuelve el pedido ya creado
    if (clave) {
      const existente = await pedidoPorClave(client, clave);
      if (existente) return { ...respuestaCreacion(existente), repetido: true };
    }

    const tienda = await estadoTienda(id_negocio, client);
    if (!tienda.abierta) throw errorHttp(409, tienda.motivo);

    const datos = validarSolicitud(body, tienda);

    await client.query("BEGIN");
    const { lineas, subtotal } = await cotizar(client, id_negocio, datos.items);
    if (tienda.pedido_minimo && subtotal < tienda.pedido_minimo) {
      throw errorHttp(400, `El pedido mínimo es $${tienda.pedido_minimo.toLocaleString("es-CO")}`);
    }
    const domicilio = costoDomicilio(tienda, datos.tipo, subtotal);
    const total = subtotal + domicilio;

    const id_cliente = await obtenerCliente(client, datos);
    const { rows: [{ n }] } = await client.query(`SELECT nextval('pedidos_numero_seq') AS n`);
    const codigo = `WEB-${String(n).padStart(6, "0")}`;
    const token = crypto.randomBytes(24).toString("base64url");

    const { rows: [pedido] } = await client.query(
      `INSERT INTO pedidos (id_negocio, codigo, token_consulta, id_cliente, nombre_cliente, telefono, email,
         tipo_entrega, direccion, barrio, referencias, observacion, subtotal, costo_domicilio, total,
         metodo_pago, clave_idempotencia, avisos_whatsapp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [id_negocio, codigo, token, id_cliente, datos.nombre, datos.telefono, datos.email, datos.tipo,
        datos.tipo === "DOMICILIO" ? datos.direccion : null,
        datos.tipo === "DOMICILIO" ? datos.barrio : null,
        datos.tipo === "DOMICILIO" ? datos.referencias : null,
        datos.observacion, subtotal, domicilio, total, datos.metodo, clave, datos.avisos_whatsapp]
    );

    for (const l of lineas) {
      const { rows: [item] } = await client.query(
        `INSERT INTO pedidos_items (id_pedido, id_producto, nombre, cantidad, precio_unitario, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [pedido.id, l.id_producto, l.nombre, l.cantidad, l.precio_unitario, l.subtotal]
      );
      for (const a of l.adicionales) {
        await client.query(
          `INSERT INTO pedidos_items (id_pedido, id_producto, id_item_padre, nombre, cantidad, precio_unitario, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [pedido.id, a.id_producto, item.id, a.nombre, a.cantidad, a.precio_unitario, a.subtotal]
        );
      }
    }

    await client.query(
      `INSERT INTO pedidos_historial (id_pedido, campo, valor_anterior, valor_nuevo, origen, nota)
       VALUES ($1, 'estado', NULL, 'PENDIENTE', 'CLIENTE', $2)`,
      [pedido.id, datos.metodo === "EN_LINEA" ? "Pedido creado, esperando pago en línea" : "Pedido creado, pago contraentrega"]
    );

    const pago = datos.metodo === "EN_LINEA" ? await crearIntentoPago(client, pedido) : null;
    await client.query("COMMIT");

    notificarPedido(id_negocio, "pedido_nuevo", pedido.id);
    // Saludo + "recibido": contraentrega de una vez; en línea cuando se apruebe el pago
    if (datos.metodo === "CONTRAENTREGA") encolarAviso(pedido.id, "RECIBIDO");
    return respuestaCreacion(pedido, pago);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    // Dos envíos simultáneos con la misma clave: devolver el que ganó
    if (err.code === "23505" && clave && String(err.constraint).includes("clave_idempotencia")) {
      const existente = await pedidoPorClave(client, clave);
      if (existente) return { ...respuestaCreacion(existente), repetido: true };
    }
    throw err;
  } finally {
    client.release();
  }
};

// ------------------------------------------------------------------
// CONSULTA PÚBLICA DEL PEDIDO (código + token secreto)
// ------------------------------------------------------------------
const buscarPedidoConToken = async (codigo, token, db = pool) => {
  const { rows: [p] } = await db.query(`SELECT * FROM pedidos WHERE codigo = $1`, [String(codigo ?? "")]);
  const a = Buffer.from(String(token ?? ""));
  const b = Buffer.from(p?.token_consulta ?? "");
  if (!p || a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw errorHttp(404, "Pedido no encontrado");
  return p;
};

export const consultarPedido = async (codigo, token, idTransaccion) => {
  let pedido = await buscarPedidoConToken(codigo, token);
  const cfgWompi = await wompiNegocio(pedido.id_negocio);

  if (pedido.metodo_pago === "EN_LINEA" && pedido.estado_pago === "PENDIENTE" && cfgWompi.habilitado) {
    try {
      if (idTransaccion) {
        // Al volver de Wompi llega ?id=: se verifica directamente con la pasarela
        const tx = await wompi.consultarTransaccion(idTransaccion, cfgWompi);
        if (tx?.reference?.startsWith(`${pedido.codigo}-`)) await procesarTransaccion(tx, "CONSULTA");
      } else if (cfgWompi.puedeBuscar) {
        // Sin redirección ni webhook (p. ej. en local): se busca por la referencia del
        // último intento, como máximo cada 15 s por pedido
        const { rows: [intento] } = await pool.query(
          `SELECT referencia FROM pedidos_transacciones
           WHERE id_pedido = $1 AND estado IN ('CREADA', 'PENDING') AND updated_at < NOW() - INTERVAL '15 seconds'
           ORDER BY id DESC LIMIT 1`,
          [pedido.id]
        );
        if (intento) {
          await pool.query(`UPDATE pedidos_transacciones SET updated_at = NOW() WHERE referencia = $1`, [intento.referencia]);
          const [tx] = await wompi.buscarPorReferencia(intento.referencia, cfgWompi);
          if (tx) await procesarTransaccion(tx, "BUSQUEDA");
        }
      }
      pedido = await buscarPedidoConToken(codigo, token);
    } catch (err) {
      console.error("No se pudo verificar la transacción con Wompi:", err.message);
    }
  }

  const { rows: items } = await pool.query(
    `SELECT id, id_item_padre, nombre, cantidad, precio_unitario::float, subtotal::float
     FROM pedidos_items WHERE id_pedido = $1 ORDER BY id`,
    [pedido.id]
  );
  const { rows: [ultimaTx] } = await pool.query(
    `SELECT estado FROM pedidos_transacciones WHERE id_pedido = $1 ORDER BY id DESC LIMIT 1`,
    [pedido.id]
  );

  const { rows: [neg] } = await pool.query(`SELECT url_negocio FROM negocios WHERE id = $1`, [pedido.id_negocio]);

  return {
    codigo: pedido.codigo,
    url_negocio: neg?.url_negocio ?? null,
    fecha: pedido.created_at,
    nombre_cliente: pedido.nombre_cliente,
    estado: pedido.estado,
    estado_pago: pedido.estado_pago,
    metodo_pago: pedido.metodo_pago,
    tipo_entrega: pedido.tipo_entrega,
    direccion: pedido.direccion,
    subtotal: Number(pedido.subtotal),
    costo_domicilio: Number(pedido.costo_domicilio),
    total: Number(pedido.total),
    items: items.filter((i) => !i.id_item_padre).map((i) => ({
      nombre: i.nombre, cantidad: i.cantidad, precio_unitario: i.precio_unitario, subtotal: i.subtotal,
      adicionales: items.filter((a) => a.id_item_padre === i.id).map((a) => ({ nombre: a.nombre, subtotal: a.subtotal })),
    })),
    pago_en_proceso: ultimaTx?.estado === "PENDING",
    puede_reintentar_pago:
      pedido.metodo_pago === "EN_LINEA" && pedido.estado === "PENDIENTE" &&
      ["PENDIENTE", "RECHAZADO", "ANULADO"].includes(pedido.estado_pago) && ultimaTx?.estado !== "PENDING",
  };
};

// Nuevo intento de pago (pago rechazado o checkout abandonado)
export const reintentarPago = async (codigo, token) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pedido = await buscarPedidoConToken(codigo, token, client);
    await client.query(`SELECT id FROM pedidos WHERE id = $1 FOR UPDATE`, [pedido.id]);
    const { rows: txs } = await client.query(`SELECT estado FROM pedidos_transacciones WHERE id_pedido = $1`, [pedido.id]);

    if (pedido.metodo_pago !== "EN_LINEA" || pedido.estado !== "PENDIENTE" ||
        !["PENDIENTE", "RECHAZADO", "ANULADO"].includes(pedido.estado_pago)) {
      throw errorHttp(409, "Este pedido no admite un nuevo pago");
    }
    if (txs.some((t) => t.estado === "PENDING" || t.estado === "APPROVED")) {
      throw errorHttp(409, "Ya hay un pago en proceso para este pedido");
    }
    if (!(await wompiNegocio(pedido.id_negocio, client)).habilitado) throw errorHttp(409, "El pago en línea no está disponible");

    const pago = await crearIntentoPago(client, pedido);
    await client.query("COMMIT");
    return pago;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

// ------------------------------------------------------------------
// RESULTADO DE UNA TRANSACCIÓN (webhook o consulta). Idempotente.
// ------------------------------------------------------------------
export const procesarTransaccion = async (tx, origen) => {
  const client = await pool.connect();
  let aviso = null;
  try {
    await client.query("BEGIN");
    const { rows: [intento] } = await client.query(
      `SELECT * FROM pedidos_transacciones WHERE referencia = $1 FOR UPDATE`,
      [tx.reference]
    );
    if (!intento) {
      await client.query("ROLLBACK");
      return { ignorado: "referencia desconocida" };
    }

    const { rows: [pedido] } = await client.query(`SELECT * FROM pedidos WHERE id = $1 FOR UPDATE`, [intento.id_pedido]);
    const historial = (campo, anterior, nuevo, nota) => client.query(
      `INSERT INTO pedidos_historial (id_pedido, campo, valor_anterior, valor_nuevo, origen, nota)
       VALUES ($1, $2, $3, $4, 'PASARELA', $5)`,
      [pedido.id, campo, anterior, nuevo, `${nota} · ${origen} · ${tx.id}`.slice(0, 500)]
    );

    // El monto pagado debe coincidir con el calculado por el servidor
    const montoOk = Number(tx.amount_in_cents) === Number(intento.monto_centavos) && tx.currency === intento.moneda;
    const statusFinal = montoOk ? tx.status : "ERROR";
    const yaProcesado = intento.estado === statusFinal && intento.id_transaccion_proveedor === tx.id;

    await client.query(
      `UPDATE pedidos_transacciones
       SET estado = $1, id_transaccion_proveedor = $2, metodo = $3, respuesta = $4, updated_at = NOW()
       WHERE id = $5`,
      [statusFinal, tx.id, tx.payment_method_type ?? null, wompi.resumenTransaccion(tx), intento.id]
    );

    if (!montoOk) {
      await historial("nota", null, null, `Monto de la pasarela (${tx.amount_in_cents}) no coincide con el pedido (${intento.monto_centavos})`);
      await client.query("COMMIT");
      return { pedido: pedido.id, error: "monto" };
    }
    if (yaProcesado) {
      await client.query("COMMIT");
      return { pedido: pedido.id, duplicado: true };
    }

    const nuevo = wompi.estadoPagoDesdeWompi(statusFinal);
    let estadoPago = pedido.estado_pago;

    if (nuevo === "APROBADO") {
      if (pedido.estado_pago === "APROBADO") {
        // Otro intento ya estaba aprobado: no se cambia nada, queda registrado
        await historial("nota", null, null, "Pago adicional aprobado en otra transacción: revisar y reembolsar");
      } else if (pedido.estado === "CANCELADO") {
        estadoPago = "REEMBOLSO_PENDIENTE";
        await historial("estado_pago", pedido.estado_pago, estadoPago, "Pago aprobado sobre un pedido cancelado");
      } else {
        estadoPago = "APROBADO";
        await historial("estado_pago", pedido.estado_pago, estadoPago, "Pago aprobado");
        aviso = "pago_confirmado";
      }
    } else if (nuevo && ["PENDIENTE", "RECHAZADO", "ANULADO"].includes(pedido.estado_pago) && nuevo !== pedido.estado_pago) {
      estadoPago = nuevo;
      await historial("estado_pago", pedido.estado_pago, estadoPago, `Pago ${statusFinal}`);
      aviso = "pago_rechazado";
    }

    if (estadoPago !== pedido.estado_pago) {
      await client.query(
        `UPDATE pedidos SET estado_pago = $1, version = version + 1, updated_at = NOW() WHERE id = $2`,
        [estadoPago, pedido.id]
      );
    }
    await client.query("COMMIT");
    if (aviso) notificarPedido(pedido.id_negocio, aviso, pedido.id);
    if (aviso === "pago_confirmado") encolarAviso(pedido.id, "RECIBIDO");
    return { pedido: pedido.id, estado_pago: estadoPago };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

// Webhook de Wompi: se verifica la firma y se descarta si ya se recibió
// Cada negocio puede tener su propia cuenta de Wompi: el secreto de eventos se toma
// del negocio dueño de la referencia (o del .env si no tiene credenciales propias).
const wompiDeReferencia = async (referencia) => {
  if (!referencia) return configWompi();
  const { rows: [r] } = await pool.query(
    `SELECT p.id_negocio FROM pedidos_transacciones t JOIN pedidos p ON p.id = t.id_pedido WHERE t.referencia = $1`,
    [String(referencia)]
  );
  return r ? wompiNegocio(r.id_negocio) : configWompi();
};

export const recibirEventoWompi = async (evento) => {
  const cfg = await wompiDeReferencia(evento?.data?.transaction?.reference);
  if (!wompi.verificarEvento(evento, cfg)) throw errorHttp(401, "Firma inválida");

  const { rows } = await pool.query(
    `INSERT INTO pagos_webhook_eventos (proveedor, id_evento, evento, firma_valida, payload)
     VALUES ('WOMPI', $1, $2, TRUE, $3)
     ON CONFLICT (proveedor, id_evento) DO NOTHING RETURNING id`,
    [String(evento.signature.checksum), evento.event ?? null, { event: evento.event, timestamp: evento.timestamp, transaction: wompi.resumenTransaccion(evento.data?.transaction ?? {}) }]
  );
  if (rows.length === 0) return { duplicado: true };

  if (evento.event === "transaction.updated" && evento.data?.transaction) {
    return procesarTransaccion(evento.data.transaction, "WEBHOOK");
  }
  return { ignorado: evento.event };
};

// ------------------------------------------------------------------
// CONCILIADOR: pregunta a Wompi por los pagos en línea pendientes.
// No depende de que el cliente tenga abierta la página del pedido.
// En local reemplaza al webhook (que no llega); en producción es respaldo.
// Requiere la llave privada del negocio (o WOMPI_PRIVATE_KEY del servidor).
// ------------------------------------------------------------------
let conciliando = false;

export const conciliarPagosPendientes = async () => {
  if (conciliando) return { revisados: 0 };
  conciliando = true;
  let revisados = 0;
  try {
    // Intentos aún sin resultado final, de las últimas 24 h, no revisados en los últimos 20 s
    const { rows } = await pool.query(
      `SELECT t.referencia, p.id_negocio FROM pedidos_transacciones t
       JOIN pedidos p ON p.id = t.id_pedido
       WHERE t.estado IN ('CREADA', 'PENDING') AND t.created_at > NOW() - INTERVAL '24 hours'
         AND t.updated_at < NOW() - INTERVAL '20 seconds'
         AND p.estado_pago IN ('PENDIENTE', 'RECHAZADO', 'ANULADO')
       ORDER BY t.created_at DESC LIMIT 20`
    );
    for (const { referencia, id_negocio } of rows) {
      try {
        // Se marca como revisada aunque el negocio no pueda consultar, para no bloquear la fila de espera
        await pool.query(`UPDATE pedidos_transacciones SET updated_at = NOW() WHERE referencia = $1`, [referencia]);
        const cfg = await wompiNegocio(id_negocio);
        if (!cfg.puedeBuscar) continue;
        const [tx] = await wompi.buscarPorReferencia(referencia, cfg);
        if (tx) await procesarTransaccion(tx, "CONCILIACION");
        revisados++;
      } catch (err) {
        console.error(`Conciliación de ${referencia}:`, err.message);
      }
    }
  } finally {
    conciliando = false;
  }
  return { revisados };
};
