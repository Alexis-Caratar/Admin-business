// Reportes financieros: resultado del período, rentabilidad por producto, flujo
// de caja, presupuestos, alertas y proyecciones. Fórmulas en
// docs/GESTION_FINANCIERA_DISENO.md (§2.4). Todo filtra por el negocio del usuario.
//
// Dos bases para el costo de ventas (se muestran ambas; ninguna se suma con la otra):
//  · "teorico": lo que costaron los productos vendidos (receta / insumo / costo de
//    referencia guardado en cada venta) + mermas valorizadas.
//  · "compras": compras de insumos del período (módulo Compras + egresos de caja
//    clasificados como insumos). Útil cuando faltan recetas o costos.
// El resultado operativo es ESTIMADO: no incluye impuesto de renta, intereses ni
// prestaciones que no se hayan registrado como gasto.
import { db } from "../../config/db.js";
import { enTransaccion, errorHttp, fecha, mesActual, periodo, redondear, sumarMeses } from "./comun.js";
import { proyeccion } from "./gastos.service.js";

// Categorías de egreso que son compra de insumos (no gasto operativo)
export const INSUMOS = ["materia_prima", "carnes", "verduras", "aceites_condimentos", "bebidas"];
const FIJOS = ["FIJO", "NOMINA", "SERVICIO"];
const ALERTAS_DEFECTO = { VENCIMIENTO_DIAS: 5, DESVIO_PRESUPUESTO_PCT: 10, MARGEN_MINIMO_PCT: 30, GASTO_ALTO_PCT: 30 };

const hoy = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })).toISOString().slice(0, 10);
const pct = (a, b) => (b ? redondear((a / b) * 100, 1) : null); // null = sin base para comparar
const crecimiento = (actual, anterior) => (anterior ? redondear(((actual - anterior) / Math.abs(anterior)) * 100, 1) : null);
const dias = (d, h) => Math.round((new Date(`${h}T00:00:00Z`) - new Date(`${d}T00:00:00Z`)) / 86400000) + 1;
const sumarDias = (d, n) => new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);

export const rango = (f = {}) => {
  const d = fecha(f.desde) ?? mesActual();
  const h = fecha(f.hasta) ?? hoy();
  if (h < d) throw errorHttp(400, "La fecha final es anterior a la inicial");
  if (dias(d, h) > 800) throw errorHttp(400, "El rango máximo es de 2 años");
  return { desde: d, hasta: h };
};
// Período anterior de la misma duración
const anterior = ({ desde, hasta }) => {
  const n = dias(desde, hasta);
  return { desde: sumarDias(desde, -n), hasta: sumarDias(desde, -1) };
};

const VENTAS = `FROM ventas v JOIN caja c ON c.id = v.id_caja JOIN usuarios u ON u.id = c.id_usuario
  WHERE u.id_negocio = $1 AND (v.fecha AT TIME ZONE 'America/Bogota')::date BETWEEN $2 AND $3`;

/* ------------------------------- Ventas -------------------------------- */
export const ventas = async (id_negocio, r) => {
  const [[v]] = await db.query(
    `SELECT count(*) FILTER (WHERE v.estado <> 'cancelado')::int AS transacciones,
            COALESCE(sum(v.subtotal) FILTER (WHERE v.estado <> 'cancelado'), 0)::float AS brutas,
            COALESCE(sum(v.descuento) FILTER (WHERE v.estado <> 'cancelado'), 0)::float AS descuentos,
            COALESCE(sum(v.impuesto) FILTER (WHERE v.estado <> 'cancelado'), 0)::float AS impuestos,
            count(*) FILTER (WHERE v.estado = 'cancelado')::int AS anuladas,
            COALESCE(sum(v.total) FILTER (WHERE v.estado = 'cancelado'), 0)::float AS valor_anuladas
     ${VENTAS}`,
    [id_negocio, r.desde, r.hasta]
  );
  const [[c]] = await db.query(
    `SELECT COALESCE(sum(vi.cantidad * vi.costo_unitario), 0)::float AS costo,
            COALESCE(sum(vi.cantidad * vi.costo_unitario) FILTER (WHERE vi.costo_estimado), 0)::float AS costo_estimado,
            COALESCE(sum(vi.subtotal) FILTER (WHERE vi.costo_unitario IS NULL), 0)::float AS ingresos_sin_costo,
            COALESCE(sum(vi.subtotal) FILTER (WHERE vi.costo_unitario IS NOT NULL AND NOT vi.costo_estimado), 0)::float AS ingresos_costo_real
     FROM ventas_items vi JOIN ventas v ON v.id = vi.id_venta JOIN caja c ON c.id = v.id_caja JOIN usuarios u ON u.id = c.id_usuario
     WHERE u.id_negocio = $1 AND (v.fecha AT TIME ZONE 'America/Bogota')::date BETWEEN $2 AND $3 AND v.estado <> 'cancelado'`,
    [id_negocio, r.desde, r.hasta]
  );
  // Decisión del negocio (21/10/2026): los impuestos no se separan por ahora
  const netas = redondear(v.brutas - v.descuentos);
  return {
    ...v, netas, ticket_promedio: v.transacciones ? redondear(netas / v.transacciones) : null,
    costo_teorico: redondear(c.costo), costo_teorico_estimado: redondear(c.costo_estimado),
    ingresos_sin_costo: redondear(c.ingresos_sin_costo), cobertura_costo_real_pct: pct(c.ingresos_costo_real, v.brutas),
  };
};

/* ------------------------------- Gastos -------------------------------- */
// Gastos causados del período, prorrateados por días si el rango cubre parte de un mes
const gastosCausados = async (id_negocio, r) => {
  const [rows] = await db.query(
    `SELECT c.grupo, c.codigo, c.nombre AS categoria,
            sum(g.valor * (LEAST($3::date, (g.periodo + interval '1 month' - interval '1 day')::date) - GREATEST($2::date, g.periodo) + 1)
                / EXTRACT(day FROM (g.periodo + interval '1 month' - interval '1 day')))::float AS valor,
            bool_or($2::date > g.periodo OR $3::date < (g.periodo + interval '1 month' - interval '1 day')::date) AS prorrateado
     FROM fin_gastos g JOIN fin_categorias c ON c.id = g.id_categoria
     WHERE g.id_negocio = $1 AND g.estado <> 'ANULADO'
       AND g.periodo <= $3::date AND (g.periodo + interval '1 month' - interval '1 day')::date >= $2::date
     GROUP BY 1, 2, 3`,
    [id_negocio, r.desde, r.hasta]
  );
  return rows.map((x) => ({ ...x, valor: redondear(x.valor), origen: "gastos" }));
};

// Egresos de caja que no pagan una compra ni un gasto ya registrado (así no se cuentan dos veces)
const egresosPropios = (alias = "e") => `${alias}.estado <> 'ANULADO'
  AND NOT EXISTS (SELECT 1 FROM pagos_compras pc WHERE pc.id_egreso = ${alias}.id)
  AND NOT EXISTS (SELECT 1 FROM fin_pagos fp WHERE fp.id_egreso = ${alias}.id AND NOT fp.anulado)`;

const egresosClasificados = async (id_negocio, r) => {
  const [rows] = await db.query(
    `SELECT COALESCE(c.grupo, 'SIN_CLASIFICAR') AS grupo, c.codigo, COALESCE(c.nombre, 'Por clasificar') AS categoria, sum(e.monto)::float AS valor
     FROM egresos e LEFT JOIN fin_categorias c ON c.id = e.id_categoria AND e.categoria_confirmada
     WHERE e.id_negocio = $1 AND (e.fecha AT TIME ZONE 'America/Bogota')::date BETWEEN $2 AND $3 AND ${egresosPropios()}
     GROUP BY 1, 2, 3`,
    [id_negocio, r.desde, r.hasta]
  );
  return rows.map((x) => ({ ...x, valor: redondear(x.valor), origen: "egresos" }));
};

const mermas = async (id_negocio, r) => {
  const [[m]] = await db.query(
    `SELECT COALESCE(sum(m.cantidad * COALESCE(m.costo_unitario, i.costo_unitario, 0)), 0)::float AS valor
     FROM inventario_movimientos m JOIN inventario i ON i.id = m.inventario_id
     WHERE i.id_negocio = $1 AND m.tipo = 'SALIDA' AND m.motivo ILIKE 'MERMA%'
       AND (m.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota')::date BETWEEN $2 AND $3`,
    [id_negocio, r.desde, r.hasta]
  );
  return redondear(m.valor);
};

const comprasInventario = async (id_negocio, r) => {
  const [[c]] = await db.query(
    `SELECT COALESCE(sum(total - impuesto), 0)::float AS valor FROM compras
     WHERE id_negocio = $1 AND estado <> 'ANULADA' AND (fecha_compra AT TIME ZONE 'UTC' AT TIME ZONE 'America/Bogota')::date BETWEEN $2 AND $3`,
    [id_negocio, r.desde, r.hasta]
  );
  return redondear(c.valor);
};

const depreciacion = async (id_negocio, r) => {
  const [[a]] = await db.query(
    `SELECT COALESCE(sum(depreciacion_mensual), 0)::float AS mensual FROM activos
     WHERE id_negocio = $1 AND COALESCE(estado, 'ACTIVO') NOT IN ('BAJA', 'VENDIDO', 'INACTIVO') AND (fecha_compra IS NULL OR fecha_compra <= $2)`,
    [id_negocio, r.hasta]
  );
  return redondear(a.mensual * (dias(r.desde, r.hasta) / 30.4375));
};

/* --------------------------- Resultado del período --------------------- */
export const resultado = async (id_negocio, r) => {
  const [v, causados, egresos, merma, compras, dep] = await Promise.all([
    ventas(id_negocio, r), gastosCausados(id_negocio, r), egresosClasificados(id_negocio, r),
    mermas(id_negocio, r), comprasInventario(id_negocio, r), depreciacion(id_negocio, r),
  ]);
  const esInsumo = (x) => x.origen === "egresos" && INSUMOS.includes(x.codigo);
  const insumosCaja = redondear(egresos.filter(esInsumo).reduce((a, x) => a + x.valor, 0));
  const sinClasificar = redondear(egresos.filter((x) => x.grupo === "SIN_CLASIFICAR").reduce((a, x) => a + x.valor, 0));
  const noOperativos = redondear(egresos.filter((x) => x.grupo === "NO_OPERATIVO").reduce((a, x) => a + x.valor, 0));
  // Gastos operativos: causados + egresos clasificados como gasto (sin insumos, sin no operativos, sin los por clasificar)
  const lineas = [...causados, ...egresos.filter((x) => !esInsumo(x) && !["SIN_CLASIFICAR", "NO_OPERATIVO"].includes(x.grupo))];
  const porGrupo = {};
  const porCategoria = {};
  for (const x of lineas) {
    porGrupo[x.grupo] = redondear((porGrupo[x.grupo] ?? 0) + x.valor);
    porCategoria[x.categoria] = { grupo: x.grupo, valor: redondear((porCategoria[x.categoria]?.valor ?? 0) + x.valor) };
  }
  if (dep) porGrupo.DEPRECIACION = dep;
  const gastosOperativos = redondear(lineas.reduce((a, x) => a + x.valor, 0) + dep);
  const fijos = redondear(FIJOS.reduce((a, g) => a + (porGrupo[g] ?? 0), 0) + dep);
  const variables = redondear(porGrupo.VARIABLE ?? 0);

  const base = (costo) => {
    const margen = redondear(v.netas - costo);
    const contribucion = redondear(v.netas - costo - variables);
    const mcPct = v.netas > 0 ? contribucion / v.netas : null;
    return {
      costo_ventas: costo,
      margen_bruto: margen,
      margen_bruto_pct: pct(margen, v.netas),
      margen_contribucion: contribucion,
      margen_contribucion_pct: mcPct === null ? null : redondear(mcPct * 100, 1),
      resultado_operativo_estimado: redondear(margen - gastosOperativos),
      // Ventas necesarias para cubrir los costos fijos (solo con costos fijos registrados y contribución positiva)
      punto_equilibrio: fijos > 0 && mcPct && mcPct > 0 ? redondear(fijos / mcPct) : null,
    };
  };
  const teorico = base(redondear(v.costo_teorico + merma));
  const porCompras = base(redondear(compras + insumosCaja));
  return {
    rango: r,
    ventas: v,
    costos: {
      teorico: { ...teorico, detalle: { productos_vendidos: v.costo_teorico, de_eso_estimado: v.costo_teorico_estimado, mermas: merma } },
      compras: { ...porCompras, detalle: { compras_inventario: compras, insumos_pagados_por_caja: insumosCaja } },
      // Si menos del 70 % de lo vendido tiene costo real Y hay compras de insumos registradas,
      // el costo por compras es más confiable; sin compras registradas se usa el teórico (estimado)
      base_recomendada: (v.cobertura_costo_real_pct ?? 0) >= 70 || compras + insumosCaja === 0 ? "teorico" : "compras",
    },
    gastos: {
      operativos: gastosOperativos, fijos, variables, depreciacion: dep,
      por_grupo: porGrupo,
      por_categoria: Object.entries(porCategoria).map(([categoria, x]) => ({ categoria, ...x })).sort((a, b) => b.valor - a.valor),
      prorrateados: causados.some((x) => x.prorrateado),
      sin_clasificar: sinClasificar, no_operativos: noOperativos,
    },
  };
};

/* ------------------------- Rentabilidad por producto -------------------- */
export const rentabilidad = async (id_negocio, f = {}) => {
  const r = rango(f);
  const ant = anterior(r);
  const params = [id_negocio, r.desde, r.hasta];
  const filtroCat = f.id_categoria ? ` AND p.id_categoria = $${params.push(Number(f.id_categoria))}` : "";
  const porProducto = async (d, h, extra = []) => (await db.query(
    `SELECT p.id, sum(vi.cantidad)::float AS unidades, sum(vi.subtotal)::float AS ingresos,
            sum(vi.cantidad * vi.costo_unitario)::float AS costo, bool_or(vi.costo_estimado) AS estimado,
            count(*) FILTER (WHERE vi.costo_unitario IS NULL)::int AS lineas_sin_costo
     FROM ventas_items vi JOIN ventas v ON v.id = vi.id_venta JOIN caja c ON c.id = v.id_caja JOIN usuarios u ON u.id = c.id_usuario
     JOIN productos p ON p.id = vi.id_producto
     WHERE u.id_negocio = $1 AND (v.fecha AT TIME ZONE 'America/Bogota')::date BETWEEN $2 AND $3 AND v.estado <> 'cancelado'${filtroCat}
     GROUP BY p.id`,
    [id_negocio, d, h, ...extra]
  ))[0];
  const actual = await porProducto(r.desde, r.hasta, params.slice(3));
  const previo = new Map((await porProducto(ant.desde, ant.hasta, params.slice(3))).map((x) => [x.id, x]));
  // Precio y costo de hoy (para margen unitario y alertas de precio)
  const [catalogo] = await db.query(
    `SELECT p.id, p.nombre, p.usa_receta, cat.id AS id_categoria, cat.nombre AS categoria, p.estado,
            (SELECT pp.precio_venta FROM productos_precios pp WHERE pp.id_producto = p.id ORDER BY pp.id DESC LIMIT 1)::float AS precio,
            fc.costo::float AS costo_actual, fc.estimado AS costo_actual_estimado,
            (p.usa_receta AND NOT EXISTS (SELECT 1 FROM recetas rc WHERE rc.producto_id = p.id)) AS receta_vacia
     FROM productos p JOIN categorias cat ON cat.id = p.id_categoria
     CROSS JOIN LATERAL fin_costo_producto(p.id) fc
     WHERE cat.id_negocio = $1 AND p.es_complemento IS NOT TRUE${f.id_categoria ? " AND p.id_categoria = $2" : ""}`,
    f.id_categoria ? [id_negocio, Number(f.id_categoria)] : [id_negocio]
  );
  const umbral = (await configAlertas(id_negocio)).MARGEN_MINIMO_PCT;
  const vendidos = new Map(actual.map((x) => [x.id, x]));
  let filas = catalogo
    .filter((p) => vendidos.has(p.id) || f.todos === "1" || f.todos === true)
    .map((p) => {
      const a = vendidos.get(p.id) ?? { unidades: 0, ingresos: 0, costo: 0, estimado: true, lineas_sin_costo: 0 };
      const b = previo.get(p.id);
      const contribucion = a.costo !== null && a.lineas_sin_costo === 0 ? redondear(a.ingresos - a.costo) : null;
      const unitario = p.precio && p.costo_actual !== null ? redondear(p.precio - p.costo_actual) : null;
      return {
        id: p.id, nombre: p.nombre, categoria: p.categoria, id_categoria: p.id_categoria,
        precio_actual: p.precio, costo_actual: p.costo_actual,
        costo_estimado: p.costo_actual === null ? null : Boolean(p.costo_actual_estimado || a.estimado),
        sin_costo: p.costo_actual === null, receta_vacia: p.receta_vacia,
        margen_unitario: unitario, margen_unitario_pct: unitario === null ? null : pct(unitario, p.precio),
        unidades: redondear(a.unidades, 3), ingresos: redondear(a.ingresos), costo_ventas: redondear(a.costo ?? 0),
        contribucion, contribucion_pct: contribucion === null ? null : pct(contribucion, a.ingresos),
        unidades_anterior: b ? redondear(b.unidades, 3) : 0, ingresos_anterior: b ? redondear(b.ingresos) : 0,
        crecimiento_ingresos_pct: crecimiento(a.ingresos, b?.ingresos ?? 0),
      };
    });
  // Participación y señales (volumen ≠ rentabilidad)
  const totalIngresos = filas.reduce((s, x) => s + x.ingresos, 0);
  const totalContribucion = filas.reduce((s, x) => s + (x.contribucion ?? 0), 0);
  const conMargen = filas.filter((x) => x.contribucion_pct !== null && x.unidades > 0);
  const cuartil = (arr, q) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.floor((s.length - 1) * q)]; };
  const p75Unidades = cuartil(conMargen.map((x) => x.unidades), 0.75);
  const p25Margen = cuartil(conMargen.map((x) => x.contribucion_pct), 0.25);
  filas = filas.map((x) => ({
    ...x,
    participacion_ingresos_pct: pct(x.ingresos, totalIngresos),
    participacion_contribucion_pct: x.contribucion === null ? null : pct(x.contribucion, totalContribucion),
    senales: [
      x.sin_costo && "Sin costo registrado",
      x.receta_vacia && "Receta sin ingredientes",
      x.costo_actual !== null && x.precio_actual !== null && x.costo_actual >= x.precio_actual && "El precio no cubre el costo",
      x.margen_unitario_pct !== null && x.margen_unitario_pct < umbral && x.costo_actual < (x.precio_actual ?? 0) && `Margen menor al ${umbral} %`,
      p75Unidades !== null && x.unidades >= p75Unidades && x.contribucion_pct !== null && x.contribucion_pct <= p25Margen && "Se vende mucho pero deja poco",
    ].filter(Boolean),
  }));
  const orden = { contribucion: (a, b) => (b.contribucion ?? -Infinity) - (a.contribucion ?? -Infinity), unidades: (a, b) => b.unidades - a.unidades,
    ingresos: (a, b) => b.ingresos - a.ingresos, margen: (a, b) => (a.contribucion_pct ?? Infinity) - (b.contribucion_pct ?? Infinity) }[f.orden] ?? ((a, b) => b.ingresos - a.ingresos);
  filas.sort(orden);
  const categorias = {};
  for (const x of filas) {
    const c = (categorias[x.categoria] ??= { categoria: x.categoria, unidades: 0, ingresos: 0, costo_ventas: 0, contribucion: 0, completo: true });
    c.unidades = redondear(c.unidades + x.unidades, 3); c.ingresos = redondear(c.ingresos + x.ingresos); c.costo_ventas = redondear(c.costo_ventas + x.costo_ventas);
    if (x.contribucion === null && x.unidades > 0) c.completo = false; else c.contribucion = redondear(c.contribucion + (x.contribucion ?? 0));
  }
  return {
    rango: r, anterior: ant, umbral_margen_pct: umbral,
    productos: filas,
    categorias: Object.values(categorias).map((c) => ({ ...c, contribucion_pct: pct(c.contribucion, c.ingresos) })).sort((a, b) => b.ingresos - a.ingresos),
    totales: { ingresos: redondear(totalIngresos), contribucion: redondear(totalContribucion), contribucion_pct: pct(totalContribucion, totalIngresos) },
  };
};

/* ------------------------------- Flujo de caja -------------------------- */
export const flujo = async (id_negocio, f = {}) => {
  const r = rango(f);
  const unidad = { dia: "day", semana: "week", mes: "month" }[f.agrupar] ?? (dias(r.desde, r.hasta) > 62 ? "month" : "day");
  const P = [id_negocio, r.desde, r.hasta, unidad];
  const [entradas] = await db.query(
    `SELECT date_trunc($4, (pg.fecha AT TIME ZONE 'America/Bogota'))::date AS fecha, UPPER(COALESCE(pg.metodo_pago, 'EFECTIVO')) AS medio, sum(pg.monto_pagado)::float AS valor
     FROM v_pagos_medios pg JOIN ventas v ON v.id = pg.id_venta JOIN caja c ON c.id = v.id_caja JOIN usuarios u ON u.id = c.id_usuario
     WHERE u.id_negocio = $1 AND (pg.fecha AT TIME ZONE 'America/Bogota')::date BETWEEN $2 AND $3 AND v.estado <> 'cancelado'
       AND UPPER(COALESCE(pg.metodo_pago, '')) NOT IN ('PENDIENTE', 'TIQUERERA')   -- pagos divididos: un renglón por medio
     GROUP BY 1, 2`, P);
  // Venta de tiqueteras: el cliente paga por adelantado (sí es dinero que entra).
  // Sus consumos ('TIQUERERA') no son dinero nuevo y por eso se excluyen arriba.
  const tiq = await db.query(
    `SELECT date_trunc($4, (fecha_compra AT TIME ZONE 'America/Bogota'))::date AS fecha, 'TIQUETERAS (' || metodo_pago || ')' AS medio, sum(valor_pagado)::float AS valor
     FROM tiqueteras WHERE id_negocio = $1 AND estado <> 'ANULADA' AND (fecha_compra AT TIME ZONE 'America/Bogota')::date BETWEEN $2 AND $3 GROUP BY 1, 2`, P
  ).then(([rows]) => rows, (err) => (err.code === "42P01" ? [] : Promise.reject(err)));
  entradas.push(...tiq);
  const [salidas] = await db.query(
    `SELECT fecha, tipo, sum(valor)::float AS valor FROM (
        SELECT date_trunc($4, (e.fecha AT TIME ZONE 'America/Bogota'))::date AS fecha,
               CASE WHEN c.codigo = 'base_caja' THEN 'TRASLADO' WHEN c.grupo = 'NO_OPERATIVO' THEN 'FINANCIACION'
                    WHEN EXISTS (SELECT 1 FROM pagos_compras pc WHERE pc.id_egreso = e.id) THEN 'COMPRAS' ELSE 'OPERACION' END AS tipo,
               e.monto AS valor
        FROM egresos e LEFT JOIN fin_categorias c ON c.id = e.id_categoria AND e.categoria_confirmada
        WHERE e.id_negocio = $1 AND e.estado <> 'ANULADO' AND (e.fecha AT TIME ZONE 'America/Bogota')::date BETWEEN $2 AND $3
        UNION ALL
        SELECT date_trunc($4, pc.fecha)::date, 'COMPRAS', pc.valor
        FROM pagos_compras pc JOIN compras co ON co.id = pc.id_compra
        WHERE co.id_negocio = $1 AND pc.id_egreso IS NULL AND pc.fecha::date BETWEEN $2 AND $3
        UNION ALL
        SELECT date_trunc($4, fp.fecha)::date, 'OPERACION', fp.valor
        FROM fin_pagos fp WHERE fp.id_negocio = $1 AND NOT fp.anulado AND fp.id_egreso IS NULL AND fp.fecha BETWEEN $2 AND $3
     ) s GROUP BY 1, 2`, P);
  const fechas = [...new Set([...entradas, ...salidas].map((x) => String(x.fecha instanceof Date ? x.fecha.toISOString().slice(0, 10) : x.fecha)))].sort();
  const clave = (x) => String(x.fecha instanceof Date ? x.fecha.toISOString().slice(0, 10) : x.fecha);
  let acumulado = Number(f.saldo_inicial) || 0;
  const serie = fechas.map((d) => {
    const ent = entradas.filter((x) => clave(x) === d).reduce((a, x) => a + x.valor, 0);
    const sal = (t) => salidas.filter((x) => clave(x) === d && x.tipo === t).reduce((a, x) => a + x.valor, 0);
    const neto = ent - sal("OPERACION") - sal("COMPRAS") - sal("FINANCIACION");
    acumulado += neto;
    return { fecha: d, entradas: redondear(ent), operacion: redondear(sal("OPERACION")), compras: redondear(sal("COMPRAS")),
      financiacion: redondear(sal("FINANCIACION")), traslados: redondear(sal("TRASLADO")), neto: redondear(neto), acumulado: redondear(acumulado) };
  });
  const suma = (k) => redondear(serie.reduce((a, x) => a + x[k], 0));
  const porMedio = {};
  for (const x of entradas) porMedio[x.medio] = redondear((porMedio[x.medio] ?? 0) + x.valor);
  const [[pp]] = await db.query(
    `SELECT COALESCE(sum(saldo), 0)::float AS total,
            COALESCE(sum(saldo) FILTER (WHERE vence < CURRENT_DATE), 0)::float AS vencido,
            COALESCE(sum(saldo) FILTER (WHERE vence BETWEEN CURRENT_DATE AND CURRENT_DATE + 7), 0)::float AS proximos_7_dias
     FROM (SELECT saldo_pendiente AS saldo, fecha_vencimiento AS vence FROM compras WHERE id_negocio = $1 AND estado IN ('PENDIENTE', 'PARCIAL')
           UNION ALL SELECT saldo, fecha_vencimiento FROM fin_gastos WHERE id_negocio = $1 AND estado IN ('PENDIENTE', 'PARCIAL')) s`,
    [id_negocio]
  );
  const [[pc]] = await db.query(
    `SELECT COALESCE(sum(pg.monto_pagado), 0)::float AS total, count(*)::int AS ventas
     FROM pagos pg JOIN ventas v ON v.id = pg.id_venta JOIN caja c ON c.id = v.id_caja JOIN usuarios u ON u.id = c.id_usuario
     WHERE u.id_negocio = $1 AND v.estado <> 'cancelado' AND UPPER(COALESCE(pg.metodo_pago, '')) = 'PENDIENTE'`,
    [id_negocio]
  );
  return {
    rango: r, agrupado_por: { day: "dia", week: "semana", month: "mes" }[unidad], saldo_inicial: Number(f.saldo_inicial) || 0,
    serie, entradas_por_medio: porMedio,
    totales: { entradas: suma("entradas"), salidas_operacion: suma("operacion"), salidas_compras: suma("compras"), salidas_financiacion: suma("financiacion"),
      traslados_excluidos: suma("traslados"), neto: suma("neto"), saldo_final: redondear((Number(f.saldo_inicial) || 0) + suma("neto")) },
    por_pagar: { total: redondear(pp.total), vencido: redondear(pp.vencido), proximos_7_dias: redondear(pp.proximos_7_dias) },
    por_cobrar: { total: redondear(pc.total), ventas: pc.ventas, nota: "Ventas registradas con pago PENDIENTE" },
  };
};

/* ----------------------- Presupuestos y alertas ------------------------- */
export const listarPresupuestos = async (id_negocio, f = {}) => {
  const d = periodo(f.desde) ?? sumarMeses(mesActual(), -2);
  const h = periodo(f.hasta) ?? sumarMeses(mesActual(), 3);
  const [rows] = await db.query(
    `SELECT p.id, to_char(p.periodo, 'YYYY-MM') AS periodo, p.tipo, p.id_categoria, c.nombre AS categoria, p.valor::float
     FROM fin_presupuestos p LEFT JOIN fin_categorias c ON c.id = p.id_categoria
     WHERE p.id_negocio = $1 AND p.periodo BETWEEN $2 AND $3 ORDER BY p.periodo, p.tipo, c.nombre NULLS FIRST`,
    [id_negocio, d, h]
  );
  return rows;
};

export const guardarPresupuestos = async (id_negocio, lista, id_usuario) => {
  if (!Array.isArray(lista)) throw errorHttp(400, "Formato no válido");
  await enTransaccion(async (client) => {
    for (const it of lista.slice(0, 500)) {
      const p = periodo(it.periodo);
      if (!p || !["VENTAS", "GASTO", "MARGEN"].includes(it.tipo)) throw errorHttp(400, "Período o tipo no válido");
      const cat = it.id_categoria ? Number(it.id_categoria) : null;
      if (it.valor === null || it.valor === "") {
        await client.query(`DELETE FROM fin_presupuestos WHERE id_negocio = $1 AND periodo = $2 AND tipo = $3 AND COALESCE(id_categoria, 0) = COALESCE($4, 0)`, [id_negocio, p, it.tipo, cat]);
        continue;
      }
      const valor = Number(it.valor);
      if (!Number.isFinite(valor) || valor < 0 || (it.tipo === "MARGEN" && valor > 100)) throw errorHttp(400, `Valor no válido en ${it.periodo}`);
      await client.query(
        `INSERT INTO fin_presupuestos (id_negocio, periodo, tipo, id_categoria, valor) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_negocio, periodo, tipo, COALESCE(id_categoria, 0)) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
        [id_negocio, p, it.tipo, cat, valor]
      );
    }
    await client.query(`INSERT INTO fin_auditoria (id_negocio, tabla, accion, despues, id_usuario) VALUES ($1, 'fin_presupuestos', 'GUARDAR', $2, $3)`, [id_negocio, JSON.stringify(lista.slice(0, 50)), id_usuario]);
  });
  return listarPresupuestos(id_negocio);
};

export const configAlertas = async (id_negocio) => {
  const [rows] = await db.query(`SELECT tipo, valor::float, activo FROM fin_alertas WHERE id_negocio = $1`, [id_negocio]);
  const c = { ...ALERTAS_DEFECTO };
  for (const r of rows) c[r.tipo] = r.activo ? r.valor : null;
  return c;
};

export const guardarAlertas = async (id_negocio, body = {}) => {
  for (const [tipo, defecto] of Object.entries(ALERTAS_DEFECTO)) {
    if (body[tipo] === undefined) continue;
    const activo = body[tipo] !== null && body[tipo] !== "";
    const valor = activo ? Number(body[tipo]) : defecto;
    if (!Number.isFinite(valor) || valor < 0 || valor > 1000) throw errorHttp(400, `Valor no válido para ${tipo}`);
    await db.query(
      `INSERT INTO fin_alertas (id_negocio, tipo, valor, activo) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_negocio, tipo) DO UPDATE SET valor = EXCLUDED.valor, activo = EXCLUDED.activo`,
      [id_negocio, tipo, valor, activo]
    );
  }
  return configAlertas(id_negocio);
};

export const alertas = async (id_negocio) => {
  const cfg = await configAlertas(id_negocio);
  const lista = [];
  if (cfg.VENCIMIENTO_DIAS !== null) {
    const [venc] = await db.query(
      `SELECT 'gasto' AS tipo, id, concepto AS nombre, saldo::float, to_char(fecha_vencimiento, 'YYYY-MM-DD') AS vence, fecha_vencimiento < CURRENT_DATE AS vencido
       FROM fin_gastos WHERE id_negocio = $1 AND estado IN ('PENDIENTE', 'PARCIAL') AND fecha_vencimiento <= CURRENT_DATE + $2::int
       UNION ALL
       SELECT 'compra', id, numero_compra, saldo_pendiente::float, to_char(fecha_vencimiento, 'YYYY-MM-DD'), fecha_vencimiento < CURRENT_DATE
       FROM compras WHERE id_negocio = $1 AND estado IN ('PENDIENTE', 'PARCIAL') AND fecha_vencimiento <= CURRENT_DATE + $2::int
       ORDER BY 5`,
      [id_negocio, cfg.VENCIMIENTO_DIAS]
    );
    for (const v of venc) lista.push({ nivel: v.vencido ? "alta" : "media", tipo: "vencimiento", mensaje: `${v.vencido ? "Vencido" : "Vence"} ${v.vence}: ${v.nombre}`, valor: v.saldo, ref: { tipo: v.tipo, id: v.id } });
  }
  // Mes actual hasta hoy
  const r = { desde: mesActual(), hasta: hoy() };
  const res = await resultado(id_negocio, r);
  const transcurrido = dias(r.desde, r.hasta) / dias(r.desde, sumarDias(sumarMeses(r.desde, 1), -1));
  if (cfg.DESVIO_PRESUPUESTO_PCT !== null) {
    const [pres] = await db.query(`SELECT tipo, id_categoria, valor::float FROM fin_presupuestos WHERE id_negocio = $1 AND periodo = $2`, [id_negocio, r.desde]);
    for (const p of pres) {
      if (p.tipo === "GASTO" && !p.id_categoria && res.gastos.operativos > p.valor * (1 + cfg.DESVIO_PRESUPUESTO_PCT / 100)) {
        lista.push({ nivel: "alta", tipo: "presupuesto", mensaje: `Los gastos del mes (${Math.round(res.gastos.operativos)}) superan el presupuesto (${p.valor})`, valor: res.gastos.operativos });
      }
      if (p.tipo === "VENTAS" && transcurrido > 0.25) {
        const proyectado = res.ventas.netas / transcurrido;
        if (proyectado < p.valor * (1 - cfg.DESVIO_PRESUPUESTO_PCT / 100)) {
          lista.push({ nivel: "media", tipo: "meta", mensaje: `Al ritmo actual el mes cerraría en ${Math.round(proyectado)}, por debajo de la meta (${p.valor})`, valor: proyectado });
        }
      }
    }
  }
  if (cfg.MARGEN_MINIMO_PCT !== null) {
    const rent = await rentabilidad(id_negocio, { desde: sumarDias(hoy(), -29), hasta: hoy() });
    for (const x of rent.productos.filter((p) => p.senales.some((s) => s.startsWith("El precio no cubre") || s.startsWith("Margen menor"))).slice(0, 10)) {
      lista.push({ nivel: x.senales.some((s) => s.startsWith("El precio no cubre")) ? "alta" : "media", tipo: "margen", mensaje: `${x.nombre}: ${x.senales.join(" · ")}`, valor: x.margen_unitario_pct, ref: { tipo: "producto", id: x.id } });
    }
  }
  if (cfg.GASTO_ALTO_PCT !== null && transcurrido > 0.2) {
    const previos = await Promise.all([1, 2, 3].map((k) => resultado(id_negocio, { desde: sumarMeses(r.desde, -k), hasta: sumarDias(sumarMeses(r.desde, -k + 1), -1) })));
    for (const c of res.gastos.por_categoria) {
      const prom = previos.reduce((a, p) => a + (p.gastos.por_categoria.find((x) => x.categoria === c.categoria)?.valor ?? 0), 0) / 3;
      const proyectado = c.valor / transcurrido;
      if (prom > 0 && proyectado > prom * (1 + cfg.GASTO_ALTO_PCT / 100)) {
        lista.push({ nivel: "media", tipo: "gasto_alto", mensaje: `${c.categoria}: este mes va en camino a ${Math.round(proyectado)} (promedio de 3 meses: ${Math.round(prom)})`, valor: proyectado });
      }
    }
  }
  if (res.gastos.sin_clasificar > 0) lista.push({ nivel: "baja", tipo: "clasificar", mensaje: `Hay egresos de caja por clasificar este mes (${Math.round(res.gastos.sin_clasificar)}): no entran en los gastos`, valor: res.gastos.sin_clasificar });
  return { config: cfg, alertas: lista };
};

/* --------------------------- Panel ejecutivo ---------------------------- */
export const resumen = async (id_negocio, f = {}) => {
  const r = rango(f);
  const ant = anterior(r);
  const [actual, previo] = await Promise.all([resultado(id_negocio, r), resultado(id_negocio, ant)]);
  const baseSel = f.base === "teorico" || f.base === "compras" ? f.base : actual.costos.base_recomendada;
  const kpi = (x) => ({ ...x.costos[baseSel], ventas_netas: x.ventas.netas, gastos_operativos: x.gastos.operativos });
  const a = kpi(actual), b = kpi(previo);
  const comparacion = Object.fromEntries(["ventas_netas", "costo_ventas", "margen_bruto", "gastos_operativos", "resultado_operativo_estimado"].map((k) => [k, { actual: a[k], anterior: b[k], crecimiento_pct: crecimiento(a[k], b[k]) }]));
  comparacion.transacciones = { actual: actual.ventas.transacciones, anterior: previo.ventas.transacciones, crecimiento_pct: crecimiento(actual.ventas.transacciones, previo.ventas.transacciones) };
  comparacion.ticket_promedio = { actual: actual.ventas.ticket_promedio, anterior: previo.ventas.ticket_promedio, crecimiento_pct: crecimiento(actual.ventas.ticket_promedio ?? 0, previo.ventas.ticket_promedio ?? 0) };

  // Últimos 12 meses (tendencias)
  const meses = Array.from({ length: 12 }, (_, k) => sumarMeses(periodo(r.hasta), k - 11));
  const serie = await Promise.all(meses.map(async (m) => {
    const fin = sumarDias(sumarMeses(m, 1), -1);
    const x = await resultado(id_negocio, { desde: m, hasta: fin < r.hasta ? fin : r.hasta });
    const c = x.costos[baseSel];
    return { mes: m.slice(0, 7), ventas_netas: x.ventas.netas, costo_ventas: c.costo_ventas, gastos_operativos: x.gastos.operativos,
      resultado_operativo_estimado: c.resultado_operativo_estimado, transacciones: x.ventas.transacciones };
  }));
  serie.forEach((s, k) => { s.crecimiento_ventas_pct = k ? crecimiento(s.ventas_netas, serie[k - 1].ventas_netas) : null; });

  const flu = await flujo(id_negocio, { desde: r.desde, hasta: r.hasta });
  const [pres] = await db.query(
    `SELECT tipo, id_categoria, sum(valor)::float AS valor FROM fin_presupuestos WHERE id_negocio = $1 AND periodo BETWEEN $2 AND $3 GROUP BY 1, 2`,
    [id_negocio, periodo(r.desde), periodo(r.hasta)]
  );
  const meta = pres.find((p) => p.tipo === "VENTAS" && !p.id_categoria)?.valor ?? null;
  const tope = pres.find((p) => p.tipo === "GASTO" && !p.id_categoria)?.valor ?? null;

  // Proyección del próximo mes (estimación con supuestos explícitos)
  const completos = serie.slice(0, -1).filter((s) => s.transacciones > 0).slice(-3);
  const proxMes = sumarMeses(mesActual(), 1);
  const recurr = await proyeccion(id_negocio, { desde: proxMes, hasta: proxMes });
  const prom = (k) => (completos.length ? redondear(completos.reduce((s, x) => s + x[k], 0) / completos.length) : null);
  return {
    rango: r, anterior: ant, base: baseSel, base_recomendada: actual.costos.base_recomendada,
    actual, previo, comparacion, serie,
    flujo: { totales: flu.totales, por_pagar: flu.por_pagar, por_cobrar: flu.por_cobrar },
    presupuesto: { meta_ventas: meta, cumplimiento_meta_pct: meta ? pct(actual.ventas.netas, meta) : null, tope_gastos: tope, ejecucion_gastos_pct: tope ? pct(actual.gastos.operativos, tope) : null },
    proyeccion: {
      mes: proxMes.slice(0, 7),
      ventas_netas: prom("ventas_netas"), costo_ventas: prom("costo_ventas"),
      gastos_recurrentes_programados: recurr.total_estimado,
      gastos_operativos: prom("gastos_operativos"),
      supuestos: completos.length
        ? `Promedio de los últimos ${completos.length} mes(es) completos con ventas; gastos recurrentes según lo programado. Es una estimación, no un compromiso.`
        : "No hay meses completos con ventas para proyectar.",
    },
    notas: [
      "Ingresos netos = ventas − descuentos (las anuladas no suman). Los impuestos no se separan (decisión del negocio).",
      "Resultado operativo ESTIMADO: no es utilidad neta (no incluye impuesto de renta, intereses ni prestaciones no registradas).",
      actual.costos.base_recomendada === "compras" ? "Menos del 70 % de lo vendido tiene costo real: se recomienda el costo por compras." : null,
      baseSel === "teorico" && (actual.ventas.cobertura_costo_real_pct ?? 0) < 70 ? "El costo de ventas es en buena parte ESTIMADO (costos de referencia de los productos). Cargue recetas y registre compras para mejorarlo." : null,
      baseSel === "compras" && actual.costos.compras.costo_ventas === 0 ? "No hay compras de insumos registradas en el período: el costo por compras está en cero." : null,
      actual.gastos.sin_clasificar > 0 ? "Hay egresos de caja por clasificar: no se cuentan como gasto hasta clasificarlos." : null,
      actual.gastos.prorrateados ? "Los gastos mensuales se prorratean por días cuando el rango no cubre el mes completo." : null,
    ].filter(Boolean),
  };
};
