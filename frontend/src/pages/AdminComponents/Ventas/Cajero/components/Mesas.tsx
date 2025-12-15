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
  mesaSeleccionada?: Mesa | null;
  onSelect: (m: Mesa) => void;
};

export const Mesas: React.FC<Props> = ({
  mesas,
  mesaSeleccionada,
  onSelect,
}) => {
  const getEstadoConfig = (estado: Mesa["estado"]) => {
    switch (estado) {
      case "Disponible":
        return {
          icon: <CheckCircleIcon />,
          iconBg: "#2e7d32",
          chipColor: "success" as const,
          clickable: true,
        };
      case "Ocupada":
        return {
          icon: <RestaurantIcon />,
          iconBg: "#c62828",
          chipColor: "error" as const,
          clickable: false,
        };
      case "Reservada":
        return {
          icon: <EventSeatIcon />,
          iconBg: "#ef6c00",
          chipColor: "warning" as const,
          clickable: false,
        };
    }
  };

  return (
    <Box width="100%">
      <Typography
        fontWeight={700}
        mb={2}
        sx={{ fontSize: { xs: 16, md: 22 } }}
      >
        Mesas del Restaurante
      </Typography>

      <Grid container spacing={2}>
        {mesas.map((mesa) => {
          const config = getEstadoConfig(mesa.estado);
          const isSelected = mesaSeleccionada?.id === mesa.id;

          return (
            <Grid item xs={6} sm={4} md={3} lg={2} key={mesa.id}>
              <Card
                onClick={() => {
                  if (config.clickable) {
                    onSelect(mesa);
                  }
                }}
                sx={{
                  position: "relative",
                  p: 2,
                  borderRadius: 3,
                  minHeight: 130,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",

                  cursor: config.clickable ? "pointer" : "not-allowed",
                  opacity: config.clickable ? 1 : 0.55,

                  border: isSelected
                    ? "2px solid"
                    : "1px solid transparent",
                  borderColor: isSelected
                    ? "primary.main"
                    : "transparent",

                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(25,118,210,.25)"
                    : "0 6px 18px rgba(0,0,0,0.08)",

                  transition: "all .25s ease",

                  "&:hover": {
                    transform:
                      config.clickable && !isSelected
                        ? { xs: "none", md: "translateY(-6px)" }
                        : "none",
                    boxShadow:
                      config.clickable && !isSelected
                        ? "0 10px 28px rgba(0,0,0,0.15)"
                        : undefined,
                  },
                }}
              >
                {/* Icono circular */}
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: config.iconBg,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                    boxShadow: "0 4px 12px rgba(0,0,0,.25)",
                  }}
                >
                  {config.icon}
                </Box>

                <Typography fontWeight={700} fontSize={14} noWrap>
                  {mesa.nombre}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Capacidad · {mesa.capacidad}
                </Typography>

                <Chip
                  label={mesa.estado}
                  color={config.chipColor}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    textTransform: "capitalize",
                    px: 1,
                  }}
                />

                {isSelected && (
                  <Chip
                    label="Seleccionada"
                    color="primary"
                    size="small"
                    sx={{ mt: 1, fontWeight: 700 }}
                  />
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
