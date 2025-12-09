import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
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
  // -------------------------------------------
  // Filtrar ventas por fecha exacta
  // -------------------------------------------
  const ventasDelDia = useMemo(() => {
    return ventas.filter((v) => {
      if (!v.fecha) return false;
      const normal = v.fecha.includes("T") ? v.fecha.split("T")[0] : v.fecha;
      return normal === fecha;
    });
  }, [ventas, fecha]);

  // -------------------------------------------
  // Cálculo de estadísticas del día
  // -------------------------------------------
  const stats = useMemo(() => {
    if (!ventasDelDia.length) {
      return {
        cantidad: 0,
        totalDinero: 0,
        promedio: 0,
        ventaMayor: 0,
      };
    }

    const totalDinero = ventasDelDia.reduce(
      (sum, v) => sum + Number(v.total || 0),
      0
    );

    const ventaMayor = Math.max(
      ...ventasDelDia.map((v) => Number(v.total || 0))
    );

    return {
      cantidad: ventasDelDia.length,
      totalDinero,
      promedio: totalDinero / ventasDelDia.length,
      ventaMayor,
    };
  }, [ventasDelDia]);

  return (
    <Box>
      {/* ---------------------------------- */}
      {/* ESTADÍSTICAS */}
      {/* ---------------------------------- */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center" }} elevation={3}>
            <Typography variant="h6" fontWeight="bold">
              Ventas
            </Typography>
            <Typography variant="h4" color="primary">
              {stats.cantidad}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center" }} elevation={3}>
            <Typography variant="h6" fontWeight="bold">
              Total del día
            </Typography>
            <Typography variant="h4" color="success.main">
              ${stats.totalDinero}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center" }} elevation={3}>
            <Typography variant="h6" fontWeight="bold">
              Promedio
            </Typography>
            <Typography variant="h4" color="secondary">
              ${stats.promedio.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center" }} elevation={3}>
            <Typography variant="h6" fontWeight="bold">
              Venta mayor
            </Typography>
            <Typography variant="h4" color="error.main">
              ${stats.ventaMayor}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* ---------------------------------- */}
      {/* LISTADO DE VENTAS DEL DÍA */}
      {/* ---------------------------------- */}
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
