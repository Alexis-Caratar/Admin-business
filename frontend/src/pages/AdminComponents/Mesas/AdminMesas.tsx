// Gestión de mesas: crear, editar, activar/desactivar y ver su estado real
// (comanda abierta, mesero responsable, cuenta pendiente).
import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Switch, TextField, Tooltip } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import Swal from "sweetalert2";
import { apiActivarMesa, apiGuardarMesa, apiMesasAdmin, errorDe, ESTADO_MESA, type MesaEstado } from "../../../api/comandas";
import { useEventosComandas } from "../../../components/comandas/useComandas";
import { usePermisos } from "../../../hooks/usePermisos";
import { Pagina, Seccion, TarjetaIndicador, TarjetaPrincipal } from "../../../components/pedidos/DisenoPedidos";
import { sxBotonPrincipal } from "../../../components/pedidos/pedidosUtil";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PaymentsIcon from "@mui/icons-material/Payments";
import BlockIcon from "@mui/icons-material/Block";

export default function AdminMesas() {
  const { tiene } = usePermisos();
  const [mesas, setMesas] = useState<MesaEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ id?: number; nombre: string; capacidad: number } | null>(null);

  const cargar = useCallback(() => apiMesasAdmin().then((m) => { setMesas(m); setError(null); }).catch((e) => setError(errorDe(e).mensaje)).finally(() => setCargando(false)), []);
  useEffect(() => { cargar(); }, [cargar]);
  useEventosComandas(useCallback(() => { cargar(); }, [cargar]), true);

  const guardar = async () => {
    if (!edit) return;
    try { await apiGuardarMesa(edit); setEdit(null); cargar(); }
    catch (e) { Swal.fire("No se guardó", errorDe(e).mensaje, "error"); }
  };
  const activar = async (m: MesaEstado, activo: boolean) => {
    try { await apiActivarMesa(m.id, activo); cargar(); }
    catch (e) { Swal.fire("No se pudo", errorDe(e).mensaje, "error"); }
  };

  const cols: GridColDef<MesaEstado>[] = [
    { field: "nombre", headerName: "Mesa", flex: 1, minWidth: 120 },
    { field: "capacidad", headerName: "Personas", width: 100 },
    { field: "estado_operativo", headerName: "Estado", width: 170, renderCell: (p) => {
      if (!p.row.activo) return <Chip size="small" label="Desactivada" />;
      const e = ESTADO_MESA[p.row.estado_operativo];
      return <Chip size="small" label={e.texto} sx={{ bgcolor: e.fondo, color: e.color, fontWeight: 700 }} />;
    } },
    { field: "mesero", headerName: "Mesero responsable", flex: 1, minWidth: 160, valueGetter: (_v, r) => r.mesero ?? "—" },
    { field: "numero_comanda", headerName: "Comanda", width: 150, renderCell: (p) => p.row.id_comanda
      ? `#${p.row.numero_comanda} · ${p.row.estado_comanda === "EN_COBRO" ? "en cobro" : "abierta"}`
      : p.row.id_venta_pendiente ? "Cuenta pendiente (caja)" : "—" },
    { field: "activo", headerName: "Activa", width: 90, sortable: false, renderCell: (p) => (
      <Tooltip title={tiene("mesas.desactivar") ? "" : "Sin permiso"}>
        <span><Switch size="small" checked={p.row.activo} disabled={!tiene("mesas.desactivar")} onChange={(e) => activar(p.row, e.target.checked)} /></span>
      </Tooltip>) },
    { field: "acciones", headerName: "", width: 60, sortable: false, renderCell: (p) => tiene("mesas.editar")
      ? <IconButton size="small" onClick={() => setEdit({ id: p.row.id, nombre: p.row.nombre, capacidad: p.row.capacidad })}><EditIcon fontSize="small" /></IconButton> : null },
  ];

  const activas = mesas.filter((m) => m.activo);
  const cuenta = (e: string) => activas.filter((m) => m.estado_operativo === e).length;
  return (
    <Pagina>
      <TarjetaPrincipal icono={<TableRestaurantIcon />} titulo="Gestión de mesas"
        descripcion="Mesas del restaurante con su estado real: comanda abierta, mesero responsable y cuentas pendientes de cobro. Una mesa en uso no se puede desactivar."
        etiquetas={["Mesas", "Meseros", "Comandas", "Cobro en caja"]}
        acciones={tiene("mesas.crear") ? <Button variant="contained" onClick={() => setEdit({ nombre: "", capacidad: 4 })} sx={sxBotonPrincipal}>Nueva mesa</Button> : undefined} />
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, mb: 2 }}>
        <TarjetaIndicador titulo="Activas" valor={activas.length} subtitulo={`${activas.reduce((a, m) => a + m.capacidad, 0)} puestos`} icono={<TableRestaurantIcon />} color="azul" />
        <TarjetaIndicador titulo="Disponibles" valor={cuenta("DISPONIBLE")} icono={<EventSeatIcon />} color="verde" />
        <TarjetaIndicador titulo="Con pedido" valor={cuenta("CON_PEDIDO")} subtitulo="comanda en cocina" icono={<RestaurantIcon />} color="ambar" />
        <TarjetaIndicador titulo="Por cobrar" valor={cuenta("PENDIENTE_PAGO")} subtitulo="cuenta en caja" icono={<PaymentsIcon />} color="violeta" />
        <TarjetaIndicador titulo="Desactivadas" valor={mesas.length - activas.length} icono={<BlockIcon />} color="pizarra" />
      </Box>
      <Seccion titulo="Mesas del restaurante" icono={<TableRestaurantIcon />}>
        <Box sx={{ height: 560 }}>
          <DataGrid rows={mesas} columns={cols} loading={cargando} disableRowSelectionOnClick density="compact" hideFooter={mesas.length <= 100}
            sx={{ border: "1px solid #EEF2F7", borderRadius: 3, "& .MuiDataGrid-columnHeaders": { bgcolor: "#F8FAFC" } }} />
        </Box>
      </Seccion>
      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>{edit?.id ? "Editar mesa" : "Nueva mesa"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nombre o número" size="small" autoFocus value={edit?.nombre ?? ""} onChange={(e) => edit && setEdit({ ...edit, nombre: e.target.value })} inputProps={{ maxLength: 50 }} />
            <TextField label="Capacidad (personas)" size="small" type="number" value={edit?.capacidad ?? 4} onChange={(e) => edit && setEdit({ ...edit, capacidad: Number(e.target.value) })} />
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setEdit(null)}>Cancelar</Button><Button variant="contained" onClick={guardar}>Guardar</Button></DialogActions>
      </Dialog>
    </Pagina>
  );
}
