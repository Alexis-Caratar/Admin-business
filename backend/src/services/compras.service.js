// Compras de insumos y mercancía (inventario) a proveedores.
//
// Una compra, en una sola transacción:
//   · suma al inventario (movimiento ENTRADA con su costo) — NO es gasto todavía;
//   · actualiza el costo de referencia del insumo con promedio ponderado y deja
//     historial (inventario_costos); las compras anteriores no cambian;
//   · queda como cuenta por pagar (saldo) hasta que se registren sus pagos.
// El costo pasa al resultado cuando el insumo se vende o consume (costo de ventas).
// Los pagos son salidas de dinero; si salen de la caja se crea y vincula el egreso.
import { db } from "../config/db.js";
import { auditar, egresoDeCaja, enTransaccion, errorHttp, fecha, monto, redondear, texto } from "./finanzas/comun.js";

const ESTADO = (total, saldo) => (saldo <= 0 ? "PAGADA" : saldo < total ? "PARCIAL" : "PENDIENTE");

// Proveedor: uno existente (personas) o uno nuevo con identificación y nombre
const resolverProveedor = async (client, data, errores) => {
  if (data.id_proveedor) {
    const { rows: [p] } = await client.query(`SELECT id FROM personas WHERE id = $1`, [data.id_proveedor]);
    if (!p) errores.id_proveedor = "El proveedor no existe";
    return p?.id ?? null;
  }
  const nuevo = data.proveedor ?? {};
  const identificacion = texto(nuevo.identificacion, 30);
  const nombres = texto(nuevo.nombres, 100);
  if (!identificacion || !nombres) {
    errores.id_proveedor = "Elige un proveedor o escribe su NIT/cédula y nombre";
    return null;
  }
  const { rows: [existe] } = await client.query(`SELECT id FROM personas WHERE TRIM(identificacion) = $1`, [identificacion]);
  if (existe) return existe.id;
  const { rows: [p] } = await client.query(
    `INSERT INTO personas (tipo_identificacion, identificacion, nombres, apellidos, tipo, email, telefono, direccion, fecha_creacion)
     VALUES ($1, $2, $3, $4, 'Proveedor', $5, $6, $7, NOW()) RETURNING id`,
    [texto(nuevo.tipo_identificacion, 10) ?? "NIT", identificacion, nombres, texto(nuevo.apellidos, 100) ?? "", texto(nuevo.email, 150), texto(nuevo.telefono, 30), texto(nuevo.direccion, 200)]
  );
  return p.id;
};

const numeroCompra = async (client, id_negocio) => {
  // Bloqueo por negocio: dos compras simultáneas no repiten número
  await client.query(`SELECT pg_advisory_xact_lock(hashtext('compras'), $1)`, [id_negocio]);
  const { rows: [r] } = await client.query(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(numero_compra, '^.*-', ''), '')::int), 0) + 1 AS n FROM compras WHERE id_negocio = $1 AND numero_compra ~ '-[0-9]+$'`,
    [id_negocio]
  );
  return `OC${id_negocio}-${String(r.n).padStart(6, "0")}`;
};

// Medio de pago del negocio: el elegido o, si no se eligió, efectivo (caja) o transferencia.
// Si el negocio no tiene ese medio en su catálogo, se agrega.
const medioDePago = async (client, id_negocio, id_metodo_pago, desde_caja) => {
  if (id_metodo_pago) {
    const { rows: [m] } = await client.query(`SELECT id FROM metodos_pago WHERE id = $1 AND id_negocio = $2`, [id_metodo_pago, id_negocio]);
    if (!m) throw errorHttp(400, "Medio de pago no válido", { id_metodo_pago: "No existe en este negocio" });
    return m.id;
  }
  const [codigo, nombre] = desde_caja ? ["EFE", "EFECTIVO"] : ["TRA", "TRANSFERENCIA"];
  const { rows: [m] } = await client.query(`SELECT id FROM metodos_pago WHERE id_negocio = $1 AND codigo = $2 ORDER BY activo DESC LIMIT 1`, [id_negocio, codigo]);
  if (m) return m.id;
  const { rows: [nuevo] } = await client.query(
    `INSERT INTO metodos_pago (id_negocio, codigo, nombre, requiere_referencia, activo, fecha_creacion) VALUES ($1, $2, $3, false, true, NOW()) RETURNING id`,
    [id_negocio, codigo, nombre]
  );
  return nuevo.id;
};

const registrarPago = async (client, { compra, valor, fecha: f, id_metodo_pago, referencia, observacion, desde_caja, id_usuario }) => {
  id_metodo_pago = await medioDePago(client, compra.id_negocio, id_metodo_pago, desde_caja);
  let id_egreso = null;
  if (desde_caja) {
    // El egreso queda sin categoría de gasto: pagar una compra no es gasto (va al inventario)
    const e = await egresoDeCaja(client, {
      id_negocio: compra.id_negocio, id_usuario, monto: valor,
      descripcion: `Pago compra ${compra.numero_compra}${compra.numero_factura ? ` · Factura ${compra.numero_factura}` : ""}`,
      observacion: "Pago de compra (no es gasto: la compra va al inventario)",
    });
    id_egreso = e.id;
  }
  const { rows: [pago] } = await client.query(
    `INSERT INTO pagos_compras (id_compra, fecha, id_metodo_pago, valor, referencia, observacion, id_usuario, created_at, id_egreso)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8) RETURNING *`,
    [compra.id, f ?? new Date().toISOString().slice(0, 10), id_metodo_pago ?? null, valor, texto(referencia, 80), texto(observacion, 300), id_usuario, id_egreso]
  );
  return pago;
};

export const ComprasService = {
  listarCompras: async (id_negocio, { estado, desde, hasta, q } = {}) => {
    const params = [id_negocio];
    const filtros = [];
    if (estado) { params.push(estado); filtros.push(`c.estado = $${params.length}`); }
    if (desde) { params.push(desde); filtros.push(`c.fecha_compra::date >= $${params.length}`); }
    if (hasta) { params.push(hasta); filtros.push(`c.fecha_compra::date <= $${params.length}`); }
    if (q) { params.push(`%${q}%`); filtros.push(`(c.numero_compra ILIKE $${params.length} OR c.numero_factura ILIKE $${params.length} OR p.nombres ILIKE $${params.length} OR p.identificacion ILIKE $${params.length})`); }
    const [rows] = await db.query(`
      SELECT c.id, c.numero_compra, c.numero_factura, c.tipo_documento, c.fecha_compra, c.fecha_factura, c.fecha_vencimiento,
             c.subtotal::float, c.descuento::float, c.impuesto::float, c.total::float, c.saldo_pendiente::float, c.estado,
             c.id_proveedor, p.identificacion, TRIM(CONCAT(p.nombres, ' ', COALESCE(p.apellidos, ''))) AS proveedor,
             mp.nombre AS metodo_pago,
             (c.estado IN ('PENDIENTE', 'PARCIAL') AND c.fecha_vencimiento < CURRENT_DATE) AS vencida
      FROM compras c
      JOIN personas p ON p.id = c.id_proveedor
      LEFT JOIN metodos_pago mp ON mp.id = c.id_metodo_pago
      WHERE c.id_negocio = $1 ${filtros.length ? `AND ${filtros.join(" AND ")}` : ""}
      ORDER BY c.id DESC LIMIT 500`, params);
    return rows;
  },

  detalleCompra: async (id_compra, id_negocio) => {
    const [[compra]] = await db.query(
      `SELECT c.*, c.subtotal::float, c.descuento::float, c.impuesto::float, c.total::float, c.saldo_pendiente::float,
              p.identificacion, TRIM(CONCAT(p.nombres, ' ', COALESCE(p.apellidos, ''))) AS proveedor
       FROM compras c JOIN personas p ON p.id = c.id_proveedor WHERE c.id = $1 AND c.id_negocio = $2`,
      [id_compra, id_negocio]
    );
    if (!compra) throw errorHttp(404, "Compra no encontrada");
    const [items] = await db.query(
      `SELECT ci.id, ci.id_inventario, ci.id_producto, COALESCE(i.nombre, pr.nombre, ci.descripcion) AS nombre, i.unidad,
              ci.cantidad::float, ci.costo_unitario::float, ci.descuento::float, ci.impuesto::float, ci.subtotal::float, ci.total::float
       FROM compras_items ci LEFT JOIN inventario i ON i.id = ci.id_inventario LEFT JOIN productos pr ON pr.id = ci.id_producto
       WHERE ci.id_compra = $1 ORDER BY ci.id`,
      [id_compra]
    );
    const [pagos] = await db.query(
      `SELECT pc.id, pc.fecha, pc.valor::float, pc.referencia, pc.observacion, pc.id_egreso, mp.nombre AS metodo_pago, e.numero_egreso
       FROM pagos_compras pc LEFT JOIN metodos_pago mp ON mp.id = pc.id_metodo_pago LEFT JOIN egresos e ON e.id = pc.id_egreso
       WHERE pc.id_compra = $1 ORDER BY pc.id`,
      [id_compra]
    );
    return { ...compra, items, pagos };
  },

  crearCompra: async (data, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
    const errores = {};
    const id_proveedor = await resolverProveedor(client, data, errores);
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) errores.items = "Agrega al menos un ítem";
    const adicionales = monto(data.costos_adicionales ?? 0, { campo: "costos_adicionales", errores }) ?? 0;
    const fFactura = fecha(data.fecha_factura, { campo: "fecha_factura", errores });
    const fVence = fecha(data.fecha_vencimiento, { campo: "fecha_vencimiento", errores });
    if (fFactura && fVence && fVence < fFactura) errores.fecha_vencimiento = "No puede ser anterior a la fecha de la factura";

    // Ítems: insumos del inventario de ESTE negocio
    const lineas = [];
    for (const [k, it] of items.entries()) {
      const e = {};
      const cantidad = monto(it.cantidad, { positivo: true, campo: "cantidad", errores: e });
      const costo = monto(it.costo_unitario, { campo: "costo_unitario", errores: e });
      const descuento = monto(it.descuento ?? 0, { campo: "descuento", errores: e }) ?? 0;
      const impuesto = monto(it.impuesto ?? 0, { campo: "impuesto", errores: e }) ?? 0;
      const { rows: [inv] } = await client.query(`SELECT id, nombre FROM inventario WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [it.id_inventario, id_negocio]);
      if (!inv) e.id_inventario = "Insumo no encontrado en este negocio";
      if (cantidad !== null && costo !== null && descuento > cantidad * costo) e.descuento = "Mayor que el valor del ítem";
      if (Object.keys(e).length) { errores[`items.${k}`] = Object.values(e).join(" · "); continue; }
      const subtotal = redondear(cantidad * costo);
      lineas.push({ inv, cantidad, costo, descuento, impuesto, subtotal, total: redondear(subtotal - descuento + impuesto) });
    }
    if (new Set(lineas.map((l) => l.inv.id)).size !== lineas.length) errores.items = "Un insumo está repetido: súmalo en una sola línea";

    const subtotal = redondear(lineas.reduce((a, l) => a + l.subtotal, 0));
    const descuento = redondear(lineas.reduce((a, l) => a + l.descuento, 0));
    const impuesto = redondear(lineas.reduce((a, l) => a + l.impuesto, 0));
    const total = redondear(subtotal - descuento + impuesto + adicionales);
    const pagoInicial = data.pago ? monto(data.pago.valor, { positivo: true, campo: "pago", errores }) : null;
    if (pagoInicial !== null && pagoInicial > total) errores.pago = "El pago no puede superar el total";
    if (data.numero_factura) {
      const { rows: [dup] } = await client.query(
        `SELECT numero_compra FROM compras WHERE id_negocio = $1 AND id_proveedor = $2 AND numero_factura = $3 AND estado <> 'ANULADA'`,
        [id_negocio, id_proveedor, String(data.numero_factura).trim()]
      );
      if (dup) errores.numero_factura = `Esta factura ya está registrada en ${dup.numero_compra}`;
    }
    if (Object.keys(errores).length) throw errorHttp(400, "Revisa los datos de la compra", errores);

    const numero = await numeroCompra(client, id_negocio);
    const { rows: [compra] } = await client.query(
      `INSERT INTO compras (numero_compra, id_negocio, id_proveedor, fecha_compra, fecha_factura, fecha_vencimiento, tipo_documento, numero_factura,
                            id_metodo_pago, estado, observacion, subtotal, descuento, impuesto, total, saldo_pendiente, id_usuario, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, 'PENDIENTE', $9, $10, $11, $12, $13, $13, $14, NOW(), NOW()) RETURNING *`,
      [numero, id_negocio, id_proveedor, fFactura, fVence, texto(data.tipo_documento, 30) ?? "FACTURA", texto(data.numero_factura, 100),
        data.pago?.id_metodo_pago ?? null, texto(data.observacion, 1000), subtotal, descuento, impuesto, total, id_usuario]
    );

    // Costos adicionales (flete, etc.): se reparten entre los ítems según su valor
    const base = lineas.reduce((a, l) => a + (l.total - l.impuesto), 0);
    for (const l of lineas) {
      const extra = base > 0 ? adicionales * ((l.total - l.impuesto) / base) : 0;
      const costoReal = redondear((l.total - l.impuesto + extra) / l.cantidad, 4); // el IVA descontable no es costo
      await client.query(
        `INSERT INTO compras_items (id_compra, id_inventario, descripcion, cantidad, costo_unitario, descuento, impuesto, subtotal, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [compra.id, l.inv.id, l.inv.nombre, l.cantidad, l.costo, l.descuento, l.impuesto, l.subtotal, l.total]
      );
      // Costo promedio ponderado con el stock que había
      const { rows: [antes] } = await client.query(`SELECT stock_actual::float AS stock, costo_unitario::float AS costo FROM inventario WHERE id = $1`, [l.inv.id]);
      const stockPrevio = Math.max(Number(antes.stock) || 0, 0);
      const costoPrevio = Number(antes.costo) || 0;
      const nuevoCosto = stockPrevio > 0 && costoPrevio > 0
        ? redondear((stockPrevio * costoPrevio + l.cantidad * costoReal) / (stockPrevio + l.cantidad), 4)
        : costoReal;
      await client.query(`UPDATE inventario SET stock_actual = stock_actual + $1, costo_unitario = $2 WHERE id = $3`, [l.cantidad, nuevoCosto, l.inv.id]);
      await client.query(
        `INSERT INTO inventario_movimientos (inventario_id, tipo, cantidad, motivo, referencia, id_usuario, costo_unitario, created_at)
         VALUES ($1, 'ENTRADA', $2, 'COMPRA', $3, $4, $5, NOW())`,
        [l.inv.id, l.cantidad, numero, id_usuario, costoReal]
      );
      if (nuevoCosto !== costoPrevio) {
        await client.query(
          `INSERT INTO inventario_costos (inventario_id, costo_anterior, costo_nuevo, origen, id_compra, id_usuario) VALUES ($1, $2, $3, 'COMPRA', $4, $5)`,
          [l.inv.id, costoPrevio || null, nuevoCosto, compra.id, id_usuario]
        );
      }
    }

    let saldo = total;
    if (pagoInicial) {
      await registrarPago(client, { compra, valor: pagoInicial, ...data.pago, desde_caja: Boolean(data.pago.desde_caja), id_usuario });
      saldo = redondear(total - pagoInicial);
    }
    const { rows: [final] } = await client.query(
      `UPDATE compras SET saldo_pendiente = $1, estado = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [saldo, ESTADO(total, saldo), compra.id]
    );
    await auditar(client, { id_negocio, tabla: "compras", id_registro: compra.id, accion: "CREAR", despues: { numero, total, items: lineas.length }, id_usuario });
    return final;
  }),

  pagarCompra: async (id_compra, data, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
    const { rows: [compra] } = await client.query(`SELECT * FROM compras WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id_compra, id_negocio]);
    if (!compra) throw errorHttp(404, "Compra no encontrada");
    if (compra.estado === "ANULADA") throw errorHttp(409, "La compra está anulada");
    const errores = {};
    const valor = monto(data.valor, { positivo: true, errores });
    const f = fecha(data.fecha, { campo: "fecha", errores });
    if (valor !== null && valor > Number(compra.saldo_pendiente)) errores.valor = `El saldo pendiente es ${Number(compra.saldo_pendiente)}`;
    if (Object.keys(errores).length) throw errorHttp(400, "Revisa el pago", errores);
    const pago = await registrarPago(client, { compra, valor, fecha: f, id_metodo_pago: data.id_metodo_pago, referencia: data.referencia, observacion: data.observacion, desde_caja: Boolean(data.desde_caja), id_usuario });
    const saldo = redondear(Number(compra.saldo_pendiente) - valor);
    await client.query(`UPDATE compras SET saldo_pendiente = $1, estado = $2, updated_at = NOW() WHERE id = $3`, [saldo, ESTADO(Number(compra.total), saldo), compra.id]);
    await auditar(client, { id_negocio, tabla: "pagos_compras", id_registro: pago.id, accion: "PAGAR", despues: { compra: compra.numero_compra, valor, desde_caja: Boolean(pago.id_egreso) }, id_usuario });
    return pago;
  }),

  // Anular un pago: vuelve al saldo; si salió de la caja, se anula también su egreso
  anularPago: async (id_compra, id_pago, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
    const { rows: [compra] } = await client.query(`SELECT * FROM compras WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id_compra, id_negocio]);
    if (!compra) throw errorHttp(404, "Compra no encontrada");
    const { rows: [pago] } = await client.query(`DELETE FROM pagos_compras WHERE id = $1 AND id_compra = $2 RETURNING *`, [id_pago, id_compra]);
    if (!pago) throw errorHttp(404, "Pago no encontrado");
    if (pago.id_egreso) await client.query(`UPDATE egresos SET estado = 'ANULADO', updated_at = NOW() WHERE id = $1`, [pago.id_egreso]);
    const saldo = redondear(Number(compra.saldo_pendiente) + Number(pago.valor));
    await client.query(`UPDATE compras SET saldo_pendiente = $1, estado = $2, updated_at = NOW() WHERE id = $3`, [saldo, ESTADO(Number(compra.total), saldo), compra.id]);
    await auditar(client, { id_negocio, tabla: "pagos_compras", id_registro: pago.id, accion: "ANULAR", antes: pago, id_usuario });
    return { ok: true };
  }),

  // Anular una compra sin pagos: saca del inventario lo que entró (si todavía está)
  anularCompra: async (id_compra, motivo, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
    const { rows: [compra] } = await client.query(`SELECT * FROM compras WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id_compra, id_negocio]);
    if (!compra) throw errorHttp(404, "Compra no encontrada");
    if (compra.estado === "ANULADA") throw errorHttp(409, "La compra ya está anulada");
    if (!texto(motivo, 300)) throw errorHttp(400, "Escribe el motivo de la anulación", { motivo: "Obligatorio" });
    const { rows: [{ n }] } = await client.query(`SELECT count(*)::int AS n FROM pagos_compras WHERE id_compra = $1`, [id_compra]);
    if (n > 0) throw errorHttp(409, "La compra tiene pagos: anúlalos primero");
    const { rows: items } = await client.query(`SELECT * FROM compras_items WHERE id_compra = $1 AND id_inventario IS NOT NULL`, [id_compra]);
    for (const it of items) {
      const { rows: [inv] } = await client.query(`SELECT id, nombre, stock_actual::float AS stock, costo_unitario::float AS costo FROM inventario WHERE id = $1 FOR UPDATE`, [it.id_inventario]);
      if (inv.stock < Number(it.cantidad)) throw errorHttp(409, `No se puede anular: de "${inv.nombre}" ya se usó parte de lo comprado (quedan ${inv.stock})`);
      // Deshace el promedio ponderado con el costo con que entró (incluye el flete repartido)
      const { rows: [entrada] } = await client.query(
        `SELECT costo_unitario::float AS costo FROM inventario_movimientos WHERE inventario_id = $1 AND motivo = 'COMPRA' AND referencia = $2 ORDER BY id DESC LIMIT 1`,
        [inv.id, compra.numero_compra]
      );
      const costoEntrada = entrada?.costo ?? (Number(it.total) - Number(it.impuesto)) / Number(it.cantidad);
      const restante = inv.stock - Number(it.cantidad);
      const costo = restante > 0 ? Math.max(redondear((inv.stock * inv.costo - Number(it.cantidad) * costoEntrada) / restante, 4), 0) : inv.costo;
      await client.query(`UPDATE inventario SET stock_actual = stock_actual - $1, costo_unitario = $2 WHERE id = $3`, [it.cantidad, costo, inv.id]);
      await client.query(
        `INSERT INTO inventario_movimientos (inventario_id, tipo, cantidad, motivo, referencia, id_usuario, costo_unitario, created_at)
         VALUES ($1, 'SALIDA', $2, 'ANULACION COMPRA', $3, $4, $5, NOW())`,
        [inv.id, it.cantidad, compra.numero_compra, id_usuario, costoEntrada]
      );
      if (costo !== inv.costo) await client.query(
        `INSERT INTO inventario_costos (inventario_id, costo_anterior, costo_nuevo, origen, id_compra, id_usuario) VALUES ($1, $2, $3, 'ANULACION', $4, $5)`,
        [inv.id, inv.costo, costo, compra.id, id_usuario]
      );
    }
    await client.query(
      `UPDATE compras SET estado = 'ANULADA', saldo_pendiente = 0, observacion = CONCAT_WS(E'\\n', observacion, $1::text), updated_at = NOW() WHERE id = $2`,
      [`Anulada: ${motivo}`, compra.id]
    );
    await auditar(client, { id_negocio, tabla: "compras", id_registro: compra.id, accion: "ANULAR", antes: { estado: compra.estado, total: compra.total }, despues: { motivo }, id_usuario });
    return { ok: true };
  }),

  // Proveedores: los usados por este negocio y búsqueda por nombre/identificación
  proveedores: async (id_negocio, q) => {
    const busca = texto(q, 60);
    const buscar = busca && busca.length >= 3;
    const [rows] = await db.query(
      `SELECT DISTINCT p.id, p.identificacion, TRIM(CONCAT(p.nombres, ' ', COALESCE(p.apellidos, ''))) AS nombre, p.telefono
       FROM personas p
       WHERE ${buscar ? `(p.identificacion ILIKE $1 OR CONCAT(p.nombres, ' ', p.apellidos) ILIKE $1)` : `p.id IN (SELECT id_proveedor FROM compras WHERE id_negocio = $1)`}
       ORDER BY nombre LIMIT 30`,
      [buscar ? `%${busca}%` : id_negocio]
    );
    return rows;
  },

  metodosPago: async (id_negocio) => {
    const [rows] = await db.query(`SELECT id, codigo, nombre FROM metodos_pago WHERE id_negocio = $1 AND activo ORDER BY nombre`, [id_negocio]);
    return rows;
  },
};
