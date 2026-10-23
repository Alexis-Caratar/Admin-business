// Tiqueteras desde la caja: vender una (entra el dinero a la caja abierta) y consultar saldos.
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogContent, IconButton, List, ListItemButton, ListItemText,
  MenuItem, Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QRCode from "react-qr-code";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import { Encabezado, Seccion } from "../../../../../../components/pedidos/DisenoPedidos";
import { sxBotonPrincipal } from "../../../../../../components/pedidos/pedidosUtil";
import { apibuscar_cliente } from "../../../../../../api/cajero";
import { apiTiposTiquetera, apiVenderTiquetera, enlacePortal, errorDe, nuevaClave, type TipoTiquetera, type Tiquetera } from "../../../../../../api/tiqueteras";
import { CrearClienteModal } from "../CrearClienteModal";
import { BuscadorTiqueteras, TarjetaTiquetera } from "./comun";
import { cop } from "./tiqueterasUtil";

const MEDIOS = [["EFECTIVO", "💵 Efectivo"], ["TRANSFERENCIA", "🔁 Transferencia"], ["TARJETA", "💳 Tarjeta"], ["NEQUI", "📲 Nequi"], ["DAVIPLATA", "📲 DaviPlata"]];
type Cliente = { id: number; nombres: string; apellidos: string; identificacion: string; telefono?: string | null };
const esFinal = (c: Cliente) => String(c.identificacion ?? "").includes("22222222");

const Enlace: React.FC<{ t: Tiquetera }> = ({ t }) => {
  const url = enlacePortal(t.token_portal);
  const [copiado, setCopiado] = useState(false);
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ p: 2, borderRadius: "18px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      <Box sx={{ p: 1, bgcolor: "#fff", borderRadius: 1, lineHeight: 0 }}><QRCode value={url} size={112} /></Box>
      <Box minWidth={0}>
        <Typography fontWeight={700}>Portal del cliente</Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>Con este QR o enlace el cliente ve su saldo y su historial. También sirve para buscarlo en la caja.</Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption" sx={{ wordBreak: "break-all" }}>{url}</Typography>
          <Tooltip title={copiado ? "Copiado" : "Copiar enlace"}>
            <IconButton size="small" onClick={() => navigator.clipboard?.writeText(url).then(() => setCopiado(true))}><ContentCopyIcon fontSize="inherit" /></IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Stack>
  );
};

const Vender: React.FC<{ onVendida: () => void }> = ({ onVendida }) => {
  const [tipos, setTipos] = useState<TipoTiquetera[] | null>(null);
  const [busca, setBusca] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [crear, setCrear] = useState(false);
  const [idTipo, setIdTipo] = useState<number | "">("");
  const [medio, setMedio] = useState("EFECTIVO");
  const [recibido, setRecibido] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [vendida, setVendida] = useState<{ tiquetera: Tiquetera; cambio: number } | null>(null);
  const clave = useRef(nuevaClave());

  useEffect(() => { apiTiposTiquetera().then((t) => setTipos(t.filter((x) => x.activo))).catch((e) => setError(errorDe(e).mensaje)); }, []);
  useEffect(() => {
    if (busca.trim().length < 2) { setClientes([]); return; }
    const id = setTimeout(() => apibuscar_cliente({ id_cliente: busca.trim() }).then((r) => setClientes(r.data.result ?? [])).catch(() => setClientes([])), 300);
    return () => clearTimeout(id);
  }, [busca]);

  const tipo = tipos?.find((t) => t.id === idTipo);
  const cambio = tipo && recibido !== "" ? Number(recibido) - tipo.precio : 0;
  const listo = !!cliente && !esFinal(cliente) && !!tipo && !(medio === "EFECTIVO" && recibido !== "" && cambio < 0);

  const vender = async () => {
    if (!listo || !cliente || !tipo || enviando) return;
    setEnviando(true); setError(null);
    try {
      const r = await apiVenderTiquetera({ id_cliente: cliente.id, id_tipo: tipo.id, metodo_pago: medio, monto_recibido: recibido === "" ? undefined : Number(recibido) }, clave.current);
      setVendida(r); onVendida();
    } catch (e) { setError(errorDe(e).mensaje); clave.current = nuevaClave(); }
    finally { setEnviando(false); }
  };
  const otra = () => { setVendida(null); setCliente(null); setBusca(""); setIdTipo(""); setRecibido(""); setMedio("EFECTIVO"); clave.current = nuevaClave(); };

  if (vendida) return (
    <Stack spacing={2}>
      <Alert severity="success">
        Tiquetera <b>{vendida.tiquetera.codigo}</b> vendida a {vendida.tiquetera.cliente} por {cop(vendida.tiquetera.valor_pagado)} ({vendida.tiquetera.metodo_pago}).
        {vendida.cambio > 0 && <> Cambio: <b>{cop(vendida.cambio)}</b>.</>}
      </Alert>
      <TarjetaTiquetera t={vendida.tiquetera} />
      <Enlace t={vendida.tiquetera} />
      <Button onClick={otra}>Vender otra</Button>
    </Stack>
  );
  if (!tipos) return <Box textAlign="center" py={3}>{error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}</Box>;
  if (!tipos.length) return <Alert severity="info">Aún no hay tipos de tiquetera. El administrador los crea en Ventas → Tiqueteras.</Alert>;

  return (
    <Stack spacing={2}>
      {cliente ? (
        <Alert severity={esFinal(cliente) ? "warning" : "info"} action={<Button size="small" onClick={() => setCliente(null)}>Cambiar</Button>}>
          {cliente.nombres} {cliente.apellidos} · {cliente.identificacion}
          {esFinal(cliente) && " — la tiquetera debe quedar a nombre de un cliente identificado"}
        </Alert>
      ) : (
        <Box>
          <Stack direction="row" spacing={1}>
            <TextField fullWidth size="small" autoFocus label="Cliente" placeholder="Nombre o documento" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <Button variant="outlined" onClick={() => setCrear(true)} sx={{ whiteSpace: "nowrap" }}>Nuevo</Button>
          </Stack>
          {clientes.length > 0 && (
            <List dense sx={{ maxHeight: 200, overflowY: "auto", border: 1, borderColor: "divider", borderRadius: 1, mt: 1 }}>
              {clientes.map((c) => (
                <ListItemButton key={c.id} onClick={() => { setCliente(c); setClientes([]); }}>
                  <ListItemText primary={`${c.nombres} ${c.apellidos}`} secondary={c.identificacion} />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      )}
      <TextField select size="small" label="Tipo de tiquetera" value={idTipo} onChange={(e) => setIdTipo(Number(e.target.value))}>
        {tipos.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.nombre} · {t.almuerzos} almuerzos · {cop(t.precio)}{t.vigencia_dias ? ` · ${t.vigencia_dias} días` : ""}
          </MenuItem>
        ))}
      </TextField>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField select fullWidth size="small" label="Medio de pago" value={medio} onChange={(e) => setMedio(e.target.value)}>
          {MEDIOS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
        </TextField>
        {medio === "EFECTIVO" && (
          <TextField
            fullWidth size="small" label="Monto recibido" value={recibido === "" ? "" : Number(recibido).toLocaleString("es-CO")}
            onChange={(e) => { const raw = e.target.value.replace(/\D/g, ""); setRecibido(raw === "" ? "" : Number(raw)); }}
            error={recibido !== "" && cambio < 0}
            helperText={!tipo || recibido === "" ? " " : cambio < 0 ? `Faltan ${cop(-cambio)}` : `Cambio ${cop(cambio)}`}
          />
        )}
      </Stack>
      {tipo && <Typography variant="body2" color="text.secondary">Cada almuerzo queda valorado en {cop(tipo.precio / tipo.almuerzos)}. El dinero entra hoy a tu caja.</Typography>}
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" disabled={!listo || enviando} onClick={vender} sx={{ ...sxBotonPrincipal, height: 46 }}>
        {enviando ? <CircularProgress size={20} color="inherit" /> : tipo ? `Cobrar ${cop(tipo.precio)}` : "Cobrar"}
      </Button>
      <CrearClienteModal open={crear} onClose={() => setCrear(false)} onCreated={(nuevo: Cliente) => { setCliente(nuevo); setCrear(false); }} />
    </Stack>
  );
};

const Consultar: React.FC = () => {
  const [res, setRes] = useState<Tiquetera[]>([]);
  const [ver, setVer] = useState<Tiquetera | null>(null);
  return (
    <Stack spacing={1}>
      <BuscadorTiqueteras onResultados={(r) => { setRes(r); setVer(null); }} autoFocus />
      {res.map((t) => (
        <Box key={t.id}>
          <TarjetaTiquetera t={t} seleccionada={ver?.id === t.id} onClick={() => setVer(ver?.id === t.id ? null : t)} />
          {ver?.id === t.id && <Box mt={1}><Enlace t={t} /></Box>}
        </Box>
      ))}
    </Stack>
  );
};

export const TiqueterasCajaDialog: React.FC<{ open: boolean; onClose: () => void; onVendida: () => void }> = ({ open, onClose, onVendida }) => {
  const [tab, setTab] = useState(0);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper" PaperProps={{ sx: { borderRadius: 4, bgcolor: "#F8FAFC" } }}>
      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        <Encabezado icono={<ConfirmationNumberIcon />} color="violeta" titulo="Tiqueteras"
          subtitulo="Vende una tiquetera (el dinero entra a tu caja) o consulta el saldo de un cliente." onCerrar={onClose} />
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
          sx={{ mb: 2, minHeight: 42, "& .MuiTab-root": { minHeight: 42, textTransform: "none", fontWeight: 700, borderRadius: 3, mx: 0.5, bgcolor: "#fff", border: "1px solid #E2E8F0" }, "& .Mui-selected": { bgcolor: "#EFF6FF", borderColor: "#BFDBFE" }, "& .MuiTabs-indicator": { display: "none" } }}>
          <Tab icon={<PointOfSaleIcon fontSize="small" />} iconPosition="start" label="Vender" />
          <Tab icon={<ManageSearchIcon fontSize="small" />} iconPosition="start" label="Consultar saldo" />
        </Tabs>
        <Seccion>{open && (tab === 0 ? <Vender onVendida={onVendida} /> : <Consultar />)}</Seccion>
      </DialogContent>
    </Dialog>
  );
};
