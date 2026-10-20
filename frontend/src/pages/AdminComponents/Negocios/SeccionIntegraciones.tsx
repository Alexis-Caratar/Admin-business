/*
 * Pestaña "Pagos y WhatsApp" del modal Editar negocio: credenciales de Wompi,
 * de WhatsApp Cloud API y ajustes de la tienda que antes solo estaban en el .env.
 * Lo que se deja vacío usa la configuración del servidor. Los secretos se guardan
 * cifrados y nunca se vuelven a mostrar (solo sus 4 últimos caracteres).
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, FormControlLabel, IconButton, InputAdornment, MenuItem, Stack, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockIcon from "@mui/icons-material/Lock";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import SaveIcon from "@mui/icons-material/Save";
import Swal from "sweetalert2";

import { guardarIntegraciones, obtenerIntegraciones, probarIntegracion } from "../../../api/negocios";
import type { CambiosIntegraciones, IntegracionesNegocio, SecretoGuardado } from "../../../api/negocios";
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

type Secreto = "wompi_integrity_secret" | "wompi_events_secret" | "wompi_private_key" | "whatsapp_token";
type Form = {
  wompi_entorno: "pruebas" | "produccion"; wompi_public_key: string;
  whatsapp_phone_number_id: string; whatsapp_api_version: string; whatsapp_idioma: string;
  tienda_url_retorno: string; tienda_validar_horario: boolean;
} & Record<Secreto, string>;

const desde = (d: IntegracionesNegocio): Form => ({
  wompi_entorno: d.wompi.entorno, wompi_public_key: d.wompi.public_key,
  wompi_integrity_secret: "", wompi_events_secret: "", wompi_private_key: "", whatsapp_token: "",
  whatsapp_phone_number_id: d.whatsapp.phone_number_id, whatsapp_api_version: d.whatsapp.api_version, whatsapp_idioma: d.whatsapp.idioma,
  tienda_url_retorno: d.tienda.url_retorno, tienda_validar_horario: d.tienda.validar_horario,
});

const ORIGEN: Record<string, { label: string; color: "success" | "info" | "default" }> = {
  negocio: { label: "CREDENCIALES PROPIAS", color: "success" },
  servidor: { label: "USA LAS DEL SERVIDOR", color: "info" },
  ninguno: { label: "SIN CONFIGURAR", color: "default" },
};

export default function SeccionIntegraciones({ idNegocio }: { idNegocio: number | null }) {
  const [datos, setDatos] = useState<IntegracionesNegocio | null>(null);
  const [f, setF] = useState<Form | null>(null);
  const [borrar, setBorrar] = useState<Set<Secreto>>(new Set());
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [prueba, setPrueba] = useState<Record<string, { cargando?: boolean; ok?: boolean; mensaje?: string }>>({});

  useEffect(() => {
    if (!idNegocio) return;
    let vivo = true;
    obtenerIntegraciones(idNegocio).then(
      (d) => { if (vivo) { setDatos(d); setF(desde(d)); } },
      (e) => { if (vivo) setError(e?.response?.data?.error ?? "No se pudo cargar la configuración (¿aplicaste la migración 007?)"); },
    );
    return () => { vivo = false; };
  }, [idNegocio]);

  if (!idNegocio) return <Alert severity="info">Guarda primero el negocio para configurar sus pagos y WhatsApp.</Alert>;
  if (error && !datos) return <Alert severity="error">{error}</Alert>;
  if (!datos || !f) return <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF({ ...f, [k]: v }); setErrores((e) => ({ ...e, [k]: "" })); };
  const vacio = (v: string) => v.trim() || null;
  const cambios = (): CambiosIntegraciones => {
    const c: CambiosIntegraciones = {
      wompi_entorno: f.wompi_entorno, wompi_public_key: vacio(f.wompi_public_key),
      whatsapp_phone_number_id: vacio(f.whatsapp_phone_number_id), whatsapp_api_version: vacio(f.whatsapp_api_version),
      whatsapp_idioma: vacio(f.whatsapp_idioma), tienda_url_retorno: vacio(f.tienda_url_retorno), tienda_validar_horario: f.tienda_validar_horario,
    };
    (["wompi_integrity_secret", "wompi_events_secret", "wompi_private_key", "whatsapp_token"] as Secreto[]).forEach((k) => {
      c[k] = borrar.has(k) ? null : f[k].trim();
    });
    return c;
  };

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const d = await guardarIntegraciones(idNegocio, cambios());
      setDatos(d); setF(desde(d)); setBorrar(new Set()); setErrores({});
      Swal.fire({ icon: "success", title: "Configuración guardada", text: "Los cambios ya aplican a la tienda de este negocio.", timer: 1800, showConfirmButton: false });
    } catch (e: unknown) {
      const r = (e as { response?: { data?: { error?: string; errores?: Record<string, string> } } })?.response?.data;
      setErrores(r?.errores ?? {});
      setError(r?.error ?? "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const probar = async (tipo: "wompi" | "whatsapp") => {
    setPrueba((p) => ({ ...p, [tipo]: { cargando: true } }));
    try {
      const r = await probarIntegracion(idNegocio, tipo, cambios());
      setPrueba((p) => ({ ...p, [tipo]: r }));
    } catch {
      setPrueba((p) => ({ ...p, [tipo]: { ok: false, mensaje: "No se pudo hacer la prueba" } }));
    }
  };

  // Quita todas las credenciales propias de un bloque (vuelve a las del servidor)
  const usarServidor = (tipo: "wompi" | "whatsapp") => {
    if (tipo === "wompi") {
      setF({ ...f, wompi_public_key: "", wompi_integrity_secret: "", wompi_events_secret: "", wompi_private_key: "" });
      setBorrar((b) => new Set([...b, "wompi_integrity_secret", "wompi_events_secret", "wompi_private_key"]));
    } else {
      setF({ ...f, whatsapp_token: "", whatsapp_phone_number_id: "", whatsapp_api_version: "", whatsapp_idioma: "" });
      setBorrar((b) => new Set([...b, "whatsapp_token"]));
    }
  };

  const secreto = (k: Secreto, label: string, guardado: SecretoGuardado, ayuda?: string) => (
    <CampoSecreto label={label} valor={f[k]} guardado={guardado} quitado={borrar.has(k)} error={errores[k]} ayuda={ayuda}
      onCambio={(v) => { set(k, v); setBorrar((b) => { const n = new Set(b); n.delete(k); return n; }); }}
      onQuitar={() => { set(k, ""); setBorrar((b) => new Set([...b, k])); }}
      onRestaurar={() => setBorrar((b) => { const n = new Set(b); n.delete(k); return n; })} />
  );

  const entorno = f.wompi_entorno === "produccion" ? "prod" : "test";
  const estado = (o: string) => <Chip size="small" label={ORIGEN[o].label} color={ORIGEN[o].color} sx={{ fontWeight: 700 }} />;

  return (
    <Stack spacing={3}>
      <Alert severity="info" icon={<LockIcon />}>
        Lo que dejes vacío usa la configuración del servidor (.env). Los secretos se guardan <b>cifrados</b> y no se vuelven a mostrar:
        para cambiarlos escribe el nuevo valor.
      </Alert>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1fr 1fr" }} gap={3}>
        <Tarjeta icono={<CreditCardIcon />} titulo="Pagos en línea · Wompi" accion={estado(datos.wompi.origen)}>
          <TextField select size="small" fullWidth label="Entorno" value={f.wompi_entorno} sx={campo} {...err(errores, "wompi_entorno")}
            onChange={(e) => set("wompi_entorno", e.target.value as Form["wompi_entorno"])}>
            <MenuItem value="pruebas">Pruebas (sandbox)</MenuItem>
            <MenuItem value="produccion">Producción (cobros reales)</MenuItem>
          </TextField>
          <TextField size="small" fullWidth label="Llave pública" placeholder={`pub_${entorno}_…`} value={f.wompi_public_key} sx={campo}
            onChange={(e) => set("wompi_public_key", e.target.value)} {...err(errores, "wompi_public_key")}
            slotProps={{ htmlInput: { autoComplete: "off", spellCheck: false } }} />
          {secreto("wompi_integrity_secret", "Secreto de integridad", datos.wompi.integrity_secret, `${entorno}_integrity_…`)}
          {secreto("wompi_events_secret", "Secreto de eventos", datos.wompi.events_secret, `${entorno}_events_…`)}
          {secreto("wompi_private_key", "Llave privada (opcional)", datos.wompi.private_key, `prv_${entorno}_… · confirma pagos aunque no llegue el webhook (necesaria en local)`)}
          <TextField size="small" fullWidth label="URL de eventos para registrar en Wompi" value={datos.wompi.webhook} sx={campo}
            helperText="Wompi > Desarrolladores > URL de eventos (debe ser pública con HTTPS en producción)"
            slotProps={{ input: { readOnly: true, endAdornment: <InputAdornment position="end"><Copiar texto={datos.wompi.webhook} /></InputAdornment> } }} />
          <Acciones prueba={prueba.wompi} onProbar={() => probar("wompi")} onServidor={datos.wompi.origen === "negocio" || f.wompi_public_key ? () => usarServidor("wompi") : undefined}
            servidor={datos.servidor.wompi ? `El servidor tiene Wompi en ${datos.servidor.wompi}.` : "El servidor no tiene Wompi configurado."} />
        </Tarjeta>

        <Tarjeta icono={<WhatsAppIcon />} titulo="Avisos por WhatsApp · Meta" accion={estado(datos.whatsapp.origen)}>
          {secreto("whatsapp_token", "Token de acceso", datos.whatsapp.token, "Meta Business > WhatsApp > Configuración de la API (token permanente)")}
          <TextField size="small" fullWidth label="ID del número de teléfono" placeholder="Ej.: 109876543210987" value={f.whatsapp_phone_number_id} sx={campo}
            onChange={(e) => set("whatsapp_phone_number_id", e.target.value.replace(/\D/g, ""))}
            {...err(errores, "whatsapp_phone_number_id", "Es el ID que da Meta, no el número de celular")} />
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <TextField size="small" label="Versión de la API" placeholder="v21.0" value={f.whatsapp_api_version} sx={campo}
              onChange={(e) => set("whatsapp_api_version", e.target.value)} {...err(errores, "whatsapp_api_version", "Vacío = v21.0")} />
            <TextField size="small" label="Idioma de las plantillas" placeholder="es" value={f.whatsapp_idioma} sx={campo}
              onChange={(e) => set("whatsapp_idioma", e.target.value)} {...err(errores, "whatsapp_idioma", "El aprobado en Meta (es, es_CO…)")} />
          </Box>
          <Typography fontSize={12.5} color="text.secondary">
            Las plantillas deben estar aprobadas en Meta con los nombres pedido_recibido, pedido_confirmado, pedido_listo, pedido_en_camino,
            pedido_entregado y pedido_cancelado. Sin credenciales, el pedido sigue ofreciendo el botón "Avisar por WhatsApp".
          </Typography>
          <Acciones prueba={prueba.whatsapp} onProbar={() => probar("whatsapp")} onServidor={datos.whatsapp.origen === "negocio" || f.whatsapp_phone_number_id ? () => usarServidor("whatsapp") : undefined}
            servidor={datos.servidor.whatsapp ? "El servidor tiene WhatsApp configurado." : "El servidor no tiene WhatsApp configurado."} />
        </Tarjeta>

        <Tarjeta icono={<StorefrontIcon />} titulo="Tienda web">
          <TextField size="small" fullWidth label="URL de la tienda (regreso después de pagar)" placeholder="https://mitienda.com" value={f.tienda_url_retorno} sx={campo}
            onChange={(e) => set("tienda_url_retorno", e.target.value)}
            {...err(errores, "tienda_url_retorno", `Vacío = ${datos.servidor.url_publica ?? "el dominio del negocio"}. Wompi solo regresa a URLs públicas con HTTPS.`)} />
          <FormControlLabel control={<Switch checked={f.tienda_validar_horario} onChange={(e) => set("tienda_validar_horario", e.target.checked)} />}
            label={<b>Recibir pedidos solo en el horario del negocio</b>} />
          {!datos.servidor.validar_horario && (
            <Alert severity="warning">El servidor tiene TIENDA_VALIDAR_HORARIO=false: el horario no se valida para ningún negocio.</Alert>
          )}
        </Tarjeta>
      </Box>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" size="large" startIcon={guardando ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />} disabled={guardando} onClick={guardar}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 3, px: 3 }}>
          Guardar pagos y WhatsApp
        </Button>
      </Stack>
    </Stack>
  );
}

const err = (errores: Record<string, string>, k: string, ayuda?: string) => ({ error: Boolean(errores[k]), helperText: errores[k] || ayuda });

function CampoSecreto({ label, valor, guardado, quitado, error, ayuda, onCambio, onQuitar, onRestaurar }: {
  label: string; valor: string; guardado: SecretoGuardado; quitado: boolean; error?: string; ayuda?: string;
  onCambio: (v: string) => void; onQuitar: () => void; onRestaurar: () => void;
}) {
  const [ver, setVer] = useState(false);
  const placeholder = quitado ? "Se borrará al guardar" : guardado.guardado ? `Guardado · termina en ${guardado.final} (escribe para reemplazar)` : "";
  return (
    <TextField size="small" fullWidth label={label} value={valor} placeholder={placeholder} sx={campo} type={ver ? "text" : "password"}
      onChange={(e) => onCambio(e.target.value)} error={Boolean(error)} helperText={error || ayuda}
      slotProps={{
        inputLabel: { shrink: Boolean(placeholder) || Boolean(valor) || undefined },
        htmlInput: { autoComplete: "new-password", spellCheck: false },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              {valor && <IconButton size="small" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar" : "Mostrar"}>{ver ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton>}
              {guardado.guardado && !valor && (quitado
                ? <Button size="small" onClick={onRestaurar} sx={{ textTransform: "none" }}>Deshacer</Button>
                : <Button size="small" color="error" onClick={onQuitar} sx={{ textTransform: "none" }}>Quitar</Button>)}
            </InputAdornment>
          ),
        },
      }} />
  );
}

function Acciones({ prueba, onProbar, onServidor, servidor }: {
  prueba?: { cargando?: boolean; ok?: boolean; mensaje?: string }; onProbar: () => void; onServidor?: () => void; servidor: string;
}) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button variant="outlined" size="small" onClick={onProbar} disabled={prueba?.cargando}
          startIcon={prueba?.cargando ? <CircularProgress size={14} /> : <WifiTetheringIcon />} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
          Probar conexión
        </Button>
        {onServidor && <Button size="small" onClick={onServidor} sx={{ textTransform: "none" }}>Usar las del servidor</Button>}
      </Stack>
      {prueba?.mensaje && <Alert severity={prueba.ok ? "success" : "error"}>{prueba.mensaje}</Alert>}
      <Typography fontSize={12} color="text.secondary">{servidor}</Typography>
    </Stack>
  );
}

function Copiar({ texto }: { texto: string }): ReactNode {
  const [ok, setOk] = useState(false);
  return (
    <Tooltip title={ok ? "¡Copiado!" : "Copiar"}>
      <IconButton size="small" onClick={() => { navigator.clipboard?.writeText(texto).then(() => { setOk(true); window.setTimeout(() => setOk(false), 1500); }); }} aria-label="Copiar URL">
        <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
