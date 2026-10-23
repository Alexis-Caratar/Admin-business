// Editor de pago dividido: p. ej. 10.000 por Nequi y 14.000 en efectivo.
// Al escribir un valor, el último medio se completa con lo que falta.
import { Box, Button, Chip, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import { estadoPago, MEDIOS_DIVIDIDO, type LineaPago } from "./pagoDivididoUtil";

const cop = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;
const numero = (v: string) => { const raw = v.replace(/\D/g, ""); return raw === "" ? "" : Number(raw); };

export default function PagoDividido({ total, lineas, onChange }: { total: number; lineas: LineaPago[]; onChange: (l: LineaPago[]) => void }) {
  const e = estadoPago(lineas, total);
  const cambiar = (k: number, cambio: Partial<LineaPago>) => {
    let n = lineas.map((l, i) => (i === k ? { ...l, ...cambio } : l));
    // Completar el último medio con lo que falta (si se editó otro valor)
    if ("monto" in cambio && k !== n.length - 1) {
      const otros = n.slice(0, -1).reduce((a, l) => a + (Number(l.monto) || 0), 0);
      const resto = Math.round(total - otros);
      n = n.map((l, i) => (i === n.length - 1 ? { ...l, monto: resto > 0 ? resto : "" } : l));
    }
    onChange(n);
  };
  const iguales = () => {
    const parte = Math.floor(total / lineas.length / 100) * 100;
    onChange(lineas.map((l, i) => ({ ...l, monto: i === lineas.length - 1 ? Math.round(total - parte * (lineas.length - 1)) : parte })));
  };
  const usados = new Set(lineas.map((l) => l.metodo_pago));
  const agregar = () => {
    const libre = MEDIOS_DIVIDIDO.find(([v]) => !usados.has(v))?.[0] ?? "EFECTIVO";
    onChange([...lineas, { metodo_pago: libre, monto: e.falta > 0 ? e.falta : "", monto_recibido: "" }]);
  };

  return (
    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "16px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <CallSplitIcon sx={{ color: "#2563EB" }} fontSize="small" />
        <Typography fontWeight={700} fontSize={14} flex={1}>Pago dividido · {cop(total)}</Typography>
        <Button size="small" onClick={iguales} sx={{ textTransform: "none", fontWeight: 700 }}>Partes iguales</Button>
      </Stack>
      <Stack spacing={1}>
        {lineas.map((l, k) => (
          <Box key={k} sx={{ p: 1, borderRadius: "12px", bgcolor: "#fff", border: "1px solid #EEF2F7" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField select size="small" value={l.metodo_pago} onChange={(ev) => cambiar(k, { metodo_pago: ev.target.value, monto_recibido: "" })} sx={{ minWidth: 140 }}>
                {MEDIOS_DIVIDIDO.map(([v, t]) => <MenuItem key={v} value={v}>{t}</MenuItem>)}
              </TextField>
              <TextField size="small" fullWidth placeholder="Valor" value={l.monto === "" ? "" : Number(l.monto).toLocaleString("es-CO")}
                onChange={(ev) => cambiar(k, { monto: numero(ev.target.value) })} inputProps={{ inputMode: "numeric", "aria-label": `Valor en ${l.metodo_pago}` }} />
              {lineas.length > 2 && <IconButton size="small" onClick={() => onChange(lineas.filter((_, i) => i !== k))} aria-label="Quitar medio"><CloseIcon fontSize="small" /></IconButton>}
            </Stack>
            {l.metodo_pago === "EFECTIVO" && (
              <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                <TextField size="small" fullWidth placeholder="Recibido en efectivo (opcional)" value={l.monto_recibido === "" ? "" : Number(l.monto_recibido).toLocaleString("es-CO")}
                  onChange={(ev) => cambiar(k, { monto_recibido: numero(ev.target.value) })} inputProps={{ inputMode: "numeric" }}
                  error={l.monto_recibido !== "" && Number(l.monto_recibido) < Number(l.monto)} />
                {l.monto_recibido !== "" && Number(l.monto_recibido) >= Number(l.monto) && (
                  <Typography fontSize={13} fontWeight={700} color="success.main" whiteSpace="nowrap">Cambio {cop(Number(l.monto_recibido) - Number(l.monto))}</Typography>
                )}
              </Stack>
            )}
          </Box>
        ))}
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
        {lineas.length < 5 && <Button size="small" startIcon={<AddIcon />} onClick={agregar} sx={{ textTransform: "none" }}>Agregar medio</Button>}
        <Box flex={1} />
        {e.valido
          ? <Chip size="small" color="success" label="Completo" sx={{ fontWeight: 700 }} />
          : e.falta === 0
          ? <Chip size="small" color="warning" label={e.efectivoCorto ? "El efectivo recibido no alcanza" : "Escribe el valor de cada medio"} sx={{ fontWeight: 700 }} />
          : <Chip size="small" color={e.falta > 0 ? "warning" : "error"} label={e.falta > 0 ? `Falta ${cop(e.falta)}` : `Sobra ${cop(-e.falta)}`} sx={{ fontWeight: 700 }} />}
        {e.cambio > 0 && <Chip size="small" color="success" variant="outlined" label={`Cambio total ${cop(e.cambio)}`} />}
      </Stack>
    </Box>
  );
}
