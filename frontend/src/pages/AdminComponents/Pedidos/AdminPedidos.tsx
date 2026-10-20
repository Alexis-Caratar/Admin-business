/*
 * Módulo administrativo de Pedidos web, con el diseño de Ventas admin:
 * tarjeta principal con filtro de periodo, indicadores y pestañas
 * (Dashboard / Historial). La operación diaria está en el cajero.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert, Avatar, Box, Card, Chip, Divider, InputAdornment, MenuItem, Stack, Tab, Table, TableBody, TableCell,
  TableHead, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import InsightsIcon from "@mui/icons-material/Insights";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { listarPedidos, mensajeError, resumenPedidos } from "../../../api/pedidos";
import type { PedidoResumen, ResumenPedidos } from "../../../api/pedidos";
import { ChipEstado, ChipPago, DetallePedido, Filtro } from "../../../components/pedidos/PedidosComunes";
import { TarjetaIndicador } from "../../../components/pedidos/DisenoPedidos";
import { ESTADOS, PAGOS, cop, hoy } from "../../../components/pedidos/pedidosUtil";

/* ---------------- Periodos (los mismos de Ventas admin) ---------------- */
type Periodo = "hoy" | "ayer" | "semana_actual" | "semana_anterior" | "mes_actual" | "mes_anterior" | "anio" | "fecha_fecha";
const PERIODOS: [Periodo, string][] = [
  ["hoy", "Hoy"], ["ayer", "Ayer"], ["semana_actual", "Semana Actual"], ["semana_anterior", "Semana Anterior"],
  ["mes_actual", "Mes Actual"], ["mes_anterior", "Mes Anterior"], ["anio", "Año Actual"], ["fecha_fecha", "Fecha a Fecha"],
];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const deFecha = (f: string) => new Date(`${f}T12:00:00Z`);
const sumarDias = (f: string, n: number) => { const d = deFecha(f); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

// Rango [desde, hasta] del periodo, con la fecha de hoy en Colombia
function rangoDe(p: Periodo, inicio: string, fin: string): [string, string] | null {
  const h = hoy();
  const lunes = sumarDias(h, -((deFecha(h).getUTCDay() + 6) % 7));
  const [y, m] = h.split("-").map(Number);
  switch (p) {
    case "hoy": return [h, h];
    case "ayer": return [sumarDias(h, -1), sumarDias(h, -1)];
    case "semana_actual": return [lunes, h];
    case "semana_anterior": return [sumarDias(lunes, -7), sumarDias(lunes, -1)];
    case "mes_actual": return [`${h.slice(0, 7)}-01`, h];
    case "mes_anterior": {
      const ini = iso(new Date(Date.UTC(m === 1 ? y - 1 : y, m === 1 ? 11 : m - 2, 1)));
      return [ini, sumarDias(`${h.slice(0, 7)}-01`, -1)];
    }
    case "anio": return [`${y}-01-01`, h];
    case "fecha_fecha": return inicio && fin ? [inicio, fin] : null;
  }
}

const fechaCorta = (f: string) => deFecha(f).toLocaleDateString("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });

/* Campo del encabezado (alto 46, como en Ventas admin) */
const campoFiltro = {
  "& .MuiOutlinedInput-root": {
    height: 46, borderRadius: 3, background: "#FFFFFF", transition: ".25s",
    "& fieldset": { borderColor: "#CBD5E1" },
    "&:hover": { boxShadow: "0 4px 12px rgba(37,99,235,.08)" },
    "&:hover fieldset": { borderColor: "#93C5FD" },
    "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(37,99,235,.10)" },
    "&.Mui-focused fieldset": { borderColor: "#2563EB", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { color: "#64748B", fontWeight: 500 },
} as const;

/* Tarjeta de gráfico de Ventas admin: radio 28, etiqueta superior, título y pastilla */
function TarjetaGrafico({ etiqueta, titulo, descripcion, pastilla, children }: { etiqueta: string; titulo: string; descripcion?: string; pastilla?: string; children: ReactNode }) {
  return (
    <Card sx={{
      position: "relative", overflow: "hidden", borderRadius: "28px", p: { xs: 2, md: 3 }, height: "100%", bgcolor: "#ffffff",
      border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 10px 40px rgba(15,23,42,0.06)",
      "&::before": { content: '""', position: "absolute", top: -120, right: -120, width: 260, height: 260, borderRadius: "50%", background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(96,165,250,0.04))" },
    }}>
      <Box sx={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, mb: 0.5 }}>{etiqueta}</Typography>
          <Typography sx={{ fontSize: { xs: 14, md: 18 }, fontWeight: 900, color: "#0f172a", lineHeight: 1.1 }}>{titulo}</Typography>
          {descripcion && <Typography sx={{ mt: 1, color: "#64748b", fontSize: 12 }}>{descripcion}</Typography>}
        </Box>
        {pastilla && (
          <Box sx={{ px: 2, py: 1, borderRadius: 999, background: "linear-gradient(135deg,#2563eb,#3b82f6)", color: "#fff", fontWeight: 700, fontSize: 13, boxShadow: "0 10px 25px rgba(37,99,235,0.25)" }}>
            {pastilla}
          </Box>
        )}
      </Box>
      <Box sx={{ position: "relative", zIndex: 2 }}>{children}</Box>
    </Card>
  );
}

export default function AdminPedidos() {
  const [periodo, setPeriodo] = useState<Periodo>("mes_actual");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tab, setTab] = useState(0);
  const [resumen, setResumen] = useState<ResumenPedidos | null>(null);
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [filtros, setFiltros] = useState<{ estado?: string; estado_pago?: string; metodo_pago?: string; tipo_entrega?: string }>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<number | null>(null);

  const rango = useMemo(() => rangoDe(periodo, fechaInicio, fechaFin), [periodo, fechaInicio, fechaFin]);

  const cargar = useCallback(async () => {
    if (!rango) return;
    const [desde, hasta] = rango;
    setCargando(true);
    try {
      const [r, lista] = await Promise.all([resumenPedidos(desde, hasta), listarPedidos({ desde, hasta, ...filtros })]);
      setResumen(r);
      setPedidos(lista);
      setError(null);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [rango, filtros]);

  useEffect(() => {
    const t = window.setTimeout(cargar, 0);
    return () => window.clearTimeout(t);
  }, [cargar]);

  const t = resumen?.totales;
  const totalPeriodo = resumen?.por_dia.reduce((a, d) => a + d.total, 0) ?? 0;
  const maxEstado = Math.max(1, ...(resumen?.por_estado ?? []).map((e) => e.cantidad));

  const columnas = useMemo<GridColDef<PedidoResumen>[]>(() => [
    { field: "codigo", headerName: "Pedido", width: 120 },
    { field: "created_at", headerName: "Fecha", width: 150, valueFormatter: (v: string) => new Date(v).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) },
    { field: "nombre_cliente", headerName: "Cliente", flex: 1, minWidth: 150 },
    { field: "telefono", headerName: "Teléfono", width: 120 },
    { field: "tipo_entrega", headerName: "Entrega", width: 110, valueFormatter: (v: string) => (v === "DOMICILIO" ? "Domicilio" : "Recoger") },
    { field: "metodo_pago", headerName: "Método", width: 120, valueFormatter: (v: string) => (v === "EN_LINEA" ? "En línea" : "Contraentrega") },
    { field: "estado_pago", headerName: "Pago", width: 170, renderCell: ({ row }) => <ChipPago pago={row.estado_pago} /> },
    { field: "estado", headerName: "Estado", width: 150, renderCell: ({ row }) => <ChipEstado estado={row.estado} /> },
    { field: "total", headerName: "Total", width: 120, type: "number", valueFormatter: (v: number) => cop.format(v) },
    { field: "numero_factura", headerName: "Factura", width: 120, valueFormatter: (v: string | null) => v ?? "—" },
  ], []);

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg,#f5f7fb,#eef4ff)", p: 1 }}>
      {/* ================= TARJETA PRINCIPAL ================= */}
      <Card sx={{
        mb: 2, borderRadius: 5, overflow: "hidden", position: "relative", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0",
        boxShadow: "0 12px 35px rgba(15,23,42,.06)",
        "&::before": { content: '""', position: "absolute", top: 0, left: 0, width: "100%", height: 5, background: "linear-gradient(90deg,#2563EB,#3B82F6,#60A5FA)" },
      }}>
        <Box sx={{ position: "absolute", top: -80, right: -80, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,.08), transparent 70%)" }} />
        <Box sx={{ position: "absolute", bottom: -120, left: -120, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,.05), transparent 70%)" }} />
        <Box sx={{ position: "relative", zIndex: 2, p: { xs: 1, md: 2 } }}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: { xs: 50, md: 62 }, height: { xs: 50, md: 62 }, borderRadius: 4, bgcolor: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", boxShadow: "0 10px 25px rgba(37,99,235,.10)" }}>
                <ReceiptLongIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 14, md: 20 }, color: "#0F172A", letterSpacing: -0.5 }}>Pedidos web</Typography>
                <Typography sx={{ mt: 0.8, color: "#64748B", fontSize: { xs: 10, md: 12 }, maxWidth: 520, lineHeight: 1.6 }}>
                  Seguimiento de los pedidos de la tienda en línea: ventas, cobros pendientes, pagos en línea y productos más pedidos. La atención de cada pedido se hace desde el cajero.
                </Typography>
                <Stack direction="row" spacing={1.2} mt={1} flexWrap="wrap" useFlexGap>
                  {["Tienda en línea", "Domicilios", "Pagos Wompi", "Reportes"].map((item) => (
                    <Chip key={item} label={item} sx={{ height: 32, borderRadius: 2, fontWeight: 600, fontSize: { xs: 8, md: 12 }, bgcolor: "#F8FAFC", color: "#334155", border: "1px solid #E2E8F0", "&:hover": { bgcolor: "#EFF6FF", borderColor: "#BFDBFE" } }} />
                  ))}
                </Stack>
              </Box>
            </Stack>

            {/* FILTRO DE PERIODO */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
              <TextField select size="small" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} sx={{ ...campoFiltro, minWidth: 220 }} inputProps={{ "aria-label": "Periodo" }}>
                {PERIODOS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </TextField>
              {periodo === "fecha_fecha" && (["Fecha inicial", "Fecha final"] as const).map((etq, i) => (
                <TextField key={etq} label={etq} type="date" size="small" value={i === 0 ? fechaInicio : fechaFin}
                  onChange={(e) => (i === 0 ? setFechaInicio : setFechaFin)(e.target.value)} InputLabelProps={{ shrink: true }}
                  sx={{ ...campoFiltro, minWidth: { xs: "100%", sm: 200 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon sx={{ color: "#64748B", fontSize: 20 }} /></InputAdornment> }} />
              ))}
            </Stack>
          </Stack>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      {t && (t.reembolsos_pendientes > 0 || t.pagos_rechazados > 0) && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 3 }}>
          {t.reembolsos_pendientes > 0 && <><b>{t.reembolsos_pendientes}</b> reembolso(s) pendiente(s) en Wompi. </>}
          {t.pagos_rechazados > 0 && <><b>{t.pagos_rechazados}</b> pedido(s) con pago rechazado.</>}
        </Alert>
      )}

      {/* ================= INDICADORES ================= */}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }, mb: 2 }}>
        <TarjetaIndicador titulo="Ventas pagadas" valor={t ? cop.format(t.ventas_pagadas) : "—"} icono={<PaidOutlinedIcon />} color="verde" />
        <TarjetaIndicador titulo="Por cobrar" valor={t ? cop.format(t.por_cobrar) : "—"} subtitulo="Contraentrega pendiente" icono={<HourglassEmptyIcon />} color="ambar" />
        <TarjetaIndicador titulo="Pedidos" valor={t ? t.pedidos : "—"} subtitulo={t ? `${t.entregados} entregados · ${t.en_curso} en curso` : undefined} icono={<ShoppingBagOutlinedIcon />} color="azul" />
        <TarjetaIndicador titulo="Ticket promedio" valor={t ? cop.format(t.ticket_promedio) : "—"} icono={<ConfirmationNumberOutlinedIcon />} color="violeta" />
        <TarjetaIndicador titulo="Pago en línea" valor={t ? t.en_linea : "—"} subtitulo={t ? `${t.contraentrega} contraentrega` : undefined} icono={<CreditCardIcon />} color="pizarra" />
        <TarjetaIndicador titulo="Cancelados" valor={t ? t.cancelados : "—"} subtitulo={t ? `${t.domicilios} domicilios` : undefined} icono={<CancelOutlinedIcon />} color="rojo" />
      </Box>

      {/* ================= PESTAÑAS ================= */}
      <Card sx={{ borderRadius: 5, overflow: "hidden" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab icon={<InsightsIcon />} iconPosition="start" label="Dashboard" />
          <Tab icon={<ListAltIcon />} iconPosition="start" label={`Historial${pedidos.length ? ` (${pedidos.length})` : ""}`} />
        </Tabs>
        <Divider />

        {tab === 0 && (
          <Box sx={{ p: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" } }}>
            <TarjetaGrafico etiqueta="Rendimiento" titulo="Ventas web por día" descripcion="Total de pedidos no cancelados en el periodo." pastilla={cop.format(totalPeriodo)}>
              {resumen && resumen.por_dia.length > 0 ? (
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resumen.por_dia} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pedidosArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="fecha" tickFormatter={(v) => fechaCorta(String(v))} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={16} />
                      <YAxis tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip
                        contentStyle={{ borderRadius: 18, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.12)", background: "#fff" }}
                        labelStyle={{ color: "#0f172a", fontWeight: 700 }}
                        labelFormatter={(f) => fechaCorta(String(f))}
                        formatter={(v, _n, item) => [`${cop.format(Number(v))} · ${item?.payload?.pedidos ?? 0} pedido(s)`, "Ventas"]}
                      />
                      <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} fill="url(#pedidosArea)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography sx={{ py: 8, textAlign: "center", color: "#94A3B8" }}>{cargando ? "Cargando…" : "Sin pedidos en este periodo."}</Typography>
              )}
            </TarjetaGrafico>

            <Box sx={{ display: "grid", gap: 2 }}>
              <TarjetaGrafico etiqueta="Operación" titulo="Pedidos por estado">
                <Stack spacing={1.2}>
                  {(resumen?.por_estado ?? []).map((e) => (
                    <Box key={e.estado}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <ChipEstado estado={e.estado} />
                        <Typography sx={{ fontWeight: 800, color: "#0F172A" }}>{e.cantidad}</Typography>
                      </Stack>
                      <Box sx={{ height: 6, borderRadius: 999, bgcolor: "#F1F5F9", overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${(e.cantidad / maxEstado) * 100}%`, bgcolor: ESTADOS[e.estado].color, borderRadius: 999 }} />
                      </Box>
                    </Box>
                  ))}
                  {resumen?.por_estado.length === 0 && <Typography sx={{ color: "#94A3B8", fontSize: 13 }}>Sin datos en este periodo.</Typography>}
                </Stack>
              </TarjetaGrafico>

              <TarjetaGrafico etiqueta="Productos" titulo="Los más pedidos">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Producto", "Und.", "Total"].map((h, i) => (
                        <TableCell key={h} align={i ? "right" : "left"} sx={{ fontWeight: 700, color: "#475569", bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(resumen?.productos ?? []).map((p) => (
                      <TableRow key={p.nombre} hover>
                        <TableCell sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</TableCell>
                        <TableCell align="right">{p.cantidad}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{cop.format(p.total)}</TableCell>
                      </TableRow>
                    ))}
                    {resumen?.productos.length === 0 && (
                      <TableRow><TableCell colSpan={3} sx={{ color: "#94A3B8", textAlign: "center" }}>Sin datos en este periodo.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TarjetaGrafico>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }} useFlexGap flexWrap="wrap" justifyContent="flex-end">
              <Filtro label="Estado" valor={filtros.estado} opciones={Object.entries(ESTADOS).map(([k, v]) => [k, v.label])} onCambio={(v) => setFiltros((f) => ({ ...f, estado: v }))} />
              <Filtro label="Pago" valor={filtros.estado_pago} opciones={Object.entries(PAGOS).map(([k, v]) => [k, v.label])} onCambio={(v) => setFiltros((f) => ({ ...f, estado_pago: v }))} />
              <Filtro label="Método" valor={filtros.metodo_pago} opciones={[["EN_LINEA", "En línea"], ["CONTRAENTREGA", "Contraentrega"]]} onCambio={(v) => setFiltros((f) => ({ ...f, metodo_pago: v }))} />
              <Filtro label="Entrega" valor={filtros.tipo_entrega} opciones={[["DOMICILIO", "Domicilio"], ["RECOGER", "Recoger"]]} onCambio={(v) => setFiltros((f) => ({ ...f, tipo_entrega: v }))} />
            </Stack>
            <DataGrid
              rows={pedidos}
              columns={columnas}
              loading={cargando}
              autoHeight
              density="compact"
              disableRowSelectionOnClick
              onRowClick={({ row }) => setAbierto(row.id)}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              pageSizeOptions={[25, 50, 100]}
              sx={{
                border: 0,
                "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, color: "#475569" },
                "& .MuiDataGrid-row": { cursor: "pointer" },
                "& .MuiDataGrid-row:hover": { bgcolor: "#f8fafc" },
              }}
            />
          </Box>
        )}
      </Card>

      {abierto !== null && (
        <DetallePedido id={abierto} recarga={0} onCerrar={() => setAbierto(null)} onCambio={cargar} onAviso={() => {}} />
      )}
    </Box>
  );
}
