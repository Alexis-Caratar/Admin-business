// StatsCards.tsx

import React from "react";

import {
  Box,
  Paper,
  Typography,
  Skeleton,
  Stack,
  Avatar,
  Grid,
} from "@mui/material";

import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PaymentsIcon from "@mui/icons-material/Payments";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

interface Props {
  stats: {
    totalVentas: number;
    totalDinero: number;
    totalEgresos: number;
    utilidad: number;
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
  subtitle,
}: {
  title: string;
  value: string | number;
  loading: boolean;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 5,
      overflow: "hidden",
      position: "relative",
      background: "#fff",
      border: "1px solid #edf2f7",
      transition: "all .25s ease",

      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
      },
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
        background: gradient,
        opacity: 0.12,
      }}
    />

    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
    >
      <Box>
        <Typography
          fontSize={13}
          fontWeight={600}
          color="text.secondary"
        >
          {title}
        </Typography>

        {loading ? (
          <Skeleton
            variant="text"
            width={120}
            height={45}
          />
        ) : (
          <Typography
            fontSize={{
              xs: 24,
              md: 28,
            }}
            fontWeight={900}
            mt={1}
            lineHeight={1}
          >
            {value}
          </Typography>
        )}

        {subtitle && (
          <Typography
            fontSize={12}
            color="text.secondary"
            mt={1}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <Avatar
        sx={{
          width: 52,
          height: 52,
          background: gradient,
          boxShadow:
            "0 10px 20px rgba(0,0,0,0.15)",
        }}
      >
        {icon}
      </Avatar>
    </Stack>
  </Paper>
);

const StatsCards: React.FC<Props> = ({
  stats,
  loading,
}) => {
  const cards = [
    {
      title: "Ventas Totales",
      value: stats.totalVentas,
      subtitle: "Cantidad de ventas realizadas",
      icon: <ShoppingCartIcon />,
      gradient:
        "linear-gradient(135deg,#2563eb,#60a5fa)",
    },

    {
      title: "Ingresos",
      value: formatCOP(stats.totalDinero),
      subtitle: "Dinero generado",
      icon: <PaymentsIcon />,
      gradient:
        "linear-gradient(135deg,#16a34a,#4ade80)",
    },

    {
      title: "Egresos",
      value: formatCOP(stats.totalEgresos),
      subtitle: "Gastos registrados",
      icon: <AccountBalanceWalletIcon />,
      gradient:
        "linear-gradient(135deg,#dc2626,#f87171)",
    },

    {
      title: "Utilidad",
      value: formatCOP(stats.utilidad),
      subtitle: "Ganancia neta",
      icon: <PointOfSaleIcon />,
      gradient:
        "linear-gradient(135deg,#7c3aed,#a78bfa)",
    },

    {
      title: "Venta Más Alta",
      value: formatCOP(stats.ventaMayor),
      subtitle: "Mayor venta registrada",
      icon: <TrendingUpIcon />,
      gradient:
        "linear-gradient(135deg,#ea580c,#fb923c)",
    },
  ];

  return (
    <Grid
      container
      spacing={2.5}
      mb={3}
    >
      {cards.map((card, index) => (
      <Box
  key={index}
  sx={{
    flex: {
      xs: "1 1 100%",
      sm: "1 1 calc(50% - 16px)",
      md: "1 1 calc(33.33% - 16px)",
      lg: "1 1 calc(20% - 16px)",
    },
    minWidth: 220,
  }}
>
  <CardStat
    {...card}
    loading={loading}
  />
</Box>
      ))}
    </Grid>
  );
};

export default StatsCards;