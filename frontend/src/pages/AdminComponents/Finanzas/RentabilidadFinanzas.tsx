/* Rentabilidad por producto y categoría. Volumen no es rentabilidad: la matriz
   cruza unidades vendidas con margen para ver qué conviene revisar. */
import { useMemo, useState } from "react";
import { Alert, Box, Button, Chip, MenuItem, Stack, Switch, FormControlLabel, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip as TooltipChart, XAxis, YAxis, ZAxis } from "recharts";
import DownloadIcon from "@mui/icons-material/Download";
import { fin } from "../../../api/finanzas";
import type { FilaRentabilidad } from "../../../api/finanzas";
import { Seccion, TarjetaIndicador } from "../../../components/pedidos/DisenoPedidos";
import { exportarCSV, pesos, porc, signo } from "./finanzasUtil";
import { useDatos } from "./useDatos";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import PercentIcon from "@mui/icons-material/Percent";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function RentabilidadFinanzas({ desde, hasta }: { desde: string; hasta: string }) {
  const [orden, setOrden] = useState("contribucion");
  const [todos, setTodos] = useState(false);
  const { datos: r, error, cargando } = useDatos(() => fin.rentabilidad({ desde, hasta, orden, todos: todos ? "1" : "" }), [desde, hasta, orden, todos]);
  const conSenal = (r?.productos ?? []).filter((p) => p.senales.length);
  const puntos = useMemo(() => (r?.productos ?? []).filter((p) => p.unidades > 0 && p.contribucion_pct !== null).map((p) => ({ x: p.unidades, y: p.contribucion_pct, z: p.ingresos, nombre: p.nombre })), [r]);

  const columnas: GridColDef<FilaRentabilidad>[] = [
    { field: "nombre", headerName: "Producto", flex: 1, minWidth: 170, renderCell: ({ row }) => (
      <Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.nombre}</Typography><Typography sx={{ fontSize: 11, color: "#94A3B8" }}>{row.categoria.replace(/^\d+\.\s*/, "")}</Typography></Box>
    ) },
    { field: "precio_actual", headerName: "Precio", width: 100, type: "number", valueFormatter: (v: number | null) => pesos(v) },
    { field: "costo_actual", headerName: "Costo", width: 115, type: "number", renderCell: ({ row }) => row.sin_costo ? <Chip size="small" label="Sin costo" color="error" variant="outlined" /> : (
      <Tooltip title={row.costo_estimado ? "Costo de referencia (estimado)" : "Costo según receta / inventario"}><span>{pesos(row.costo_actual)}{row.costo_estimado ? " *" : ""}</span></Tooltip>
    ) },
    { field: "margen_unitario_pct", headerName: "Margen unit.", width: 105, type: "number", valueFormatter: (v: number | null) => porc(v) },
    { field: "unidades", headerName: "Unidades", width: 95, type: "number" },
    { field: "ingresos", headerName: "Ingresos", width: 120, type: "number", valueFormatter: (v: number) => pesos(v) },
    { field: "contribucion", headerName: "Contribución", width: 125, type: "number", valueFormatter: (v: number | null) => pesos(v) },
    { field: "participacion_contribucion_pct", headerName: "% del total", width: 95, type: "number", valueFormatter: (v: number | null) => porc(v) },
    { field: "crecimiento_ingresos_pct", headerName: "vs. anterior", width: 120, valueFormatter: (v: number | null) => signo(v) },
    { field: "senales", headerName: "Revisar", width: 260, sortable: false, renderCell: ({ row }) => (
      <Stack direction="row" spacing={0.5} sx={{ overflow: "hidden" }}>{row.senales.map((s) => <Chip key={s} size="small" label={s} color={s.startsWith("El precio") || s.startsWith("Sin costo") ? "error" : "warning"} variant="outlined" />)}</Stack>
    ) },
  ];

  if (error) return <Alert severity="error">{error}</Alert>;
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
        <TarjetaIndicador titulo="Ingresos por productos" valor={pesos(r?.totales.ingresos)} icono={<RestaurantMenuIcon />} color="azul" />
        <TarjetaIndicador titulo="Contribución total" valor={pesos(r?.totales.contribucion)} subtitulo={`${porc(r?.totales.contribucion_pct)} de los ingresos`} icono={<PercentIcon />} color="verde" />
        <TarjetaIndicador titulo="Productos para revisar" valor={conSenal.length} subtitulo={`Margen mínimo esperado: ${r?.umbral_margen_pct ?? 30} %`} icono={<WarningAmberIcon />} color={conSenal.length ? "ambar" : "pizarra"} />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1.3fr 1fr" } }}>
        <Seccion titulo="Volumen vs. margen" accion={<Typography sx={{ fontSize: 11.5, color: "#94A3B8" }}>Tamaño = ingresos</Typography>}>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#EEF2F7" />
                <XAxis type="number" dataKey="x" name="Unidades" tick={{ fontSize: 11 }} label={{ value: "Unidades vendidas", position: "insideBottom", offset: -4, fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Margen %" unit="%" tick={{ fontSize: 11 }} width={48} />
                <ZAxis type="number" dataKey="z" range={[40, 400]} />
                <ReferenceLine y={r?.umbral_margen_pct ?? 30} stroke="#F59E0B" strokeDasharray="4 4" />
                <TooltipChart cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
                  const p = payload?.[0]?.payload as { nombre: string; x: number; y: number; z: number } | undefined;
                  return p ? <Box sx={{ p: 1, bgcolor: "#fff", border: "1px solid #E2E8F0", borderRadius: 1, fontSize: 12 }}><b>{p.nombre}</b><br />{p.x} unidades · margen {p.y} %<br />Ingresos {pesos(p.z)}</Box> : null;
                }} />
                <Scatter data={puntos} fill="#2563EB" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
          <Typography sx={{ fontSize: 11.5, color: "#64748B" }}>Abajo a la derecha: se vende mucho pero deja poco (revisar precio, porción o costo). La línea naranja es el margen mínimo esperado.</Typography>
        </Seccion>

        <Seccion titulo="Por categoría">
          <Stack spacing={1}>
            {(r?.categorias ?? []).map((c) => (
              <Stack key={c.categoria} direction="row" justifyContent="space-between" sx={{ py: 0.75, borderBottom: "1px solid #EEF2F7" }}>
                <Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{c.categoria.replace(/^\d+\.\s*/, "")}</Typography><Typography sx={{ fontSize: 11.5, color: "#94A3B8" }}>{c.unidades} unidades · {pesos(c.ingresos)}</Typography></Box>
                <Box sx={{ textAlign: "right" }}><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{pesos(c.contribucion)}</Typography><Typography sx={{ fontSize: 11.5, color: c.completo ? "#16A34A" : "#D97706" }}>{porc(c.contribucion_pct)}{c.completo ? "" : " · incompleto"}</Typography></Box>
              </Stack>
            ))}
          </Stack>
        </Seccion>
      </Box>

      <Seccion titulo="Productos" accion={
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControlLabel control={<Switch size="small" checked={todos} onChange={(e) => setTodos(e.target.checked)} />} label={<Typography sx={{ fontSize: 13 }}>Incluir sin ventas</Typography>} />
          <TextField select size="small" value={orden} onChange={(e) => setOrden(e.target.value)} sx={{ minWidth: 190 }}>
            <MenuItem value="contribucion">Mayor contribución</MenuItem>
            <MenuItem value="ingresos">Mayores ingresos</MenuItem>
            <MenuItem value="unidades">Más vendidos</MenuItem>
            <MenuItem value="margen">Menor margen</MenuItem>
          </TextField>
          <Button size="small" startIcon={<DownloadIcon />} sx={{ textTransform: "none" }} onClick={() => exportarCSV("rentabilidad", [
            { campo: "nombre", titulo: "Producto" }, { campo: "categoria", titulo: "Categoría" }, { campo: "precio_actual", titulo: "Precio" }, { campo: "costo_actual", titulo: "Costo" },
            { campo: "costo_estimado", titulo: "Costo estimado" }, { campo: "margen_unitario_pct", titulo: "Margen unitario %" }, { campo: "unidades", titulo: "Unidades" },
            { campo: "ingresos", titulo: "Ingresos" }, { campo: "costo_ventas", titulo: "Costo de ventas" }, { campo: "contribucion", titulo: "Contribución" },
            { campo: "contribucion_pct", titulo: "Contribución %" }, { campo: "ingresos_anterior", titulo: "Ingresos período anterior" }, { campo: "senales", titulo: "Revisar" },
          ], (r?.productos ?? []) as unknown as Record<string, unknown>[])}>Exportar</Button>
        </Stack>
      }>
        <Box sx={{ height: 560 }}>
          <DataGrid rows={r?.productos ?? []} columns={columnas} loading={cargando} density="compact" disableRowSelectionOnClick rowHeight={48}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} pageSizeOptions={[25, 50, 100]} sx={{ border: 0 }}
            localeText={{ noRowsLabel: "No hay ventas en el período" }} />
        </Box>
        <Typography sx={{ mt: 1, fontSize: 11.5, color: "#94A3B8" }}>
          * Costo de referencia (estimado). Para un costo real, carga la receta del producto o vincúlalo a su inventario en Productos.
          La contribución usa el costo guardado en cada venta; el margen unitario usa el precio y el costo de hoy.
        </Typography>
      </Seccion>
    </Stack>
  );
}
