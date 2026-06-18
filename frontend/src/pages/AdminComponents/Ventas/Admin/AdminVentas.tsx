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
        background:
          "linear-gradient(180deg,#f5f7fb,#eef4ff)",
        p: 3,
      }}
    >

   <Card
  sx={{
    mb: 3,
    borderRadius: "32px",
    overflow: "hidden",
    position: "relative",
    background:
      "linear-gradient(135deg,#071021 0%,#0f172a 35%,#172554 100%)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 25px 60px rgba(15,23,42,0.35)",
  }}
>
  {/* EFECTOS FONDO */}

  <Box
    sx={{
      position: "absolute",
      top: -120,
      right: -120,
      width: 320,
      height: 320,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(59,130,246,.35), transparent 70%)",
    }}
  />

  <Box
    sx={{
      position: "absolute",
      bottom: -100,
      left: -100,
      width: 260,
      height: 260,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(139,92,246,.25), transparent 70%)",
    }}
  />

  <Box
    sx={{
      position: "relative",
      zIndex: 2,
      p: {
        xs: 2.5,
        md: 4,
      },
    }}
  >
    <Stack
      direction={{
        xs: "column",
        lg: "row",
      }}
      justifyContent="space-between"
      spacing={4}
    >
      {/* ================================================= */}
      {/* LEFT */}
      {/* ================================================= */}

      <Stack
        direction="row"
        spacing={2.5}
        alignItems="center"
      >
        <Avatar
          sx={{
            width: 78,
            height: 78,
            borderRadius: "24px",
            background:
              "linear-gradient(135deg,rgba(59,130,246,.25),rgba(255,255,255,.08))",
            backdropFilter: "blur(10px)",
            border:
              "1px solid rgba(255,255,255,.12)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,.25)",
          }}
        >
          <InsightsIcon
            sx={{
              fontSize: 42,
              color: "#fff",
            }}
          />
        </Avatar>

        <Box>
          <Typography
            fontWeight={800}
            sx={{
              fontSize: {
                xs: 16,
                md: 20,
              },
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            Dashboard Financiero
          </Typography>

          <Typography
            sx={{
              mt: 1,
              opacity: 0.75,
              fontSize: 10,
              maxWidth: 520,
            }}
          >
            Analiza ingresos, egresos,
            utilidades y el crecimiento de tu
            negocio en tiempo real.
          </Typography>

          <Stack
            direction="row"
            spacing={1.2}
            mt={2}
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
                key={item}
                label={item}
                sx={{
                  height: 25,
                  px: 1,
                  borderRadius: "12px",
                  color: "#fff",
                  fontWeight: 700,
                  bgcolor:
                    "rgba(255,255,255,.08)",
                  border:
                    "1px solid rgba(255,255,255,.10)",
                  backdropFilter: "blur(10px)",

                  "& .MuiChip-label": {
                    px: 1,
                  },
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
            minWidth: 240,

            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              bgcolor:
                "rgba(255,255,255,.08)",
              color: "#fff",
              backdropFilter: "blur(10px)",

              "& fieldset": {
                border:
                  "1px solid rgba(255,255,255,.12)",
              },

              "&:hover fieldset": {
                border:
                  "1px solid rgba(255,255,255,.25)",
              },

              "&.Mui-focused fieldset": {
                border:
                  "1px solid rgba(96,165,250,.9)",
              },
            },

            "& .MuiSvgIcon-root": {
              color: "#fff",
            },

            "& .MuiInputBase-input": {
              color: "#fff",
              fontWeight: 600,
            },
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
          <>
            <TextField
              type="date"
              size="small"
              value={fechaInicio}
              onChange={(e) =>
                setFechaInicio(
                  e.target.value
                )
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "16px",
                  bgcolor:
                    "rgba(255,255,255,.08)",
                  color: "#fff",

                  "& fieldset": {
                    border:
                      "1px solid rgba(255,255,255,.12)",
                  },
                },

                "& input": {
                  color: "#fff",
                  fontWeight: 600,
                },
              }}
            />

            <TextField
              type="date"
              size="small"
              value={fechaFin}
              onChange={(e) =>
                setFechaFin(
                  e.target.value
                )
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "16px",
                  bgcolor:
                    "rgba(255,255,255,.08)",
                  color: "#fff",

                  "& fieldset": {
                    border:
                      "1px solid rgba(255,255,255,.12)",
                  },
                },

                "& input": {
                  color: "#fff",
                  fontWeight: 600,
                },
              }}
            />
          </>
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