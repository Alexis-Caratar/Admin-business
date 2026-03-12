import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

import type { Venta } from "../../../types/ventas";

interface Props {
  ventas: Venta[];
  fecha: string;
}

const VentasDelDia: React.FC<Props> = ({ ventas, fecha }) => {
  const ventasDelDia = useMemo(() => {
    return ventas.filter((v) => {
      if (!v.fecha) return false;
      const normal = v.fecha.includes("T") ? v.fecha.split("T")[0] : v.fecha;
      return normal === fecha;
    });
  }, [ventas, fecha]);

  const stats = useMemo(() => {
    if (!ventasDelDia.length) {
      return { cantidad: 0, totalDinero: 0, promedio: 0, ventaMayor: 0 };
    }

    const totalDinero = ventasDelDia.reduce(
      (sum, v) => sum + Number(v.total || 0),
      0
    );
    const ventaMayor = Math.max(...ventasDelDia.map((v) => Number(v.total || 0)));

    return {
      cantidad: ventasDelDia.length,
      totalDinero,
      promedio: totalDinero / ventasDelDia.length,
      ventaMayor,
    };
  }, [ventasDelDia]);

  // Array de estadísticas para map
  const statsArray = [
    { label: "Ventas", value: stats.cantidad, color: "primary" },
    { label: "Total del día", value: `$${stats.totalDinero}`, color: "success.main" },
    { label: "Promedio", value: `$${stats.promedio.toFixed(2)}`, color: "secondary" },
    { label: "Venta mayor", value: `$${stats.ventaMayor}`, color: "error.main" },
  ];

  return (
    <Box>
      {/* Estadísticas */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        {statsArray.map((stat, idx) => (
          <Box
            key={idx}
            sx={{
              flex: "1 1 200px", // ocupa igual espacio, mínimo 200px
            }}
          >
            <Paper sx={{ p: 2, textAlign: "center" }} elevation={3}>
              <Typography variant="h6" fontWeight="bold">{stat.label}</Typography>
              <Typography variant="h4" color={stat.color}>{stat.value}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Listado de ventas */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Detalle de ventas del día
      </Typography>

      {!ventasDelDia.length ? (
        <Typography color="text.secondary">No hay ventas este día.</Typography>
      ) : (
        <List>
          {ventasDelDia.map((v) => (
            <Paper key={v.id} sx={{ mb: 2, p: 2 }} elevation={2}>
              <ListItem>
                <ListItemText
                  primary={`Venta #${v.id}`}
                  secondary={`Método: ${v.metodo_pago || "N/A"}`}
                />
                <Chip
                  label={`$${v.total}`}
                  color="primary"
                  sx={{ fontSize: "1rem", fontWeight: "bold" }}
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
};

export default VentasDelDia;