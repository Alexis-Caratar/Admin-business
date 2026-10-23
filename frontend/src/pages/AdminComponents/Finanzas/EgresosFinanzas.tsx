/* Egresos de caja: clasificarlos para que cuenten bien (gasto, insumo o movimiento de dinero).
   El sistema sugiere la categoría por palabras de la descripción; el administrador confirma. */
import { useMemo, useState } from "react";
import { Alert, Box, Button, Chip, InputAdornment, ListSubheader, MenuItem, Stack, Switch, FormControlLabel, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SearchIcon from "@mui/icons-material/Search";
import Swal from "sweetalert2";
import { errorDe, fin } from "../../../api/finanzas";
import type { Categoria, Egreso } from "../../../api/finanzas";
import { Seccion } from "../../../components/pedidos/DisenoPedidos";
import { GRUPOS, fechaCorta, pesos } from "./finanzasUtil";
import { useDatos } from "./useDatos";

const opciones = (cats: Categoria[]) => Object.entries(GRUPOS).filter(([g]) => cats.some((c) => c.grupo === g)).flatMap(([g, n]) => [
  <ListSubheader key={`h-${g}`}>{n}</ListSubheader>,
  ...cats.filter((c) => c.grupo === g).map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>),
]);

export default function EgresosFinanzas({ desde, hasta }: { desde: string; hasta: string }) {
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [q, setQ] = useState("");
  const { datos: cats } = useDatos(() => fin.categorias(), []);
  const { datos, error, cargando, recargar } = useDatos(() => fin.egresos({ desde, hasta, sin_clasificar: soloPendientes ? "1" : "" }), [desde, hasta, soloPendientes]);
  const [cambios, setCambios] = useState<Record<number, number | "">>({});
  const filas = useMemo(() => (datos ?? []).filter((e) => !q || e.descripcion.toLowerCase().includes(q.toLowerCase())), [datos, q]);
  const conSugerencia = filas.filter((e) => e.sugerencia && !e.categoria_confirmada);
  const sinClasificar = filas.filter((e) => !e.categoria_confirmada && !e.id_compra).reduce((a, e) => a + e.monto, 0);

  const guardar = async (lista: { id: number; id_categoria: number | null }[]) => {
    if (!lista.length) return;
    try {
      const r = await fin.clasificar(lista);
      setCambios({});
      Swal.fire({ icon: "success", title: `${r.clasificados} egreso(s) clasificado(s)`, timer: 1500, showConfirmButton: false });
      recargar();
    } catch (e) { Swal.fire("Error", errorDe(e).mensaje, "error"); }
  };

  const columnas: GridColDef<Egreso>[] = [
    { field: "fecha", headerName: "Fecha", width: 110, valueFormatter: (v: string) => fechaCorta(v) },
    { field: "descripcion", headerName: "Descripción", flex: 1, minWidth: 180 },
    { field: "monto", headerName: "Monto", width: 110, type: "number", valueFormatter: (v: number) => pesos(v) },
    { field: "categoria", headerName: "Categoría", width: 300, sortable: false, renderCell: ({ row }) => {
      if (row.id_compra) return <Chip size="small" label="Pago de compra (inventario)" color="info" variant="outlined" />;
      if (row.id_gasto) return <Chip size="small" label={`Pago de gasto · ${row.categoria ?? ""}`} color="success" variant="outlined" />;
      const valor = cambios[row.id] ?? (row.categoria_confirmada ? row.id_categoria ?? "" : row.sugerencia?.id_categoria ?? "");
      return (
        <TextField select size="small" fullWidth value={valor} onChange={(e) => setCambios((c) => ({ ...c, [row.id]: e.target.value === "" ? "" : Number(e.target.value) }))}
          SelectProps={{ displayEmpty: true }} sx={{ "& .MuiInputBase-root": { fontSize: 13, height: 34, bgcolor: !row.categoria_confirmada && row.sugerencia && cambios[row.id] === undefined ? "#FFFBEB" : undefined } }}>
          <MenuItem value=""><em>Sin clasificar</em></MenuItem>
          {opciones(cats ?? [])}
        </TextField>
      );
    } },
    { field: "estado", headerName: "", width: 120, renderCell: ({ row }) => row.categoria_confirmada || row.id_compra || row.id_gasto
      ? <Chip size="small" label="Clasificado" color="success" />
      : row.sugerencia ? <Chip size="small" label="Sugerido" color="warning" /> : <Chip size="small" label="Pendiente" /> },
  ];

  const pendientesGuardar = Object.entries(cambios).map(([id, c]) => ({ id: Number(id), id_categoria: c === "" ? null : c }));
  return (
    <Seccion titulo="Egresos de caja" accion={
      <Stack direction="row" spacing={1}>
        <Button size="small" startIcon={<AutoFixHighIcon />} disabled={!conSugerencia.length} sx={{ textTransform: "none" }}
          onClick={() => guardar(conSugerencia.filter((e) => cambios[e.id] === undefined).map((e) => ({ id: e.id, id_categoria: e.sugerencia!.id_categoria })))}>
          Aceptar {conSugerencia.length} sugerencia(s)
        </Button>
        <Button size="small" variant="contained" disabled={!pendientesGuardar.length} onClick={() => guardar(pendientesGuardar)} sx={{ textTransform: "none", borderRadius: 2 }}>
          Guardar cambios ({pendientesGuardar.length})
        </Button>
      </Stack>
    }>
      <Typography sx={{ fontSize: 12.5, color: "#64748B", mb: 1.5 }}>
        Clasifica lo que se paga desde la caja: <b>gastos</b> (nómina, servicios…), <b>insumos</b> (leche, pollo… cuentan como costo) o <b>movimientos de dinero</b>
        (traslados de base, retiros), que no son gasto. Lo que queda sin clasificar no entra en los cálculos.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
        <TextField size="small" placeholder="Buscar descripción" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 240 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <FormControlLabel control={<Switch checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />} label="Solo sin clasificar" />
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 13, color: "#64748B" }}>Sin clasificar en la lista: <b>{pesos(sinClasificar)}</b></Typography>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Box sx={{ height: 560 }}>
        <DataGrid rows={filas} columns={columnas} loading={cargando} density="compact" disableRowSelectionOnClick rowHeight={46}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }} pageSizeOptions={[25, 50, 100]}
          localeText={{ noRowsLabel: soloPendientes ? "No hay egresos por clasificar en el período 🎉" : "No hay egresos en el período" }} sx={{ border: 0 }} />
      </Box>
    </Seccion>
  );
}
