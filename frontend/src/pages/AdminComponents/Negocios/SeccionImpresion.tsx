/*
 * Pestaña "Impresión" del modal Editar negocio. Todo lo que antes estaba fijo
 * en el agente local se configura aquí: ancho del papel, textos, QR, documento
 * de consumidor final y comandas. También se genera el token del agente para
 * instalarlo en cualquier punto de venta y se ven los agentes conectados.
 */
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptIcon from "@mui/icons-material/Receipt";
import RouterIcon from "@mui/icons-material/Router";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyIcon from "@mui/icons-material/Key";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";

import { guardarImpresion, obtenerImpresion, pruebaImpresion, tokenAgente } from "../../../api/negocios";
import { impresionPropia } from "../../../api/miNegocio";
import type { ConfigImpresion, ImpresionNegocio } from "../../../api/negocios";
import { Tarjeta } from "./SeccionesSitio";

const campo = {
  "& .MuiOutlinedInput-root": {
    minHeight: 42, borderRadius: 3, background: "#FFFFFF", fontSize: 13,
    "& fieldset": { borderColor: "#E2E8F0" }, "&:hover fieldset": { borderColor: "#93C5FD" },
    "&.Mui-focused fieldset": { borderColor: "#2563EB", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { fontSize: 13 },
  "& .MuiFormHelperText-root": { fontSize: 11.5 },
} as const;

const mensaje = (e: unknown) => (e as { response?: { data?: { error?: string; errores?: Record<string, string> } } })?.response?.data;

// propio: dentro de Configuración, sobre el negocio del usuario (endpoints /mi-negocio/impresion)
export default function SeccionImpresion({ idNegocio, propio = false }: { idNegocio: number | null; propio?: boolean }) {
  const api = useMemo(() => propio
    ? { obtener: () => impresionPropia.obtener(), guardar: (c: Partial<ConfigImpresion>) => impresionPropia.guardar(c), token: () => impresionPropia.token(), prueba: (r: "factura" | "comanda") => impresionPropia.prueba(r) }
    : { obtener: () => obtenerImpresion(idNegocio!), guardar: (c: Partial<ConfigImpresion>) => guardarImpresion(idNegocio!, c), token: () => tokenAgente(idNegocio!), prueba: (r: "factura" | "comanda") => pruebaImpresion(idNegocio!, r) }, [idNegocio, propio]);
  const [datos, setDatos] = useState<ImpresionNegocio | null>(null);
  const [c, setC] = useState<ConfigImpresion | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [token, setToken] = useState<{ token: string; ws_url: string } | null>(null);

  const cargar = useCallback(async () => {
    if (!idNegocio && !propio) return;
    setRefrescando(true);
    try {
      const d = await api.obtener();
      setDatos(d);
      setC((actual) => actual ?? d.config);
    } catch (e) {
      setError(mensaje(e)?.error ?? "No se pudo cargar la impresión (¿aplicaste la migración 008?)");
    } finally {
      setRefrescando(false);
    }
  }, [idNegocio, propio, api]);

  useEffect(() => {
    if (!idNegocio && !propio) return;
    const t = window.setTimeout(cargar, 0);
    // Los agentes conectados se refrescan solos
    const i = window.setInterval(cargar, 20_000);
    return () => { window.clearTimeout(t); window.clearInterval(i); };
  }, [idNegocio, propio, cargar]);

  if (!idNegocio && !propio) return <Alert severity="info">Guarda primero el negocio para configurar la impresión.</Alert>;
  if (error && !datos) return <Alert severity="error">{error}</Alert>;
  if (!datos || !c) return <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box>;

  const set = <K extends keyof ConfigImpresion>(k: K, v: ConfigImpresion[K]) => { setC({ ...c, [k]: v }); setErrores((e) => ({ ...e, [k]: "" })); };
  const err = (k: string, ayuda?: string) => ({ error: Boolean(errores[k]), helperText: errores[k] || ayuda });

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const d = await api.guardar(c);
      setDatos(d); setC(d.config); setErrores({});
      Swal.fire({ icon: "success", title: "Impresión guardada", text: "Los próximos tickets salen con este formato en todos los puntos de venta.", timer: 1800, showConfirmButton: false });
    } catch (e) {
      const r = mensaje(e);
      setErrores(r?.errores ?? {});
      setError(r?.error ?? "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const generarToken = async () => {
    const ok = await Swal.fire({
      icon: "warning", title: "¿Generar un token nuevo?",
      text: "Los agentes instalados con el token anterior dejarán de imprimir hasta que les pongas el nuevo.",
      showCancelButton: true, confirmButtonText: "Generar", cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      setToken(await api.token());
    } catch (e) {
      Swal.fire("Error", mensaje(e)?.error ?? "No se pudo generar el token", "error");
    }
  };

  const probar = async (rol: "factura" | "comanda") => {
    try {
      const r = await api.prueba(rol);
      Swal.fire({ icon: r.ok ? "success" : "warning", title: r.ok ? "Prueba impresa" : "No se imprimió", text: r.mensaje });
    } catch (e) {
      Swal.fire("Error", mensaje(e)?.error ?? "No se pudo enviar la prueba", "error");
    }
  };

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1.1fr 1fr" }} gap={3}>
        <Stack spacing={3}>
          <Tarjeta icono={<ReceiptIcon />} titulo="Formato del ticket">
            <TextField select size="small" fullWidth label="Papel" value={c.ancho_caracteres} sx={campo} {...err("ancho_caracteres")}
              onChange={(e) => set("ancho_caracteres", Number(e.target.value) as ConfigImpresion["ancho_caracteres"])}>
              <MenuItem value={32}>58 mm (32 caracteres)</MenuItem>
              <MenuItem value={42}>80 mm (42 caracteres)</MenuItem>
              <MenuItem value={48}>80 mm (48 caracteres, letra pequeña)</MenuItem>
            </TextField>
            <TextField size="small" fullWidth multiline minRows={2} label="Texto extra en el encabezado (opcional)" placeholder="Régimen simplificado · Resolución DIAN…"
              value={c.encabezado ?? ""} onChange={(e) => set("encabezado", e.target.value)} sx={campo} {...err("encabezado", "Va debajo del nombre, NIT, dirección y teléfono del negocio")} />
            <TextField size="small" fullWidth multiline minRows={2} label="Mensaje final" value={c.pie ?? ""} onChange={(e) => set("pie", e.target.value)} sx={campo} {...err("pie")} />
            <TextField size="small" fullWidth label="Documento de consumidor final" value={c.documento_consumidor} sx={campo}
              onChange={(e) => set("documento_consumidor", e.target.value)} {...err("documento_consumidor", "Se imprime cuando la venta no tiene cliente")} />
          </Tarjeta>

          <Tarjeta icono={<PrintIcon />} titulo="QR y comandas">
            <FormControlLabel control={<Switch checked={c.mostrar_qr} onChange={(e) => set("mostrar_qr", e.target.checked)} />} label={<b>Imprimir código QR en la factura</b>} />
            {c.mostrar_qr && (
              <>
                <TextField select size="small" fullWidth label="El QR lleva a" value={c.qr_contenido} sx={campo} onChange={(e) => set("qr_contenido", e.target.value as ConfigImpresion["qr_contenido"])}
                  helperText={c.qr_contenido === "tienda" ? datos.url_tienda : undefined}>
                  <MenuItem value="tienda">La tienda en línea del negocio</MenuItem>
                  <MenuItem value="factura">Los datos de la factura (número y total)</MenuItem>
                  <MenuItem value="texto">Un enlace o texto propio</MenuItem>
                </TextField>
                {c.qr_contenido === "texto" && (
                  <TextField size="small" fullWidth label="Enlace o texto del QR" value={c.qr_texto ?? ""} onChange={(e) => set("qr_texto", e.target.value)} sx={campo} {...err("qr_texto")} />
                )}
                <TextField size="small" fullWidth label="Texto bajo el QR" value={c.qr_leyenda ?? ""} onChange={(e) => set("qr_leyenda", e.target.value)} sx={campo} />
              </>
            )}
            <TextField select size="small" fullWidth label="Factura al cobrar" value={c.factura_al_cobrar ?? "preguntar"} sx={campo} {...err("factura_al_cobrar")}
              onChange={(e) => set("factura_al_cobrar", e.target.value as ConfigImpresion["factura_al_cobrar"])}
              helperText="La factura es aparte de la comanda: sale cuando la cuenta queda pagada">
              <MenuItem value="preguntar">Preguntar al cobrar (opcional)</MenuItem>
              <MenuItem value="siempre">Imprimir siempre al cobrar</MenuItem>
              <MenuItem value="nunca">No imprimir (solo desde las ventas)</MenuItem>
            </TextField>
            <FormControlLabel control={<Switch checked={c.imprimir_comanda_al_vender} onChange={(e) => set("imprimir_comanda_al_vender", e.target.checked)} />}
              label={<b>Imprimir la comanda al registrar cada venta</b>} />
            <TextField select size="small" label="Copias de cada comanda" value={c.copias_comanda} sx={{ ...campo, maxWidth: 220 }} onChange={(e) => set("copias_comanda", Number(e.target.value))}>
              {[1, 2, 3].map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
          </Tarjeta>
        </Stack>

        <Stack spacing={3}>
          <Tarjeta icono={<ReceiptIcon />} titulo="Vista previa" accion={<Typography fontSize={12} color="text.secondary">Se actualiza al guardar</Typography>}>
            <Box component="pre" sx={{
              m: 0, mx: "auto", p: 1.5, bgcolor: "#fff", border: "1px dashed #CBD5E1", borderRadius: 1, fontFamily: '"Courier New", monospace', fontSize: 11.5, lineHeight: 1.35,
              width: `${datos.config.ancho_caracteres + 3}ch`, maxWidth: "100%", overflowX: "auto", whiteSpace: "pre",
            }}>{datos.vista_previa}</Box>
          </Tarjeta>

          <Tarjeta icono={<RouterIcon />} titulo="Agentes de impresión"
            accion={<Tooltip title="Actualizar"><IconButton size="small" onClick={cargar} disabled={refrescando}><RefreshIcon fontSize="small" /></IconButton></Tooltip>}>
            {datos.agentes.length === 0 ? (
              <Alert severity="warning">Ningún punto de venta conectado. Sin agente, la caja ofrece imprimir desde el mismo celular o computador.</Alert>
            ) : datos.agentes.map((a, k) => (
              <Box key={k} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={700} fontSize={14}>{a.punto}</Typography>
                  <Chip size="small" label={a.protocolo >= 2 ? `v${a.version ?? "2"}` : "versión antigua"} color={a.protocolo >= 2 ? "success" : "warning"} />
                </Stack>
                <Typography fontSize={12.5} color="text.secondary">
                  {a.impresoras.length ? a.impresoras.map((i) => `${i.nombre} (${i.rol === "todo" ? "facturas y comandas" : i.rol}${i.conectada === false ? ", desconectada" : ""})`).join(" · ") : a.estado?.message ?? "Sin impresoras reportadas"}
                </Typography>
              </Box>
            ))}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={() => probar("factura")} sx={{ textTransform: "none", borderRadius: 2 }}>Probar factura</Button>
              <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={() => probar("comanda")} sx={{ textTransform: "none", borderRadius: 2 }}>Probar comanda</Button>
              <Button size="small" variant="contained" startIcon={<KeyIcon />} onClick={generarToken} sx={{ textTransform: "none", borderRadius: 2 }}>Instalar en un punto de venta</Button>
            </Stack>
          </Tarjeta>
        </Stack>
      </Box>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" size="large" startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} disabled={guardando} onClick={guardar}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 3, px: 3 }}>
          Guardar impresión
        </Button>
      </Stack>

      <Dialog open={Boolean(token)} onClose={() => setToken(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
          Instalar el agente en un punto de venta
          <IconButton onClick={() => setToken(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {token && (
            <Stack spacing={2} sx={{ pb: 1 }}>
              <Alert severity="info">Copia estos datos ahora: el token no se vuelve a mostrar. Sirve para todos los puntos de venta de este negocio.</Alert>
              <Copiable etiqueta="Servidor" valor={token.ws_url} />
              <Copiable etiqueta="Token del agente" valor={token.token} />
              <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: 13.5, color: "#334155", "& li": { mb: 0.75 } }}>
                <li>Copia la carpeta <b>agente-local</b> al equipo del punto de venta (Windows: Node 24; instala el controlador de la impresora USB con Zadig).</li>
                <li>En esa carpeta ejecuta <code>npm install</code> y luego <code>npm run configurar</code>: pega el servidor y el token, ponle nombre al punto (Caja 1, Cocina…) y elige para qué sirve cada impresora.</li>
                <li>Inicia con <code>npm start</code> (o <code>start.sh</code>, que lo reinicia si se cae). El punto aparecerá aquí en "Agentes de impresión".</li>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

function Copiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [ok, setOk] = useState(false);
  return (
    <TextField size="small" fullWidth label={etiqueta} value={valor} sx={campo}
      slotProps={{ input: { readOnly: true, sx: { fontFamily: "monospace", fontSize: 12 }, endAdornment: (
        <Tooltip title={ok ? "¡Copiado!" : "Copiar"}>
          <IconButton size="small" onClick={() => navigator.clipboard?.writeText(valor).then(() => { setOk(true); window.setTimeout(() => setOk(false), 1500); })}><ContentCopyIcon fontSize="small" /></IconButton>
        </Tooltip>
      ) } }} />
  );
}
