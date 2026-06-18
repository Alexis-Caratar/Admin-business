// DashboardVentas.tsx

import React from "react";

import {
  Box,
  Typography,
  Card,
  Stack,
  Avatar,
} from "@mui/material";

import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

interface Props {
  chartData: any[];
  stats: any;
  onSelectDate: (fecha: string) => void;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

// =====================================================
// FORMATEAR FECHA
// =====================================================

const formatFecha = (fecha: any) => {
  if (!fecha) return "";

  try {
    const texto = String(fecha);

    // 2026-03-30T00:00:00.000Z
    const limpia = texto.split("T")[0];

    const [year, month, day] = limpia
      .split("-")
      .map(Number);

    if (!year || !month || !day) {
      return limpia;
    }

    const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    const dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

    const date = new Date(year, month - 1, day);

    const nombreDia = dias[date.getDay()];
    const nombreMes = meses[month - 1];

    return `${nombreDia}, ${day} ${nombreMes}`;
  } catch {
    return String(fecha);
  }
};
const DashboardVentas: React.FC<Props> = ({
  chartData,
  stats,
  onSelectDate,
}) => {
  return (
    <Box p={3}>
      {/* ================================================= */}
      {/* FILA SUPERIOR */}
      {/* ================================================= */}

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          mb: 3,
        }}
      >
   {/* ================================================= */}
{/* GRAFICO VENTAS */}
{/* ================================================= */}

<Box
  sx={{
    flex: {
      xs: "1 1 100%",
      lg: "1 1 calc(66.66% - 12px)",
    },
  }}
>
  <Card
    sx={{
      position: "relative",
      overflow: "hidden",
      borderRadius: "28px",
      p: { xs: 2, md: 3 },
      height: "100%",
      bgcolor: "#ffffff",
      border: "1px solid rgba(15,23,42,0.06)",
      boxShadow:
        "0 10px 40px rgba(15,23,42,0.06)",
      backdropFilter: "blur(10px)",

      "&::before": {
        content: '""',
        position: "absolute",
        top: -120,
        right: -120,
        width: 260,
        height: 260,
        borderRadius: "50%",
        background:
          "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(96,165,250,0.04))",
      },
    }}
  >
    {/* HEADER */}

    <Box
      sx={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      {/* TITULO */}

      <Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: 1,
            mb: 0.5,
          }}
        >
          Rendimiento
        </Typography>

        <Typography
          sx={{
            fontSize: {
              xs: 14,
              md: 18,
            },
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1.1,
          }}
        >
          Crecimiento de Ventas
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: "#64748b",
            fontSize: 12,
          }}
        >
          Visualiza el comportamiento de las
          ventas en tiempo real.
        </Typography>
      </Box>

      {/* BADGE */}

      <Box
        sx={{
          px: 2,
          py: 1,
          borderRadius: 999,
          background:
            "linear-gradient(135deg,#2563eb,#3b82f6)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          boxShadow:
            "0 10px 25px rgba(37,99,235,0.25)",
        }}
      >
        Ventas Totales
      </Box>
    </Box>

    {/* GRAFICO */}

    <Box
      sx={{
        height: 360,
        position: "relative",
        zIndex: 2,
      }}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
      <AreaChart
        data={chartData}
        onClick={(e) => {
          const rawFecha = (e as any)?.activeLabel;
          if (rawFecha) {
            const fecha = rawFecha.split("T")[0];
            onSelectDate(fecha);
          }
        }}
>
            <defs>
            <linearGradient
              id="ventasGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#2563eb"
                stopOpacity={0.45}
              />

              <stop
                offset="100%"
                stopColor="#2563eb"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#e2e8f0"
          />

          <XAxis
            dataKey="fecha"
            tickFormatter={(value) =>
              formatFecha(String(value))
            }
            tick={{
              fill: "#64748b",
              fontSize: 12,
            }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fill: "#64748b",
              fontSize: 12,
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: "none",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.12)",
              background: "#fff",
            }}
            labelStyle={{
              color: "#0f172a",
              fontWeight: 700,
            }}
            labelFormatter={(value) =>
              formatFecha(String(value))
            }
            formatter={(value: any) => [
              formatCOP(Number(value)),
              "Ventas",
            ]}
          />

          <Area
            type="monotone"
            dataKey="ventas"
            stroke="#2563eb"
            strokeWidth={4}
            fill="url(#ventasGradient)"
            dot={false}
            activeDot={{
              r: 7,
              strokeWidth: 0,
              fill: "#2563eb",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  </Card>
</Box>
     
      </Box>

   {/* ================================================= */}
{/* EGRESOS + UTILIDADES */}
{/* ================================================= */}

<Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 3,
    mb: 3,
  }}
>
  {/* ================================================= */}
  {/* EGRESOS */}
  {/* ================================================= */}

  <Box
    sx={{
      flex: {
        xs: "1 1 100%",
        lg: "1 1 calc(50% - 12px)",
      },
    }}
  >
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        p: { xs: 2, md: 3 },
        height: "100%",
        bgcolor: "#fff",
        border: "1px solid rgba(15,23,42,0.06)",
        boxShadow:
          "0 10px 40px rgba(15,23,42,0.06)",

        "&::before": {
          content: '""',
          position: "absolute",
          top: -120,
          right: -120,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(239,68,68,0.16), rgba(248,113,113,0.04))",
        },
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          mb: 3,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: 1,
            mb: 0.5,
          }}
        >
          Flujo Financiero
        </Typography>

        <Typography
          sx={{
            fontSize: {
              xs: 14,
              md: 18,
            },
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          📉 Egresos
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: "#64748b",
            fontSize: 12,
          }}
        >
          Seguimiento de gastos y salidas
          de dinero.
        </Typography>
      </Box>

      {/* CHART */}

      <Box
        sx={{
          height: 320,
          position: "relative",
          zIndex: 2,
        }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
              data={chartData}
              onClick={(e: any) => {
                const rawFecha = e?.activeLabel;

                if (rawFecha) {
                  const fecha = rawFecha.split("T")[0];
                  onSelectDate(fecha);
                }
              }}
            >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="fecha"
              tickFormatter={(value) =>
                formatFecha(String(value))
              }
              tick={{
                fill: "#64748b",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fill: "#64748b",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 18,
                border: "none",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.12)",
              }}
              labelFormatter={(value) =>
                formatFecha(String(value))
              }
              formatter={(value: any) => [
                formatCOP(Number(value)),
                "Egresos",
              ]}
            />

            <Line
              type="monotone"
              dataKey="egresos"
              stroke="#ef4444"
              strokeWidth={4}
              dot={false}
              activeDot={{
                r: 7,
                fill: "#ef4444",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  </Box>

  {/* ================================================= */}
  {/* UTILIDADES */}
  {/* ================================================= */}

  <Box
    sx={{
      flex: {
        xs: "1 1 100%",
        lg: "1 1 calc(50% - 12px)",
      },
    }}
  >
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        p: { xs: 2, md: 3 },
        height: "100%",
        bgcolor: "#fff",
        border: "1px solid rgba(15,23,42,0.06)",
        boxShadow:
          "0 10px 40px rgba(15,23,42,0.06)",

        "&::before": {
          content: '""',
          position: "absolute",
          top: -120,
          right: -120,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(167,139,250,0.04))",
        },
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          mb: 3,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: 1,
            mb: 0.5,
          }}
        >
          Rendimiento
        </Typography>

        <Typography
          sx={{
            fontSize: {
              xs: 14,
              md: 18,
            },
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          💰 Utilidades
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: "#64748b",
            fontSize: 12,
          }}
        >
          Beneficio generado después de
          egresos y gastos.
        </Typography>
      </Box>

      {/* CHART */}

      <Box
        sx={{
          height: 320,
          position: "relative",
          zIndex: 2,
        }}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
    <BarChart
        data={chartData}
        onClick={(data: any) => {

          if (data?.activeLabel) {
            onSelectDate(
              data.activeLabel.split("T")[0]
            );
          }
        }}
      >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="fecha"
              tickFormatter={(value) =>
                formatFecha(String(value))
              }
              tick={{
                fill: "#64748b",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fill: "#64748b",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 18,
                border: "none",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.12)",
              }}
              labelFormatter={(value) =>
                formatFecha(String(value))
              }
              formatter={(value: any) => [
                formatCOP(Number(value)),
                "Utilidad",
              ]}
            />

            <Bar
              dataKey="utilidad"
              radius={[10, 10, 0, 0]}
              fill="#7c3aed"
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  </Box>
</Box>

  {/* ================================================= */}
{/* FILA INFERIOR MODERNA */}
{/* ================================================= */}

<Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 3,
    mt: 1,
  }}
>
  {/* ================================================= */}
  {/* DIA MAYOR VENTA */}
  {/* ================================================= */}

  <Box
    sx={{
      flex: {
        xs: "1 1 100%",
        md: "1 1 calc(35% - 12px)",
      },
    }}
  >
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 6,
        p: 3,
        height: "100%",
        background:
          "linear-gradient(135deg,#fff7ed,#ffffff)",
        border: "1px solid #fed7aa",
        boxShadow:
          "0 10px 30px rgba(249,115,22,0.08)",
      }}
    >
      {/* DECORACION */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg,#fb923c,#f97316)",
          opacity: 0.08,
        }}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <Avatar
            sx={{
              width: 58,
              height: 58,
              bgcolor: "#fff",
              color: "#f97316",
              boxShadow:
                "0 8px 20px rgba(249,115,22,0.18)",
            }}
          >
            <LocalFireDepartmentIcon
              sx={{ fontSize: 30 }}
            />
          </Avatar>

          <Box>
            <Typography
              fontSize={15}
              fontWeight={700}
              color="text.secondary"
            >
              Mejor Día de Ventas
            </Typography>

            <Typography
              fontWeight={900}
              fontSize={20}
            >
              {formatFecha(stats.mejorDia)}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Typography
        fontSize={14}
        color="text.secondary"
        mb={1}
      >
        Total generado
      </Typography>

      <Typography
        fontWeight={900}
        fontSize={{
          xs: 28,
          md: 34,
        }}
        color="#f97316"
        lineHeight={1}
      >
        {formatCOP(stats.ventaMayor)}
      </Typography>
    </Card>
  </Box>

  {/* ================================================= */}
  {/* RESUMEN FINANCIERO */}
  {/* ================================================= */}

  <Box
    sx={{
      flex: {
        xs: "1 1 100%",
        md: "1 1 calc(65% - 12px)",
      },
    }}
  >
    <Card
      sx={{
        borderRadius: 6,
        p: 3,
        height: "100%",
        background: "#fff",
        border: "1px solid #eef2f7",
        boxShadow:
          "0 10px 30px rgba(15,23,42,0.05)",
      }}
    >
      {/* HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography
            fontSize={14}
            fontWeight={700}
            color="text.secondary"
          >
            Resumen Financiero
          </Typography>

          <Typography
            fontSize={24}
            fontWeight={900}
          >
            Estado General
          </Typography>
        </Box>

        <Avatar
          sx={{
            bgcolor: "#eff6ff",
            color: "#2563eb",
            width: 54,
            height: 54,
          }}
        >
          📊
        </Avatar>
      </Stack>

      {/* GRID */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,1fr)",
          },
          gap: 2,
        }}
      >
        {/* VENTAS */}
        <Box
          sx={{
            p: 2.2,
            borderRadius: 4,
            border: "1px solid #f1f5f9",
            background: "#fafafa",
          }}
        >
          <Typography
            color="text.secondary"
            fontSize={13}
            mb={1}
          >
            Total Ventas
          </Typography>

          <Typography
            fontWeight={900}
            fontSize={26}
          >
            {stats.totalVentas}
          </Typography>
        </Box>

        {/* INGRESOS */}
        <Box
          sx={{
            p: 2.2,
            borderRadius: 4,
            border: "1px solid #dcfce7",
            background: "#f0fdf4",
          }}
        >
          <Typography
            color="success.main"
            fontSize={13}
            mb={1}
          >
            Ingresos
          </Typography>

          <Typography
            fontWeight={900}
            fontSize={24}
            color="success.main"
          >
            {formatCOP(stats.totalDinero)}
          </Typography>
        </Box>

        {/* EGRESOS */}
        <Box
          sx={{
            p: 2.2,
            borderRadius: 4,
            border: "1px solid #fee2e2",
            background: "#fef2f2",
          }}
        >
          <Typography
            color="error.main"
            fontSize={13}
            mb={1}
          >
            Egresos
          </Typography>

          <Typography
            fontWeight={900}
            fontSize={24}
            color="error.main"
          >
            {formatCOP(stats.totalEgresos)}
          </Typography>
        </Box>

        {/* UTILIDAD */}
        <Box
          sx={{
            p: 2.2,
            borderRadius: 4,
            border: "1px solid #dbeafe",
            background: "#eff6ff",
          }}
        >
          <Typography
            color="primary"
            fontSize={13}
            mb={1}
          >
            Utilidad Neta
          </Typography>

          <Typography
            fontWeight={900}
            fontSize={24}
            color="primary"
          >
            {formatCOP(stats.utilidad)}
          </Typography>
        </Box>
      </Box>
    </Card>
  </Box>
</Box>

    </Box>
  );
};

export default DashboardVentas;