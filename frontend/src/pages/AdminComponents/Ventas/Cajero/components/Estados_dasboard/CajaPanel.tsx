import { Stack, Collapse, Grid } from "@mui/material";
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
        <Grid container spacing={2}>

          {/* Estado caja */}
          <Grid item xs={12} md={4}>
            <CajaEstado cajaAbierta={cajaAbierta} />
          </Grid>

          {/* Métricas */}
          <Grid item xs={12} md={8}>
            <CajaMetricas
              caja={caja}
              formatCOP={formatCOP}
              onVentas={onVentas}
              onEgresos={onEgresos}
              onArqueo={onArqueo}
              onCerrar={onCerrar}
            />
          </Grid>

        </Grid>
      </Collapse>
    </Stack>
  );
}