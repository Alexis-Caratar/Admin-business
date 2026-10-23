// Comandas de los meseros pendientes de cobro, en la caja (en vivo).
import { useEffect, useState } from "react";
import { Alert, Avatar, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import { Encabezado } from "../pedidos/DisenoPedidos";
import { GRADIENTES, sxBotonPrincipal } from "../pedidos/pedidosUtil";
import { apiComanda, ESTADO_COMANDA, ESTADO_IMPRESION, type ComandaDetalle, type ComandaResumen } from "../../api/comandas";

const hora = (f: string) => new Date(f).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const cop = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;

function Detalle({ id, recarga }: { id: number; recarga: number }) {
  const [c, setC] = useState<ComandaDetalle | null>(null);
  useEffect(() => { apiComanda(id).then(setC).catch(() => setC(null)); }, [id, recarga]);
  if (!c) return <CircularProgress size={18} />;
  return (
    <Box sx={{ mt: 1 }}>
      {c.items.map((i) => (
        <Typography key={i.id} fontSize={13}>
          {i.cantidad}× {i.nombre}{i.tanda > 1 ? ` (adición ${i.tanda - 1})` : ""}{i.nota ? ` — ${i.nota}` : ""}
        </Typography>
      ))}
      {c.nota && <Typography fontSize={13} color="text.secondary" mt={0.5}>Nota: {c.nota}</Typography>}
    </Box>
  );
}

export default function PanelComandasCaja({ comandas, error, recarga, onCobrar, onCerrar }: {
  comandas: ComandaResumen[]; error: string | null; recarga: number; onCobrar: (c: ComandaResumen) => void; onCerrar: () => void;
}) {
  const [abierta, setAbierta] = useState<number | null>(null);
  return (
    <Stack spacing={2}>
      <Encabezado icono={<RoomServiceIcon />} color="azul" titulo="Comandas de meseros"
        subtitulo="Pendientes de cobro. Se actualizan solas; si se pierde la conexión, se recuperan al reconectar." onCerrar={onCerrar} />
      {error && <Alert severity="error">{error}</Alert>}
      {!comandas.length && <Box sx={{ p: 4, textAlign: "center", borderRadius: "22px", bgcolor: "#fff", border: "1px dashed #CBD5E1" }}><Typography color="#64748B">No hay comandas pendientes.</Typography></Box>}
      {comandas.map((c) => (
        <Box key={c.id} sx={{ p: 2, borderRadius: "22px", bgcolor: "#fff", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 8px 24px rgba(15,23,42,.05)" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flex={1} onClick={() => setAbierta(abierta === c.id ? null : c.id)} sx={{ cursor: "pointer", minWidth: 0 }}>
              <Avatar sx={{ width: 46, height: 46, background: c.estado === "EN_COBRO" ? GRADIENTES.violeta : GRADIENTES.ambar, boxShadow: "0 10px 20px rgba(0,0,0,.10)" }}><TableRestaurantIcon /></Avatar>
              <Box minWidth={0}>
                <Typography fontWeight={800} color="#0F172A">#{c.numero} · {c.mesa} · {cop(c.total)}</Typography>
                <Typography fontSize={12.5} color="#64748B">{c.mesero} · {hora(c.created_at)} · {c.unidades} producto(s){c.tandas > 1 ? ` · ${c.tandas - 1} adición(es)` : ""}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip size="small" color={ESTADO_COMANDA[c.estado].color} label={ESTADO_COMANDA[c.estado].texto} sx={{ fontWeight: 700 }} />
              {c.impresion && c.impresion !== "CONFIRMADA" && <Chip size="small" variant="outlined" color={ESTADO_IMPRESION[c.impresion].color} label={ESTADO_IMPRESION[c.impresion].texto} />}
              <Button variant="contained" onClick={() => onCobrar(c)} sx={{ ...sxBotonPrincipal, height: 36 }}>
                {c.estado === "EN_COBRO" ? "Ir al cobro" : "Cobrar"}
              </Button>
            </Stack>
          </Stack>
          {abierta === c.id && <Detalle id={c.id} recarga={recarga} />}
        </Box>
      ))}
    </Stack>
  );
}
