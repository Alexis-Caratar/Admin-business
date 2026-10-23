/* Gastos: del período, por pagar y recurrentes (con proyección y generación mensual). */
import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, InputAdornment, ListSubheader, MenuItem,
  Stack, Switch, Tab, Tabs, TextField, Tooltip, Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import PaymentsIcon from "@mui/icons-material/Payments";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import DownloadIcon from "@mui/icons-material/Download";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import SearchIcon from "@mui/icons-material/Search";
import Swal from "sweetalert2";
import { errorDe, fin } from "../../../api/finanzas";
import type { Categoria, Gasto, Recurrente } from "../../../api/finanzas";
import { Seccion } from "../../../components/pedidos/DisenoPedidos";
import { GRUPOS, exportarCSV, fechaCorta, hoy, mesCorto, pesos } from "./finanzasUtil";
import { useDatos } from "./useDatos";

const COLOR: Record<string, "default" | "success" | "warning" | "error" | "info"> = { PENDIENTE: "warning", PARCIAL: "info", PAGADO: "success", ANULADO: "default" };

export default function GastosFinanzas({ desde, hasta }: { desde: string; hasta: string }) {
  const [vista, setVista] = useState(0);
  const { datos: cats } = useDatos(() => fin.categorias(), []);
  return (
    <Stack spacing={2}>
      <Tabs value={vista} onChange={(_, v) => setVista(v)} sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}>
        <Tab label="Gastos del período" />
        <Tab label="Por pagar" />
        <Tab label="Recurrentes" />
      </Tabs>
      {vista === 0 && <ListaGastos filtroBase={{ desde, hasta }} categorias={cats ?? []} titulo={`Gastos de ${mesCorto(desde)}${desde.slice(0, 7) !== hasta.slice(0, 7) ? ` a ${mesCorto(hasta)}` : ""}`} />}
      {vista === 1 && <ListaGastos filtroBase={{ estado: "POR_PAGAR" }} categorias={cats ?? []} titulo="Gastos pendientes de pago (todos los períodos)" />}
      {vista === 2 && <Recurrentes categorias={cats ?? []} />}
    </Stack>
  );
}

/* ------------------------------ Lista ------------------------------ */
function ListaGastos({ filtroBase, categorias, titulo }: { filtroBase: Record<string, string>; categorias: Categoria[]; titulo: string }) {
  const [grupo, setGrupo] = useState("");
  const [q, setQ] = useState("");
  const { datos, error, cargando, recargar } = useDatos(() => fin.gastos({ ...filtroBase, grupo }), [JSON.stringify(filtroBase), grupo]);
  const [editar, setEditar] = useState<Gasto | null | "nuevo">(null);
  const [pagar, setPagar] = useState<Gasto | null>(null);
  const filas = useMemo(() => (datos ?? []).filter((g) => !q || `${g.concepto} ${g.beneficiario ?? ""} ${g.categoria}`.toLowerCase().includes(q.toLowerCase())), [datos, q]);
  const total = filas.reduce((a, g) => a + g.valor, 0);
  const saldo = filas.reduce((a, g) => a + g.saldo, 0);

  const anular = async (g: Gasto) => {
    const r = await Swal.fire({ title: `Anular "${g.concepto}"`, input: "text", inputLabel: "Motivo", showCancelButton: true, confirmButtonText: "Anular", cancelButtonText: "Cancelar", inputValidator: (v) => (!v ? "Escribe el motivo" : null) });
    if (!r.isConfirmed) return;
    try { await fin.anularGasto(g.id, r.value); recargar(); } catch (e) { Swal.fire("No se pudo anular", errorDe(e).mensaje, "error"); }
  };

  const columnas: GridColDef<Gasto>[] = [
    { field: "periodo", headerName: "Mes", width: 90, valueFormatter: (v: string) => mesCorto(v) },
    { field: "concepto", headerName: "Concepto", flex: 1, minWidth: 180 },
    { field: "categoria", headerName: "Categoría", width: 190, renderCell: ({ row }) => <Box><Typography sx={{ fontSize: 13 }}>{row.categoria}</Typography><Typography sx={{ fontSize: 11, color: "#94A3B8" }}>{GRUPOS[row.grupo]}</Typography></Box> },
    { field: "valor", headerName: "Valor", width: 120, type: "number", valueFormatter: (v: number) => pesos(v) },
    { field: "saldo", headerName: "Saldo", width: 120, type: "number", valueFormatter: (v: number) => pesos(v) },
    { field: "fecha_vencimiento", headerName: "Vence", width: 150, renderCell: ({ row }) => row.fecha_vencimiento ? (
      <Stack direction="row" spacing={0.5} alignItems="center"><span>{fechaCorta(row.fecha_vencimiento)}</span>{row.vencido && <Chip size="small" color="error" label="Vencido" />}{row.por_vencer && <Chip size="small" color="warning" label="Pronto" />}</Stack>
    ) : "—" },
    { field: "estado", headerName: "Estado", width: 110, renderCell: ({ row }) => <Chip size="small" label={row.estado} color={COLOR[row.estado]} /> },
    { field: "acciones", headerName: "", width: 130, sortable: false, renderCell: ({ row }) => row.estado === "ANULADO" ? null : (
      <Stack direction="row">
        {row.estado !== "PAGADO" && <Tooltip title="Registrar pago"><IconButton size="small" color="success" onClick={() => setPagar(row)}><PaymentsIcon fontSize="small" /></IconButton></Tooltip>}
        <Tooltip title="Editar"><IconButton size="small" onClick={() => setEditar(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        {row.pagado === 0 && <Tooltip title="Anular"><IconButton size="small" color="error" onClick={() => anular(row)}><BlockIcon fontSize="small" /></IconButton></Tooltip>}
      </Stack>
    ) },
  ];

  return (
    <Seccion titulo={titulo} accion={
      <Stack direction="row" spacing={1}>
        <Button size="small" startIcon={<DownloadIcon />} onClick={() => exportarCSV("gastos", [
          { campo: "periodo", titulo: "Mes" }, { campo: "concepto", titulo: "Concepto" }, { campo: "categoria", titulo: "Categoría" }, { campo: "grupo", titulo: "Tipo" },
          { campo: "valor", titulo: "Valor" }, { campo: "pagado", titulo: "Pagado" }, { campo: "saldo", titulo: "Saldo" }, { campo: "fecha_vencimiento", titulo: "Vence" }, { campo: "estado", titulo: "Estado" },
          { campo: "beneficiario", titulo: "Beneficiario" }, { campo: "consumo", titulo: "Consumo" }, { campo: "unidad_consumo", titulo: "Unidad" },
        ], filas as unknown as Record<string, unknown>[])} sx={{ textTransform: "none" }}>Exportar</Button>
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setEditar("nuevo")} sx={{ textTransform: "none", borderRadius: 2 }}>Registrar gasto</Button>
      </Stack>
    }>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
        <TextField size="small" placeholder="Buscar concepto o beneficiario" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        <TextField size="small" select label="Tipo" value={grupo} onChange={(e) => setGrupo(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="">Todos</MenuItem>
          {Object.entries(GRUPOS).filter(([k]) => !["NO_OPERATIVO", "DEPRECIACION", "SIN_CLASIFICAR"].includes(k)).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ alignSelf: "center", fontSize: 13, color: "#64748B" }}>Total {pesos(total)} · por pagar <b>{pesos(saldo)}</b></Typography>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Box sx={{ height: 520 }}>
        <DataGrid rows={filas} columns={columnas} loading={cargando} density="compact" disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} pageSizeOptions={[25, 50, 100]}
          localeText={{ noRowsLabel: "No hay gastos con estos filtros" }} sx={{ border: 0 }} />
      </Box>
      {editar && <DialogoGasto gasto={editar === "nuevo" ? null : editar} categorias={categorias} onCerrar={(ok) => { setEditar(null); if (ok) recargar(); }} />}
      {pagar && <DialogoPago gasto={pagar} onCerrar={(ok) => { setPagar(null); if (ok) recargar(); }} />}
    </Seccion>
  );
}

/* Categorías agrupadas por tipo (sin las no operativas).
   Es una función (no un componente): el Select de MUI necesita los MenuItem como hijos directos. */
const opcionesCategoria = (categorias: Categoria[]) =>
  Object.entries(GRUPOS).filter(([g]) => categorias.some((c) => c.grupo === g && g !== "NO_OPERATIVO")).flatMap(([g, nombre]) => [
    <ListSubheader key={`h-${g}`}>{nombre}</ListSubheader>,
    ...categorias.filter((c) => c.grupo === g).map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>),
  ]);

/* --------------------------- Crear / editar --------------------------- */
function DialogoGasto({ gasto, categorias, onCerrar }: { gasto: Gasto | null; categorias: Categoria[]; onCerrar: (ok: boolean) => void }) {
  const [f, setF] = useState<Record<string, string | number | boolean | null>>(() => gasto ? { ...gasto } : { periodo: hoy().slice(0, 7), valor: "", concepto: "", id_categoria: "" });
  const [pagarYa, setPagarYa] = useState(false);
  const [medio, setMedio] = useState("TRANSFERENCIA");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const cat = categorias.find((c) => c.id === Number(f.id_categoria));
  const set = (k: string) => (e: { target: { value: string } }) => { setF((x) => ({ ...x, [k]: e.target.value })); setErrores((x) => ({ ...x, [k]: "" })); };
  const err = (k: string, ayuda?: string) => ({ error: Boolean(errores[k]), helperText: errores[k] || ayuda });

  const guardar = async () => {
    setGuardando(true); setError(null);
    const cuerpo = { ...f, periodo: String(f.periodo ?? "").slice(0, 7), ...(pagarYa && !gasto ? { pago: { valor: f.valor, medio, desde_caja: medio === "CAJA", fecha: hoy() } } : {}) };
    try {
      if (gasto) await fin.editarGasto(gasto.id, cuerpo); else await fin.crearGasto(cuerpo);
      onCerrar(true);
    } catch (e) {
      const r = errorDe(e); setError(r.mensaje); setErrores(r.errores);
    } finally { setGuardando(false); }
  };

  return (
    <Dialog open onClose={() => onCerrar(false)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{gasto ? "Editar gasto" : "Registrar gasto"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField select label="Categoría" value={f.id_categoria ?? ""} onChange={set("id_categoria")} {...err("id_categoria")} size="small">{opcionesCategoria(categorias)}</TextField>
          <TextField label="Concepto" value={f.concepto ?? ""} onChange={set("concepto")} {...err("concepto", "Ej.: Energía octubre, Arriendo local, Nómina 1ª quincena")} size="small" />
          <Stack direction="row" spacing={2}>
            <TextField label="Valor" type="number" value={f.valor ?? ""} onChange={set("valor")} {...err("valor")} size="small" fullWidth InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            <TextField label="Mes al que corresponde" type="month" value={String(f.periodo ?? "").slice(0, 7)} onChange={set("periodo")} {...err("periodo")} size="small" fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Fecha de emisión" type="date" value={f.fecha_emision ?? ""} onChange={set("fecha_emision")} {...err("fecha_emision")} size="small" fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Fecha de vencimiento" type="date" value={f.fecha_vencimiento ?? ""} onChange={set("fecha_vencimiento")} {...err("fecha_vencimiento")} size="small" fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Proveedor o beneficiario" value={f.beneficiario ?? ""} onChange={set("beneficiario")} size="small" fullWidth />
            <TextField label="N.º de factura / documento" value={f.numero_documento ?? ""} onChange={set("numero_documento")} size="small" fullWidth />
          </Stack>
          {cat?.grupo === "SERVICIO" && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#F8FAFC" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Consumo (opcional)</Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField label="Lectura anterior" type="number" value={f.lectura_anterior ?? ""} onChange={set("lectura_anterior")} size="small" />
                <TextField label="Lectura actual" type="number" value={f.lectura_actual ?? ""} onChange={set("lectura_actual")} {...err("lectura_actual")} size="small" />
                <TextField label="Consumo" type="number" value={f.consumo ?? ""} onChange={set("consumo")} size="small" helperText="Se calcula con las lecturas" />
                <TextField label="Unidad" value={f.unidad_consumo ?? ""} onChange={set("unidad_consumo")} size="small" placeholder="kWh, m³" sx={{ width: 110 }} />
              </Stack>
            </Box>
          )}
          <TextField label="Enlace del soporte (opcional)" value={f.soporte_url ?? ""} onChange={set("soporte_url")} {...err("soporte_url", "Foto o PDF de la factura en Drive, correo…")} size="small" />
          <TextField label="Observación" value={f.observacion ?? ""} onChange={set("observacion")} size="small" multiline minRows={2} />
          {!gasto && (
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel control={<Checkbox checked={pagarYa} onChange={(e) => setPagarYa(e.target.checked)} />} label="Ya está pagado" />
              {pagarYa && (
                <TextField select size="small" label="Cómo se pagó" value={medio} onChange={(e) => setMedio(e.target.value)} sx={{ minWidth: 220 }}>
                  <MenuItem value="TRANSFERENCIA">Transferencia / banco</MenuItem>
                  <MenuItem value="CAJA">Efectivo de la caja (crea el egreso)</MenuItem>
                  <MenuItem value="TARJETA">Tarjeta</MenuItem>
                </TextField>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onCerrar(false)}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

/* -------------------------------- Pago -------------------------------- */
function DialogoPago({ gasto, onCerrar }: { gasto: Gasto; onCerrar: (ok: boolean) => void }) {
  const [modo, setModo] = useState<"TRANSFERENCIA" | "CAJA" | "TARJETA" | "VINCULAR">("TRANSFERENCIA");
  const [valor, setValor] = useState(String(gasto.saldo));
  const [fecha, setFecha] = useState(hoy());
  const [referencia, setReferencia] = useState("");
  const [idEgreso, setIdEgreso] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Egresos de los últimos 60 días (la fecha se calcula al cargar, no en cada render)
  const { datos: egresos } = useDatos(() => (modo === "VINCULAR"
    ? fin.egresos({ desde: new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10), hasta: hoy() })
    : Promise.resolve([])), [modo]);
  const libres = (egresos ?? []).filter((e) => !e.id_gasto && !e.id_compra);

  const pagar = async () => {
    setError(null);
    try {
      await fin.pagarGasto(gasto.id, modo === "VINCULAR" ? { id_egreso: Number(idEgreso) } : { valor, fecha, medio: modo, desde_caja: modo === "CAJA", referencia });
      onCerrar(true);
    } catch (e) { setError(errorDe(e).mensaje); }
  };

  return (
    <Dialog open onClose={() => onCerrar(false)} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Pagar: {gasto.concepto}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: 13, color: "#64748B" }}>Saldo pendiente: <b>{pesos(gasto.saldo)}</b></Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField select size="small" label="Cómo se paga" value={modo} onChange={(e) => setModo(e.target.value as typeof modo)}>
            <MenuItem value="TRANSFERENCIA">Transferencia / banco</MenuItem>
            <MenuItem value="TARJETA">Tarjeta</MenuItem>
            <MenuItem value="CAJA">Efectivo de mi caja abierta (crea el egreso)</MenuItem>
            <MenuItem value="VINCULAR">Ya se registró como egreso en la caja</MenuItem>
          </TextField>
          {modo === "VINCULAR" ? (
            <TextField select size="small" label="Egreso de caja" value={idEgreso} onChange={(e) => setIdEgreso(e.target.value)}
              helperText={libres.length ? "El valor del pago será el del egreso" : "No hay egresos sin vincular en los últimos 60 días"}>
              {libres.map((e) => <MenuItem key={e.id} value={e.id}>{fechaCorta(e.fecha)} · {e.descripcion} · {pesos(e.monto)}</MenuItem>)}
            </TextField>
          ) : (
            <>
              <TextField size="small" label="Valor" type="number" value={valor} onChange={(e) => setValor(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
              <TextField size="small" label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField size="small" label="Referencia (opcional)" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </>
          )}
          <Typography sx={{ fontSize: 11.5, color: "#94A3B8" }}>Un pago vinculado a un egreso de caja se cuenta una sola vez en el flujo de caja.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onCerrar(false)}>Cancelar</Button>
        <Button variant="contained" color="success" onClick={pagar} disabled={modo === "VINCULAR" && !idEgreso}>Registrar pago</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ----------------------------- Recurrentes ---------------------------- */
const PERIODICIDAD: Record<string, string> = { MENSUAL: "Mensual", BIMESTRAL: "Cada 2 meses", TRIMESTRAL: "Cada 3 meses", SEMESTRAL: "Cada 6 meses", ANUAL: "Anual" };

function Recurrentes({ categorias }: { categorias: Categoria[] }) {
  const { datos, recargar } = useDatos(() => fin.recurrentes(), []);
  const { datos: proy, recargar: recargarProy } = useDatos(() => fin.proyeccion(), []);
  const [editar, setEditar] = useState<Recurrente | null | "nuevo">(null);

  const generar = async () => {
    const ok = await Swal.fire({ icon: "question", title: "Generar los gastos de este mes", text: "Se crean los gastos recurrentes que toquen hasta este mes. Los que ya existen no se repiten.", showCancelButton: true, confirmButtonText: "Generar", cancelButtonText: "Cancelar" });
    if (!ok.isConfirmed) return;
    try {
      const r = await fin.causar();
      Swal.fire({ icon: "success", title: r.creados.length ? `${r.creados.length} gasto(s) generado(s)` : "No había nada pendiente", timer: 1800, showConfirmButton: false });
      recargar(); recargarProy();
    } catch (e) { Swal.fire("Error", errorDe(e).mensaje, "error"); }
  };

  const meses = [...new Set((proy?.items ?? []).map((i) => i.periodo))];
  return (
    <Stack spacing={2}>
      <Seccion titulo="Gastos que se repiten" icono={<EventRepeatIcon />} accion={
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={generar} sx={{ textTransform: "none" }}>Generar gastos del mes</Button>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setEditar("nuevo")} sx={{ textTransform: "none", borderRadius: 2 }}>Nuevo</Button>
        </Stack>
      }>
        <Typography sx={{ fontSize: 12.5, color: "#64748B", mb: 1.5 }}>
          Arriendo, internet, software, seguros… Se definen una vez; el sistema los proyecta y, al generarlos, crea el gasto del mes una sola vez para que lo pagues.
        </Typography>
        <Box sx={{ height: 320 }}>
          <DataGrid rows={datos ?? []} density="compact" disableRowSelectionOnClick sx={{ border: 0 }} localeText={{ noRowsLabel: "Aún no hay gastos recurrentes" }}
            columns={[
              { field: "concepto", headerName: "Concepto", flex: 1, minWidth: 160 },
              { field: "categoria", headerName: "Categoría", width: 180 },
              { field: "valor_estimado", headerName: "Valor", width: 120, type: "number", valueFormatter: (v: number) => pesos(v) },
              { field: "periodicidad", headerName: "Cada", width: 120, valueFormatter: (v: string) => PERIODICIDAD[v] },
              { field: "dia_vencimiento", headerName: "Vence el día", width: 100 },
              { field: "ultimo_periodo", headerName: "Último generado", width: 130, valueFormatter: (v: string | null) => (v ? mesCorto(v) : "—") },
              { field: "activo", headerName: "Activo", width: 80, renderCell: ({ row }) => <Chip size="small" label={row.activo ? "Sí" : "No"} color={row.activo ? "success" : "default"} /> },
              { field: "e", headerName: "", width: 60, sortable: false, renderCell: ({ row }) => <IconButton size="small" onClick={() => setEditar(row)}><EditIcon fontSize="small" /></IconButton> },
            ]} />
        </Box>
      </Seccion>

      <Seccion titulo={`Proyección ${proy ? `${mesCorto(proy.desde)} – ${mesCorto(proy.hasta)}` : ""}`} accion={proy && <Chip label={`Total ${pesos(proy.total_estimado)}`} />}>
        {!proy || proy.items.length === 0 ? <Typography sx={{ fontSize: 13, color: "#64748B" }}>Sin gastos recurrentes programados.</Typography> : (
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ borderCollapse: "collapse", width: "100%", fontSize: 13, "& td, & th": { p: 1, borderBottom: "1px solid #EEF2F7", textAlign: "right", whiteSpace: "nowrap" }, "& td:first-of-type, & th:first-of-type": { textAlign: "left" } }}>
              <thead><tr><th>Concepto</th>{meses.map((m) => <th key={m}>{mesCorto(m)}</th>)}</tr></thead>
              <tbody>
                {[...new Set(proy.items.map((i) => i.concepto))].map((c) => (
                  <tr key={c}><td>{c}</td>{meses.map((m) => {
                    const it = proy.items.find((i) => i.concepto === c && i.periodo === m);
                    return <td key={m}>{it ? <Tooltip title={it.estimado ? "Proyectado (aún no generado)" : `Generado · ${it.estado}`}><span style={{ color: it.estimado ? "#94A3B8" : "#0F172A", fontWeight: it.estimado ? 400 : 700 }}>{pesos(it.valor)}</span></Tooltip> : ""}</td>;
                  })}</tr>
                ))}
              </tbody>
            </Box>
            <Typography sx={{ mt: 1, fontSize: 11.5, color: "#94A3B8" }}>En gris: proyectado (estimado). En negro: ya generado como gasto.</Typography>
          </Box>
        )}
      </Seccion>
      {editar && <DialogoRecurrente rec={editar === "nuevo" ? null : editar} categorias={categorias} onCerrar={(ok) => { setEditar(null); if (ok) { recargar(); recargarProy(); } }} />}
    </Stack>
  );
}

function DialogoRecurrente({ rec, categorias, onCerrar }: { rec: Recurrente | null; categorias: Categoria[]; onCerrar: (ok: boolean) => void }) {
  const [f, setF] = useState<Record<string, string | number | boolean | null>>(() => rec ? { ...rec } : { periodicidad: "MENSUAL", dia_vencimiento: 5, fecha_inicio: `${hoy().slice(0, 7)}-01`, activo: true, id_categoria: "", concepto: "", valor_estimado: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const err = (k: string) => ({ error: Boolean(errores[k]), helperText: errores[k] });
  const guardar = async () => {
    try { await fin.guardarRecurrente(rec?.id ?? null, f); onCerrar(true); } catch (e) { const r = errorDe(e); setError(r.mensaje); setErrores(r.errores); }
  };
  return (
    <Dialog open onClose={() => onCerrar(false)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>{rec ? "Editar gasto recurrente" : "Nuevo gasto recurrente"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField select size="small" label="Categoría" value={f.id_categoria ?? ""} onChange={set("id_categoria")} {...err("id_categoria")}>{opcionesCategoria(categorias)}</TextField>
          <TextField size="small" label="Concepto" value={f.concepto ?? ""} onChange={set("concepto")} {...err("concepto")} placeholder="Arriendo del local" />
          <Stack direction="row" spacing={2}>
            <TextField size="small" fullWidth label="Valor estimado" type="number" value={f.valor_estimado ?? ""} onChange={set("valor_estimado")} {...err("valor_estimado")} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            <TextField size="small" fullWidth select label="Cada cuánto" value={f.periodicidad ?? "MENSUAL"} onChange={set("periodicidad")}>
              {Object.entries(PERIODICIDAD).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField size="small" fullWidth label="Día de vencimiento" type="number" value={f.dia_vencimiento ?? 5} onChange={set("dia_vencimiento")} {...err("dia_vencimiento")} inputProps={{ min: 1, max: 28 }} />
            <TextField size="small" fullWidth label="Desde" type="date" value={f.fecha_inicio ?? ""} onChange={set("fecha_inicio")} {...err("fecha_inicio")} InputLabelProps={{ shrink: true }} />
            <TextField size="small" fullWidth label="Hasta (opcional)" type="date" value={f.fecha_fin ?? ""} onChange={set("fecha_fin")} {...err("fecha_fin")} InputLabelProps={{ shrink: true }} />
          </Stack>
          <TextField size="small" label="Proveedor o beneficiario" value={f.beneficiario ?? ""} onChange={set("beneficiario")} />
          <FormControlLabel control={<Switch checked={Boolean(f.activo)} onChange={(e) => setF((x) => ({ ...x, activo: e.target.checked }))} />} label="Activo" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onCerrar(false)}>Cancelar</Button>
        <Button variant="contained" onClick={guardar}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
