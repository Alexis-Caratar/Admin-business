// StatsCards.tsx

import React from "react";

import {
  Box,
  Paper,
  Typography,
  Skeleton,
  Stack,
  Avatar,
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
      position: "relative",
      overflow: "hidden",
      p: 2,
      borderRadius: "22px",
      background: "#fff",
      border: "1px solid rgba(15,23,42,0.06)",
      boxShadow:
        "0 8px 24px rgba(15,23,42,0.05)",

      transition: "all .25s ease",
      minHeight: "unset",
      "&:hover": {
        transform: "translateY(-3px)",
        boxShadow:
          "0 14px 35px rgba(15,23,42,0.09)",
      },
    }}
  >
    {/* DECORACION */}
    <Box
      sx={{
        position: "absolute",
        top: -35,
        right: -35,
        width: 100,

        borderRadius: "50%",
        background: gradient,
        opacity: 0.12,
      }}
    />

    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={1.5}
      sx={{
        position: "relative",
        zIndex: 2,
      }}
    >
      {/* INFO */}
      <Box flex={1} minWidth={0}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",

          }}
        >
          {title}
        </Typography>

        {loading ? (
          <Skeleton
            variant="text"
            width={90}
            height={35}
          />
        ) : (
          <Typography
            sx={{
              fontSize: {
                xs: 14,
                sm: 16,
              },
              fontWeight: 900,
              lineHeight: 1,
              color: "#0f172a",
              wordBreak: "break-word",
            }}
          >
            {value}
          </Typography>
        )}

        {subtitle && (
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 11,
              color: "#94a3b8",
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* ICON */}
      <Avatar
        sx={{
          width: 42,
          height: 42,
          background: gradient,

          boxShadow:
            "0 10px 20px rgba(0,0,0,0.10)",

          "& svg": {
            fontSize: 20,
          },
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
      title: "Ventas",
      value: stats.totalVentas,
      subtitle: "Total realizadas",
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
      subtitle: "Gastos",
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
      title: "Venta Alta",
      value: formatCOP(stats.ventaMayor),
      subtitle: "Mayor venta",
      icon: <TrendingUpIcon />,
      gradient:
        "linear-gradient(135deg,#ea580c,#fb923c)",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        mb: 2,
      }}
    >
      {cards.map((card, index) => (
        <Box
          key={index}
          sx={{
            flex: {
              xs: "1 1 100%",
              sm: "1 1 calc(50% - 8px)",
              md: "1 1 calc(33.33% - 12px)",
              lg: "1 1 calc(20% - 13px)",
            },

            minWidth: 0,
          }}
        >
          <CardStat
            {...card}
            loading={loading}
          />
        </Box>
      ))}
    </Box>
  );
};

export default StatsCards;