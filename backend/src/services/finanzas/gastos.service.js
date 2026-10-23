// Costos y gastos del negocio: categorías, gastos causados (fijos, servicios,
// variables, nómina), sus pagos, gastos recurrentes y clasificación de egresos de caja.
//
// Reglas para no contar dos veces:
//  · El gasto se CAUSA en su período (aunque no esté pagado).
//  · El pago es salida de dinero. Si sale de la caja se crea un egreso y se
//    vincula; si se vincula un egreso que ya existía, no se crea otro.
//  · Un recurrente se causa una sola vez por período (índice único).
import { db } from "../../config/db.js";
import { auditar, egresoDeCaja, enTransaccion, errorHttp, fecha, mesActual, monto, periodo, redondear, sumarMeses, texto } from "./comun.js";

const GRUPOS = ["FIJO", "VARIABLE", "SERVICIO", "FUNCIONAMIENTO", "NOMINA", "NO_OPERATIVO"];
const PASO = { MENSUAL: 1, BIMESTRAL: 2, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12 };
const ESTADO = (valor, saldo) => (saldo <= 0 ? "PAGADO" : saldo < valor ? "PARCIAL" : "PENDIENTE");

/* ------------------------------ Categorías ------------------------------ */
export const categorias = async (id_negocio) => {
  const [rows] = await db.query(
    `SELECT id, id_negocio, codigo, nombre, grupo, palabras, orden, activo, (id_negocio IS NULL) AS del_sistema
     FROM fin_categorias WHERE (id_negocio IS NULL OR id_negocio = $1) AND activo ORDER BY orden, nombre`,
    [id_negocio]
  );
  return rows;
};

export const crearCategoria = async (data, { id_negocio, id_usuario }) => {
  const errores = {};
  const nombre = texto(data.nombre, 80);
  if (!nombre) errores.nombre = "Obligatorio";
  if (!GRUPOS.includes(data.grupo)) errores.grupo = "Elige el tipo de gasto";
  if (Object.keys(errores).length) throw errorHttp(400, "Revisa la categoría", errores);
  const codigo = `n${id_negocio}_${nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30)}`;
  const palabras = (Array.isArray(data.palabras) ? data.palabras : String(data.palabras ?? "").split(","))
    .map((p) => String(p).trim().toLowerCase()).filter(Boolean).slice(0, 30);
  try {
    const { rows: [c] } = await db.query(
      `INSERT INTO fin_categorias (id_negocio, codigo, nombre, grupo, palabras, orden) VALUES ($1, $2, $3, $4, $5, 200) RETURNING *`,
      [id_negocio, codigo, nombre, data.grupo, palabras]
    );
    await auditar(db, { id_negocio, tabla: "fin_categorias", id_registro: c.id, accion: "CREAR", despues: c, id_usuario });
    return c;
  } catch (err) {
    if (err.code === "23505") throw errorHttp(409, "Ya existe una categoría con ese nombre");
    throw err;
  }
};

const categoriaValida = async (client, id_categoria, id_negocio) => {
  const { rows: [c] } = await client.query(
    `SELECT id, grupo, nombre FROM fin_categorias WHERE id = $1 AND (id_negocio IS NULL OR id_negocio = $2) AND activo`,
    [id_categoria, id_negocio]
  );
  return c ?? null;
};

/* -------------------------------- Gastos -------------------------------- */
const leerGasto = async (client, data, id_negocio, errores, actual = null) => {
  const g = {};
  const cat = await categoriaValida(client, data.id_categoria ?? actual?.id_categoria, id_negocio);
  if (!cat) errores.id_categoria = "Elige una categoría";
  else if (cat.grupo === "NO_OPERATIVO") errores.id_categoria = "Esa categoría no es un gasto (es un movimiento de dinero)";
  g.id_categoria = cat?.id;
  g.concepto = texto(data.concepto ?? actual?.concepto, 160);
  if (!g.concepto) errores.concepto = "Escribe el concepto";
  g.valor = monto(data.valor ?? actual?.valor, { positivo: true, errores });
  g.periodo = periodo(data.periodo ?? actual?.periodo_txt);
  if (!g.periodo) errores.periodo = "Elige el mes al que corresponde";
  g.fecha_emision = fecha(data.fecha_emision, { campo: "fecha_emision", errores });
  g.fecha_vencimiento = fecha(data.fecha_vencimiento, { campo: "fecha_vencimiento", errores });
  if (g.fecha_emision && g.fecha_vencimiento && g.fecha_vencimiento < g.fecha_emision) errores.fecha_vencimiento = "No puede ser anterior a la emisión";
  g.beneficiario = texto(data.beneficiario, 120);
  g.numero_documento = texto(data.numero_documento, 60);
  g.observacion = texto(data.observacion, 1000);
  g.soporte_url = texto(data.soporte_url, 500);
  if (g.soporte_url && !/^https?:\/\//i.test(g.soporte_url)) errores.soporte_url = "Debe ser un enlace (https://…)";
  for (const k of ["consumo", "lectura_anterior", "lectura_actual"]) {
    g[k] = data[k] === "" || data[k] == null ? null : monto(data[k], { campo: k, errores });
  }
  if (g.lectura_anterior !== null && g.lectura_actual !== null) {
    if (g.lectura_actual < g.lectura_anterior) errores.lectura_actual = "Menor que la lectura anterior";
    else if (g.consumo === null) g.consumo = redondear(g.lectura_actual - g.lectura_anterior, 3);
  }
  g.unidad_consumo = texto(data.unidad_consumo, 12);
  g.id_proveedor = data.id_proveedor ? Number(data.id_proveedor) : null;
  return g;
};

export const listarGastos = async (id_negocio, f = {}) => {
  const params = [id_negocio];
  const w = [];
  const p = (v) => { params.push(v); return `$${params.length}`; };
  if (periodo(f.desde)) w.push(`g.periodo >= ${p(periodo(f.desde))}`);
  if (periodo(f.hasta)) w.push(`g.periodo <= ${p(periodo(f.hasta))}`);
  if (f.estado === "POR_PAGAR") w.push(`g.estado IN ('PENDIENTE', 'PARCIAL')`);
  else if (f.estado) w.push(`g.estado = ${p(String(f.estado))}`);
  else w.push(`g.estado <> 'ANULADO'`);
  if (f.grupo) w.push(`c.grupo = ${p(String(f.grupo))}`);
  if (f.id_categoria) w.push(`g.id_categoria = ${p(Number(f.id_categoria))}`);
  if (f.q) w.push(`(g.concepto ILIKE ${p(`%${f.q}%`)} OR g.beneficiario ILIKE $${params.length} OR g.numero_documento ILIKE $${params.length})`);
  const [rows] = await db.query(
    `SELECT g.id, g.concepto, g.valor::float, g.saldo::float, (g.valor - g.saldo)::float AS pagado, to_char(g.periodo, 'YYYY-MM') AS periodo,
            to_char(g.fecha_emision, 'YYYY-MM-DD') AS fecha_emision, to_char(g.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento, g.estado, g.beneficiario, g.numero_documento, g.consumo::float, g.unidad_consumo,
            g.lectura_anterior::float, g.lectura_actual::float, g.soporte_url, g.observacion, g.id_recurrente, g.id_categoria,
            c.nombre AS categoria, c.grupo,
            (g.estado IN ('PENDIENTE', 'PARCIAL') AND g.fecha_vencimiento < CURRENT_DATE) AS vencido,
            (g.estado IN ('PENDIENTE', 'PARCIAL') AND g.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) AS por_vencer
     FROM fin_gastos g JOIN fin_categorias c ON c.id = g.id_categoria
     WHERE g.id_negocio = $1 AND ${w.join(" AND ")}
     ORDER BY g.periodo DESC, g.fecha_vencimiento NULLS LAST, g.id DESC LIMIT 1000`,
    params
  );
  return rows;
};

export const detalleGasto = async (id, id_negocio) => {
  const [[g]] = await db.query(`SELECT g.*, c.nombre AS categoria, c.grupo FROM fin_gastos g JOIN fin_categorias c ON c.id = g.id_categoria WHERE g.id = $1 AND g.id_negocio = $2`, [id, id_negocio]);
  if (!g) throw errorHttp(404, "Gasto no encontrado");
  const [pagos] = await db.query(
    `SELECT p.id, p.fecha, p.valor::float, p.medio, p.referencia, p.anulado, p.id_egreso, e.numero_egreso
     FROM fin_pagos p LEFT JOIN egresos e ON e.id = p.id_egreso WHERE p.id_gasto = $1 ORDER BY p.id`,
    [id]
  );
  return { ...g, valor: Number(g.valor), saldo: Number(g.saldo), pagos };
};

// Se lee el detalle DESPUÉS de confirmar la transacción (antes no es visible)
export const crearGasto = async (data, ctx) => detalleGasto(await crearGastoTx(data, ctx), ctx.id_negocio);
const crearGastoTx = async (data, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
  const errores = {};
  const g = await leerGasto(client, data, id_negocio, errores);
  if (Object.keys(errores).length) throw errorHttp(400, "Revisa los datos del gasto", errores);
  const { rows: [nuevo] } = await client.query(
    `INSERT INTO fin_gastos (id_negocio, id_categoria, concepto, valor, saldo, periodo, fecha_emision, fecha_vencimiento, beneficiario, numero_documento,
                             consumo, unidad_consumo, lectura_anterior, lectura_actual, soporte_url, observacion, id_proveedor, id_usuario)
     VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
    [id_negocio, g.id_categoria, g.concepto, g.valor, g.periodo, g.fecha_emision, g.fecha_vencimiento, g.beneficiario, g.numero_documento,
      g.consumo, g.unidad_consumo, g.lectura_anterior, g.lectura_actual, g.soporte_url, g.observacion, g.id_proveedor, id_usuario]
  );
  await auditar(client, { id_negocio, tabla: "fin_gastos", id_registro: nuevo.id, accion: "CREAR", despues: nuevo, id_usuario });
  // Pagado de una vez (opcional)
  if (data.pago?.valor) await pagar(client, nuevo, data.pago, { id_negocio, id_usuario });
  return nuevo.id;
});

export const actualizarGasto = async (id, data, ctx) => detalleGasto(await actualizarGastoTx(id, data, ctx), ctx.id_negocio);
const actualizarGastoTx = async (id, data, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
  const { rows: [actual] } = await client.query(`SELECT *, to_char(periodo, 'YYYY-MM') AS periodo_txt FROM fin_gastos WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, id_negocio]);
  if (!actual) throw errorHttp(404, "Gasto no encontrado");
  if (actual.estado === "ANULADO") throw errorHttp(409, "El gasto está anulado");
  const errores = {};
  const g = await leerGasto(client, data, id_negocio, errores, actual);
  const pagado = Number(actual.valor) - Number(actual.saldo);
  if (g.valor !== null && g.valor < pagado) errores.valor = `Ya se pagaron ${pagado}: el valor no puede ser menor`;
  if (Object.keys(errores).length) throw errorHttp(400, "Revisa los datos del gasto", errores);
  const saldo = redondear(g.valor - pagado);
  const { rows: [nuevo] } = await client.query(
    `UPDATE fin_gastos SET id_categoria = $1, concepto = $2, valor = $3, saldo = $4, estado = $5, periodo = $6, fecha_emision = $7, fecha_vencimiento = $8,
            beneficiario = $9, numero_documento = $10, consumo = $11, unidad_consumo = $12, lectura_anterior = $13, lectura_actual = $14,
            soporte_url = $15, observacion = $16, id_proveedor = $17, updated_at = NOW()
     WHERE id = $18 RETURNING *`,
    [g.id_categoria, g.concepto, g.valor, saldo, ESTADO(g.valor, saldo), g.periodo, g.fecha_emision, g.fecha_vencimiento, g.beneficiario, g.numero_documento,
      g.consumo, g.unidad_consumo, g.lectura_anterior, g.lectura_actual, g.soporte_url, g.observacion, g.id_proveedor, id]
  );
  await auditar(client, { id_negocio, tabla: "fin_gastos", id_registro: id, accion: "EDITAR", antes: actual, despues: nuevo, id_usuario });
  return id;
});

export const anularGasto = async (id, motivo, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
  const { rows: [g] } = await client.query(`SELECT * FROM fin_gastos WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, id_negocio]);
  if (!g) throw errorHttp(404, "Gasto no encontrado");
  if (!texto(motivo, 300)) throw errorHttp(400, "Escribe el motivo", { motivo: "Obligatorio" });
  const { rows: [{ n }] } = await client.query(`SELECT count(*)::int AS n FROM fin_pagos WHERE id_gasto = $1 AND NOT anulado`, [id]);
  if (n > 0) throw errorHttp(409, "El gasto tiene pagos: anúlalos primero");
  await client.query(`UPDATE fin_gastos SET estado = 'ANULADO', saldo = 0, observacion = CONCAT_WS(E'\\n', observacion, $1::text), updated_at = NOW() WHERE id = $2`, [`Anulado: ${motivo}`, id]);
  await auditar(client, { id_negocio, tabla: "fin_gastos", id_registro: id, accion: "ANULAR", antes: g, despues: { motivo }, id_usuario });
  return { ok: true };
});

/* -------------------------------- Pagos --------------------------------- */
// medio: TRANSFERENCIA, EFECTIVO, TARJETA… · desde_caja: crea el egreso · id_egreso: vincula uno existente
const pagar = async (client, gasto, data, { id_negocio, id_usuario }) => {
  const errores = {};
  let valor = data.id_egreso ? null : monto(data.valor, { positivo: true, errores });
  const f = fecha(data.fecha, { campo: "fecha", errores }) ?? new Date().toISOString().slice(0, 10);
  let id_egreso = null;
  let medio = texto(data.medio, 30)?.toUpperCase() ?? "TRANSFERENCIA";
  if (data.id_egreso) {
    const { rows: [e] } = await client.query(
      `SELECT e.id, e.monto::float AS monto, e.fecha, (SELECT 1 FROM fin_pagos p WHERE p.id_egreso = e.id AND NOT p.anulado) AS usado,
              (SELECT 1 FROM pagos_compras pc WHERE pc.id_egreso = e.id) AS de_compra
       FROM egresos e WHERE e.id = $1 AND e.id_negocio = $2 AND e.estado <> 'ANULADO'`,
      [data.id_egreso, id_negocio]
    );
    if (!e) errores.id_egreso = "Egreso no encontrado";
    else if (e.usado || e.de_compra) errores.id_egreso = "Ese egreso ya está vinculado a otro pago";
    else { valor = e.monto; id_egreso = e.id; medio = "EGRESO_CAJA"; }
  }
  if (valor !== null && valor > Number(gasto.saldo)) errores.valor = `El saldo pendiente es ${Number(gasto.saldo)}`;
  if (Object.keys(errores).length) throw errorHttp(400, "Revisa el pago", errores);
  if (!id_egreso && data.desde_caja) {
    const e = await egresoDeCaja(client, { id_negocio, id_usuario, monto: valor, id_categoria: gasto.id_categoria, descripcion: gasto.concepto, observacion: "Pago de gasto registrado en Finanzas" });
    id_egreso = e.id;
    medio = "CAJA";
  }
  if (id_egreso) await client.query(`UPDATE egresos SET id_categoria = $1, categoria_confirmada = true WHERE id = $2`, [gasto.id_categoria, id_egreso]);
  const { rows: [p] } = await client.query(
    `INSERT INTO fin_pagos (id_negocio, id_gasto, id_egreso, fecha, valor, medio, referencia, soporte_url, id_usuario)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [id_negocio, gasto.id, id_egreso, f, valor, medio, texto(data.referencia, 80), texto(data.soporte_url, 500), id_usuario]
  );
  const saldo = redondear(Number(gasto.saldo) - valor);
  await client.query(`UPDATE fin_gastos SET saldo = $1, estado = $2, updated_at = NOW() WHERE id = $3`, [saldo, ESTADO(Number(gasto.valor), saldo), gasto.id]);
  await auditar(client, { id_negocio, tabla: "fin_pagos", id_registro: p.id, accion: "PAGAR", despues: p, id_usuario });
  return p;
};

export const pagarGasto = async (id, data, ctx) => enTransaccion(async (client) => {
  const { rows: [g] } = await client.query(`SELECT * FROM fin_gastos WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, ctx.id_negocio]);
  if (!g) throw errorHttp(404, "Gasto no encontrado");
  if (g.estado === "ANULADO") throw errorHttp(409, "El gasto está anulado");
  if (g.estado === "PAGADO") throw errorHttp(409, "El gasto ya está pagado");
  return pagar(client, g, data, ctx);
});

export const anularPago = async (id_gasto, id_pago, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
  const { rows: [g] } = await client.query(`SELECT * FROM fin_gastos WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id_gasto, id_negocio]);
  if (!g) throw errorHttp(404, "Gasto no encontrado");
  const { rows: [p] } = await client.query(`UPDATE fin_pagos SET anulado = true WHERE id = $1 AND id_gasto = $2 AND NOT anulado RETURNING *`, [id_pago, id_gasto]);
  if (!p) throw errorHttp(404, "Pago no encontrado");
  // Egreso creado por este pago: se anula. Egreso vinculado (ya existía): solo se desvincula.
  if (p.id_egreso && p.medio === "CAJA") await client.query(`UPDATE egresos SET estado = 'ANULADO', updated_at = NOW() WHERE id = $1`, [p.id_egreso]);
  if (p.id_egreso && p.medio === "EGRESO_CAJA") await client.query(`UPDATE fin_pagos SET id_egreso = NULL WHERE id = $1`, [p.id]);
  const saldo = redondear(Number(g.saldo) + Number(p.valor));
  await client.query(`UPDATE fin_gastos SET saldo = $1, estado = $2, updated_at = NOW() WHERE id = $3`, [saldo, ESTADO(Number(g.valor), saldo), g.id]);
  await auditar(client, { id_negocio, tabla: "fin_pagos", id_registro: p.id, accion: "ANULAR", antes: p, id_usuario });
  return { ok: true };
});

/* ------------------------------ Recurrentes ----------------------------- */
const leerRecurrente = async (client, data, id_negocio, errores) => {
  const cat = await categoriaValida(client, data.id_categoria, id_negocio);
  if (!cat || cat.grupo === "NO_OPERATIVO") errores.id_categoria = "Elige una categoría de gasto";
  const r = {
    id_categoria: cat?.id,
    concepto: texto(data.concepto, 120),
    valor_estimado: monto(data.valor_estimado, { campo: "valor_estimado", errores }),
    periodicidad: PASO[data.periodicidad] ? data.periodicidad : null,
    dia_vencimiento: Number(data.dia_vencimiento ?? 5),
    fecha_inicio: fecha(data.fecha_inicio, { campo: "fecha_inicio", errores, requerido: true }),
    fecha_fin: fecha(data.fecha_fin, { campo: "fecha_fin", errores }),
    beneficiario: texto(data.beneficiario, 120),
    observacion: texto(data.observacion, 1000),
    activo: data.activo === undefined ? true : Boolean(data.activo),
  };
  if (!r.concepto) errores.concepto = "Obligatorio";
  if (!r.periodicidad) errores.periodicidad = "Elige cada cuánto se paga";
  if (!(r.dia_vencimiento >= 1 && r.dia_vencimiento <= 28)) errores.dia_vencimiento = "Entre 1 y 28";
  if (r.fecha_inicio && r.fecha_fin && r.fecha_fin < r.fecha_inicio) errores.fecha_fin = "Anterior al inicio";
  return r;
};

export const listarRecurrentes = async (id_negocio) => {
  const [rows] = await db.query(
    `SELECT r.*, r.valor_estimado::float, to_char(r.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio, to_char(r.fecha_fin, 'YYYY-MM-DD') AS fecha_fin, c.nombre AS categoria, c.grupo,
            (SELECT to_char(max(periodo), 'YYYY-MM') FROM fin_gastos g WHERE g.id_recurrente = r.id AND g.estado <> 'ANULADO') AS ultimo_periodo
     FROM fin_recurrentes r JOIN fin_categorias c ON c.id = r.id_categoria WHERE r.id_negocio = $1 ORDER BY r.activo DESC, r.concepto`,
    [id_negocio]
  );
  return rows;
};

export const guardarRecurrente = async (id, data, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
  const errores = {};
  const r = await leerRecurrente(client, data, id_negocio, errores);
  if (Object.keys(errores).length) throw errorHttp(400, "Revisa el gasto recurrente", errores);
  const campos = ["id_categoria", "concepto", "valor_estimado", "periodicidad", "dia_vencimiento", "fecha_inicio", "fecha_fin", "beneficiario", "observacion", "activo"];
  let fila;
  if (id) {
    const { rows: [antes] } = await client.query(`SELECT * FROM fin_recurrentes WHERE id = $1 AND id_negocio = $2 FOR UPDATE`, [id, id_negocio]);
    if (!antes) throw errorHttp(404, "Gasto recurrente no encontrado");
    ({ rows: [fila] } = await client.query(
      `UPDATE fin_recurrentes SET ${campos.map((c, i) => `${c} = $${i + 1}`).join(", ")}, updated_at = NOW() WHERE id = $${campos.length + 1} RETURNING *`,
      [...campos.map((c) => r[c]), id]
    ));
    await auditar(client, { id_negocio, tabla: "fin_recurrentes", id_registro: id, accion: "EDITAR", antes, despues: fila, id_usuario });
  } else {
    ({ rows: [fila] } = await client.query(
      `INSERT INTO fin_recurrentes (id_negocio, ${campos.join(", ")}) VALUES ($1, ${campos.map((_, i) => `$${i + 2}`).join(", ")}) RETURNING *`,
      [id_negocio, ...campos.map((c) => r[c])]
    ));
    await auditar(client, { id_negocio, tabla: "fin_recurrentes", id_registro: fila.id, accion: "CREAR", despues: fila, id_usuario });
  }
  return fila;
});

// Períodos en que toca un recurrente entre dos meses (sin crear registros)
const periodosDe = (r, desde, hasta) => {
  const inicio = periodo(r.fi);
  const fin = r.ff ? periodo(r.ff) : null;
  const salida = [];
  for (let p = inicio, k = 0; p <= hasta && k < 600; p = sumarMeses(inicio, (++k) * PASO[r.periodicidad])) {
    if (fin && p > fin) break;
    if (p >= desde) salida.push(p);
  }
  return salida;
};

// Proyección: qué gastos recurrentes tocan cada mes y si ya se generaron
export const proyeccion = async (id_negocio, { desde, hasta } = {}) => {
  const d = periodo(desde) ?? mesActual();
  const h = periodo(hasta) ?? sumarMeses(d, 5);
  const [recs] = await db.query(`SELECT r.*, to_char(r.fecha_inicio, 'YYYY-MM-DD') AS fi, to_char(r.fecha_fin, 'YYYY-MM-DD') AS ff, c.nombre AS categoria FROM fin_recurrentes r JOIN fin_categorias c ON c.id = r.id_categoria WHERE r.id_negocio = $1 AND r.activo`, [id_negocio]);
  const [hechos] = await db.query(
    `SELECT id, id_recurrente, to_char(periodo, 'YYYY-MM-DD') AS periodo, estado, valor::float FROM fin_gastos WHERE id_negocio = $1 AND id_recurrente IS NOT NULL AND estado <> 'ANULADO' AND periodo BETWEEN $2 AND $3`,
    [id_negocio, d, h]
  );
  const items = [];
  for (const r of recs) {
    for (const p of periodosDe(r, d, h)) {
      const g = hechos.find((x) => x.id_recurrente === r.id && x.periodo === p);
      items.push({
        id_recurrente: r.id, concepto: r.concepto, categoria: r.categoria, periodo: p.slice(0, 7),
        valor: g ? g.valor : Number(r.valor_estimado), estimado: !g, id_gasto: g?.id ?? null, estado: g?.estado ?? "PROYECTADO",
        fecha_vencimiento: `${p.slice(0, 8)}${String(r.dia_vencimiento).padStart(2, "0")}`,
      });
    }
  }
  items.sort((a, b) => a.periodo.localeCompare(b.periodo) || a.concepto.localeCompare(b.concepto));
  return { desde: d.slice(0, 7), hasta: h.slice(0, 7), items, total_estimado: redondear(items.reduce((a, i) => a + i.valor, 0)) };
};

// Genera (causa) los gastos recurrentes hasta un mes. Repetirlo no duplica nada.
export const causarRecurrentes = async (id_negocio, { hasta, id_recurrente, valores = {} } = {}, id_usuario) => enTransaccion(async (client) => {
  const h = periodo(hasta) ?? mesActual();
  const { rows: recs } = await client.query(
    `SELECT *, to_char(fecha_inicio, 'YYYY-MM-DD') AS fi, to_char(fecha_fin, 'YYYY-MM-DD') AS ff FROM fin_recurrentes WHERE id_negocio = $1 AND activo ${id_recurrente ? "AND id = $2" : ""}`,
    id_recurrente ? [id_negocio, id_recurrente] : [id_negocio]
  );
  const creados = [];
  for (const r of recs) {
    for (const p of periodosDe(r, sumarMeses(h, -24), h)) {
      const valor = valores[`${r.id}:${p.slice(0, 7)}`] !== undefined ? monto(valores[`${r.id}:${p.slice(0, 7)}`]) : Number(r.valor_estimado);
      if (valor === null) continue;
      const vence = `${p.slice(0, 8)}${String(r.dia_vencimiento).padStart(2, "0")}`;
      const { rows: [g] } = await client.query(
        `INSERT INTO fin_gastos (id_negocio, id_categoria, id_recurrente, concepto, valor, saldo, periodo, fecha_vencimiento, beneficiario, id_proveedor, observacion, id_usuario)
         VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, 'Generado desde gasto recurrente', $10)
         ON CONFLICT (id_recurrente, periodo) WHERE id_recurrente IS NOT NULL AND estado <> 'ANULADO' DO NOTHING RETURNING id, concepto, to_char(periodo, 'YYYY-MM') AS periodo, valor::float`,
        [id_negocio, r.id_categoria, r.id, `${r.concepto} ${p.slice(0, 7)}`, valor, p, vence, r.beneficiario, r.id_proveedor, id_usuario]
      );
      if (g) creados.push(g);
    }
  }
  if (creados.length) await auditar(client, { id_negocio, tabla: "fin_gastos", accion: "CAUSAR_RECURRENTES", despues: { hasta: h, creados: creados.length }, id_usuario });
  return { creados };
});

/* ------------------------- Egresos de caja ------------------------------ */
const normal = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Sugerencia por palabras clave (la palabra más larga que coincida gana)
export const sugerir = (descripcion, cats) => {
  const d = ` ${normal(descripcion).replace(/[^a-z0-9]+/g, " ")} `;
  let mejor = null;
  for (const c of cats) {
    for (const p of c.palabras ?? []) {
      const w = normal(p).trim();
      if (w && d.includes(` ${w} `) && (!mejor || w.length > mejor.largo)) mejor = { id: c.id, nombre: c.nombre, grupo: c.grupo, largo: w.length };
    }
  }
  return mejor ? { id_categoria: mejor.id, categoria: mejor.nombre, grupo: mejor.grupo } : null;
};

export const listarEgresos = async (id_negocio, f = {}) => {
  const params = [id_negocio];
  const w = [`e.estado <> 'ANULADO'`];
  const p = (v) => { params.push(v); return `$${params.length}`; };
  if (fecha(f.desde)) w.push(`(e.fecha AT TIME ZONE 'America/Bogota')::date >= ${p(fecha(f.desde))}`);
  if (fecha(f.hasta)) w.push(`(e.fecha AT TIME ZONE 'America/Bogota')::date <= ${p(fecha(f.hasta))}`);
  if (f.sin_clasificar === "1" || f.sin_clasificar === true) w.push(`NOT e.categoria_confirmada`);
  if (f.q) w.push(`e.descripcion ILIKE ${p(`%${f.q}%`)}`);
  const [rows] = await db.query(
    `SELECT e.id, e.numero_egreso, e.fecha, e.descripcion, e.metodo_pago, e.monto::float, e.observacion, e.id_categoria, e.categoria_confirmada,
            c.nombre AS categoria, c.grupo,
            (SELECT pc.id_compra FROM pagos_compras pc WHERE pc.id_egreso = e.id LIMIT 1) AS id_compra,
            (SELECT fp.id_gasto FROM fin_pagos fp WHERE fp.id_egreso = e.id AND NOT fp.anulado LIMIT 1) AS id_gasto
     FROM egresos e LEFT JOIN fin_categorias c ON c.id = e.id_categoria
     WHERE e.id_negocio = $1 AND ${w.join(" AND ")} ORDER BY e.fecha DESC LIMIT 2000`,
    params
  );
  const cats = await categorias(id_negocio);
  return rows.map((e) => ({ ...e, sugerencia: e.categoria_confirmada || e.id_compra ? null : sugerir(e.descripcion, cats) }));
};

// Clasifica uno o varios egresos: [{ id, id_categoria }]
export const clasificarEgresos = async (lista, { id_negocio, id_usuario }) => enTransaccion(async (client) => {
  if (!Array.isArray(lista) || !lista.length) throw errorHttp(400, "Nada que clasificar");
  let n = 0;
  for (const it of lista.slice(0, 2000)) {
    const cat = it.id_categoria ? await categoriaValida(client, it.id_categoria, id_negocio) : null;
    if (it.id_categoria && !cat) throw errorHttp(400, `Categoría no válida en el egreso ${it.id}`);
    const { rows: [antes] } = await client.query(`SELECT id, id_categoria, categoria_confirmada FROM egresos WHERE id = $1 AND id_negocio = $2`, [it.id, id_negocio]);
    if (!antes) continue;
    await client.query(`UPDATE egresos SET id_categoria = $1, categoria_confirmada = $2 WHERE id = $3`, [cat?.id ?? null, Boolean(cat), it.id]);
    n++;
  }
  await auditar(client, { id_negocio, tabla: "egresos", accion: "CLASIFICAR", despues: { cantidad: n }, id_usuario });
  return { clasificados: n };
});
