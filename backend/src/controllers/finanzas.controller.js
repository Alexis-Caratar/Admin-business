import * as gastos from "../services/finanzas/gastos.service.js";
import * as reportes from "../services/finanzas/reportes.service.js";

// El negocio siempre sale del token, nunca del navegador
const ctx = (req) => ({ id_negocio: req.user.id_negocio, id_usuario: req.user.id });

const r = (fn) => async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, data: await fn(req) });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status).json({ ok: false, error: err.message, errores: err.errores });
    console.error("Error finanzas:", err);
    res.status(500).json({ ok: false, error: "No se pudo procesar la solicitud" });
  }
};

export const categorias = r((req) => gastos.categorias(req.user.id_negocio));
export const crearCategoria = r((req) => gastos.crearCategoria(req.body, ctx(req)));

export const listarGastos = r((req) => gastos.listarGastos(req.user.id_negocio, req.query));
export const detalleGasto = r((req) => gastos.detalleGasto(Number(req.params.id), req.user.id_negocio));
export const crearGasto = r((req) => gastos.crearGasto(req.body, ctx(req)));
export const actualizarGasto = r((req) => gastos.actualizarGasto(Number(req.params.id), req.body, ctx(req)));
export const anularGasto = r((req) => gastos.anularGasto(Number(req.params.id), req.body?.motivo, ctx(req)));
export const pagarGasto = r((req) => gastos.pagarGasto(Number(req.params.id), req.body, ctx(req)));
export const anularPagoGasto = r((req) => gastos.anularPago(Number(req.params.id), Number(req.params.id_pago), ctx(req)));

export const listarRecurrentes = r((req) => gastos.listarRecurrentes(req.user.id_negocio));
export const crearRecurrente = r((req) => gastos.guardarRecurrente(null, req.body, ctx(req)));
export const actualizarRecurrente = r((req) => gastos.guardarRecurrente(Number(req.params.id), req.body, ctx(req)));
export const proyeccion = r((req) => gastos.proyeccion(req.user.id_negocio, req.query));
export const causarRecurrentes = r((req) => gastos.causarRecurrentes(req.user.id_negocio, req.body ?? {}, req.user.id));

export const listarEgresos = r((req) => gastos.listarEgresos(req.user.id_negocio, req.query));
export const clasificarEgresos = r((req) => gastos.clasificarEgresos(req.body?.egresos, ctx(req)));

export const resumen = r((req) => reportes.resumen(req.user.id_negocio, req.query));
export const resultado = r((req) => reportes.resultado(req.user.id_negocio, reportes.rango(req.query)));
export const rentabilidad = r((req) => reportes.rentabilidad(req.user.id_negocio, req.query));
export const flujo = r((req) => reportes.flujo(req.user.id_negocio, req.query));
export const alertas = r((req) => reportes.alertas(req.user.id_negocio));
export const configAlertas = r((req) => reportes.configAlertas(req.user.id_negocio));
export const guardarAlertas = r((req) => reportes.guardarAlertas(req.user.id_negocio, req.body));
export const listarPresupuestos = r((req) => reportes.listarPresupuestos(req.user.id_negocio, req.query));
export const guardarPresupuestos = r((req) => reportes.guardarPresupuestos(req.user.id_negocio, req.body?.presupuestos, req.user.id));
