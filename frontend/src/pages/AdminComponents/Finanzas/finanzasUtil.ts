/* Utilidades del módulo Finanzas (sin componentes) */
import { cop, hoy } from "../../../components/pedidos/pedidosUtil";

export { cop, hoy };
export const pesos = (v: number | null | undefined) => (v === null || v === undefined ? "—" : cop.format(v));
export const porc = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`);
export const signo = (v: number | null | undefined) => (v === null || v === undefined ? "sin comparación" : `${v > 0 ? "▲" : v < 0 ? "▼" : "="} ${Math.abs(v).toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`);

export const GRUPOS: Record<string, string> = {
  FIJO: "Costos fijos", VARIABLE: "Costos variables", SERVICIO: "Servicios públicos", FUNCIONAMIENTO: "Funcionamiento",
  NOMINA: "Nómina", NO_OPERATIVO: "No operativo", DEPRECIACION: "Depreciación", SIN_CLASIFICAR: "Por clasificar",
};

/* Períodos (mismos nombres que Ventas admin) */
export type Periodo = "hoy" | "ayer" | "semana_actual" | "semana_anterior" | "mes_actual" | "mes_anterior" | "ultimos_3" | "ultimos_6" | "anio" | "fecha_fecha";
export const PERIODOS: [Periodo, string][] = [
  ["mes_actual", "Mes actual"], ["mes_anterior", "Mes anterior"], ["ultimos_3", "Últimos 3 meses"],
  ["ultimos_6", "Últimos 6 meses"], ["anio", "Año actual"], ["fecha_fecha", "Fecha a fecha"],
];
const iso = (d: Date) => d.toISOString().slice(0, 10);
const mesMas = (f: string, n: number) => { const [y, m] = f.split("-").map(Number); return iso(new Date(Date.UTC(y, m - 1 + n, 1))); };
const finMes = (f: string) => { const [y, m] = f.split("-").map(Number); return iso(new Date(Date.UTC(y, m, 0))); };
export function rangoDe(p: Periodo, inicio: string, fin: string): [string, string] | null {
  const h = hoy();
  const mes = `${h.slice(0, 7)}-01`;
  const sumarDias = (f: string, n: number) => { const d = new Date(`${f}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  const lunes = sumarDias(h, -((new Date(`${h}T12:00:00Z`).getUTCDay() + 6) % 7));
  switch (p) {
    case "hoy": return [h, h];
    case "ayer": return [sumarDias(h, -1), sumarDias(h, -1)];
    case "semana_actual": return [lunes, h];
    case "semana_anterior": return [sumarDias(lunes, -7), sumarDias(lunes, -1)];
    case "mes_actual": return [mes, h];
    case "mes_anterior": return [mesMas(mes, -1), finMes(mesMas(mes, -1))];
    case "ultimos_3": return [mesMas(mes, -2), h];
    case "ultimos_6": return [mesMas(mes, -5), h];
    case "anio": return [`${h.slice(0, 4)}-01-01`, h];
    case "fecha_fecha": return inicio && fin && inicio <= fin ? [inicio, fin] : null;
  }
}
export const fechaCorta = (f: string) => new Date(`${f.slice(0, 10)}T12:00:00Z`).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const mesCorto = (m: string) => new Date(`${m.slice(0, 7)}-15T12:00:00Z`).toLocaleDateString("es-CO", { month: "short", year: "2-digit", timeZone: "UTC" });

/* Exportar a CSV (se abre en Excel: separador ";" y BOM para tildes) */
export function exportarCSV(nombre: string, columnas: { campo: string; titulo: string }[], filas: Record<string, unknown>[]) {
  const celda = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = Array.isArray(v) ? v.join(" | ") : typeof v === "number" ? String(v).replace(".", ",") : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columnas.map((c) => celda(c.titulo)).join(";"), ...filas.map((f) => columnas.map((c) => celda(f[c.campo])).join(";"))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
