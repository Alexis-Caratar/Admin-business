// Cliente del módulo Finanzas (/api/finanzas) y Compras (/api/compras).
// El negocio lo toma el servidor del usuario: nunca se envía desde aquí.
import axios from "./axios";

const datos = <T,>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

export type Grupo = "FIJO" | "VARIABLE" | "SERVICIO" | "FUNCIONAMIENTO" | "NOMINA" | "NO_OPERATIVO";
export type Categoria = { id: number; codigo: string; nombre: string; grupo: Grupo; palabras: string[]; del_sistema: boolean };
export type Gasto = {
  id: number; concepto: string; valor: number; saldo: number; pagado: number; periodo: string; fecha_emision: string | null; fecha_vencimiento: string | null;
  estado: "PENDIENTE" | "PARCIAL" | "PAGADO" | "ANULADO"; beneficiario: string | null; numero_documento: string | null; consumo: number | null; unidad_consumo: string | null;
  lectura_anterior: number | null; lectura_actual: number | null; soporte_url: string | null; observacion: string | null; id_recurrente: number | null;
  id_categoria: number; categoria: string; grupo: Grupo; vencido: boolean; por_vencer: boolean;
};
export type PagoGasto = { id: number; fecha: string; valor: number; medio: string; referencia: string | null; anulado: boolean; id_egreso: number | null; numero_egreso: string | null };
export type Recurrente = {
  id: number; id_categoria: number; categoria: string; concepto: string; valor_estimado: number; periodicidad: string; dia_vencimiento: number;
  fecha_inicio: string; fecha_fin: string | null; beneficiario: string | null; observacion: string | null; activo: boolean; ultimo_periodo: string | null;
};
export type Proyeccion = { desde: string; hasta: string; total_estimado: number; items: { id_recurrente: number; concepto: string; categoria: string; periodo: string; valor: number; estimado: boolean; id_gasto: number | null; estado: string; fecha_vencimiento: string }[] };
export type Egreso = {
  id: number; numero_egreso: string; fecha: string; descripcion: string; metodo_pago: string | null; monto: number; id_categoria: number | null; categoria_confirmada: boolean;
  categoria: string | null; grupo: Grupo | null; id_compra: number | null; id_gasto: number | null;
  sugerencia: { id_categoria: number; categoria: string; grupo: Grupo } | null;
};
export type BaseCosto = {
  costo_ventas: number; margen_bruto: number; margen_bruto_pct: number | null; margen_contribucion: number; margen_contribucion_pct: number | null;
  resultado_operativo_estimado: number; punto_equilibrio: number | null; detalle: Record<string, number>;
};
export type Resultado = {
  rango: { desde: string; hasta: string };
  ventas: { transacciones: number; brutas: number; descuentos: number; impuestos: number; anuladas: number; valor_anuladas: number; netas: number; ticket_promedio: number | null;
    costo_teorico: number; costo_teorico_estimado: number; ingresos_sin_costo: number; cobertura_costo_real_pct: number | null };
  costos: { teorico: BaseCosto; compras: BaseCosto; base_recomendada: "teorico" | "compras" };
  gastos: { operativos: number; fijos: number; variables: number; depreciacion: number; por_grupo: Record<string, number>;
    por_categoria: { categoria: string; grupo: string; valor: number }[]; prorrateados: boolean; sin_clasificar: number; no_operativos: number };
};
type Comp = { actual: number | null; anterior: number | null; crecimiento_pct: number | null };
export type Resumen = {
  rango: { desde: string; hasta: string }; anterior: { desde: string; hasta: string }; base: "teorico" | "compras"; base_recomendada: "teorico" | "compras";
  actual: Resultado; previo: Resultado; comparacion: Record<string, Comp>;
  serie: { mes: string; ventas_netas: number; costo_ventas: number; gastos_operativos: number; resultado_operativo_estimado: number; transacciones: number; crecimiento_ventas_pct: number | null }[];
  flujo: { totales: Flujo["totales"]; por_pagar: Flujo["por_pagar"]; por_cobrar: Flujo["por_cobrar"] };
  presupuesto: { meta_ventas: number | null; cumplimiento_meta_pct: number | null; tope_gastos: number | null; ejecucion_gastos_pct: number | null };
  proyeccion: { mes: string; ventas_netas: number | null; costo_ventas: number | null; gastos_recurrentes_programados: number; gastos_operativos: number | null; supuestos: string };
  notas: string[];
};
export type FilaRentabilidad = {
  id: number; nombre: string; categoria: string; precio_actual: number | null; costo_actual: number | null; costo_estimado: boolean | null; sin_costo: boolean; receta_vacia: boolean;
  margen_unitario: number | null; margen_unitario_pct: number | null; unidades: number; ingresos: number; costo_ventas: number; contribucion: number | null; contribucion_pct: number | null;
  unidades_anterior: number; ingresos_anterior: number; crecimiento_ingresos_pct: number | null; participacion_ingresos_pct: number | null; participacion_contribucion_pct: number | null; senales: string[];
};
export type Rentabilidad = {
  rango: { desde: string; hasta: string }; umbral_margen_pct: number; productos: FilaRentabilidad[];
  categorias: { categoria: string; unidades: number; ingresos: number; costo_ventas: number; contribucion: number; contribucion_pct: number | null; completo: boolean }[];
  totales: { ingresos: number; contribucion: number; contribucion_pct: number | null };
};
export type Flujo = {
  rango: { desde: string; hasta: string }; agrupado_por: string; saldo_inicial: number;
  serie: { fecha: string; entradas: number; operacion: number; compras: number; financiacion: number; traslados: number; neto: number; acumulado: number }[];
  entradas_por_medio: Record<string, number>;
  totales: { entradas: number; salidas_operacion: number; salidas_compras: number; salidas_financiacion: number; traslados_excluidos: number; neto: number; saldo_final: number };
  por_pagar: { total: number; vencido: number; proximos_7_dias: number };
  por_cobrar: { total: number; ventas: number; nota: string };
};
export type Alerta = { nivel: "alta" | "media" | "baja"; tipo: string; mensaje: string; valor: number | null };
export type ConfigAlertas = Record<"VENCIMIENTO_DIAS" | "DESVIO_PRESUPUESTO_PCT" | "MARGEN_MINIMO_PCT" | "GASTO_ALTO_PCT", number | null>;
export type Presupuesto = { id: number; periodo: string; tipo: "VENTAS" | "GASTO" | "MARGEN"; id_categoria: number | null; categoria: string | null; valor: number };

const qs = (o: Record<string, unknown>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => [k, String(v)])).toString();

export const fin = {
  categorias: () => datos<Categoria[]>(axios.get("/finanzas/categorias")),
  crearCategoria: (c: { nombre: string; grupo: Grupo; palabras?: string }) => datos<Categoria>(axios.post("/finanzas/categorias", c)),
  gastos: (f: Record<string, unknown>) => datos<Gasto[]>(axios.get(`/finanzas/gastos?${qs(f)}`)),
  gasto: (id: number) => datos<Gasto & { pagos: PagoGasto[] }>(axios.get(`/finanzas/gastos/${id}`)),
  crearGasto: (g: Record<string, unknown>) => datos<Gasto>(axios.post("/finanzas/gastos", g)),
  editarGasto: (id: number, g: Record<string, unknown>) => datos<Gasto>(axios.put(`/finanzas/gastos/${id}`, g)),
  anularGasto: (id: number, motivo: string) => datos(axios.post(`/finanzas/gastos/${id}/anular`, { motivo })),
  pagarGasto: (id: number, p: Record<string, unknown>) => datos(axios.post(`/finanzas/gastos/${id}/pagos`, p)),
  anularPagoGasto: (id: number, idPago: number) => datos(axios.delete(`/finanzas/gastos/${id}/pagos/${idPago}`)),
  recurrentes: () => datos<Recurrente[]>(axios.get("/finanzas/recurrentes")),
  guardarRecurrente: (id: number | null, r: Record<string, unknown>) => datos<Recurrente>(id ? axios.put(`/finanzas/recurrentes/${id}`, r) : axios.post("/finanzas/recurrentes", r)),
  proyeccion: (desde?: string, hasta?: string) => datos<Proyeccion>(axios.get(`/finanzas/recurrentes/proyeccion?${qs({ desde, hasta })}`)),
  causar: (hasta?: string) => datos<{ creados: { id: number; concepto: string; periodo: string; valor: number }[] }>(axios.post("/finanzas/recurrentes/causar", { hasta })),
  egresos: (f: Record<string, unknown>) => datos<Egreso[]>(axios.get(`/finanzas/egresos?${qs(f)}`)),
  clasificar: (egresos: { id: number; id_categoria: number | null }[]) => datos<{ clasificados: number }>(axios.post("/finanzas/egresos/clasificar", { egresos })),
  resumen: (desde: string, hasta: string, base?: string) => datos<Resumen>(axios.get(`/finanzas/resumen?${qs({ desde, hasta, base })}`)),
  rentabilidad: (f: Record<string, unknown>) => datos<Rentabilidad>(axios.get(`/finanzas/rentabilidad?${qs(f)}`)),
  flujo: (f: Record<string, unknown>) => datos<Flujo>(axios.get(`/finanzas/flujo?${qs(f)}`)),
  alertas: () => datos<{ config: ConfigAlertas; alertas: Alerta[] }>(axios.get("/finanzas/alertas")),
  guardarAlertas: (c: Partial<ConfigAlertas>) => datos<ConfigAlertas>(axios.put("/finanzas/alertas/config", c)),
  presupuestos: (desde?: string, hasta?: string) => datos<Presupuesto[]>(axios.get(`/finanzas/presupuestos?${qs({ desde, hasta })}`)),
  guardarPresupuestos: (presupuestos: { periodo: string; tipo: string; id_categoria?: number | null; valor: number | null }[]) => datos<Presupuesto[]>(axios.put("/finanzas/presupuestos", { presupuestos })),
};

/* ------------------------------- Compras -------------------------------- */
export type CompraResumen = {
  id: number; numero_compra: string; numero_factura: string | null; tipo_documento: string; fecha_compra: string; fecha_factura: string | null; fecha_vencimiento: string | null;
  subtotal: number; descuento: number; impuesto: number; total: number; saldo_pendiente: number; estado: "PENDIENTE" | "PARCIAL" | "PAGADA" | "ANULADA";
  id_proveedor: number; identificacion: string; proveedor: string; vencida: boolean;
};
export type CompraDetalle = CompraResumen & {
  observacion: string | null;
  items: { id: number; id_inventario: number | null; nombre: string; unidad: string | null; cantidad: number; costo_unitario: number; descuento: number; impuesto: number; subtotal: number; total: number }[];
  pagos: { id: number; fecha: string; valor: number; referencia: string | null; metodo_pago: string | null; id_egreso: number | null; numero_egreso: string | null }[];
};
export type Proveedor = { id: number; identificacion: string; nombre: string; telefono: string | null };

export const compras = {
  listar: (f: Record<string, unknown> = {}) => axios.get<{ compras: CompraResumen[] }>(`/compras/listar?${qs(f)}`).then((r) => r.data.compras),
  detalle: (id: number) => axios.get<{ compra: CompraDetalle }>(`/compras/${id}`).then((r) => r.data.compra),
  crear: (c: Record<string, unknown>) => axios.post<{ compra: CompraResumen }>("/compras/crear", c).then((r) => r.data.compra),
  pagar: (id: number, p: Record<string, unknown>) => axios.post(`/compras/${id}/pagos`, p).then((r) => r.data),
  anularPago: (id: number, idPago: number) => axios.delete(`/compras/${id}/pagos/${idPago}`).then((r) => r.data),
  anular: (id: number, motivo: string) => axios.post(`/compras/${id}/anular`, { motivo }).then((r) => r.data),
  proveedores: (q?: string) => axios.get<{ proveedores: Proveedor[] }>(`/compras/proveedores?${qs({ q })}`).then((r) => r.data.proveedores),
  metodos: () => axios.get<{ metodos: { id: number; codigo: string; nombre: string }[] }>("/compras/metodos-pago").then((r) => r.data.metodos),
};

export const errorDe = (e: unknown, defecto = "No se pudo completar la operación") => {
  const r = (e as { response?: { data?: { error?: string; errores?: Record<string, string> } } })?.response?.data;
  return { mensaje: r?.error ?? defecto, errores: r?.errores ?? {} };
};
