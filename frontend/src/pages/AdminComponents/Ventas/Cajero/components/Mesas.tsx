import React from "react";
import { Grid, Card, Typography, Box, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import EventSeatIcon from "@mui/icons-material/EventSeat";

export interface Mesa {
  id: number;
  nombre: string;
  capacidad: number;
  estado: "Disponible" | "Ocupada" | "Reservada";
}

type Props = {
  mesas: Mesa[];
  onSelect: (m: Mesa) => void;
};

export const Mesas: React.FC<Props> = ({ mesas, onSelect }) => {

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case "Disponible":
        return {
          icon: <CheckCircleIcon sx={{ fontSize: 36, color: "#2e7d32" }} />,
          bg: "linear-gradient(145deg, #e8f5e9, #d0efd0)",
          chipColor: "success" as const,
        };
      case "Ocupada":
        return {
          icon: <RestaurantIcon sx={{ fontSize: 36, color: "#c62828" }} />,
          bg: "linear-gradient(145deg, #ffebee, #f5c5c5)",
          chipColor: "error" as const,
        };
      case "Reservada":
        return {
          icon: <EventSeatIcon sx={{ fontSize: 36, color: "#ef6c00" }} />,
          bg: "linear-gradient(145deg, #fff3e0, #ffe0b2)",
          chipColor: "warning" as const,
        };
      default:
        return {
          icon: null,
          bg: "#eeeeee",
          chipColor: "default" as const,
        };
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="h6"
        fontWeight="bold"
        mb={2}
        sx={{ fontSize: { xs: 16, md: 22 } }}
      >
        Mesas del Restaurante
      </Typography>

      <Grid container spacing={3}>
        {mesas.map((mesa) => {
          const config = getEstadoConfig(mesa.estado);

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={mesa.id}>
              <Card
                onClick={() => onSelect(mesa)}
                sx={{
                  p: 2,
                  textAlign: "center",
                  borderRadius: 3,
                  cursor: "pointer",
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  background: config.bg,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  },
                }}
              >
                <Box mb={1}>{config.icon}</Box>

                <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: 15 }}>
                  {mesa.nombre}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Capacidad: {mesa.capacidad}
                </Typography>

                <Chip
                  label={mesa.estado}
                  color={config.chipColor}
                  size="small"
                  sx={{
                    mt: 1.5,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                />
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
