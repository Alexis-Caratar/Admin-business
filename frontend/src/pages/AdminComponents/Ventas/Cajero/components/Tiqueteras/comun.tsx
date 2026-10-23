// Piezas compartidas de tiqueteras en la caja: buscador y tarjeta con el saldo.
import React, { useEffect, useRef, useState } from "react";
import { Avatar, Box, Chip, CircularProgress, InputAdornment, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { GRADIENTES } from "../../../../../../components/pedidos/pedidosUtil";
import SearchIcon from "@mui/icons-material/Search";
import { apiBuscarTiqueteras, errorDe, type Tiquetera } from "../../../../../../api/tiqueteras";
import { cop, motivoNoUsable } from "./tiqueterasUtil";


export const TarjetaTiquetera: React.FC<{ t: Tiquetera; seleccionada?: boolean; necesarios?: number; onClick?: () => void }> = ({ t, seleccionada, necesarios = 0, onClick }) => {
  const motivo = motivoNoUsable(t);
  const corto = !motivo && necesarios > t.disponibles;
  const usable = !motivo && !corto;
  return (
    <Box
      onClick={usable ? onClick : undefined}
      sx={{
        p: 1.8, borderRadius: "18px", bgcolor: "#fff", cursor: usable && onClick ? "pointer" : "default", opacity: usable ? 1 : 0.6, transition: ".2s",
        border: seleccionada ? "2px solid #2563EB" : "1px solid rgba(15,23,42,.06)",
        boxShadow: seleccionada ? "0 0 0 3px rgba(37,99,235,.12)" : "0 8px 24px rgba(15,23,42,.05)",
        "&:hover": usable && onClick ? { transform: "translateY(-2px)" } : undefined,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar sx={{ width: 44, height: 44, background: motivo ? GRADIENTES.pizarra : GRADIENTES.violeta, boxShadow: "0 10px 20px rgba(0,0,0,.10)" }}><ConfirmationNumberIcon /></Avatar>
        <Box flex={1} minWidth={0}>
          <Typography fontWeight={800} color="#0F172A" noWrap>{t.cliente}</Typography>
          <Typography fontSize={12} color="#64748B" noWrap>{t.codigo} · {t.tipo} · CC {t.identificacion}</Typography>
        </Box>
        <Box textAlign="right">
          <Typography fontWeight={900} fontSize={22} lineHeight={1} color="#0F172A">{t.disponibles}</Typography>
          <Typography fontSize={11} color="#64748B">de {t.almuerzos_total}</Typography>
        </Box>
      </Stack>
      <LinearProgress variant="determinate" value={(t.consumidos / t.almuerzos_total) * 100} sx={{ my: 1.2, height: 6, borderRadius: 3, bgcolor: "#EDE9FE", "& .MuiLinearProgress-bar": { background: GRADIENTES.violeta } }} />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {motivo ? <Chip size="small" color="error" label={motivo} sx={{ fontWeight: 700 }} /> : corto ? <Chip size="small" color="warning" label={`Necesita ${necesarios}, le quedan ${t.disponibles}`} sx={{ fontWeight: 700 }} /> : <Chip size="small" color="success" label="Disponible" sx={{ fontWeight: 700 }} />}
        <Chip size="small" variant="outlined" label={`Almuerzo ${cop(t.valor_almuerzo)}`} />
        {t.fecha_vencimiento && !t.vencida && <Chip size="small" variant="outlined" label={`Vence ${t.fecha_vencimiento}`} />}
      </Stack>
    </Box>
  );
};

// Busca por nombre, documento, teléfono, código (TQ-…) o el enlace/QR del portal (un lector de QR "escribe" el enlace)
export const BuscadorTiqueteras: React.FC<{ inicial?: string; onResultados: (r: Tiquetera[]) => void; autoFocus?: boolean }> = ({ inicial = "", onResultados, autoFocus }) => {
  const [q, setQ] = useState(inicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turno = useRef(0);
  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) { onResultados([]); setError(null); return; }
    const n = ++turno.current;
    const id = setTimeout(async () => {
      setCargando(true);
      try { const r = await apiBuscarTiqueteras(texto); if (n === turno.current) { onResultados(r); setError(null); } }
      catch (e) { if (n === turno.current) setError(errorDe(e).mensaje); }
      finally { if (n === turno.current) setCargando(false); }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  return (
    <TextField
      fullWidth size="small" autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)}
      label="Buscar tiquetera" placeholder="Nombre, documento, teléfono, código o QR"
      error={!!error} helperText={error ?? " "}
      InputProps={{
        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
        endAdornment: cargando ? <InputAdornment position="end"><CircularProgress size={16} /></InputAdornment> : undefined,
      }}
    />
  );
};
