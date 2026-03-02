import React, { useState } from "react";
import {
  Grid,
  Card,
  Typography,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CloseIcon from "@mui/icons-material/Close";
import type { Mesa } from "./../../../../../types/cajero";

type Props = {
  mesas: Mesa[];
  onSelect?: (m: Mesa | null) => void; // opcional
};

export const Mesas: React.FC<Props> = ({ mesas, onSelect }) => {
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [mesaOrden, setMesaOrden] = useState<Mesa | null>(null);
  const [openOrden, setOpenOrden] = useState(false);

  const getEstadoConfig = (estado: Mesa["estado"]) => {
    switch (estado) {
      case "Disponible":
        return {
          chipColor: "success" as const,
          iconBg: "#2e7d32",
          icon: <CheckCircleIcon />,
        };
      case "Ocupada":
        return {
          chipColor: "error" as const,
          iconBg: "#c62828",
          icon: <RestaurantIcon />,
        };
      case "Reservada":
        return {
          chipColor: "warning" as const,
          iconBg: "#ef6c00",
          icon: <EventSeatIcon />,
        };
    }
  };

  const handleClickMesa = (mesa: Mesa) => {
    // 🟢 DISPONIBLE → SELECCIONAR
    if (mesa.estado === "Disponible") {
      setMesaSeleccionada((prev) =>
        prev?.id === mesa.id ? null : mesa
      );
      onSelect?.(mesa);
      return;
    }

    // 🔴 OCUPADA / RESERVADA → VER ORDEN
    setMesaOrden(mesa);
    setOpenOrden(true);
  };

  return (
    <Box width="100%">
      <Typography fontWeight={700} mb={1} sx={{ fontSize: { xs: 16, md: 22 } }}>
        Mesas del Restaurante
      </Typography>

      <Grid container spacing={2}>
        {mesas.map((mesa) => {
          const config = getEstadoConfig(mesa.estado);
          const isSelected = mesaSeleccionada?.id === mesa.id;

          return (
            <Grid
              item
              key={mesa.id}
              sx={{
                flexBasis: "18%",
                maxWidth: "18%",

                "@media (max-width:1200px)": {
                  flexBasis: "25%",
                  maxWidth: "25%",
                },
                "@media (max-width:900px)": {
                  flexBasis: "33.333%",
                  maxWidth: "33.333%",
                },
                "@media (max-width:600px)": {
                  flexBasis: "50%",
                  maxWidth: "50%",
                },
              }}
            >

              <Card
                onClick={() => handleClickMesa(mesa)}
                sx={{
                  position: "relative",
                  p: 2,
                  borderRadius: 4,
                  minHeight: 160,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",

                  background: isSelected
                    ? "linear-gradient(135deg, rgba(25,118,210,.08), rgba(25,118,210,.02))"
                    : "#fff",

                  border: isSelected ? "2px solid" : "1px solid rgba(0,0,0,0.08)",
                  borderColor: isSelected ? "primary.main" : "rgba(0,0,0,0.08)",

                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(25,118,210,.25)"
                    : "0 10px 25px rgba(0,0,0,0.08)",

                  transition: "all .25s ease",
                  "&:hover": {
                    transform: { xs: "none", md: "translateY(-6px)" },
                    boxShadow: "0 14px 30px rgba(0,0,0,0.15)",
                  },
                }}
              >
                {/* ===== ESTADO (TOP RIGHT) ===== */}
                <Chip
                  label={mesa.estado}
                  color={config.chipColor}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    fontWeight: 700,
                    height: 24,
                    px: 1.2,
                    borderRadius: 2,
                    boxShadow: "0 2px 6px rgba(0,0,0,.2)",
                  }}
                />

                {/* ===== ICONO ===== */}
                <Box
                  sx={{
                    mt:4,
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${config.iconBg})`,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1.5,
                    boxShadow: "0 6px 14px rgba(0,0,0,.25)",
                  }}
                >
                  {config.icon}
                </Box>

                {/* ===== INFO ===== */}
                <Box textAlign="center">
                  <Typography fontWeight={800} fontSize={14} noWrap>
                    {mesa.nombre}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Capacidad · {mesa.capacidad} pers
                  </Typography>
                </Box>

                {/* ===== ESPACIADOR ===== */}
                <Box flexGrow={1} />

                {/* ===== SELECCIONADA (ABAJO) ===== */}
                {isSelected && (
                  <Chip
                    label="Seleccionada"
                    color="primary"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      borderRadius: 2,
                      mb: 0.5,
                    }}
                  />
                )}
              </Card>
            </Grid>

          );
        })}
      </Grid>

      {/* ================= MODAL ORDEN ================= */}
      <Dialog
        open={openOrden}
        onClose={() => setOpenOrden(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Orden de {mesaOrden?.nombre}
          <IconButton
            onClick={() => setOpenOrden(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Typography fontWeight={600} mb={1}>
            Estado: {mesaOrden?.estado}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* 🔥 Aquí conectas ventas + ventas_items */}
          <Typography color="text.secondary">
            Aquí se mostrarán los detalles de la factura activa de esta mesa.
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
