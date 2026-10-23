/*
 * Compras a proveedores. Al registrar una compra los insumos ENTRAN al inventario
 * con su costo (no es gasto todavía) y queda la cuenta por pagar.
 * Los pagos son salidas de dinero; si salen de la caja se crea su egreso.
 */
import { useMemo, useState } from "react";
import {
  Alert, Autocomplete, Avatar, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, FormControlLabel, IconButton,
  InputAdornment, MenuItem, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PaymentsIcon from "@mui/icons-material/Payments";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import Swal from "sweetalert2";
import { compras, errorDe } from "../../../api/finanzas";
import type { CompraDetalle, CompraResumen, Proveedor } from "../../../api/finanzas";
import { getInventarios } from "../../../api/inventarios";
import type { InventarioFisico } from "../../../types/inventario";
import { Encabezado, Seccion, TarjetaIndicador } from "../../../components/pedidos/DisenoPedidos";
import { sxBotonPrincipal } from "../../../components/pedidos/pedidosUtil";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { exportarCSV, fechaCorta, hoy, pesos } from "../Finanzas/finanzasUtil";
import { useDatos } from "../Finanzas/useDatos";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import Inventory2Icon from "@mui/icons-material/Inventory2";

const ESTADO: Record<string, { bg: string; color: string }> = {
  PAGADA: { bg: "#dcfce7", color: "#166534" }, ANULADA: { bg: "#fee2e2", color: "#991b1b" },
  PARCIAL: { bg: "#dbeafe", color: "#1e40af" }, PENDIENTE: { bg: "#fef3c7", color: "#92400e" },
};
const ChipEstado = ({ e }: { e: string }) => <Chip label={e} size="small" sx={{ fontWeight: 700, borderRadius: "10px", bgcolor: ESTADO[e]?.bg, color: ESTADO[e]?.color }} />;

// incrustado: dentro de la pestaña Compras de Ventas (sin fondo ni alto de página propios)
// desde/hasta: el período del filtro de Ventas (la lista y sus totales siguen ese rango)
export default function AdminCompras({ incrustado = false, desde, hasta }: { incrustado?: boolean; desde?: string; hasta?: string } = {}) {
  const [estado, setEstado] = useState("");
  const [q, setQ] = useState("");
  const { datos, cargando, error, recargar } = useDatos(() => compras.listar({ estado }), [estado]);
  const [nueva, setNueva] = useState(false);
  const [ver, setVer] = useState<number | null>(null);
  const enRango = (c: CompraResumen) => { const f = String(c.fecha_compra ?? "").slice(0, 10); return (!desde || f >= desde) && (!hasta || f <= hasta); };
  const filas = useMemo(() => (datos ?? []).filter((c) => enRango(c) && (!q || `${c.numero_compra} ${c.numero_factura ?? ""} ${c.proveedor} ${c.identificacion}`.toLowerCase().includes(q.toLowerCase()))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datos, q, desde, hasta]);
  const activas = (datos ?? []).filter((c) => c.estado !== "ANULADA");
  const porPagar = activas.reduce((a, c) => a + c.saldo_pendiente, 0);
  const vencido = activas.filter((c) => c.vencida).reduce((a, c) => a + c.saldo_pendiente, 0);

  const columnas: GridColDef<CompraResumen>[] = [
    { field: "numero_compra", headerName: "Compra", width: 130, renderCell: ({ value }) => <Typography fontWeight={700} fontSize={13}>{value}</Typography> },
    { field: "fecha_compra", headerName: "Fecha", width: 110, valueFormatter: (v: string) => fechaCorta(v) },
    { field: "proveedor", headerName: "Proveedor", flex: 1, minWidth: 170 },
    { field: "numero_factura", headerName: "Factura", width: 120, valueFormatter: (v: string | null) => v ?? "—" },
    { field: "total", headerName: "Total", width: 120, type: "number", valueFormatter: (v: number) => pesos(v) },
    { field: "saldo_pendiente", headerName: "Saldo", width: 120, type: "number", valueFormatter: (v: number) => pesos(v) },
    { field: "fecha_vencimiento", headerName: "Vence", width: 140, renderCell: ({ row }) => row.fecha_vencimiento ? <Stack direction="row" spacing={0.5} alignItems="center"><span>{fechaCorta(row.fecha_vencimiento)}</span>{row.vencida && <Chip size="small" color="error" label="Vencida" />}</Stack> : "—" },
    { field: "estado", headerName: "Estado", width: 110, renderCell: ({ value }) => <ChipEstado e={value} /> },
    { field: "a", headerName: "", width: 60, sortable: false, renderCell: ({ row }) => <IconButton size="small" onClick={() => setVer(row.id)}><VisibilityOutlinedIcon fontSize="small" /></IconButton> },
  ];

  return (
    <Box sx={incrustado ? {} : { minHeight: "100vh", background: "linear-gradient(180deg,#f5f7fb,#eef4ff)", p: 1 }}>
      <Card sx={{ mb: 2, borderRadius: 5, p: { xs: 1.5, md: 2.5 }, border: "1px solid #E2E8F0", boxShadow: "0 12px 35px rgba(15,23,42,.06)", position: "relative", overflow: "hidden",
        "&::before": { content: '""', position: "absolute", top: 0, left: 0, width: "100%", height: 5, background: "linear-gradient(90deg,#2563EB,#3B82F6,#60A5FA)" } }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 58, height: 58, borderRadius: 4, bgcolor: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}><ShoppingCartOutlinedIcon sx={{ fontSize: 32 }} /></Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, md: 20 }, color: "#0F172A" }}>Compras</Typography>
              <Typography sx={{ color: "#64748B", fontSize: 12, maxWidth: 560 }}>
                Lo comprado entra al inventario con su costo y queda como cuenta por pagar. Pasa a costo cuando se vende o consume; por eso una compra no es un gasto del mes.
              </Typography>
            </Box>
          </Stack>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNueva(true)} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 3, height: 44 }}>Registrar compra</Button>
        </Stack>
      </Card>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, mb: 2 }}>
        <TarjetaIndicador titulo="Compras registradas" valor={activas.length} subtitulo={pesos(activas.reduce((a, c) => a + c.total, 0))} icono={<ReceiptLongIcon />} color="azul" />
        <TarjetaIndicador titulo="Por pagar a proveedores" valor={pesos(porPagar)} icono={<Inventory2Icon />} color="ambar" onClick={() => setEstado("PENDIENTE")} />
        <TarjetaIndicador titulo="Vencido" valor={pesos(vencido)} icono={<EventBusyIcon />} color={vencido ? "rojo" : "pizarra"} />
      </Box>

      <Card sx={{ borderRadius: "22px", p: 2, border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 8px 24px rgba(15,23,42,.05)" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
          <TextField size="small" placeholder="Buscar compra, factura o proveedor" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 280 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <TextField size="small" select label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">Todas</MenuItem>{["PENDIENTE", "PARCIAL", "PAGADA", "ANULADA"].map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Button size="small" startIcon={<DownloadIcon />} sx={{ textTransform: "none" }} onClick={() => exportarCSV("compras", [
            { campo: "numero_compra", titulo: "Compra" }, { campo: "fecha_compra", titulo: "Fecha" }, { campo: "proveedor", titulo: "Proveedor" }, { campo: "identificacion", titulo: "NIT/CC" },
            { campo: "numero_factura", titulo: "Factura" }, { campo: "subtotal", titulo: "Subtotal" }, { campo: "descuento", titulo: "Descuento" }, { campo: "impuesto", titulo: "Impuesto" },
            { campo: "total", titulo: "Total" }, { campo: "saldo_pendiente", titulo: "Saldo" }, { campo: "fecha_vencimiento", titulo: "Vence" }, { campo: "estado", titulo: "Estado" },
          ], filas as unknown as Record<string, unknown>[])}>Exportar</Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <Box sx={{ height: 560 }}>
          <DataGrid rows={filas} columns={columnas} loading={cargando} density="compact" disableRowSelectionOnClick onRowDoubleClick={({ row }) => setVer(row.id)}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} pageSizeOptions={[25, 50, 100]} sx={{ border: 0 }}
            localeText={{ noRowsLabel: "Aún no hay compras registradas" }} />
        </Box>
      </Card>

      {nueva && <NuevaCompra onCerrar={(ok) => { setNueva(false); if (ok) recargar(); }} />}
      {ver && <DetalleCompra id={ver} onCerrar={(cambio) => { setVer(null); if (cambio) recargar(); }} />}
    </Box>
  );
}

/* ----------------------------- Nueva compra ----------------------------- */
type Linea = { id_inventario: number | null; cantidad: string; costo_unitario: string; descuento: string; impuesto: string };
const vacia = (): Linea => ({ id_inventario: null, cantidad: "", costo_unitario: "", descuento: "", impuesto: "" });

function NuevaCompra({ onCerrar }: { onCerrar: (ok: boolean) => void }) {
  const { datos: insumos } = useDatos(() => getInventarios(), []);
  const [busca, setBusca] = useState("");
  const { datos: proveedores } = useDatos(() => compras.proveedores(busca.length >= 3 ? busca : undefined), [busca.length >= 3 ? busca : ""]);
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [nuevoProv, setNuevoProv] = useState({ identificacion: "", nombres: "", telefono: "" });
  const [esNuevo, setEsNuevo] = useState(false);
  const [f, setF] = useState({ numero_factura: "", fecha_factura: hoy(), fecha_vencimiento: "", costos_adicionales: "", observacion: "" });
  const [lineas, setLineas] = useState<Linea[]>([vacia()]);
  const [pago, setPago] = useState({ activo: false, valor: "", desde_caja: false });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const n = (v: string) => Number(v) || 0;
  const subtotal = lineas.reduce((a, l) => a + n(l.cantidad) * n(l.costo_unitario), 0);
  const descuento = lineas.reduce((a, l) => a + n(l.descuento), 0);
  const impuesto = lineas.reduce((a, l) => a + n(l.impuesto), 0);
  const total = subtotal - descuento + impuesto + n(f.costos_adicionales);
  const setL = (k: number, campo: keyof Linea, v: string | number | null) => setLineas((ls) => ls.map((l, i) => (i === k ? { ...l, [campo]: v } : l)));

  const guardar = async () => {
    setGuardando(true); setError(null);
    try {
      await compras.crear({
        ...(esNuevo ? { proveedor: nuevoProv } : { id_proveedor: proveedor?.id }),
        ...f, fecha_vencimiento: f.fecha_vencimiento || null,
        items: lineas.filter((l) => l.id_inventario).map((l) => ({ id_inventario: l.id_inventario, cantidad: l.cantidad, costo_unitario: l.costo_unitario, descuento: l.descuento || 0, impuesto: l.impuesto || 0 })),
        ...(pago.activo ? { pago: { valor: pago.valor || total, desde_caja: pago.desde_caja } } : {}),
      });
      Swal.fire({ icon: "success", title: "Compra registrada", text: "Los insumos ya están en el inventario.", timer: 1600, showConfirmButton: false });
      onCerrar(true);
    } catch (e) {
      const r = errorDe(e); setError(r.mensaje); setErrores(r.errores);
    } finally { setGuardando(false); }
  };

  return (
    <Dialog open onClose={() => onCerrar(false)} fullWidth maxWidth="lg" scroll="paper" PaperProps={{ sx: { borderRadius: 4, bgcolor: "#F8FAFC" } }}>
      <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
        <Encabezado icono={<ShoppingCartOutlinedIcon />} color="azul" titulo="Registrar compra"
          subtitulo="Los insumos entran al inventario con su costo y queda la cuenta por pagar." onCerrar={() => onCerrar(false)} />
        <Stack spacing={2}>
          {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}{Object.entries(errores).filter(([k]) => k.startsWith("items")).map(([k, v]) => <div key={k}>Ítem {Number(k.split(".")[1]) + 1}: {v}</div>)}</Alert>}
          <Seccion titulo="Proveedor y factura" icono={<StorefrontIcon />}
            accion={<FormControlLabel control={<Switch size="small" checked={esNuevo} onChange={(e) => setEsNuevo(e.target.checked)} />} label={<Typography fontSize={13}>Proveedor nuevo</Typography>} />}>
          <Stack spacing={2}>
          {esNuevo ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField size="small" label="NIT o cédula" value={nuevoProv.identificacion} onChange={(e) => setNuevoProv({ ...nuevoProv, identificacion: e.target.value })} error={!!errores.id_proveedor} />
              <TextField size="small" label="Nombre o razón social" fullWidth value={nuevoProv.nombres} onChange={(e) => setNuevoProv({ ...nuevoProv, nombres: e.target.value })} error={!!errores.id_proveedor} helperText={errores.id_proveedor} />
              <TextField size="small" label="Teléfono" value={nuevoProv.telefono} onChange={(e) => setNuevoProv({ ...nuevoProv, telefono: e.target.value })} />
            </Stack>
          ) : (
            <Autocomplete options={proveedores ?? []} value={proveedor} onChange={(_, v) => setProveedor(v)} onInputChange={(_, v) => setBusca(v)}
              getOptionLabel={(p) => `${p.nombre} · ${p.identificacion}`} isOptionEqualToValue={(a, b) => a.id === b.id} noOptionsText="Escribe 3 letras para buscar o crea uno nuevo"
              renderInput={(p) => <TextField {...p} size="small" label="Buscar proveedor" error={!!errores.id_proveedor} helperText={errores.id_proveedor} />} />
          )}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField size="small" label="N.º de factura" value={f.numero_factura} onChange={(e) => setF({ ...f, numero_factura: e.target.value })} error={!!errores.numero_factura} helperText={errores.numero_factura} />
            <TextField size="small" label="Fecha de la factura" type="date" value={f.fecha_factura} onChange={(e) => setF({ ...f, fecha_factura: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField size="small" label="Vence (crédito)" type="date" value={f.fecha_vencimiento} onChange={(e) => setF({ ...f, fecha_vencimiento: e.target.value })} InputLabelProps={{ shrink: true }} error={!!errores.fecha_vencimiento} helperText={errores.fecha_vencimiento} />
          </Stack>
          </Stack>
          </Seccion>

          <Seccion titulo="Insumos o mercancía" icono={<Inventory2Icon />}>
          <Stack spacing={1.5}>
          {lineas.map((l, k) => (
            <Stack key={k} direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
              <Autocomplete sx={{ flex: 2, minWidth: 200 }} options={insumos ?? []} value={(insumos ?? []).find((i) => i.id === l.id_inventario) ?? null}
                onChange={(_, v: InventarioFisico | null) => { setL(k, "id_inventario", v?.id ?? null); if (v && !l.costo_unitario && v.costo_unitario) setL(k, "costo_unitario", String(v.costo_unitario)); }}
                getOptionLabel={(i) => `${i.nombre} (${i.unidad})`} isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(p) => <TextField {...p} size="small" label="Insumo" error={!!errores[`items.${k}`]} />} />
              <TextField size="small" label="Cantidad" type="number" value={l.cantidad} onChange={(e) => setL(k, "cantidad", e.target.value)} sx={{ width: 110 }} />
              <TextField size="small" label="Costo unitario" type="number" value={l.costo_unitario} onChange={(e) => setL(k, "costo_unitario", e.target.value)} sx={{ width: 140 }} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
              <TextField size="small" label="Descuento" type="number" value={l.descuento} onChange={(e) => setL(k, "descuento", e.target.value)} sx={{ width: 120 }} />
              <Tooltip title="IVA u otro impuesto de la línea (no suma al costo del insumo)"><TextField size="small" label="Impuesto" type="number" value={l.impuesto} onChange={(e) => setL(k, "impuesto", e.target.value)} sx={{ width: 110 }} /></Tooltip>
              <Typography sx={{ width: 110, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{pesos(n(l.cantidad) * n(l.costo_unitario) - n(l.descuento) + n(l.impuesto))}</Typography>
              <IconButton size="small" onClick={() => setLineas((ls) => (ls.length > 1 ? ls.filter((_, i) => i !== k) : [vacia()]))}><DeleteOutlineIcon fontSize="small" /></IconButton>
            </Stack>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => setLineas((ls) => [...ls, vacia()])} sx={{ alignSelf: "flex-start", textTransform: "none" }}>Agregar insumo</Button>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField size="small" label="Costos adicionales (flete, transporte)" type="number" value={f.costos_adicionales} onChange={(e) => setF({ ...f, costos_adicionales: e.target.value })}
              helperText="Se reparten en el costo de los insumos" sx={{ minWidth: 260 }} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            <TextField size="small" label="Observación" fullWidth value={f.observacion} onChange={(e) => setF({ ...f, observacion: e.target.value })} />
          </Stack>
          </Stack>
          </Seccion>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Seccion titulo="Pago al recibir" icono={<PaymentsIcon />}>
          <Stack spacing={1.5}>
            <FormControlLabel control={<Switch checked={pago.activo} onChange={(e) => setPago({ ...pago, activo: e.target.checked })} />} label="Se pagó (total o parte) al recibirla" />
            {pago.activo && (
              <>
                <TextField size="small" label="Valor pagado" type="number" value={pago.valor} onChange={(e) => setPago({ ...pago, valor: e.target.value })} placeholder={String(total)} error={!!errores.pago} helperText={errores.pago} />
                <FormControlLabel control={<Switch checked={pago.desde_caja} onChange={(e) => setPago({ ...pago, desde_caja: e.target.checked })} />} label="Salió de mi caja abierta" />
              </>
            )}
          </Stack>
          </Seccion>
          <Seccion titulo="Resumen" icono={<ReceiptIcon />}>
            {([["Subtotal", subtotal], ["Descuentos", -descuento], ["Impuestos", impuesto], ["Adicionales", n(f.costos_adicionales)]] as const).map(([l, v]) => (
              <Stack key={l} direction="row" justifyContent="space-between" sx={{ py: 0.3 }}><Typography fontSize={13} color="#64748B">{l}</Typography><Typography fontSize={13}>{pesos(v)}</Typography></Stack>
            ))}
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "14px", background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight={600}>Total</Typography><Typography fontWeight={800}>{pesos(total)}</Typography>
            </Box>
          </Seccion>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, md: 4 }, pb: 2.5, bgcolor: "#F8FAFC" }}>
        <Button onClick={() => onCerrar(false)} sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}>Cancelar</Button>
        <Button variant="contained" onClick={guardar} disabled={guardando || total <= 0} sx={sxBotonPrincipal}>{guardando ? "Guardando…" : "Registrar compra"}</Button>
      </DialogActions>
    </Dialog>
  );
}

/* --------------------------- Detalle y pagos ---------------------------- */
function DetalleCompra({ id, onCerrar }: { id: number; onCerrar: (cambio: boolean) => void }) {
  const { datos: c, recargar } = useDatos<CompraDetalle>(() => compras.detalle(id), [id]);
  const [pago, setPago] = useState({ valor: "", desde_caja: false, referencia: "" });
  const [cambio, setCambio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pagar = async () => {
    setError(null);
    try { await compras.pagar(id, { valor: pago.valor, desde_caja: pago.desde_caja, referencia: pago.referencia, fecha: hoy() }); setPago({ valor: "", desde_caja: false, referencia: "" }); setCambio(true); recargar(); }
    catch (e) { setError(errorDe(e).mensaje); }
  };
  const anularPago = async (idPago: number) => {
    const ok = await Swal.fire({ icon: "warning", title: "¿Anular este pago?", text: "Si salió de la caja, también se anula su egreso.", showCancelButton: true, confirmButtonText: "Anular", cancelButtonText: "Cancelar" });
    if (!ok.isConfirmed) return;
    try { await compras.anularPago(id, idPago); setCambio(true); recargar(); } catch (e) { setError(errorDe(e).mensaje); }
  };
  const anular = async () => {
    const r = await Swal.fire({ title: "Anular compra", text: "Se saca del inventario lo que entró con esta compra.", input: "text", inputLabel: "Motivo", showCancelButton: true, confirmButtonText: "Anular", cancelButtonText: "Cancelar", inputValidator: (v) => (!v ? "Escribe el motivo" : null) });
    if (!r.isConfirmed) return;
    try { await compras.anular(id, r.value); onCerrar(true); } catch (e) { setError(errorDe(e).mensaje); }
  };

  return (
    <Dialog open onClose={() => onCerrar(cambio)} fullWidth maxWidth="md" scroll="paper" PaperProps={{ sx: { borderRadius: 4, bgcolor: "#F8FAFC" } }}>
      <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
        <Encabezado icono={<ReceiptLongIcon />} color={c?.estado === "ANULADA" ? "rojo" : c?.estado === "PAGADA" ? "verde" : "azul"}
          titulo={<Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap"><span>{c?.numero_compra ?? "Compra"}</span>{c && <ChipEstado e={c.estado} />}</Stack>}
          subtitulo={c ? `${c.proveedor} · ${c.identificacion}${c.numero_factura ? ` · Factura ${c.numero_factura}` : ""}${c.fecha_vencimiento ? ` · Vence ${fechaCorta(c.fecha_vencimiento)}` : ""}` : undefined}
          onCerrar={() => onCerrar(cambio)} />
        {!c ? <Box textAlign="center" py={4}><Typography color="#64748B">Cargando…</Typography></Box> : (
          <Stack spacing={2}>
            {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
              <TarjetaIndicador titulo="Total" valor={pesos(c.total)} subtitulo={`${c.items.length} insumo(s)`} icono={<ReceiptIcon />} color="azul" />
              <TarjetaIndicador titulo="Pagado" valor={pesos(c.total - c.saldo_pendiente)} subtitulo={`${c.pagos.length} pago(s)`} icono={<PaymentsIcon />} color="verde" />
              <TarjetaIndicador titulo="Saldo" valor={pesos(c.saldo_pendiente)} subtitulo={c.vencida ? "Vencida" : "por pagar"} icono={<AccountBalanceWalletIcon />} color={c.saldo_pendiente > 0 ? "ambar" : "pizarra"} />
            </Box>
            <Seccion titulo="Insumos o mercancía" icono={<Inventory2Icon />}>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ "& th": { color: "#64748B", fontWeight: 700, bgcolor: "#F8FAFC", borderColor: "#EEF2F7" }, "& td": { borderColor: "#EEF2F7" } }}>
                  <TableHead><TableRow><TableCell>Insumo</TableCell><TableCell align="right">Cantidad</TableCell><TableCell align="right">Costo unit.</TableCell><TableCell align="right">Desc.</TableCell><TableCell align="right">Imp.</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
                  <TableBody>
                    {c.items.map((i) => (
                      <TableRow key={i.id}><TableCell sx={{ fontWeight: 600 }}>{i.nombre}</TableCell><TableCell align="right">{i.cantidad} {i.unidad ?? ""}</TableCell><TableCell align="right">{pesos(i.costo_unitario)}</TableCell><TableCell align="right">{pesos(i.descuento)}</TableCell><TableCell align="right">{pesos(i.impuesto)}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{pesos(i.total)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "14px", background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between" }}>
                <Typography fontWeight={600}>Total</Typography><Typography fontWeight={800}>{pesos(c.total)}</Typography>
              </Box>
            </Seccion>
            <Seccion titulo={`Pagos · saldo ${pesos(c.saldo_pendiente)}`} icono={<PaymentsIcon />}>
              {c.pagos.length === 0 ? <Typography fontSize={13} color="#64748B">Sin pagos.</Typography> : (
                <Stack spacing={1}>
                  {c.pagos.map((p) => (
                    <Stack key={p.id} direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.2, borderRadius: "14px", border: "1px solid #EEF2F7" }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: "#DCFCE7", color: "#16A34A" }}><PaymentsIcon fontSize="small" /></Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography fontWeight={700} fontSize={14}>{pesos(p.valor)} · {p.metodo_pago ?? "—"}</Typography>
                        <Typography fontSize={12} color="#64748B">{fechaCorta(p.fecha)}{p.numero_egreso ? ` · egreso ${p.numero_egreso}` : ""}{p.referencia ? ` · ${p.referencia}` : ""}</Typography>
                      </Box>
                      {c.estado !== "ANULADA" && <IconButton size="small" onClick={() => anularPago(p.id)} sx={{ bgcolor: "#FEF2F2", color: "#DC2626" }}><DeleteOutlineIcon fontSize="small" /></IconButton>}
                    </Stack>
                  ))}
                </Stack>
              )}
              {c.saldo_pendiente > 0 && c.estado !== "ANULADA" && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 2, p: 1.5, borderRadius: "14px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <TextField size="small" label="Valor" type="number" value={pago.valor} onChange={(e) => setPago({ ...pago, valor: e.target.value })} placeholder={String(c.saldo_pendiente)} sx={{ bgcolor: "#fff" }} />
                  <TextField size="small" label="Referencia" value={pago.referencia} onChange={(e) => setPago({ ...pago, referencia: e.target.value })} sx={{ bgcolor: "#fff" }} />
                  <FormControlLabel control={<Switch checked={pago.desde_caja} onChange={(e) => setPago({ ...pago, desde_caja: e.target.checked })} />} label="Desde mi caja" />
                  <Button variant="contained" startIcon={<PaymentsIcon />} onClick={pagar} disabled={!pago.valor} sx={sxBotonPrincipal}>Registrar pago</Button>
                </Stack>
              )}
            </Seccion>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, md: 4 }, pb: 2.5, bgcolor: "#F8FAFC" }}>
        {c && c.estado !== "ANULADA" && c.pagos.length === 0 && <Button color="error" onClick={anular} sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}>Anular compra</Button>}
        <Box sx={{ flex: 1 }} />
        <Button onClick={() => onCerrar(cambio)} sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
