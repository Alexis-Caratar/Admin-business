/* Panel ejecutivo: indicadores del período frente al anterior, tendencia de 12 meses,
   gastos por categoría, metas, proyección y alertas. */
import { useState } from "react";
import { Alert, Box, Chip, LinearProgress, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Tooltip as Tip, Typography } from "@mui/material";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PercentIcon from "@mui/icons-material/Percent";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BalanceIcon from "@mui/icons-material/Balance";
import SavingsIcon from "@mui/icons-material/Savings";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { fin } from "../../../api/finanzas";
import { Seccion, TarjetaIndicador } from "../../../components/pedidos/DisenoPedidos";
import { GRUPOS, fechaCorta, mesCorto, pesos, porc, signo } from "./finanzasUtil";
import { useDatos } from "./useDatos";

const ejeCop = (v: number) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M` : `${Math.round(v / 1000)} k`);

export default function PanelFinanzas({ desde, hasta, onIr }: { desde: string; hasta: string; onIr: (tab: number) => void }) {
  const [base, setBase] = useState<"teorico" | "compras" | "">("");
  const { datos: r, error, cargando } = useDatos(() => fin.resumen(desde, hasta, base || undefined), [desde, hasta, base]);
  const { datos: al } = useDatos(() => fin.alertas(), []);

  if (error) return <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>;
  if (cargando || !r) return <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} variant="rounded" height={96} sx={{ borderRadius: "22px" }} />)}</Box>;

  const c = r.comparacion;
  const costos = r.actual.costos[r.base];
  const estimado = r.base === "teorico" && (r.actual.ventas.cobertura_costo_real_pct ?? 0) < 100;
  const t = r.actual.gastos;
  const maxCat = Math.max(1, ...t.por_categoria.map((x) => x.valor));

  return (
    <Stack spacing={2}>
      {/* Base del costo de ventas */}
      <Seccion>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{fechaCorta(r.rango.desde)} – {fechaCorta(r.rango.hasta)}</Typography>
            <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>Comparado con {fechaCorta(r.anterior.desde)} – {fechaCorta(r.anterior.hasta)} (mismo número de días)</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>Costo de ventas según</Typography>
            <ToggleButtonGroup size="small" exclusive value={r.base} onChange={(_, v) => v && setBase(v)}>
              <ToggleButton value="teorico" sx={{ textTransform: "none", px: 1.5 }}>
                <Tip title="Lo que costaron los productos vendidos (recetas, insumos o costo de referencia) + mermas"><span>Productos vendidos</span></Tip>
              </ToggleButton>
              <ToggleButton value="compras" sx={{ textTransform: "none", px: 1.5 }}>
                <Tip title="Compras de insumos del período (módulo Compras + egresos de caja clasificados como insumos)"><span>Compras de insumos</span></Tip>
              </ToggleButton>
            </ToggleButtonGroup>
            {r.base === r.base_recomendada && <Chip size="small" label="Recomendado" color="primary" variant="outlined" />}
          </Stack>
        </Stack>
      </Seccion>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)", xl: "repeat(5, 1fr)" } }}>
        <TarjetaIndicador titulo="Ventas netas" valor={pesos(c.ventas_netas.actual)} subtitulo={signo(c.ventas_netas.crecimiento_pct)} icono={<TrendingUpIcon />} color="azul" />
        <TarjetaIndicador titulo="Costo de ventas" valor={pesos(costos.costo_ventas)} subtitulo={estimado ? "Incluye costos estimados" : "Con costos registrados"} icono={<Inventory2Icon />} color="ambar" />
        <TarjetaIndicador titulo="Margen bruto" valor={pesos(costos.margen_bruto)} subtitulo={porc(costos.margen_bruto_pct)} icono={<PercentIcon />} color="verde" />
        <TarjetaIndicador titulo="Gastos operativos" valor={pesos(t.operativos)} subtitulo={`${signo(c.gastos_operativos.crecimiento_pct)}${t.sin_clasificar ? ` · ${pesos(t.sin_clasificar)} por clasificar` : ""}`} icono={<ReceiptIcon />} color="rojo" onClick={() => onIr(1)} />
        <TarjetaIndicador titulo="Resultado operativo (est.)" valor={pesos(costos.resultado_operativo_estimado)} subtitulo="No es utilidad neta" icono={<BalanceIcon />} color={costos.resultado_operativo_estimado >= 0 ? "verde" : "rojo"} />
        <TarjetaIndicador titulo="Flujo neto de caja" valor={pesos(r.flujo.totales.neto)} subtitulo={`Entró ${pesos(r.flujo.totales.entradas)}`} icono={<SavingsIcon />} color="violeta" onClick={() => onIr(4)} />
        <TarjetaIndicador titulo="Por pagar" valor={pesos(r.flujo.por_pagar.total)} subtitulo={r.flujo.por_pagar.vencido ? `${pesos(r.flujo.por_pagar.vencido)} vencido` : `${pesos(r.flujo.por_pagar.proximos_7_dias)} en 7 días`} icono={<EventBusyIcon />} color={r.flujo.por_pagar.vencido ? "rojo" : "pizarra"} onClick={() => onIr(1)} />
        <TarjetaIndicador titulo="Ticket promedio" valor={pesos(c.ticket_promedio.actual)} subtitulo={`${c.transacciones.actual ?? 0} ventas · ${signo(c.transacciones.crecimiento_pct)}`} icono={<ConfirmationNumberIcon />} color="azul" />
        <TarjetaIndicador titulo="Punto de equilibrio" valor={pesos(costos.punto_equilibrio)} subtitulo={costos.punto_equilibrio ? `Ventas para cubrir ${pesos(t.fijos)} de fijos` : "Registra los costos fijos para calcularlo"} icono={<CrisisAlertIcon />} color="pizarra" />
        <TarjetaIndicador titulo="Meta de ventas" valor={r.presupuesto.meta_ventas ? porc(r.presupuesto.cumplimiento_meta_pct) : "Sin meta"} subtitulo={r.presupuesto.meta_ventas ? `de ${pesos(r.presupuesto.meta_ventas)}` : "Defínela en Metas y alertas"} icono={<TrendingUpIcon />} color="verde" onClick={() => onIr(5)} />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" } }}>
        <Seccion titulo="Últimos 12 meses" icono={<TrendingUpIcon />}>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer>
              <ComposedChart data={r.serie.map((s) => ({ ...s, mes: mesCorto(s.mes) }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#EEF2F7" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tickFormatter={ejeCop} tick={{ fontSize: 11, fill: "#64748B" }} width={52} />
                <Tooltip formatter={(v) => pesos(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ventas_netas" name="Ventas netas" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="costo_ventas" name="Costo de ventas" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="gastos_operativos" name="Gastos operativos" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Line dataKey="resultado_operativo_estimado" name="Resultado (est.)" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Seccion>

        <Seccion titulo="Gastos por categoría" icono={<ReceiptIcon />}>
          {t.por_categoria.length === 0 ? (
            <Typography sx={{ color: "#64748B", fontSize: 13 }}>No hay gastos registrados ni egresos clasificados en el período.</Typography>
          ) : (
            <Stack spacing={1.2}>
              {t.por_categoria.slice(0, 8).map((x) => (
                <Box key={x.categoria}>
                  <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 13 }}>{x.categoria}</Typography><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{pesos(x.valor)}</Typography></Stack>
                  <LinearProgress variant="determinate" value={(x.valor / maxCat) * 100} sx={{ height: 6, borderRadius: 3, bgcolor: "#EEF2F7" }} />
                  <Typography sx={{ fontSize: 11, color: "#94A3B8" }}>{GRUPOS[x.grupo] ?? x.grupo}</Typography>
                </Box>
              ))}
            </Stack>
          )}
          {t.sin_clasificar > 0 && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }} action={<Chip label="Clasificar" onClick={() => onIr(2)} size="small" />}>
              {pesos(t.sin_clasificar)} en egresos de caja sin clasificar (no se cuentan como gasto).
            </Alert>
          )}
        </Seccion>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" } }}>
        <Seccion titulo="Frente al período anterior" icono={<BalanceIcon />}>
          <Table size="small">
            <TableHead><TableRow><TableCell /><TableCell align="right">Actual</TableCell><TableCell align="right">Anterior</TableCell><TableCell align="right">Cambio</TableCell></TableRow></TableHead>
            <TableBody>
              {([["ventas_netas", "Ventas netas"], ["costo_ventas", "Costo de ventas"], ["margen_bruto", "Margen bruto"], ["gastos_operativos", "Gastos operativos"], ["resultado_operativo_estimado", "Resultado (est.)"]] as const).map(([k, l]) => (
                <TableRow key={k}>
                  <TableCell sx={{ fontSize: 12.5 }}>{l}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12.5 }}>{pesos(c[k].actual)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12.5, color: "#64748B" }}>{pesos(c[k].anterior)}</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12.5, fontWeight: 700 }}>{c[k].crecimiento_pct === null ? "—" : `${c[k].crecimiento_pct! > 0 ? "+" : ""}${c[k].crecimiento_pct} %`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Seccion>

        <Seccion titulo={`Proyección ${mesCorto(r.proyeccion.mes)}`} icono={<TrendingUpIcon />}>
          <Chip label="Estimación" size="small" color="warning" variant="outlined" sx={{ mb: 1.5 }} />
          <Stack spacing={0.8}>
            {([["Ventas netas", r.proyeccion.ventas_netas], ["Costo de ventas", r.proyeccion.costo_ventas], ["Gastos operativos", r.proyeccion.gastos_operativos], ["Gastos recurrentes programados", r.proyeccion.gastos_recurrentes_programados]] as const).map(([l, v]) => (
              <Stack key={l} direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 13 }}>{l}</Typography><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{pesos(v)}</Typography></Stack>
            ))}
          </Stack>
          <Typography sx={{ mt: 1.5, fontSize: 11.5, color: "#64748B" }}>{r.proyeccion.supuestos}</Typography>
        </Seccion>

        <Seccion titulo="Alertas" icono={<WarningAmberIcon />} accion={<Chip size="small" label="Configurar" onClick={() => onIr(5)} />}>
          {!al || al.alertas.length === 0 ? (
            <Typography sx={{ color: "#64748B", fontSize: 13 }}>Sin alertas por ahora.</Typography>
          ) : (
            <Stack spacing={1}>
              {al.alertas.slice(0, 8).map((a, i) => (
                <Alert key={i} severity={a.nivel === "alta" ? "error" : a.nivel === "media" ? "warning" : "info"} sx={{ borderRadius: 2, py: 0, fontSize: 12.5 }}>{a.mensaje}</Alert>
              ))}
            </Stack>
          )}
        </Seccion>
      </Box>

      {r.notas.length > 0 && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>Cómo leer estas cifras</Typography>
          {r.notas.map((n) => <Typography key={n} sx={{ fontSize: 12.5 }}>• {n}</Typography>)}
        </Alert>
      )}
    </Stack>
  );
}
