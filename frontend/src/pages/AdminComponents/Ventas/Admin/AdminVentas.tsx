import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";

import {
  Box,
  Dialog,
  DialogContent,
  Tabs,
  Tab,
  Stack,
  Typography,
  Card,
  TextField,
  MenuItem,
  Avatar,
  Divider,
  Chip,
  InputAdornment,
} from "@mui/material";


import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InsightsIcon from "@mui/icons-material/Insights";
import Loader from "../../../../components/Loader";
import CalendarView from "./CalendarView";
import VentasDelDia from "./VentasDelDia";
import type { Venta } from "../../../../types/ventas";
import {
  getResumenVentas,
  getVentasPorDia,
} from "../../../../api/ventas";

import DashboardVentas from "./DashboardVentas";
// Finanzas dentro de Ventas: mismas pestañas del antiguo módulo Finanzas
import PanelFinanzas from "../../Finanzas/PanelFinanzas";
import GastosFinanzas from "../../Finanzas/GastosFinanzas";
import EgresosFinanzas from "../../Finanzas/EgresosFinanzas";
import RentabilidadFinanzas from "../../Finanzas/RentabilidadFinanzas";
import FlujoFinanzas from "../../Finanzas/FlujoFinanzas";
import MetasFinanzas from "../../Finanzas/MetasFinanzas";
import AdminCompras from "../../Compras/AdminCompras";
import { rangoDe } from "../../Finanzas/finanzasUtil";
import type { Periodo } from "../../Finanzas/finanzasUtil";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import WaterfallChartIcon from "@mui/icons-material/WaterfallChart";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import FlagIcon from "@mui/icons-material/Flag";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import AdminTiqueteras from "./AdminTiqueteras";

// Pestañas: 0 Dashboard · 1 Calendario · 2.. finanzas (en este orden)
const TAB_FIN = { panel: 2, gastos: 3, egresos: 4, rentabilidad: 5, flujo: 6, compras: 7, metas: 8 };
const TAB_TIQUETERAS = 9;
// Índices que usa el panel financiero (los del antiguo módulo) → pestañas de Ventas
const DESDE_PANEL: Record<number, number> = { 0: TAB_FIN.panel, 1: TAB_FIN.gastos, 2: TAB_FIN.egresos, 3: TAB_FIN.rentabilidad, 4: TAB_FIN.flujo, 5: TAB_FIN.metas };
import StatsCards from "./StatsCards";

const AdminVentas: React.FC = () => {

  const [resumen, setResumen] = useState<Venta[]>([]);
  const [ventasDelDia, setVentasDelDia] = useState<Venta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] =
    useState<string | null>(null);
  const [tab, setTab] = useState(0);


  const [tipoFiltro, setTipoFiltro] =
    useState("mes_actual");

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // =====================================================
  // CARGAR DATA
  // =====================================================

  const recargarDatos = async () => {
  await loadResumen();

  if (selectedDate) {
    const data = await getVentasPorDia(selectedDate);
    setVentasDelDia(data.ventas || []);
  }
};

 const loadResumen = useCallback(async () => {
  try {
    setLoading(true);

    const data = await getResumenVentas(
      tipoFiltro,
      fechaInicio,
      fechaFin
    );

    setResumen(data.ventas || []);
  } catch (error) {
    console.error(error);
    setResumen([]);
  } finally {
    setLoading(false);
  }
}, [
  tipoFiltro,
  fechaInicio,
  fechaFin,
]);


useEffect(() => {
  // filtros normales
  if (tipoFiltro !== "fecha_fecha") {
    loadResumen();
    return;
  }

  if (fechaInicio && fechaFin) {
    loadResumen();
  }

}, [
  tipoFiltro,
  fechaInicio,
  fechaFin,
  loadResumen,
]);


  useEffect(() => {

      if (
        tipoFiltro === "fecha_fecha" &&
        (!fechaInicio || !fechaFin)
      ) {
        return;
      }

      loadResumen();

    }, [
      tipoFiltro,
      fechaInicio,
      fechaFin,
      loadResumen
    ]);
  // =====================================================
  // CLICK DIA
  // =====================================================

const abrirVentasDelDia = async (fecha: string) => {
  try {
    setLoading(true);

    setSelectedDate(fecha);

    const data = await getVentasPorDia(fecha);

    setVentasDelDia(data.ventas || []);
  } catch (error) {
    console.error(error);
    setVentasDelDia([]);
  } finally {
    setLoading(false);
  }
};
const ventasFiltradas = resumen;
  // =====================================================
  // STATS
  // =====================================================

  const stats = useMemo(() => {
    if (!ventasFiltradas.length) {
      return {
        totalVentas: 0,
        totalDinero: 0,
        totalEgresos: 0,
        utilidad: 0,
        ventaMayor: 0,
        mejorDia: "",
      };
    }

    const totalVentas = ventasFiltradas.reduce(
      (sum, r) => sum + Number(r.cantidad || 0),
      0
    );

    const totalDinero = ventasFiltradas.reduce(
      (sum, r) => sum + Number(r.total || 0),
      0
    );

    const totalEgresos = ventasFiltradas.reduce(
      (sum, r) => sum + Number(r.egresos || 0),
      0
    );

    const utilidad =
      totalDinero - totalEgresos;

    const ventaMayor = Math.max(
      ...ventasFiltradas.map((r) =>
        Number(r.total || 0)
      )
    );

    const mejorVenta = ventasFiltradas.reduce(
      (max, current) =>
        current.total > max.total
          ? current
          : max,
      ventasFiltradas[0]
    );

    return {
      totalVentas,
      totalDinero,
      totalEgresos,
      utilidad,
      ventaMayor,
      mejorDia: mejorVenta?.fecha || "",
    };
  }, [ventasFiltradas]);

  // =====================================================
  // DATA CHART
  // =====================================================

  const chartData = useMemo(() => {
    return ventasFiltradas.map((r) => ({
      fecha: r.fecha,
      ventas: Number(r.total || 0),
      egresos: Number(r.egresos || 0),
      utilidad:
        Number(r.total || 0) -
        Number(r.egresos || 0),
      cantidad: Number(r.cantidad || 0),
    }));
  }, [ventasFiltradas]);

  if (loading && !resumen.length) {
    return <Loader text="Cargando..." />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:"linear-gradient(180deg,#f5f7fb,#eef4ff)",
        p: 1,
      }}
    >

      <Card
        sx={{
          mb: 2,
          borderRadius: 5,
          overflow: "hidden",
          position: "relative",
          bgcolor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow: "0 12px 35px rgba(15,23,42,.06)",

          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 5,
            background:
              "linear-gradient(90deg,#2563EB,#3B82F6,#60A5FA)",
          },
        }}
      >
        {/* EFECTOS FONDO */}

        <Box
          sx={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(37,99,235,.08), transparent 70%)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            bottom: -120,
            left: -120,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(96,165,250,.05), transparent 70%)",
          }}
        />
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            p: {
              xs: 1,
              md: 2,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              lg: "row",
            }}
            justifyContent="space-between"
            spacing={2}
          >
            {/* ================================================= */}
            {/* LEFT */}
            {/* ================================================= */}

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <Avatar
                sx={{
                  width: {sx:50,md:62},
                  height: {sx:50,md:62},
                  borderRadius: 4,
                  bgcolor: "#EFF6FF",
                  color: "#2563EB",
                  border: "1px solid #BFDBFE",
                  boxShadow:
                    "0 10px 25px rgba(37,99,235,.10)",
                }}
              >
                <InsightsIcon sx={{ fontSize: 38 }} />
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: {
                      xs: 14,
                      md: 20
                    },
                    color: "#0F172A",
                    letterSpacing: -.5
                  }}
                >
                  Dashboard Financiero
                </Typography>

                <Typography
                  sx={{
                    mt: .8,
                    color: "#64748B",
                    fontSize: {
                      xs: 10,
                      md: 12
                    },
                    maxWidth: 520,
                    lineHeight: 1.6
                  }}
                >
                  Visualice en tiempo real las ventas, ingresos, egresos,
                  rentabilidad y principales indicadores financieros del negocio.
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.2}
                  mt={1}
                  flexWrap="wrap"
                  useFlexGap
                >
                  {[
                    "Ventas",
                    "Utilidades",
                    "Contabilidad",
                    "Reportes",
                  ].map((item) => (
                    <Chip
                      label={item}
                      sx={{
                        height: 32,
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: {xs:8,md:12},

                        bgcolor: "#F8FAFC",

                        color: "#334155",

                        border: "1px solid #E2E8F0",

                        "&:hover": {
                          bgcolor: "#EFF6FF",
                          borderColor: "#BFDBFE"
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>

            {/* ================================================= */}
            {/* FILTROS */}
            {/* ================================================= */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              justifyContent="flex-end"
              flexWrap="wrap"
              useFlexGap
            >
              <TextField
                select
                size="small"
                value={tipoFiltro}
                onChange={(e) =>
                  setTipoFiltro(e.target.value)
                }
                sx={{
                  minWidth: 220,
                  "& .MuiOutlinedInput-root": {
                    height: 46,
                    borderRadius: 3,
                    background: "#FFFFFF",
                    "& fieldset": {
                      borderColor: "#CBD5E1"
                    },
                    "&:hover fieldset": {
                      borderColor: "#93C5FD"
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2563EB",
                      borderWidth: 2
                    }
                  }
                }}
              >


                <MenuItem value="hoy">
                  Hoy
                </MenuItem>

                <MenuItem value="ayer">
                  Ayer
                </MenuItem>

                <MenuItem value="semana_actual">
                  Semana Actual
                </MenuItem>

                <MenuItem value="semana_anterior">
                  Semana Anterior
                </MenuItem>

                <MenuItem value="mes_actual">
                  Mes Actual
                </MenuItem>

                <MenuItem value="mes_anterior">
                  Mes Anterior
                </MenuItem>
                <MenuItem value="anio">
                  Año Actual
                </MenuItem>

                <MenuItem value="fecha_fecha">
                  Fecha a Fecha
                </MenuItem>

              </TextField>

              {tipoFiltro === "fecha_fecha" && (
                <Box
                  display="flex"
                  flexWrap="wrap"
                  gap={2}
                  alignItems="center"
                >
                  <TextField
                    label="Fecha inicial"
                    type="date"
                    size="small"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon
                            sx={{
                              color: "#64748B",
                              fontSize: 20,
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      flex: 1,
                      minWidth: { xs: "100%", sm: 220 },

                      "& .MuiOutlinedInput-root": {
                        height: 46,
                        borderRadius: 3,
                        bgcolor: "#FFFFFF",
                        transition: ".25s",
                        "& fieldset": { borderColor: "#CBD5E1", },
                        "&:hover": { boxShadow: "0 4px 12px rgba(37,99,235,.08)", },
                        "&:hover fieldset": { borderColor: "#93C5FD", },
                        "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(37,99,235,.10)", },
                        "&.Mui-focused fieldset": {
                          borderColor: "#2563EB",
                          borderWidth: 2,
                        },
                      },

                      "& .MuiInputLabel-root": {
                        color: "#64748B",
                        fontWeight: 500,
                      },
                    }}
                  />

                  <TextField
                    label="Fecha final"
                    type="date"
                    size="small"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon
                            sx={{
                              color: "#64748B",
                              fontSize: 20,
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      flex: 1,
                      minWidth: { xs: "100%", sm: 220 },

                      "& .MuiOutlinedInput-root": {
                        height: 46,
                        borderRadius: 3,
                        bgcolor: "#FFFFFF",
                        transition: ".25s",
                        "& fieldset": { borderColor: "#CBD5E1", },
                        "&:hover": { boxShadow: "0 4px 12px rgba(37,99,235,.08)", },
                        "&:hover fieldset": { borderColor: "#93C5FD", },
                        "&.Mui-focused": { boxShadow: "0 0 0 4px rgba(37,99,235,.10)", },
                        "&.Mui-focused fieldset": {
                          borderColor: "#2563EB",
                          borderWidth: 2,
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "#64748B",
                        fontWeight: 500,
                      },
                    }}
                  />
                </Box>
              )}
            </Stack>
          </Stack>
        </Box>
      </Card>

      {/* stas informativos */}
      <StatsCards
        stats={stats}
        loading={loading}
      />
      {/* MENUS */}

      <Card
        sx={{
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) =>
            setTab(value)
          }
          variant="scrollable"
        >
           <Tab
            icon={<InsightsIcon />}
            iconPosition="start"
            label="Dashboard"
          />
          <Tab
            icon={<CalendarMonthIcon />}
            iconPosition="start"
            label="Calendario"
          />

          <Tab icon={<AccountBalanceIcon />} iconPosition="start" label="Finanzas" />
          <Tab icon={<ReceiptIcon />} iconPosition="start" label="Gastos" />
          <Tab icon={<PointOfSaleIcon />} iconPosition="start" label="Egresos de caja" />
          <Tab icon={<RestaurantMenuIcon />} iconPosition="start" label="Rentabilidad" />
          <Tab icon={<WaterfallChartIcon />} iconPosition="start" label="Flujo de caja" />
          <Tab icon={<ShoppingCartOutlinedIcon />} iconPosition="start" label="Compras" />
          <Tab icon={<FlagIcon />} iconPosition="start" label="Metas y alertas" />
          <Tab icon={<ConfirmationNumberIcon />} iconPosition="start" label="Tiqueteras" />
        </Tabs>

        <Divider />

        {/*DASHBOARD  */} 
        {tab === 0 && (
          <Box p={2}>
           <DashboardVentas
          chartData={chartData}
          stats={stats}
          onSelectDate={abrirVentasDelDia}

        />
          </Box>
        )}

        {/* CALENDARIO */}

     {tab === 1 && (


    <Box p={2}>
            <CalendarView
              ventas={ventasFiltradas}
               onSelectDate={abrirVentasDelDia}
            />
          </Box>

)}

        {/* FINANZAS (mismo período del filtro de arriba) */}
        {tab === TAB_TIQUETERAS && <Box p={{ xs: 1, md: 2 }} sx={{ bgcolor: "#F8FAFC" }}><AdminTiqueteras /></Box>}

        {tab >= TAB_FIN.panel && tab <= TAB_FIN.metas && (() => {
          const rango = rangoDe(tipoFiltro as Periodo, fechaInicio, fechaFin);
          if (!rango && tab !== TAB_FIN.metas) {
            return <Box p={3}><Typography color="text.secondary">Elige las dos fechas del rango.</Typography></Box>;
          }
          const [desde, hasta] = rango ?? ["", ""];
          return (
            <Box p={{ xs: 1, md: 2 }} sx={{ bgcolor: "#F8FAFC" }}>
              {tab === TAB_FIN.panel && <PanelFinanzas desde={desde} hasta={hasta} onIr={(n) => setTab(DESDE_PANEL[n] ?? TAB_FIN.panel)} />}
              {tab === TAB_FIN.gastos && <GastosFinanzas desde={desde} hasta={hasta} />}
              {tab === TAB_FIN.egresos && <EgresosFinanzas desde={desde} hasta={hasta} />}
              {tab === TAB_FIN.rentabilidad && <RentabilidadFinanzas desde={desde} hasta={hasta} />}
              {tab === TAB_FIN.flujo && <FlujoFinanzas desde={desde} hasta={hasta} />}
              {tab === TAB_FIN.compras && <AdminCompras incrustado desde={desde} hasta={hasta} />}
              {tab === TAB_FIN.metas && <MetasFinanzas />}
            </Box>
          );
        })()}
      </Card>

      {/* ================================================= */}
      {/* MODAL VENTAS DEL DIA */}
      {/* ================================================= */}

      <Dialog
        open={Boolean(selectedDate)}
        onClose={() =>
          setSelectedDate(null)
        }
        fullWidth
        maxWidth="xl"
      >
        <DialogContent dividers>
          {loading ? (
            <Loader text="Cargando ventas..." />
          ) : (
            selectedDate && (
              <VentasDelDia
                ventas={ventasDelDia}
                fecha={selectedDate}
                 onCajaEliminada={recargarDatos}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AdminVentas;