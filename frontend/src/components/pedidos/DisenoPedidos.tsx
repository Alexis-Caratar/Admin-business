/*
 * Piezas visuales de Pedidos con el diseño del proyecto (mismas medidas,
 * colores y sombras que Egresos y CajaMetricas del cajero).
 */
import type { ReactNode } from "react";
import { Avatar, Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { GRADIENTES } from "./pedidosUtil";
import type { Gradiente } from "./pedidosUtil";

// Fondo suave del ícono de cabecera por color (como Egresos)
const SUAVE: Record<Gradiente, { fondo: string; borde: string; color: string; sombra: string }> = {
  azul: { fondo: "linear-gradient(135deg,#DBEAFE,#BFDBFE)", borde: "#93C5FD", color: "#2563EB", sombra: "rgba(37,99,235,.12)" },
  verde: { fondo: "linear-gradient(135deg,#DCFCE7,#BBF7D0)", borde: "#86EFAC", color: "#16A34A", sombra: "rgba(22,163,74,.12)" },
  rojo: { fondo: "linear-gradient(135deg,#FEE2E2,#FECACA)", borde: "#FCA5A5", color: "#DC2626", sombra: "rgba(220,38,38,.12)" },
  ambar: { fondo: "linear-gradient(135deg,#FEF3C7,#FDE68A)", borde: "#FCD34D", color: "#D97706", sombra: "rgba(217,119,6,.12)" },
  violeta: { fondo: "linear-gradient(135deg,#EDE9FE,#DDD6FE)", borde: "#C4B5FD", color: "#7C3AED", sombra: "rgba(124,58,237,.12)" },
  pizarra: { fondo: "linear-gradient(135deg,#F1F5F9,#E2E8F0)", borde: "#CBD5E1", color: "#0F172A", sombra: "rgba(15,23,42,.10)" },
};

/** Cabecera: ícono en recuadro, título, subtítulo, acciones y cierre opcional */
export function Encabezado({ icono, color = "azul", titulo, subtitulo, acciones, onCerrar }: {
  icono: ReactNode; color?: Gradiente; titulo: ReactNode; subtitulo?: ReactNode; acciones?: ReactNode; onCerrar?: () => void;
}) {
  const s = SUAVE[color];
  return (
    <Box sx={{ mb: 3, pb: 2.5, borderBottom: "1px solid #E2E8F0", display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
        <Avatar sx={{ width: { xs: 50, md: 58 }, height: { xs: 50, md: 58 }, borderRadius: 3, background: s.fondo, border: `1px solid ${s.borde}`, boxShadow: `0 8px 20px ${s.sombra}`, color: s.color, "& svg": { fontSize: { xs: 24, md: 28 } } }}>
          {icono}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="div" sx={{ fontWeight: 700, fontSize: { xs: 16, md: 24 }, color: "#0F172A", lineHeight: 1.1 }}>{titulo}</Typography>
          {subtitulo && <Typography component="div" sx={{ mt: 0.4, fontSize: { xs: 12, md: 14 }, color: "#64748B" }}>{subtitulo}</Typography>}
        </Box>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" justifyContent="flex-end">
        {acciones}
        {onCerrar && (
          <IconButton onClick={onCerrar} aria-label="Cerrar"
            sx={{ bgcolor: "#FFFFFF", color: "#64748B", border: "1px solid #E2E8F0", transition: ".25s", "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A", transform: "rotate(90deg)" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Box>
  );
}

/** Indicador (igual a CardStat de CajaMetricas). Con onClick funciona como filtro */
export function TarjetaIndicador({ titulo, valor, subtitulo, icono, color = "azul", onClick, activo = false }: {
  titulo: string; valor: ReactNode; subtitulo?: ReactNode; icono: ReactNode; color?: Gradiente; onClick?: () => void; activo?: boolean;
}) {
  const g = GRADIENTES[color];
  return (
    <Paper elevation={0} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}
      sx={{
        position: "relative", overflow: "hidden", p: 2, borderRadius: "22px", background: "#fff",
        cursor: onClick ? "pointer" : "default",
        border: activo ? `2px solid ${SUAVE[color].color}` : "1px solid rgba(15,23,42,0.06)",
        boxShadow: "0 8px 24px rgba(15,23,42,.05)", transition: ".25s",
        "&:hover": onClick ? { transform: "translateY(-4px)", boxShadow: "0 15px 35px rgba(15,23,42,.10)" } : undefined,
      }}>
      <Box sx={{ position: "absolute", top: -40, right: -40, width: 110, height: 110, borderRadius: "50%", background: g, opacity: 0.12 }} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1} sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>{titulo}</Typography>
          <Typography component="div" sx={{ mt: 0.5, fontWeight: 900, fontSize: 18, color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{valor}</Typography>
          {subtitulo && <Typography component="div" sx={{ mt: 0.5, fontSize: 11, color: "#94A3B8" }}>{subtitulo}</Typography>}
        </Box>
        <Avatar sx={{ width: 46, height: 46, background: g, boxShadow: "0 10px 20px rgba(0,0,0,.10)", "& svg": { fontSize: 22 } }}>{icono}</Avatar>
      </Stack>
    </Paper>
  );
}

/** Tarjeta de sección blanca con título e ícono (como "Información General") */
export function Seccion({ titulo, icono, accion, children, sx }: { titulo?: string; icono?: ReactNode; accion?: ReactNode; children: ReactNode; sx?: object }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: "22px", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 8px 24px rgba(15,23,42,.05)", background: "#fff", ...sx }}>
      {titulo && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          {icono && <Box sx={{ color: "#2563EB", display: "flex", "& svg": { fontSize: 20 } }}>{icono}</Box>}
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#0F172A", flex: 1 }}>{titulo}</Typography>
          {accion}
        </Stack>
      )}
      {children}
    </Paper>
  );
}
