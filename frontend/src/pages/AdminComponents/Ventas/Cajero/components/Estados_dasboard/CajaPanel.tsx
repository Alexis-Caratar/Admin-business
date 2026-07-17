import { Stack, Collapse, Box } from "@mui/material";
import CajaMetricas from "./CajaMetricas";

export default function CajaPanel({
  showStats,
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
      
      {/* Métricas */}
      <Box flex="1 1 900px">
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