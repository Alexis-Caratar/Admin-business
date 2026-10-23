/* Flujo de caja: dinero que entra y sale de verdad (no costos ni estimados). */
import { useState } from "react";
import { Alert, Box, Button, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableRow, TextField, Typography } from "@mui/material";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DownloadIcon from "@mui/icons-material/Download";
import SavingsIcon from "@mui/icons-material/Savings";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMadeIcon from "@mui/icons-material/CallMade";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { fin } from "../../../api/finanzas";
import { Seccion, TarjetaIndicador } from "../../../components/pedidos/DisenoPedidos";
import { exportarCSV, fechaCorta, mesCorto, pesos } from "./finanzasUtil";
import { useDatos } from "./useDatos";

const ejeCop = (v: number) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M` : `${Math.round(v / 1000)} k`);

export default function FlujoFinanzas({ desde, hasta }: { desde: string; hasta: string }) {
  const [agrupar, setAgrupar] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("");
  const { datos: f, error, cargando } = useDatos(() => fin.flujo({ desde, hasta, agrupar, saldo_inicial: saldoInicial }), [desde, hasta, agrupar, saldoInicial]);
  if (error) return <Alert severity="error">{error}</Alert>;
  const t = f?.totales;
  const etiqueta = (d: string) => (f?.agrupado_por === "mes" ? mesCorto(d) : fechaCorta(d));

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
        <TarjetaIndicador titulo="Entró" valor={pesos(t?.entradas)} subtitulo="Pagos de ventas (sin anuladas)" icono={<CallReceivedIcon />} color="verde" />
        <TarjetaIndicador titulo="Salió" valor={pesos(t ? t.salidas_operacion + t.salidas_compras + t.salidas_financiacion : null)} subtitulo={t ? `Operación ${pesos(t.salidas_operacion)} · Compras ${pesos(t.salidas_compras)}` : ""} icono={<CallMadeIcon />} color="rojo" />
        <TarjetaIndicador titulo="Flujo neto" valor={pesos(t?.neto)} subtitulo={t?.traslados_excluidos ? `${pesos(t.traslados_excluidos)} en traslados (no cuentan)` : "Entradas − salidas"} icono={<SavingsIcon />} color={(t?.neto ?? 0) >= 0 ? "azul" : "rojo"} />
        <TarjetaIndicador titulo="Por pagar" valor={pesos(f?.por_pagar.total)} subtitulo={f ? `Vencido ${pesos(f.por_pagar.vencido)} · 7 días ${pesos(f.por_pagar.proximos_7_dias)}` : ""} icono={<EventBusyIcon />} color={f?.por_pagar.vencido ? "rojo" : "pizarra"} />
      </Box>

      <Seccion titulo="Entradas y salidas" accion={
        <Stack direction="row" spacing={1}>
          <TextField size="small" label="Saldo inicial" type="number" value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)} sx={{ width: 170 }}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
          <TextField select size="small" label="Agrupar por" value={agrupar} onChange={(e) => setAgrupar(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">Automático</MenuItem><MenuItem value="dia">Día</MenuItem><MenuItem value="semana">Semana</MenuItem><MenuItem value="mes">Mes</MenuItem>
          </TextField>
          <Button size="small" startIcon={<DownloadIcon />} sx={{ textTransform: "none" }} disabled={!f} onClick={() => f && exportarCSV("flujo_de_caja", [
            { campo: "fecha", titulo: "Fecha" }, { campo: "entradas", titulo: "Entradas" }, { campo: "operacion", titulo: "Salidas de operación" }, { campo: "compras", titulo: "Pagos de compras" },
            { campo: "financiacion", titulo: "Retiros y préstamos" }, { campo: "traslados", titulo: "Traslados (excluidos)" }, { campo: "neto", titulo: "Neto" }, { campo: "acumulado", titulo: "Saldo acumulado" },
          ], f.serie)}>Exportar</Button>
        </Stack>
      }>
        <Box sx={{ height: 320 }}>
          {cargando && !f ? null : (
            <ResponsiveContainer>
              <ComposedChart data={(f?.serie ?? []).map((s) => ({ ...s, etiqueta: etiqueta(s.fecha), salidas: s.operacion + s.compras + s.financiacion }))}>
                <CartesianGrid stroke="#EEF2F7" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tickFormatter={ejeCop} tick={{ fontSize: 11, fill: "#64748B" }} width={52} />
                <Tooltip formatter={(v) => pesos(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="entradas" name="Entradas" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="salidas" name="Salidas" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Line dataKey="acumulado" name="Saldo acumulado" stroke="#2563EB" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Seccion>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Seccion titulo="Entradas por medio de pago">
          <Table size="small"><TableBody>
            {Object.entries(f?.entradas_por_medio ?? {}).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
              <TableRow key={m}><TableCell>{m}</TableCell><TableCell align="right">{pesos(v)}</TableCell></TableRow>
            ))}
          </TableBody></Table>
          {f && f.por_cobrar.total > 0 && <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>Por cobrar: {pesos(f.por_cobrar.total)} en {f.por_cobrar.ventas} venta(s) con pago pendiente (no cuentan como entrada).</Alert>}
        </Seccion>
        <Seccion titulo="Cómo se calcula">
          <Typography component="div" sx={{ fontSize: 12.5, color: "#475569", lineHeight: 1.7 }}>
            • <b>Entradas:</b> pagos de ventas no anuladas, por medio de pago. Las ventas "pendientes de pago" no entran hasta cobrarse.<br />
            • <b>Salidas de operación:</b> egresos de caja y pagos de gastos por transferencia.<br />
            • <b>Compras:</b> pagos a proveedores (desde la caja o por banco), una sola vez aunque el pago esté vinculado a un egreso.<br />
            • <b>Retiros y préstamos:</b> movimientos no operativos (sí son salida de dinero, no son gasto).<br />
            • <b>Traslados de base</b> entre cajas se excluyen: no entra ni sale dinero del negocio.<br />
            • El saldo acumulado parte del saldo inicial que escribas (por ejemplo, lo que había en caja y banco).
          </Typography>
        </Seccion>
      </Box>
    </Stack>
  );
}
