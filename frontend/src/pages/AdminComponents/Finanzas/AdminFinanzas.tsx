/*
 * Módulo Finanzas: costos, gastos, rentabilidad, flujo de caja, metas y alertas.
 * Mismo diseño de Ventas admin / Pedidos: tarjeta principal con período y pestañas.
 * Las cifras salen del servidor (por negocio); lo estimado se indica siempre.
 */
import { useMemo, useState } from "react";
import { Avatar, Box, Card, Chip, InputAdornment, MenuItem, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InsightsIcon from "@mui/icons-material/Insights";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import WaterfallChartIcon from "@mui/icons-material/WaterfallChart";
import FlagIcon from "@mui/icons-material/Flag";
import { PERIODOS, rangoDe } from "./finanzasUtil";
import type { Periodo } from "./finanzasUtil";
import PanelFinanzas from "./PanelFinanzas";
import GastosFinanzas from "./GastosFinanzas";
import EgresosFinanzas from "./EgresosFinanzas";
import RentabilidadFinanzas from "./RentabilidadFinanzas";
import FlujoFinanzas from "./FlujoFinanzas";
import MetasFinanzas from "./MetasFinanzas";

const campoFiltro = {
  "& .MuiOutlinedInput-root": {
    height: 46, borderRadius: 3, background: "#FFFFFF", transition: ".25s",
    "& fieldset": { borderColor: "#CBD5E1" }, "&:hover fieldset": { borderColor: "#93C5FD" },
    "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(37,99,235,.10)" }, "&.Mui-focused fieldset": { borderColor: "#2563EB", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { color: "#64748B", fontWeight: 500 },
} as const;

const PESTANAS = [
  { etiqueta: "Panel", icono: <InsightsIcon fontSize="small" /> },
  { etiqueta: "Gastos", icono: <ReceiptIcon fontSize="small" /> },
  { etiqueta: "Egresos de caja", icono: <PointOfSaleIcon fontSize="small" /> },
  { etiqueta: "Rentabilidad", icono: <RestaurantMenuIcon fontSize="small" /> },
  { etiqueta: "Flujo de caja", icono: <WaterfallChartIcon fontSize="small" /> },
  { etiqueta: "Metas y alertas", icono: <FlagIcon fontSize="small" /> },
];

export default function AdminFinanzas() {
  const [periodo, setPeriodo] = useState<Periodo>("mes_actual");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [tab, setTab] = useState(0);
  const rango = useMemo(() => rangoDe(periodo, inicio, fin), [periodo, inicio, fin]);

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg,#f5f7fb,#eef4ff)", p: 1 }}>
      <Card sx={{
        mb: 2, borderRadius: 5, overflow: "hidden", position: "relative", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 12px 35px rgba(15,23,42,.06)",
        "&::before": { content: '""', position: "absolute", top: 0, left: 0, width: "100%", height: 5, background: "linear-gradient(90deg,#2563EB,#3B82F6,#60A5FA)" },
      }}>
        <Box sx={{ position: "absolute", top: -80, right: -80, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,.08), transparent 70%)" }} />
        <Box sx={{ position: "relative", zIndex: 2, p: { xs: 1, md: 2 } }}>
          <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: { xs: 50, md: 62 }, height: { xs: 50, md: 62 }, borderRadius: 4, bgcolor: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", boxShadow: "0 10px 25px rgba(37,99,235,.10)" }}>
                <AccountBalanceIcon sx={{ fontSize: 34 }} />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 14, md: 20 }, color: "#0F172A", letterSpacing: -0.5 }}>Finanzas</Typography>
                <Typography sx={{ mt: 0.8, color: "#64748B", fontSize: { xs: 10, md: 12 }, maxWidth: 560, lineHeight: 1.6 }}>
                  Cuánto cuesta operar, cuánto deja cada producto, qué dinero entra y sale, y cómo va el negocio frente a sus metas.
                  Lo que se calcula con costos de referencia aparece marcado como estimado.
                </Typography>
                <Stack direction="row" spacing={1.2} mt={1} flexWrap="wrap" useFlexGap>
                  {["Costos", "Rentabilidad", "Flujo de caja", "Metas"].map((t) => (
                    <Chip key={t} label={t} sx={{ height: 30, borderRadius: 2, fontWeight: 600, fontSize: { xs: 9, md: 12 }, bgcolor: "#F8FAFC", color: "#334155", border: "1px solid #E2E8F0" }} />
                  ))}
                </Stack>
              </Box>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
              <TextField select size="small" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} sx={{ ...campoFiltro, minWidth: 210 }} inputProps={{ "aria-label": "Período" }}>
                {PERIODOS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </TextField>
              {periodo === "fecha_fecha" && (["Desde", "Hasta"] as const).map((etq, i) => (
                <TextField key={etq} label={etq} type="date" size="small" value={i === 0 ? inicio : fin} onChange={(e) => (i === 0 ? setInicio : setFin)(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={{ ...campoFiltro, minWidth: { xs: "100%", sm: 190 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon sx={{ color: "#64748B", fontSize: 20 }} /></InputAdornment> }} />
              ))}
            </Stack>
          </Stack>
        </Box>
        <Box sx={{ px: { xs: 1, md: 2 }, borderTop: "1px solid #E2E8F0" }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 14, minHeight: 52 }, "& .Mui-selected": { color: "#2563EB" }, "& .MuiTabs-indicator": { height: 3, borderRadius: 3, bgcolor: "#2563EB" } }}>
            {PESTANAS.map((p) => <Tab key={p.etiqueta} icon={p.icono} iconPosition="start" label={p.etiqueta} />)}
          </Tabs>
        </Box>
      </Card>

      {!rango ? (
        <Typography sx={{ p: 3, color: "#64748B" }}>Elige las dos fechas del rango.</Typography>
      ) : (
        <>
          {tab === 0 && <PanelFinanzas desde={rango[0]} hasta={rango[1]} onIr={setTab} />}
          {tab === 1 && <GastosFinanzas desde={rango[0]} hasta={rango[1]} />}
          {tab === 2 && <EgresosFinanzas desde={rango[0]} hasta={rango[1]} />}
          {tab === 3 && <RentabilidadFinanzas desde={rango[0]} hasta={rango[1]} />}
          {tab === 4 && <FlujoFinanzas desde={rango[0]} hasta={rango[1]} />}
          {tab === 5 && <MetasFinanzas />}
        </>
      )}
    </Box>
  );
}
