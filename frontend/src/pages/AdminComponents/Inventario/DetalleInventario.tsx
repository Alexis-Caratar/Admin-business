import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Stack,
  Divider,
  CircularProgress,
  Tooltip,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InventoryIcon from "@mui/icons-material/Inventory";
import DevicesIcon from "@mui/icons-material/Devices";
import CategoryIcon from "@mui/icons-material/Category";

import { motion } from "framer-motion";

import { getInventarioById } from "../../../api/inventarios";
import type { InventarioConDetalles } from "../../../types/inventario";

interface Props {
  id: number;
  onBack: () => void;
}

const InventarioDetalles: React.FC<Props> = ({ id, onBack }) => {
  const [data, setData] = useState<InventarioConDetalles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargar();
  }, [id]);

  const cargar = async () => {
    setLoading(true);
    const detalle = await getInventarioById(id);
    setData(detalle);
    setLoading(false);
  };

  /** Return Professional Icon */
  const iconoTipo = (tipo: string) => {
  const style = { sx: { fontSize: 42, color: "#0D47A1" } };

  if (tipo === "PRODUCTOS") return <CategoryIcon {...style} />;
  if (tipo === "ACTIVOS") return <DevicesIcon {...style} />;

  return <InventoryIcon {...style} />;
};

  if (loading)
    return (
      <Box textAlign="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  if (!data) return <Typography>Error cargando inventario...</Typography>;

  const { inventario, detalles } = data;

  const totales = {
    coinciden: detalles.filter((d) => Number(d.diferencia) === 0).length,
    sobrantes: detalles.filter((d) => Number(d.diferencia) > 0).length,
    faltantes: detalles.filter((d) => Number(d.diferencia) < 0).length,
  };

  return (
    <Box p={2}>
      {/* BOTÓN VOLVER */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mb: 2, fontWeight: "bold" }}
      >
        Volver
      </Button>

      {/* ENCABEZADO */}
      <Card
        sx={{
          borderRadius: 4,
          mb: 3,
          p: 2,
          background: "linear-gradient(135deg, #E3F2FD, #FFFFFF)",
          boxShadow: 3,
        }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            {iconoTipo(inventario.tipo)}

            <Box>
              <Typography variant="body1" fontWeight="bold">
                {inventario.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(inventario.fecha).toLocaleString()}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* TARJETAS DE TOTALES */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Coincidencias", value: totales.coinciden, color: "success" },
          { label: "Sobrantes", value: totales.sobrantes, color: "info" },
          { label: "Faltantes", value: totales.faltantes, color: "error" },
        ].map((item) => (
          <Grid item xs={12} md={4} key={item.label}>
            <Card
              sx={{
                borderRadius: 4,
                p: 2,
                textAlign: "center",
                boxShadow: 2,
              }}
            >
              <Typography variant="caption">{item.label}</Typography>
              <Typography variant="h4" color={item.color}>
                {item.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 2 }} />

      {/* LISTA DETALLES */}
      <Typography variant="h6" mb={2} fontWeight="bold">
        Detalles del Inventario
      </Typography>

      {detalles.length === 0 ? (
        <Typography>No existen registros.</Typography>
      ) : (
        detalles.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 4,
                boxShadow: 3,
                bgcolor: "#F8FBFF",
                borderLeft: "6px solid #0D47A1",
              }}
            >
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {item.nombre}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {item.descripcion}
                  </Typography>

                  <Box mt={1}>
                    <Chip
                      label={`Código: ${item.codigo}`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`U.M: ${item.unidad_medida}`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                </Box>

                {/* Cantidades */}
                <Stack spacing={1} textAlign="right">
                  <Chip label={`Sistema: ${item.cantidad_sistema}`} />
                  <Chip label={`Físico: ${item.cantidad_fisica}`} />
                  <Chip
                    label={`Dif: ${item.diferencia}`}
                    color={
                      Number(item.diferencia) === 0
                        ? "success"
                        : Number(item.diferencia) > 0
                        ? "info"
                        : "error"
                    }
                  />
                </Stack>
              </Stack>

              {item.observacion && (
                <Box mt={1}>
                  <Tooltip title="Observación">
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#0D47A1",
                        fontStyle: "italic",
                        mt: 1,
                      }}
                    >
                      📝 {item.observacion}
                    </Typography>
                  </Tooltip>
                </Box>
              )}
            </Card>
          </motion.div>
        ))
      )}
    </Box>
  );
};

export default InventarioDetalles;
