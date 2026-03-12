import { Stack, Collapse, Box } from "@mui/material";
import CajaEstado from "./CajaEstado";
import CajaMetricas from "./CajaMetricas";

export default function CajaPanel({
  showStats,
  cajaAbierta,
  caja,
  formatCOP,
  onVentas,
  onEgresos,
  onArqueo,
  onCerrar
}: any) {
  return (
   <Stack spacing={2}>
  <Collapse in={showStats} timeout="auto" unmountOnExit>
    <Box display="flex" flexWrap="wrap" gap={2}>
      
      {/* Estado caja */}
      <Box flex="1 1 300px">
        <CajaEstado cajaAbierta={cajaAbierta} />
      </Box>

      {/* Métricas */}
      <Box flex="1 1 600px">
        <CajaMetricas
          caja={caja}
          formatCOP={formatCOP}
          onVentas={onVentas}
          onEgresos={onEgresos}
          onArqueo={onArqueo}
          onCerrar={onCerrar}
        />
      </Box>

    </Box>
  </Collapse>
</Stack>
  );
}