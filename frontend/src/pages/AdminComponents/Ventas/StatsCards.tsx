import React from "react";
import {
  Box,
  Paper,
  Typography,
  Skeleton,
  Stack,
} from "@mui/material";

import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PaymentsIcon from "@mui/icons-material/Payments";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

interface Props {
  stats: {
    totalVentas: number;
    totalDinero: number;
    totalEgresos:number;
    totaltotal:number;
    ventaMayor: number;
  };
  loading: boolean;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

const CardStat = ({
  title,
  value,
  loading,
  icon,
  gradient,
}: {
  title: string;
  value: string | number;
  loading: boolean;
  icon: React.ReactNode;
  gradient: string;
}) => (
  <Paper
    elevation={0}
    sx={{
      flex: "1 1 250px", // 🔥 clave responsive
      p: 2.5,
      borderRadius: 4,
      position: "relative",
      overflow: "hidden",
      border: "1px solid #eee",
      background: "#fff",
      transition: "all .25s ease",

      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
      },
    }}
  >
    {/* CÍRCULO DECORATIVO */}
    <Box
      sx={{
        position: "absolute",
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: "50%",
        background: gradient,
        opacity: 0.15,
      }}
    />

    <Stack direction="row" justifyContent="space-between" alignItems="center">
      {/* TEXTO */}
      <Box>
        <Typography fontSize={13} color="text.secondary" fontWeight={500}>
          {title}
        </Typography>

        {loading ? (
          <Skeleton variant="text" height={40} width={100} />
        ) : (
          <Typography fontSize={24} fontWeight={800} sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        )}
      </Box>

      {/* ICONO */}
      <Box
        sx={{
          width: 45,
          height: 45,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: gradient,
          color: "#fff",
          boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
        }}
      >
        {icon}
      </Box>
    </Stack>
  </Paper>
);

const StatsCards: React.FC<Props> = ({ stats, loading }) => {
  return (
    <Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
    mb: 3,
  }}
>
  {[ 
    {
      title: "Total Ventas",
      value: stats.totalVentas,
      icon: <PointOfSaleIcon />,
      gradient: "linear-gradient(135deg,#1976d2,#42a5f5)",
    },
    {
      title: "Ingresos Totales",
      value: formatCOP(stats.totalDinero),
      icon: <PaymentsIcon />,
      gradient: "linear-gradient(135deg,#2e7d32,#66bb6a)",
    },
    {
      title: "Egresos Totales",
      value: formatCOP(-stats.totalEgresos),
      icon: <PaymentsIcon />,
      gradient: "linear-gradient(135deg,#f19a9a,#ef0909)",
    },
    {
      title: "Total Neto",
      value: formatCOP(-stats.totaltotal),
      icon: <PaymentsIcon />,
      gradient: "linear-gradient(135deg,#1976d2,#42a5f5)",
    },
    {
      title: "Venta Más Alta",
      value: formatCOP(stats.ventaMayor),
      icon: <TrendingUpIcon />,
      gradient: "linear-gradient(135deg,#6a1b9a,#ab47bc)",
    },
  ].map((card, i) => (
    <Box
      key={i}
      sx={{
        flex: {
          xs: "1 1 100%",   // 📱 1 por fila
          sm: "1 1 48%",    // 📱 2 por fila
          md: "1 1 23%",    // 💻 4 por fila
          lg: "1 1 15%",    // 🖥 5 por fila 👈
        },
      }}
    >
      <CardStat {...card} loading={loading} />
    </Box>
  ))}
</Box>
  );
};

export default StatsCards;