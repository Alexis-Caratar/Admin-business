// Módulos y permisos: perfiles con permisos por acción, asignación de perfiles a
// usuarios, catálogo de módulos y auditoría. El backend valida cada cambio
// (perfil Administrador intocable, nadie se quita su propia administración…).
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Avatar, Box, Button, Checkbox, Chip, Dialog, Divider, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, Switch, Tab, Tabs,
  TextField, Tooltip, Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockIcon from "@mui/icons-material/Lock";
import Swal from "sweetalert2";
import {
  apiAsignarPerfil, apiAuditoria, apiCatalogoModulos, apiEliminarPerfil, apiGuardarModulo, apiGuardarPerfil, apiPerfiles, apiUsuariosPerfil,
  type ModuloCatalogo, type Perfil, type RegistroAuditoria, type UsuarioPerfil,
} from "../../../api/permisos";
import { errorDe } from "../../../api/comandas";
import { usePermisos } from "../../../hooks/usePermisos";
import { GRADIENTES, sxBotonPrincipal } from "../../../components/pedidos/pedidosUtil";
import { Pagina, Seccion, TarjetaIndicador, TarjetaPestanas, TarjetaPrincipal } from "../../../components/pedidos/DisenoPedidos";
import AdminUsuarios from "../Usuarios/AdminUsuarios";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import StoreIcon from "@mui/icons-material/Store";
import LanguageIcon from "@mui/icons-material/Language";
import { DatosDelNegocio, PaginaWebDelNegocio } from "./MiNegocio";
import SeccionImpresion from "../Negocios/SeccionImpresion";
import PrintIcon from "@mui/icons-material/Print";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import AppsIcon from "@mui/icons-material/Apps";
import HistoryIcon from "@mui/icons-material/History";
import { componentMap } from "../../../utils/mapComponents";
import { iconMap } from "../../../utils/mapIcons";

const fecha = (v: string) => new Date(v).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

function EditorPerfil({ perfil, modulos, onCerrar, onGuardado }: { perfil: Partial<Perfil>; modulos: ModuloCatalogo[]; onCerrar: () => void; onGuardado: () => void }) {
  const [p, setP] = useState<Partial<Perfil>>({ activo: true, acciones: [], ...perfil });
  const sel = new Set(p.acciones ?? []);
  const alternar = (ids: number[], on: boolean) => {
    const n = new Set(sel);
    ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
    setP({ ...p, acciones: [...n] });
  };
  const guardar = async () => {
    try { await apiGuardarPerfil(p); onGuardado(); }
    catch (e) { Swal.fire("No se guardó", errorDe(e).mensaje, "error"); }
  };
  const habilitados = modulos.filter((m) => m.habilitado && m.activo && !m.modulo_sistema && m.acciones.length);
  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle>{p.id ? `Perfil: ${perfil.nombre}` : "Nuevo perfil"}</DialogTitle>
      <DialogContent dividers>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <TextField label="Nombre" size="small" value={p.nombre ?? ""} onChange={(e) => setP({ ...p, nombre: e.target.value })} sx={{ flex: 1 }} />
          <TextField label="Descripción" size="small" value={p.descripcion ?? ""} onChange={(e) => setP({ ...p, descripcion: e.target.value })} sx={{ flex: 2 }} />
          {p.id && <FormControlLabel control={<Switch checked={!!p.activo} onChange={(e) => setP({ ...p, activo: e.target.checked })} />} label="Activo" />}
        </Stack>
        <Typography fontSize={13} color="text.secondary" mb={1}>Solo aparecen los módulos habilitados en este negocio. Un usuario ve en su menú los módulos donde tiene al menos una acción.</Typography>
        <Stack spacing={1.5}>
          {habilitados.map((m) => {
            const ids = m.acciones.map((a) => a.id);
            const todos = ids.every((id) => sel.has(id));
            const algunos = ids.some((id) => sel.has(id));
            return (
              <Box key={m.id} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #EEF2F7" }}>
                <FormControlLabel control={<Checkbox checked={todos} indeterminate={algunos && !todos} onChange={(e) => alternar(ids, e.target.checked)} />}
                  label={<Typography fontWeight={700}>{m.nombre} <Typography component="span" fontSize={12} color="text.secondary">· {m.grupo ?? ""}</Typography></Typography>} />
                <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ pl: 4 }}>
                  {m.acciones.map((a) => (
                    <FormControlLabel key={a.id} control={<Checkbox size="small" checked={sel.has(a.id)} onChange={(e) => alternar([a.id], e.target.checked)} />}
                      label={<Typography fontSize={13}>{a.nombre}</Typography>} />
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onCerrar}>Cancelar</Button><Button variant="contained" onClick={guardar}>Guardar</Button></DialogActions>
    </Dialog>
  );
}

function Perfiles({ modulos, admin, onCambio }: { modulos: ModuloCatalogo[]; admin: boolean; onCambio: () => void }) {
  const [lista, setLista] = useState<Perfil[]>([]);
  const [edit, setEdit] = useState<Partial<Perfil> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cargar = useCallback(() => apiPerfiles().then(setLista).catch((e) => setError(errorDe(e).mensaje)), []);
  useEffect(() => { cargar(); }, [cargar]);
  const nombres = useMemo(() => new Map(modulos.flatMap((m) => m.acciones.map((a) => [a.id, m.nombre] as const))), [modulos]);
  const eliminar = async (p: Perfil) => {
    const r = await Swal.fire({ title: `Eliminar el perfil ${p.nombre}`, icon: "warning", showCancelButton: true, confirmButtonText: "Eliminar", confirmButtonColor: "#d32f2f" });
    if (!r.isConfirmed) return;
    try { await apiEliminarPerfil(p.id); cargar(); onCambio(); } catch (e) { Swal.fire("No se eliminó", errorDe(e).mensaje, "error"); }
  };
  return (
    <Seccion titulo="Perfiles y permisos" icono={<AdminPanelSettingsIcon />}
      accion={admin ? <Button variant="contained" onClick={() => setEdit({})} sx={sxBotonPrincipal}>Nuevo perfil</Button> : undefined}>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack spacing={1}>
        {lista.map((p) => {
          const mods = [...new Set(p.acciones.map((a) => nombres.get(a)).filter(Boolean))];
          return (
            <Stack key={p.id} direction="row" alignItems="center" spacing={1.5}
              sx={{ p: 2, borderRadius: "18px", bgcolor: "#fff", border: "1px solid rgba(15,23,42,.06)", boxShadow: "0 8px 24px rgba(15,23,42,.05)", opacity: p.activo ? 1 : 0.55 }}>
              <Avatar sx={{ width: 46, height: 46, background: p.es_admin ? GRADIENTES.pizarra : GRADIENTES.violeta, boxShadow: "0 10px 20px rgba(0,0,0,.10)" }}>
                {p.es_admin ? <LockIcon /> : <AdminPanelSettingsIcon />}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography fontWeight={800} color="#0F172A">{p.nombre}{!p.activo && " (inactivo)"}</Typography>
                <Typography fontSize={12.5} color="#64748B">{p.descripcion ?? ""} · {p.usuarios} usuario(s){!p.es_admin ? ` · ${p.acciones.length} acciones` : ""}</Typography>
                <Stack direction="row" spacing={0.5} mt={0.8} flexWrap="wrap" useFlexGap>
                  {p.es_admin ? <Chip size="small" label="Todos los módulos y acciones" sx={{ bgcolor: "#F1F5F9", fontWeight: 600 }} />
                    : mods.length ? mods.map((m) => <Chip key={m} size="small" label={m} sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }} />)
                    : <Chip size="small" label="Sin módulos" />}
                </Stack>
              </Box>
              {admin && !p.es_admin && <IconButton size="small" onClick={() => setEdit(p)} sx={{ bgcolor: "#EFF6FF", color: "#2563EB" }}><EditIcon fontSize="small" /></IconButton>}
              {admin && !p.es_admin && <IconButton size="small" onClick={() => eliminar(p)} disabled={p.usuarios > 0} sx={{ bgcolor: "#FEF2F2", color: "#DC2626" }}><DeleteOutlineIcon fontSize="small" /></IconButton>}
            </Stack>
          );
        })}
      </Stack>
      {edit && <EditorPerfil perfil={edit} modulos={modulos} onCerrar={() => setEdit(null)} onGuardado={() => { setEdit(null); cargar(); onCambio(); }} />}
    </Seccion>
  );
}

function Usuarios({ admin, onCambio }: { admin: boolean; onCambio: () => void }) {
  const [lista, setLista] = useState<UsuarioPerfil[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const cargar = useCallback(() => Promise.all([apiUsuariosPerfil(), apiPerfiles()]).then(([u, p]) => { setLista(u); setPerfiles(p); }).finally(() => setCargando(false)), []);
  useEffect(() => { cargar(); }, [cargar]);
  const asignar = async (u: UsuarioPerfil, id: number | null) => {
    const destino = perfiles.find((p) => p.id === id);
    const r = await Swal.fire({ title: `Asignar a ${u.nombre || u.email}`, text: destino ? `Perfil ${destino.nombre}: sus módulos quedarán como los permita el perfil.` : "Sin perfil: conserva los módulos que tiene hoy, con todas sus acciones.", showCancelButton: true, confirmButtonText: "Asignar" });
    if (!r.isConfirmed) return;
    try { await apiAsignarPerfil(u.id, id); cargar(); onCambio(); } catch (e) { Swal.fire("No se asignó", errorDe(e).mensaje, "error"); }
  };
  const cols: GridColDef<UsuarioPerfil>[] = [
    { field: "nombre", headerName: "Usuario", flex: 1, minWidth: 160, renderCell: (p) => <Box lineHeight={1.3} py={0.5}><div>{p.row.nombre || "—"}</div><Typography fontSize={11.5} color="text.secondary">{p.row.email}</Typography></Box> },
    { field: "perfil", headerName: "Perfil", width: 210, renderCell: (p) => admin ? (
      <TextField select size="small" fullWidth value={p.row.id_perfil ?? ""} onChange={(e) => asignar(p.row, e.target.value === "" ? null : Number(e.target.value))}>
        <MenuItem value="">Sin perfil (como antes)</MenuItem>
        {perfiles.filter((x) => x.activo).map((x) => <MenuItem key={x.id} value={x.id}>{x.nombre}</MenuItem>)}
      </TextField>) : (p.row.perfil ?? "Sin perfil") },
    { field: "modulos", headerName: "Módulos en su menú", flex: 1.5, minWidth: 200, sortable: false, renderCell: (p) => (
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5} py={0.5}>{p.row.modulos.map((m) => <Chip key={m} size="small" label={m} />)}</Stack>) },
  ];
  return (
    <Seccion titulo="Asignar perfiles" icono={<AssignmentIndIcon />}>
      <Typography fontSize={13} color="text.secondary" mb={1.5}>Los usuarios sin perfil siguen funcionando como antes. Al asignar un perfil, el usuario solo puede hacer lo que el perfil permite (y el servidor lo valida).</Typography>
      <Box sx={{ height: 520 }}><DataGrid rows={lista} columns={cols} loading={cargando} getRowHeight={() => "auto"} disableRowSelectionOnClick density="compact" /></Box>
    </Seccion>
  );
}

function Modulos({ modulos, sistema, onCambio }: { modulos: ModuloCatalogo[]; sistema: boolean; onCambio: () => void }) {
  const [edit, setEdit] = useState<ModuloCatalogo | null>(null);
  const guardar = async () => {
    if (!edit) return;
    try { await apiGuardarModulo(edit.id, edit); setEdit(null); onCambio(); } catch (e) { Swal.fire("No se guardó", errorDe(e).mensaje, "error"); }
  };
  const cols: GridColDef<ModuloCatalogo>[] = [
    { field: "nombre", headerName: "Módulo", flex: 1, minWidth: 150, renderCell: (p) => <Stack direction="row" spacing={1} alignItems="center">{iconMap[p.row.icono ?? ""] ?? null}<span>{p.row.nombre}</span></Stack> },
    { field: "url", headerName: "Identificador", width: 120 },
    { field: "grupo", headerName: "Grupo", width: 130 },
    { field: "descripcion", headerName: "Descripción", flex: 1.5, minWidth: 200 },
    { field: "orden", headerName: "Orden", width: 70 },
    { field: "acciones", headerName: "Acciones", width: 90, valueGetter: (_v, r) => r.acciones.length },
    { field: "estado", headerName: "Estado", width: 230, sortable: false, renderCell: (p) => (
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        <Chip size="small" color={p.row.activo ? "success" : "default"} label={p.row.activo ? "Activo" : "Inactivo"} />
        {!p.row.modulo_sistema && <Chip size="small" variant="outlined" color={p.row.habilitado ? "primary" : "default"} label={p.row.habilitado ? "En este negocio" : "No habilitado"} />}
        {!p.row.modulo_sistema && !componentMap[p.row.url] && <Tooltip title="No hay pantalla para este módulo: no se muestra en el menú"><Chip size="small" color="warning" label="Sin pantalla" /></Tooltip>}
      </Stack>) },
    { field: "editar", headerName: "", width: 60, sortable: false, renderCell: (p) => sistema ? <IconButton size="small" onClick={() => setEdit(p.row)}><EditIcon fontSize="small" /></IconButton> : null },
  ];
  return (
    <Seccion titulo="Catálogo de módulos" icono={<AppsIcon />}>
      <Typography fontSize={13} color="text.secondary" mb={1.5}>
        {sistema ? "Como administración del sistema puedes editar nombre, descripción, ícono, orden y grupo. Los módulos se habilitan por negocio en Negocios → módulos." : "Los módulos se habilitan para el negocio desde la administración del sistema."}
      </Typography>
      <Box sx={{ height: 520 }}><DataGrid rows={modulos} columns={cols} disableRowSelectionOnClick density="compact" getRowHeight={() => "auto"} /></Box>
      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Módulo {edit?.url}</DialogTitle>
        <DialogContent>
          {edit && (
            <Stack spacing={2} mt={1}>
              <TextField label="Nombre" size="small" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
              <TextField label="Descripción" size="small" value={edit.descripcion ?? ""} onChange={(e) => setEdit({ ...edit, descripcion: e.target.value })} />
              <Stack direction="row" spacing={2}>
                <TextField select label="Ícono" size="small" value={edit.icono ?? ""} onChange={(e) => setEdit({ ...edit, icono: e.target.value })} sx={{ flex: 1 }}>
                  {Object.keys(iconMap).map((k) => <MenuItem key={k} value={k}><Stack direction="row" spacing={1} alignItems="center">{iconMap[k]}<span>{k}</span></Stack></MenuItem>)}
                </TextField>
                <TextField label="Orden" size="small" type="number" value={edit.orden} onChange={(e) => setEdit({ ...edit, orden: Number(e.target.value) })} sx={{ width: 100 }} />
              </Stack>
              <TextField label="Grupo" size="small" value={edit.grupo ?? ""} onChange={(e) => setEdit({ ...edit, grupo: e.target.value })} />
              <FormControlLabel control={<Switch checked={edit.activo} onChange={(e) => setEdit({ ...edit, activo: e.target.checked })} />} label="Activo en todo el sistema" />
            </Stack>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setEdit(null)}>Cancelar</Button><Button variant="contained" onClick={guardar}>Guardar</Button></DialogActions>
      </Dialog>
    </Seccion>
  );
}

function Auditoria() {
  const [lista, setLista] = useState<RegistroAuditoria[]>([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => { apiAuditoria().then(setLista).finally(() => setCargando(false)); }, []);
  const cols: GridColDef<RegistroAuditoria>[] = [
    { field: "fecha", headerName: "Fecha", width: 140, valueFormatter: (v) => fecha(v as string) },
    { field: "usuario", headerName: "Quién", width: 170 },
    { field: "tabla", headerName: "Qué", width: 130 },
    { field: "accion", headerName: "Acción", width: 150 },
    { field: "despues", headerName: "Detalle", flex: 1, minWidth: 260, sortable: false, valueGetter: (_v, r) => {
      const d = (r.despues ?? {}) as Record<string, unknown>;
      return String(d.nombre ?? d.perfil ?? d.motivo ?? (r.id_registro ? `#${r.id_registro}` : ""));
    } },
  ];
  return (
    <Seccion titulo="Auditoría de cambios" icono={<HistoryIcon />}>
      <Box sx={{ height: 520 }}><DataGrid rows={lista} columns={cols} loading={cargando} disableRowSelectionOnClick density="compact" /></Box>
    </Seccion>
  );
}

// Permisos: perfiles, asignación, módulos y auditoría en sub-pestañas (compacto)
function Permisos({ modulos, admin, sistema, onCambio }: { modulos: ModuloCatalogo[]; admin: boolean; sistema: boolean; onCambio: () => void }) {
  const [sub, setSub] = useState(0);
  return (
    <Stack spacing={2}>
      <Tabs value={sub} onChange={(_, v) => setSub(v)} variant="scrollable"
        sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 700, borderRadius: 3, mr: 1, bgcolor: "#fff", border: "1px solid #E2E8F0" }, "& .Mui-selected": { bgcolor: "#EFF6FF", borderColor: "#BFDBFE" }, "& .MuiTabs-indicator": { display: "none" } }}>
        <Tab icon={<AdminPanelSettingsIcon fontSize="small" />} iconPosition="start" label="Perfiles" />
        <Tab icon={<AssignmentIndIcon fontSize="small" />} iconPosition="start" label="Asignar perfiles" />
        <Tab icon={<AppsIcon fontSize="small" />} iconPosition="start" label="Módulos" />
        <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Auditoría" />
      </Tabs>
      {!admin && <Alert severity="info" sx={{ borderRadius: 3 }}>Puedes consultar; para cambiar permisos necesitas la acción "Administrar perfiles y permisos".</Alert>}
      {sub === 0 && <Perfiles modulos={modulos} admin={admin} onCambio={onCambio} />}
      {sub === 1 && <Usuarios admin={admin} onCambio={onCambio} />}
      {sub === 2 && <Modulos modulos={modulos} sistema={sistema} onCambio={onCambio} />}
      {sub === 3 && <Auditoria />}
    </Stack>
  );
}

// Configuración del negocio: Mi negocio, Página web, Usuarios y Permisos, según permisos
export default function Configuracion() {
  const { tiene, permisos, listo } = usePermisos();
  const [tab, setTab] = useState<string | null>(null);
  const [modulos, setModulos] = useState<ModuloCatalogo[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([]);
  const [error, setError] = useState<string | null>(null);
  const verUsuarios = tiene("usuarios.ver");
  const verPermisos = tiene("permisos.ver");
  const verNegocio = tiene("negocio.ver");
  const admin = tiene("permisos.administrar");
  const cargar = useCallback(() => {
    if (!verPermisos) return;
    Promise.all([apiCatalogoModulos(), apiPerfiles(), apiUsuariosPerfil()])
      .then(([m, p, u]) => { setModulos(m); setPerfiles(p); setUsuarios(u); setError(null); })
      .catch((e) => setError(errorDe(e).mensaje));
  }, [verPermisos]);
  useEffect(() => { cargar(); }, [cargar]);

  const pestanas = [
    verNegocio && { id: "negocio", label: "Mi negocio", icono: <StoreIcon /> },
    verNegocio && { id: "web", label: "Página web", icono: <LanguageIcon /> },
    tiene("negocio.impresion") && { id: "impresion", label: "Factura e impresión", icono: <PrintIcon /> },
    verUsuarios && { id: "usuarios", label: "Usuarios", icono: <PeopleIcon /> },
    verPermisos && { id: "permisos", label: "Permisos", icono: <AdminPanelSettingsIcon /> },
  ].filter(Boolean) as { id: string; label: string; icono: React.ReactElement }[];
  const actual = tab && pestanas.some((p) => p.id === tab) ? tab : pestanas[0]?.id;
  const habilitados = modulos.filter((m) => m.habilitado && !m.modulo_sistema).length;

  return (
    <Pagina>
      <TarjetaPrincipal icono={<SettingsIcon />} titulo="Configuración"
        descripcion="Datos del negocio, su página web, la factura e impresión, usuarios y perfiles con permisos por acción. Cada cambio queda en la auditoría y el servidor valida los permisos."
        etiquetas={["Mi negocio", "Página web", "Factura e impresión", "Usuarios", "Permisos"]} />
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      {verPermisos && (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, mb: 2 }}>
          <TarjetaIndicador titulo="Usuarios" valor={usuarios.length} subtitulo={`${usuarios.filter((u) => u.id_perfil).length} con perfil`} icono={<PeopleIcon />} color="azul" />
          <TarjetaIndicador titulo="Perfiles" valor={perfiles.filter((p) => p.activo).length} subtitulo={`${perfiles.length} en total`} icono={<AdminPanelSettingsIcon />} color="violeta" />
          <TarjetaIndicador titulo="Módulos" valor={habilitados} subtitulo="habilitados en el negocio" icono={<AppsIcon />} color="verde" />
          <TarjetaIndicador titulo="Sin perfil" valor={usuarios.filter((u) => !u.id_perfil).length} subtitulo="acceso como antes" icono={<AssignmentIndIcon />} color="ambar" />
        </Box>
      )}
      {listo && !pestanas.length && <Alert severity="info">No tienes acceso a esta sección.</Alert>}
      {!!pestanas.length && (
        <TarjetaPestanas>
          <Tabs value={actual} onChange={(_, v) => setTab(v)} variant="scrollable">
            {pestanas.map((p) => <Tab key={p.id} value={p.id} icon={p.icono} iconPosition="start" label={p.label} />)}
          </Tabs>
          <Divider />
          <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: "#F8FAFC" }}>
            {actual === "negocio" && <DatosDelNegocio puedeEditar={tiene("negocio.editar")} />}
            {actual === "web" && <PaginaWebDelNegocio puedeEditar={tiene("negocio.sitio")} />}
            {actual === "impresion" && <Box sx={{ bgcolor: "#fff", borderRadius: "22px", p: { xs: 1.5, md: 2.5 } }}><SeccionImpresion idNegocio={null} propio /></Box>}
            {actual === "usuarios" && <Box sx={{ bgcolor: "#fff", borderRadius: "22px" }}><AdminUsuarios incrustado /></Box>}
            {actual === "permisos" && <Permisos modulos={modulos} admin={admin} sistema={Boolean(permisos?.admin_sistema)} onCambio={cargar} />}
          </Box>
        </TarjetaPestanas>
      )}
    </Pagina>
  );
}
