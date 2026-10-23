// Configuración → Mi negocio y Página web: el negocio del usuario, editable según permisos.
// Reutiliza las secciones del sitio de la administración del sistema (sin cambiar la URL ni el dominio).
import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import StoreIcon from "@mui/icons-material/Store";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LanguageIcon from "@mui/icons-material/Language";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Swal from "sweetalert2";
import { apiGuardarDatosNegocio, apiGuardarSitioPropio, apiMiNegocio, type DatosNegocio, type MiNegocio } from "../../../api/miNegocio";
import type { SitioNegocio } from "../../../api/negocios";
import { Seccion } from "../../../components/pedidos/DisenoPedidos";
import { sxBotonPrincipal } from "../../../components/pedidos/pedidosUtil";
import { SeccionHorarios, SeccionSitioWeb, SeccionTienda } from "../Negocios/SeccionesSitio";

type RespuestaError = { response?: { data?: { error?: string; errores?: Record<string, string> } } };
const errorDe = (e: unknown) => (e as RespuestaError)?.response?.data ?? {};
const enlace = (n: MiNegocio) => `${window.location.origin}/${n.url_negocio}`;

function useMiNegocio() {
  const [n, setN] = useState<MiNegocio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cargar = useCallback(() => apiMiNegocio().then((d) => { setN(d); setError(null); }).catch((e) => setError(errorDe(e).error ?? "No se pudo cargar el negocio")), []);
  useEffect(() => { cargar(); }, [cargar]);
  return { n, setN, error, cargar };
}

export function DatosDelNegocio({ puedeEditar }: { puedeEditar: boolean }) {
  const { n, error } = useMiNegocio();
  const [f, setF] = useState<DatosNegocio | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { if (n) setF({ nombre: n.nombre, descripcion: n.descripcion, telefono: n.telefono, direccion: n.direccion, ciudad: n.ciudad, correo: n.correo, imagen: n.imagen }); }, [n]);
  if (error) return <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>;
  if (!n || !f) return <Box textAlign="center" py={4}><CircularProgress /></Box>;
  const campo = (k: keyof DatosNegocio, label: string, extra: object = {}) => (
    <TextField size="small" fullWidth label={label} value={f[k] ?? ""} disabled={!puedeEditar} error={!!errores[k]} helperText={errores[k]}
      onChange={(e) => setF({ ...f, [k]: e.target.value })} {...extra} />
  );
  const guardar = async () => {
    setGuardando(true);
    try { await apiGuardarDatosNegocio(f); setErrores({}); Swal.fire({ icon: "success", title: "Negocio actualizado", timer: 1400, showConfirmButton: false }); }
    catch (e) { const r = errorDe(e); setErrores(r.errores ?? {}); Swal.fire("No se guardó", r.error ?? "Revisa los datos", "error"); }
    finally { setGuardando(false); }
  };
  return (
    <Seccion titulo="Datos del negocio" icono={<StoreIcon />}
      accion={puedeEditar ? <Button variant="contained" onClick={guardar} disabled={guardando} sx={sxBotonPrincipal}>{guardando ? "Guardando…" : "Guardar"}</Button> : undefined}>
      {!puedeEditar && <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>Puedes consultar; para editar necesitas la acción "Editar datos del negocio".</Alert>}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
        {n.nit && <Chip label={`NIT ${n.nit}`} sx={{ fontWeight: 600 }} />}
        {n.tipo && <Chip label={n.tipo} sx={{ fontWeight: 600 }} />}
        <Chip label={n.publicado ? "Página publicada" : "Página sin publicar"} color={n.publicado ? "success" : "default"} sx={{ fontWeight: 600 }} />
        <Button size="small" endIcon={<OpenInNewIcon />} href={enlace(n)} target="_blank" rel="noopener" sx={{ textTransform: "none" }}>Ver página web</Button>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        {campo("nombre", "Nombre del negocio")}
        {campo("telefono", "Teléfono")}
        {campo("correo", "Correo")}
        {campo("ciudad", "Ciudad")}
        {campo("direccion", "Dirección")}
        {campo("imagen", "Logo (enlace https)")}
        <Box sx={{ gridColumn: "1 / -1" }}>{campo("descripcion", "Descripción", { multiline: true, minRows: 3 })}</Box>
      </Box>
      <Typography fontSize={12} color="#64748B" mt={2}>El NIT, el tipo de negocio, la URL y el dominio los cambia la administración del sistema.</Typography>
    </Seccion>
  );
}

export function PaginaWebDelNegocio({ puedeEditar }: { puedeEditar: boolean }) {
  const { n, error } = useMiNegocio();
  const [sitio, setSitio] = useState<SitioNegocio | null>(null);
  const [tab, setTab] = useState(0);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { if (n) setSitio(n); }, [n]);
  const set = <K extends keyof SitioNegocio>(k: K, v: SitioNegocio[K]) => setSitio((x) => (x ? { ...x, [k]: v } : x));
  if (error) return <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>;
  if (!n || !sitio) return <Box textAlign="center" py={4}><CircularProgress /></Box>;
  const guardar = async () => {
    setGuardando(true);
    try { setSitio(await apiGuardarSitioPropio(sitio)); setErrores({}); Swal.fire({ icon: "success", title: "Página web guardada", timer: 1400, showConfirmButton: false }); }
    catch (e) {
      const r = errorDe(e); const errs = r.errores ?? {};
      setErrores(errs);
      const campos = Object.keys(errs);
      if (campos.length) setTab(campos.includes("horarios") ? 1 : campos.some((c) => c.startsWith("tienda")) ? 2 : 0);
      Swal.fire("Revisa la página web", r.error ?? "No se guardó", "warning");
    } finally { setGuardando(false); }
  };
  return (
    <Stack spacing={2}>
      <Seccion titulo="Página web del negocio" icono={<LanguageIcon />}
        accion={<Stack direction="row" spacing={1}>
          <Button size="small" endIcon={<OpenInNewIcon />} href={enlace(n)} target="_blank" rel="noopener" sx={{ textTransform: "none" }}>Ver</Button>
          {puedeEditar && <Button variant="contained" onClick={guardar} disabled={guardando} sx={sxBotonPrincipal}>{guardando ? "Guardando…" : "Guardar"}</Button>}
        </Stack>}>
        {!puedeEditar && <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>Puedes consultar; para editar necesitas la acción "Editar la página web".</Alert>}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
          <Tab icon={<LanguageIcon />} iconPosition="start" label="Sitio web" />
          <Tab icon={<ScheduleIcon />} iconPosition="start" label="Horarios" />
          <Tab icon={<StorefrontIcon />} iconPosition="start" label="Tienda en línea" />
        </Tabs>
        <Box sx={{ pointerEvents: puedeEditar ? "auto" : "none", opacity: puedeEditar ? 1 : 0.75 }}>
          {tab === 0 && <SeccionSitioWeb sitio={sitio} set={set} errores={errores} tipoNombre={n.tipo ?? undefined} bloquearUrl={!n.puede_cambiar_url} />}
          {tab === 1 && <SeccionHorarios sitio={sitio} set={set} errores={errores} />}
          {tab === 2 && <SeccionTienda sitio={sitio} set={set} errores={errores} />}
        </Box>
      </Seccion>
    </Stack>
  );
}
