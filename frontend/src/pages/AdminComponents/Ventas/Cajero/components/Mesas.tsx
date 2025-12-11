import React from "react";
import { Grid, Card, Typography, Box, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import EventSeatIcon from "@mui/icons-material/EventSeat";

type Mesa = { id: number; numero: number; estado: string };

type Props = {
  mesas: Mesa[];
  onSelect: (m: Mesa) => void;
};

export const Mesas: React.FC<Props> = ({ mesas, onSelect }) => {
  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case "Disponible":
        return {
          icon: <CheckCircleIcon sx={{ fontSize: 32, color: "#2e7d32" }} />,
          bg: "#e8f5e9",
          chip: "success",
        };

      case "Ocupada":
        return {
          icon: <RestaurantIcon sx={{ fontSize: 32, color: "#c62828" }} />,
          bg: "#ffebee",
          chip: "error",
        };

      case "Reservada":
        return {
          icon: <EventSeatIcon sx={{ fontSize: 32, color: "#ef6c00" }} />,
          bg: "#fff3e0",
          chip: "warning",
        };

      default:
        return {
          icon: null,
          bg: "#eeeeee",
          chip: "default",
        };
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Mesas del Restaurante
      </Typography>

      <Grid container spacing={2}>
        {mesas.map((mesa) => {
          const config = getEstadoConfig(mesa.estado);

          return (
            <Grid item xs={8} sm={6} md={5} lg={4} key={mesa.id}>
              <Card
                onClick={() => onSelect(mesa)}
                sx={{
                  p: 1,
                  textAlign: "center",
                  borderRadius: 4,
                  cursor: "pointer",
                  height: 80,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  background: config.bg,
                  boxShadow: 2,
                  transition: "0.25s ease",
                  "&:hover": {
                    transform: "translateY(-5px) scale(1.03)",
                    boxShadow: 6,
                  },
                }}
              >
                <Box mb={1}>{config.icon}</Box>

                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: 13 }}>
                  Mesa {mesa.numero}
                </Typography>

                <Chip
                  label={mesa.estado}
                  color={config.chip}
                  size="small"
                  sx={{
                    mt: 1,
                    fontWeight: 500,
                    textTransform: "capitalize",
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
