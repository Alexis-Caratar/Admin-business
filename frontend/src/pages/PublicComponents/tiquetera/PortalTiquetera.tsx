// Portal público del cliente: saldo de su tiquetera, calendario de almuerzos e historial.
// Se entra con el enlace/QR (/tiquetera/:token) o buscando con código + documento (/:negocio/tiquetera).
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Container, IconButton, LinearProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { apiBuscarPortal, apiPortal, errorDe, type Portal } from "../../../api/tiqueteras";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const ESTADO: Record<Portal["estado"], { texto: string; color: "success" | "default" | "error" | "warning" }> = {
  ACTIVA: { texto: "Activa", color: "success" }, AGOTADA: { texto: "Agotada", color: "default" }, ANULADA: { texto: "Anulada", color: "error" }, VENCIDA: { texto: "Vencida", color: "warning" },
};
const hoyBogota = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
const nombreMes = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).toLocaleDateString("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });

const Marco: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ minHeight: "100vh", bgcolor: "#F5F5F7", py: { xs: 3, md: 6 } }}>
    <Container maxWidth="sm" sx={{ px: 2 }}>{children}</Container>
  </Box>
);

const Calendario: React.FC<{ consumos: Portal["consumos"] }> = ({ consumos }) => {
  const [y0, m0] = hoyBogota().split("-").map(Number);
  const [mes, setMes] = useState({ y: y0, m: m0 - 1 });
  const porDia = useMemo(() => {
    const r = new Map<string, number>();
    for (const c of consumos) if (c.estado === "CONSUMIDO") r.set(c.dia, (r.get(c.dia) ?? 0) + c.cantidad);
    return r;
  }, [consumos]);
  const primero = (new Date(Date.UTC(mes.y, mes.m, 1)).getUTCDay() + 6) % 7; // lunes = 0
  const dias = new Date(Date.UTC(mes.y, mes.m + 1, 0)).getUTCDate();
  const hoy = hoyBogota();
  const mover = (n: number) => setMes(({ y, m }) => { const d = new Date(Date.UTC(y, m + n, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const celdas = [...Array(primero).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
  const enMes = [...porDia.entries()].filter(([d]) => d.startsWith(`${mes.y}-${String(mes.m + 1).padStart(2, "0")}`)).reduce((a, [, n]) => a + n, 0);

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4 }}>
      <Stack direction="row" alignItems="center" mb={1.5}>
        <IconButton size="small" onClick={() => mover(-1)} aria-label="Mes anterior"><ChevronLeftIcon /></IconButton>
        <Box flex={1} textAlign="center">
          <Typography fontWeight={700} sx={{ textTransform: "capitalize" }}>{nombreMes(mes.y, mes.m)}</Typography>
          <Typography fontSize={12} color="text.secondary">{enMes} almuerzo{enMes === 1 ? "" : "s"} este mes</Typography>
        </Box>
        <IconButton size="small" onClick={() => mover(1)} aria-label="Mes siguiente"><ChevronRightIcon /></IconButton>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, textAlign: "center" }}>
        {DIAS.map((d, i) => <Typography key={i} fontSize={11} color="text.secondary" fontWeight={600}>{d}</Typography>)}
        {celdas.map((d, i) => {
          if (d === null) return <Box key={`v${i}`} />;
          const clave = `${mes.y}-${String(mes.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const n = porDia.get(clave) ?? 0;
          return (
            <Box key={clave} title={n ? `${n} almuerzo${n === 1 ? "" : "s"}` : undefined}
              sx={{
                aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", position: "relative", fontSize: 13,
                bgcolor: n ? "#1D1D1F" : "transparent", color: n ? "#fff" : "text.primary", fontWeight: n ? 700 : 400,
                outline: clave === hoy ? "2px solid #0071E3" : "none", outlineOffset: -2,
              }}>
              {d}
              {n > 1 && <Box component="span" sx={{ position: "absolute", top: 0, right: 2, fontSize: 9, fontWeight: 800 }}>×{n}</Box>}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

const Buscar: React.FC<{ negocio: string }> = ({ negocio }) => {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [documento, setDocumento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true); setError(null);
    try { const r = await apiBuscarPortal({ negocio, codigo, documento }); navigate(`/tiquetera/${r.token}`, { replace: true }); }
    catch (er) { setError(errorDe(er).mensaje); }
    finally { setEnviando(false); }
  };
  return (
    <Marco>
      <Paper elevation={0} component="form" onSubmit={buscar} sx={{ p: 3, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Box textAlign="center">
            <ConfirmationNumberIcon sx={{ fontSize: 40 }} />
            <Typography variant="h5" fontWeight={800}>Mi tiquetera</Typography>
            <Typography color="text.secondary" fontSize={14}>Consulta cuántos almuerzos te quedan.</Typography>
          </Box>
          <TextField label="Código de la tiquetera" placeholder="TQ-000123" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          <TextField label="Tu número de documento" value={documento} onChange={(e) => setDocumento(e.target.value)} required inputProps={{ inputMode: "numeric" }} />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={enviando || !codigo.trim() || !documento.trim()} sx={{ borderRadius: 999, bgcolor: "#0071E3" }}>
            {enviando ? <CircularProgress size={22} color="inherit" /> : "Consultar"}
          </Button>
        </Stack>
      </Paper>
    </Marco>
  );
};

const Ver: React.FC<{ token: string }> = ({ token }) => {
  const [p, setP] = useState<Portal | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { apiPortal(token).then(setP).catch((e) => setError(errorDe(e).mensaje)); }, [token]);
  useEffect(() => { if (p) document.title = `Tiquetera ${p.codigo}${p.negocio ? ` · ${p.negocio.nombre}` : ""}`; }, [p]);

  if (error) return <Marco><Alert severity="error">{error}</Alert></Marco>;
  if (!p) return <Marco><Box textAlign="center" py={8}><CircularProgress /></Box></Marco>;
  const est = ESTADO[p.estado];
  return (
    <Marco>
      <Stack spacing={2}>
        <Box textAlign="center">
          {p.negocio && <Typography fontSize={13} color="text.secondary" fontWeight={600}>{p.negocio.nombre}</Typography>}
          <Typography variant="h5" fontWeight={800}>Hola, {p.cliente}</Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, textAlign: "center" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography fontSize={13} color="text.secondary">{p.codigo} · {p.tipo}</Typography>
            <Chip size="small" label={est.texto} color={est.color} />
          </Stack>
          <Typography sx={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{p.disponibles}</Typography>
          <Typography color="text.secondary">almuerzo{p.disponibles === 1 ? "" : "s"} disponible{p.disponibles === 1 ? "" : "s"} de {p.almuerzos_total}</Typography>
          <LinearProgress variant="determinate" value={(p.consumidos / p.almuerzos_total) * 100} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
          <Stack direction="row" justifyContent="space-between" mt={1}>
            <Typography fontSize={12} color="text.secondary">Comprada el {new Date(p.fecha_compra).toLocaleDateString("es-CO")}</Typography>
            <Typography fontSize={12} color={p.estado === "VENCIDA" ? "warning.main" : "text.secondary"}>{p.fecha_vencimiento ? `Vence el ${p.fecha_vencimiento}` : "Sin vencimiento"}</Typography>
          </Stack>
        </Paper>
        <Calendario consumos={p.consumos} />
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4 }}>
          <Typography fontWeight={700} mb={1}>Historial</Typography>
          {!p.consumos.length && <Typography color="text.secondary" fontSize={14}>Aún no has usado tu tiquetera.</Typography>}
          {p.consumos.map((c, i) => (
            <Stack key={i} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1, borderTop: i ? "1px solid #EEE" : "none", opacity: c.estado === "REINTEGRADO" ? 0.6 : 1 }}>
              <Box flex={1} minWidth={0}>
                <Typography fontSize={14} noWrap>{c.cantidad > 1 ? `${c.cantidad} × ` : ""}{c.producto}</Typography>
                <Typography fontSize={12} color="text.secondary">{new Date(c.fecha).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" })}</Typography>
              </Box>
              {c.estado === "REINTEGRADO" && <Chip size="small" label="Devuelto" variant="outlined" />}
            </Stack>
          ))}
        </Paper>
        <Typography fontSize={11.5} color="text.secondary" textAlign="center">Guarda este enlace: es tu acceso personal a la tiquetera.</Typography>
      </Stack>
    </Marco>
  );
};

export default function PortalTiquetera() {
  const { token, negocio } = useParams();
  return token ? <Ver token={token} /> : <Buscar negocio={negocio ?? ""} />;
}
