/* Administración de tiqueteras (pestaña de Ventas): tipos, tiqueteras vendidas, consumos y qué se paga con ellas. */
import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem, Stack, Switch, Tab, Tabs,
  TextField, Tooltip, Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import HistoryIcon from "@mui/icons-material/History";
import BlockIcon from "@mui/icons-material/Block";
import EditIcon from "@mui/icons-material/Edit";
import QRCode from "react-qr-code";
import Swal from "sweetalert2";
import {
  apiAnularTiquetera, apiElegibilidad, apiGuardarElegibilidad, apiGuardarTipo, apiHistorialTiqueteras, apiListarTiqueteras, apiTiposTiquetera,
  enlacePortal, errorDe, type Elegibilidad, type TipoTiquetera, type Tiquetera,
} from "../../../../api/tiqueteras";
import { Seccion } from "../../../../components/pedidos/DisenoPedidos";
import { useDatos } from "../../Finanzas/useDatos";

const cop = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;
const fecha = (v: string | null) => (v ? new Date(v).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "");
const ESTADO: Record<string, "success" | "default" | "error" | "warning"> = { ACTIVA: "success", AGOTADA: "default", ANULADA: "error", VENCIDA: "warning" };
const estadoDe = (t: Tiquetera) => (t.vencida && t.estado === "ACTIVA" ? "VENCIDA" : t.estado);

/* ------------------------------- Tipos -------------------------------- */
function Tipos() {
  const { datos, error, recargar } = useDatos(apiTiposTiquetera, []);
  const [edit, setEdit] = useState<Partial<TipoTiquetera> | null>(null);
  const guardar = async () => {
    if (!edit) return;
    try {
      await apiGuardarTipo({ ...edit, almuerzos: Number(edit.almuerzos), precio: Number(edit.precio), vigencia_dias: edit.vigencia_dias ? Number(edit.vigencia_dias) : null });
      setEdit(null); recargar();
    } catch (e) { Swal.fire("No se guardó", errorDe(e).mensaje, "error"); }
  };
  return (
    <Seccion titulo="Tipos de tiquetera" icono={<ConfirmationNumberIcon />}
      accion={<Button size="small" variant="contained" onClick={() => setEdit({ nombre: "", almuerzos: 20, precio: 0, vigencia_dias: null, activo: true })} sx={{ textTransform: "none", borderRadius: 2 }}>Nuevo tipo</Button>}>
      {error && <Alert severity="error">{error}</Alert>}
      {datos && !datos.length && <Typography color="text.secondary" fontSize={13}>Crea el primero, por ejemplo “Tiquetera 30 almuerzos”. El cajero la vende desde la caja.</Typography>}
      <Stack spacing={1}>
        {datos?.map((t) => (
          <Stack key={t.id} direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.25, borderRadius: 2, border: "1px solid #EEF2F7", opacity: t.activo ? 1 : 0.55 }}>
            <Box flex={1} minWidth={0}>
              <Typography fontWeight={700} fontSize={14}>{t.nombre}{!t.activo && " (inactivo)"}</Typography>
              <Typography fontSize={12.5} color="text.secondary">
                {t.almuerzos} almuerzos · {cop(t.precio)} · {cop(t.precio / t.almuerzos)} c/u · {t.vigencia_dias ? `vence a los ${t.vigencia_dias} días` : "sin vencimiento"}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setEdit(t)}><EditIcon fontSize="small" /></IconButton>
          </Stack>
        ))}
      </Stack>
      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="xs">
        <DialogTitle>{edit?.id ? "Editar tipo" : "Nuevo tipo de tiquetera"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nombre" size="small" value={edit?.nombre ?? ""} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
            <Stack direction="row" spacing={1.5}>
              <TextField label="Almuerzos" size="small" type="number" value={edit?.almuerzos ?? ""} onChange={(e) => setEdit({ ...edit, almuerzos: Number(e.target.value) })} />
              <TextField label="Precio" size="small" type="number" value={edit?.precio ?? ""} onChange={(e) => setEdit({ ...edit, precio: Number(e.target.value) })} />
            </Stack>
            <TextField label="Vigencia en días (vacío = no vence)" size="small" type="number" value={edit?.vigencia_dias ?? ""}
              onChange={(e) => setEdit({ ...edit, vigencia_dias: e.target.value === "" ? null : Number(e.target.value) })} />
            {edit?.id && <Stack direction="row" alignItems="center"><Switch checked={!!edit.activo} onChange={(e) => setEdit({ ...edit, activo: e.target.checked })} /><Typography fontSize={14}>Se puede vender</Typography></Stack>}
            {!!edit?.almuerzos && !!edit?.precio && <Typography fontSize={12.5} color="text.secondary">Cada almuerzo queda en {cop(Number(edit.precio) / Number(edit.almuerzos))}. Cambiar el precio no afecta las ya vendidas.</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setEdit(null)}>Cancelar</Button><Button variant="contained" onClick={guardar}>Guardar</Button></DialogActions>
      </Dialog>
    </Seccion>
  );
}

/* ----------------------- Tiqueteras vendidas ----------------------- */
function Vendidas({ onHistorial }: { onHistorial: (t: Tiquetera) => void }) {
  const [estado, setEstado] = useState("");
  const [q, setQ] = useState("");
  const { datos, error, cargando, recargar } = useDatos(() => apiListarTiqueteras({ estado: estado || undefined, q: q.trim() || undefined }), [estado, q]);
  const [qr, setQr] = useState<Tiquetera | null>(null);

  const anular = async (t: Tiquetera) => {
    const r = await Swal.fire({
      title: `Anular ${t.codigo}`, input: "text", inputLabel: "Motivo (queda registrado)", showCancelButton: true, confirmButtonText: "Anular", confirmButtonColor: "#d32f2f",
      inputValidator: (v) => (v.trim().length < 3 ? "Escribe el motivo" : null),
    });
    if (!r.isConfirmed) return;
    try {
      const res = await apiAnularTiquetera(t.id, r.value);
      Swal.fire({ icon: "success", title: "Tiquetera anulada", text: `Valor pagado: ${cop(res.reembolso)}. ${res.nota}` });
      recargar();
    } catch (e) { Swal.fire("No se anuló", errorDe(e).mensaje, "error"); }
  };

  const total = useMemo(() => (datos ?? []).reduce((a, t) => ({ vendido: a.vendido + (t.estado !== "ANULADA" ? t.valor_pagado : 0), saldo: a.saldo + (t.estado === "ACTIVA" && !t.vencida ? t.disponibles * t.valor_almuerzo : 0) }), { vendido: 0, saldo: 0 }), [datos]);

  const cols: GridColDef<Tiquetera>[] = [
    { field: "codigo", headerName: "Código", width: 110 },
    { field: "cliente", headerName: "Cliente", flex: 1, minWidth: 170, renderCell: (p) => <Box lineHeight={1.3} py={0.5}><div>{p.row.cliente}</div><Typography fontSize={11.5} color="text.secondary">{p.row.identificacion}{p.row.telefono ? ` · ${p.row.telefono}` : ""}</Typography></Box> },
    { field: "tipo", headerName: "Tipo", width: 160 },
    { field: "disponibles", headerName: "Saldo", width: 150, renderCell: (p) => (
      <Box width="100%"><Typography fontSize={13} fontWeight={700}>{p.row.disponibles} de {p.row.almuerzos_total}</Typography>
        <LinearProgress variant="determinate" value={(p.row.consumidos / p.row.almuerzos_total) * 100} sx={{ height: 5, borderRadius: 3 }} /></Box>) },
    { field: "valor_pagado", headerName: "Pagado", width: 120, renderCell: (p) => <Box lineHeight={1.3} py={0.5}><div>{cop(p.row.valor_pagado)}</div><Typography fontSize={11.5} color="text.secondary">{p.row.metodo_pago}</Typography></Box> },
    { field: "fecha_compra", headerName: "Compra", width: 130, valueFormatter: (v) => fecha(v as string) },
    { field: "fecha_vencimiento", headerName: "Vence", width: 105, valueFormatter: (v) => (v as string) ?? "—" },
    { field: "estado", headerName: "Estado", width: 110, renderCell: (p) => <Chip size="small" color={ESTADO[estadoDe(p.row)]} label={estadoDe(p.row)} /> },
    { field: "acciones", headerName: "", width: 130, sortable: false, renderCell: (p) => (
      <Stack direction="row">
        <Tooltip title="Consumos"><IconButton size="small" onClick={() => onHistorial(p.row)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="QR y enlace del portal"><IconButton size="small" onClick={() => setQr(p.row)}><QrCode2Icon fontSize="small" /></IconButton></Tooltip>
        {p.row.estado !== "ANULADA" && (
          <Tooltip title={p.row.consumidos > 0 ? "Tiene consumos: anula primero las ventas" : "Anular"}>
            <span><IconButton size="small" color="error" disabled={p.row.consumidos > 0} onClick={() => anular(p.row)}><BlockIcon fontSize="small" /></IconButton></span>
          </Tooltip>
        )}
      </Stack>) },
  ];

  return (
    <Seccion titulo="Tiqueteras vendidas" icono={<ConfirmationNumberIcon />}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mb={1.5}>
        <TextField size="small" label="Buscar" placeholder="Código, nombre, documento o teléfono" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flex: 1 }} />
        <TextField select size="small" label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Todas</MenuItem><MenuItem value="ACTIVA">Activas</MenuItem><MenuItem value="AGOTADA">Agotadas</MenuItem><MenuItem value="ANULADA">Anuladas</MenuItem>
        </TextField>
      </Stack>
      <Stack direction="row" spacing={3} mb={1.5}>
        <Box><Typography fontSize={12} color="text.secondary">Vendido (no anuladas)</Typography><Typography fontWeight={800}>{cop(total.vendido)}</Typography></Box>
        <Tooltip title="Almuerzos que los clientes ya pagaron y aún no han consumido, al valor prepagado">
          <Box><Typography fontSize={12} color="text.secondary">Almuerzos por entregar</Typography><Typography fontWeight={800}>{cop(total.saldo)}</Typography></Box>
        </Tooltip>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Box sx={{ height: 520 }}>
        <DataGrid rows={datos ?? []} columns={cols} loading={cargando} getRowHeight={() => "auto"} disableRowSelectionOnClick density="compact"
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} pageSizeOptions={[25, 50, 100]} />
      </Box>
      <Dialog open={!!qr} onClose={() => setQr(null)}>
        <DialogTitle>{qr?.codigo} · {qr?.cliente}</DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          {qr && <><Box sx={{ p: 2, bgcolor: "#fff", display: "inline-block" }}><QRCode value={enlacePortal(qr.token_portal)} size={200} /></Box>
            <Typography fontSize={12} sx={{ wordBreak: "break-all" }}>{enlacePortal(qr.token_portal)}</Typography></>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => qr && navigator.clipboard?.writeText(enlacePortal(qr.token_portal))}>Copiar enlace</Button>
          <Button onClick={() => setQr(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Seccion>
  );
}

/* ------------------------------ Consumos ------------------------------ */
function Consumos({ tiquetera, onQuitar }: { tiquetera: Tiquetera | null; onQuitar: () => void }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const { datos, error, cargando } = useDatos(() => apiHistorialTiqueteras({ id_tiquetera: tiquetera?.id, desde: desde || undefined, hasta: hasta || undefined }), [tiquetera?.id, desde, hasta]);
  const cols: GridColDef[] = [
    { field: "fecha", headerName: "Fecha", width: 140, valueFormatter: (v) => fecha(v as string) },
    { field: "codigo", headerName: "Tiquetera", width: 105 },
    { field: "cliente", headerName: "Cliente", flex: 1, minWidth: 150 },
    { field: "producto", headerName: "Producto", flex: 1, minWidth: 150 },
    { field: "cantidad", headerName: "Cant.", width: 70 },
    { field: "valor_almuerzo", headerName: "Valor", width: 100, valueFormatter: (v) => cop(v as number) },
    { field: "numero_factura", headerName: "Factura", width: 120 },
    { field: "cajero", headerName: "Cajero", width: 150 },
    { field: "estado", headerName: "Estado", width: 220, renderCell: (p) => p.row.estado === "REINTEGRADO"
      ? <Tooltip title={`${fecha(p.row.reintegrado_en)} · ${p.row.reintegrado_por ?? ""}${p.row.motivo_reintegro ? ` · ${p.row.motivo_reintegro}` : ""}`}><Chip size="small" color="warning" label="Reintegrado (venta anulada)" /></Tooltip>
      : <Chip size="small" color="success" label="Consumido" /> },
  ];
  return (
    <Seccion titulo="Consumos" icono={<HistoryIcon />}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mb={1.5} alignItems={{ sm: "center" }}>
        {tiquetera && <Chip label={`${tiquetera.codigo} · ${tiquetera.cliente}`} onDelete={onQuitar} color="primary" />}
        <TextField size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }} value={desde} onChange={(e) => setDesde(e.target.value)} />
        <TextField size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }} value={hasta} onChange={(e) => setHasta(e.target.value)} />
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Box sx={{ height: 520 }}>
        <DataGrid rows={datos ?? []} columns={cols} loading={cargando} disableRowSelectionOnClick density="compact"
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} pageSizeOptions={[25, 50, 100]} />
      </Box>
    </Seccion>
  );
}

/* ---------------------- Qué se paga con tiquetera ---------------------- */
function Elegibles() {
  const { datos, error, recargar } = useDatos(apiElegibilidad, []);
  const [cambios, setCambios] = useState<Elegibilidad | null>(null);
  const [filtro, setFiltro] = useState("");
  const e = cambios ?? datos;
  const catElegible = (nombre: string) => e?.categorias.find((c) => c.nombre === nombre)?.tiquetera_elegible ?? false;
  const productos = (e?.productos ?? []).filter((p) => !filtro || `${p.nombre} ${p.categoria}`.toLowerCase().includes(filtro.toLowerCase()));

  const guardar = async () => {
    if (!cambios) return;
    try {
      await apiGuardarElegibilidad({ categorias: cambios.categorias.map((c) => ({ id: c.id, tiquetera_elegible: c.tiquetera_elegible })), productos: cambios.productos.map((p) => ({ id: p.id, excepcion: p.excepcion })) });
      setCambios(null); await recargar();
      Swal.fire({ icon: "success", title: "Guardado", timer: 1300, showConfirmButton: false });
    } catch (er) { Swal.fire("No se guardó", errorDe(er).mensaje, "error"); }
  };
  const base = () => structuredClone(e!) as Elegibilidad;

  return (
    <Seccion titulo="Qué se paga con tiquetera" icono={<ConfirmationNumberIcon />}
      accion={<Button size="small" variant="contained" disabled={!cambios} onClick={guardar} sx={{ textTransform: "none", borderRadius: 2 }}>Guardar</Button>}>
      <Typography fontSize={12.5} color="text.secondary" mb={1.5}>
        Cada plato de una categoría elegible descuenta 1 almuerzo. Los complementos (sopa del día, jugo, fruta…) van incluidos y no descuentan: un almuerzo completo cuenta 1. Con una excepción (Siempre / Nunca) cambias un producto puntual. Lo que tiene precio y no se paga con tiquetera se cobra con otro medio.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography fontWeight={700} fontSize={13} mb={1}>Categorías</Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} mb={2}>
        {e?.categorias.map((c, i) => (
          <Chip key={c.id} label={c.nombre} color={c.tiquetera_elegible ? "primary" : "default"} variant={c.tiquetera_elegible ? "filled" : "outlined"}
            onClick={() => { const n = base(); n.categorias[i].tiquetera_elegible = !c.tiquetera_elegible; setCambios(n); }} />
        ))}
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <Typography fontWeight={700} fontSize={13} flex={1}>Productos</Typography>
        <TextField size="small" placeholder="Filtrar" value={filtro} onChange={(ev) => setFiltro(ev.target.value)} />
      </Stack>
      <Box sx={{ maxHeight: 420, overflowY: "auto" }}>
        {productos.map((p) => {
          const i = e!.productos.findIndex((x) => x.id === p.id);
          const valor = p.excepcion === null ? "" : p.excepcion ? "si" : "no";
          const efectivo = p.excepcion ?? (catElegible(p.categoria) && !p.es_complemento);
          return (
            <Stack key={p.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.75, borderBottom: "1px solid #EEF2F7" }}>
              <Box flex={1} minWidth={0}>
                <Typography fontSize={13.5} noWrap>{p.nombre}</Typography>
                <Typography fontSize={11.5} color="text.secondary">{p.categoria}</Typography>
              </Box>
              <Chip size="small" label={efectivo ? "Descuenta 1" : p.es_complemento && p.excepcion === null ? "Complemento: incluido" : "Cobro normal"} color={efectivo ? "primary" : "default"} variant="outlined" />
              <TextField select size="small" value={valor} sx={{ width: 170 }}
                onChange={(ev) => { const n = base(); n.productos[i].excepcion = ev.target.value === "" ? null : ev.target.value === "si"; setCambios(n); }}>
                <MenuItem value="">Como su categoría</MenuItem><MenuItem value="si">Siempre</MenuItem><MenuItem value="no">Nunca</MenuItem>
              </TextField>
            </Stack>
          );
        })}
      </Box>
    </Seccion>
  );
}

export default function AdminTiqueteras() {
  const [vista, setVista] = useState(0);
  const [tiq, setTiq] = useState<Tiquetera | null>(null);
  return (
    <Stack spacing={2}>
      <Tabs value={vista} onChange={(_, v) => setVista(v)} variant="scrollable">
        <Tab label="Tiqueteras" /><Tab label="Consumos" /><Tab label="Tipos" /><Tab label="Productos" />
      </Tabs>
      {vista === 0 && <Vendidas onHistorial={(t) => { setTiq(t); setVista(1); }} />}
      {vista === 1 && <Consumos tiquetera={tiq} onQuitar={() => setTiq(null)} />}
      {vista === 2 && <Tipos />}
      {vista === 3 && <Elegibles />}
    </Stack>
  );
}
