import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Card,
  Typography,
  Divider,
  Stack,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Pagination,
  IconButton,
  Paper,
  DialogActions,
  InputAdornment,
  Button,
  MenuItem,
  CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import PaymentsIcon from "@mui/icons-material/Payments";
import SearchIcon from "@mui/icons-material/Search";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { FacturaPOS } from "../../../../FacturasPos/FacturaPOS";
import { facturaPorCaja, productosPorVenta, actualiza_venta } from "../../../../../../api/cajero";

export default function VentasDetalles({ open, onClose, id_caja }: any) {

  const [ventas, setVentas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState("todas");
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);
  const [productosDetalle, setProductosDetalle] = useState<any[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [openPago, setOpenPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState<any>("");
  const [cambio, setCambio] = useState<number>(0);
  const idUsuario = localStorage.getItem("id_usuario");
  const id_negocio = localStorage.getItem("id_negocio");
  const porPagina = 16;

  useEffect(() => {
    if (open && id_caja) cargarVentas();
  }, [open, id_caja]);

  useEffect(() => {
    // recalcular cambio automáticamente
    if (metodoPago === "EFECTIVO" && ventaSeleccionada) {
      const total = Number(ventaSeleccionada.venta_total || 0);
      setCambio(Number(montoRecibido || 0) - total);
    }
  }, [montoRecibido, metodoPago, ventaSeleccionada]);

  const cargarVentas = async () => {
    const { data } = await facturaPorCaja({ id_caja });
    if (data?.ok) setVentas(data.result);
  };

  const abrirDetalle = async (venta: any) => {
    setVentaSeleccionada(venta);
    setDetalleOpen(true);
    setLoadingDetalle(true);
    const { data } = await productosPorVenta({ id_venta: venta.id_venta });
    if (data?.ok) setProductosDetalle(data.result);
    setLoadingDetalle(false);
  };


  /* ================= METRICAS ================= */
  const metrics = useMemo(() => {
    const totalPagadas = ventas.filter(v => v.estado_pago === true).length;
    const totalPendientes = ventas.filter(v => v.estado_pago === false).length;

    const totalVentas = ventas
      .filter(v => v.estado_pago === true)
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

    const pendiente_pago = ventas
      .filter(v => v.estado_pago === false)
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

    return { totalPagadas, totalPendientes, totalVentas, pendiente_pago };
  }, [ventas]);

  /* ================= FILTROS ================= */
  const ventasFiltradas = useMemo(() => {
    let data = [...ventas];

    if (filtro === "pagadas") {
      data = data.filter(v => v.estado_pago === true);
    }

    if (filtro === "pendientes") {
      data = data.filter(v => v.estado_pago === false);
    }

    if (busqueda) {
      data = data.filter(v =>
        v.numero_factura?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    return data;
  }, [ventas, filtro, busqueda]);

  const totalPaginas = Math.ceil(ventasFiltradas.length / porPagina);
  const ventasPagina = ventasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  // utils/format.ts
  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);


  /* ================= FINALIZAR VENTA ================= */
  const handleFinalizarVenta = async () => {
    if (!ventaSeleccionada) return;
    const payload = {
      idUsuario,
      id_negocio,
      id_venta: ventaSeleccionada.id_pago,
      metodo_pago: metodoPago,
      monto_recibido: montoRecibido,
      cambio: cambio,
      id_mesa:ventaSeleccionada.id_mesa||0
    };

    console.log("payload",payload);
    
    try {
      const { data } = await actualiza_venta(payload);
      if (data?.ok) {
        setOpenPago(false);
        setDetalleOpen(false);
        setVentaSeleccionada(null);
        setMontoRecibido("");
        setMetodoPago("EFECTIVO");
        cargarVentas();
        Swal.fire({
          title: "Venta registrada",
          html: `<b style="font-size:18px;color:#16a34a">✅ Operación exitosa</b><br/><br/>La venta se guardó correctamente`,
          icon: "success",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#16a34a",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error al registrar la venta",
        text: "Ocurrió un problema al guardar la venta. Intente nuevamente.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#d32f2f",
      });
    }
  };

const ticketRef = useRef<HTMLDivElement>(null);
const imprimirPOS = useReactToPrint({
  contentRef: ticketRef,
  documentTitle: "Factura POS",
  pageStyle: `
    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
  `,
});

  return (
    <>
      {/* ================= LISTADO VENTAS ================= */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">

            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 50,
                  height: 50,
                  boxShadow: 2
                }}
              >
                <PointOfSaleIcon />
              </Avatar>

              <Box>
                <Typography fontWeight={800} fontSize={18}>
                  Ventas de Caja
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gestión de facturación · {new Date().toLocaleDateString("es-CO")}
                </Typography>
              </Box>
            </Stack>

            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>

          </Stack>
        </DialogTitle>
        <DialogContent>
          {/* Búsqueda */}
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar factura..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Métricas */}
          <Box display="flex" flexWrap="wrap" gap={2} mb={3}>

            {/* TODAS */}
            <Box flex="1 1 200px">
              <Card
                onClick={() => setFiltro("todas")}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  border: filtro === "todas" ? "2px solid #1976d2" : "1px solid #eee",
                  background:
                    filtro === "todas"
                      ? "linear-gradient(135deg,#e3f2fd,#f1f8ff)"
                      : "#fff",
                  transform: filtro === "todas" ? "scale(1.03)" : "scale(1)",
                  boxShadow: filtro === "todas" ? 4 : 1,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <ReceiptLongIcon color="primary" />
                  <Box>
                    <Typography fontSize={12} color="text.secondary">
                      Facturas
                    </Typography>
                    <Typography fontWeight={800} fontSize={18}>
                      {ventas.length}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Box>

            {/* PAGADAS */}
            <Box flex="1 1 200px">
              <Card
                onClick={() => setFiltro("pagadas")}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  border: filtro === "pagadas" ? "2px solid #2e7d32" : "1px solid #eee",
                  background:
                    filtro === "pagadas"
                      ? "linear-gradient(135deg,#e8f5e9,#f1fff5)"
                      : "#fff",
                  transform: filtro === "pagadas" ? "scale(1.03)" : "scale(1)",
                  boxShadow: filtro === "pagadas" ? 4 : 1,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <PaymentsIcon color="success" />
                  <Box>
                    <Typography fontSize={12} color="text.secondary">
                      Pagadas
                    </Typography>
                    <Typography fontWeight={800} fontSize={18} color="success.main">
                      {metrics.totalPagadas}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Box>

            {/* PENDIENTES */}
            <Box flex="1 1 200px">
              <Card
                onClick={() => setFiltro("pendientes")}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  border: filtro === "pendientes" ? "2px solid #d32f2f" : "1px solid #eee",
                  background:
                    filtro === "pendientes"
                      ? "linear-gradient(135deg,#ffebee,#fff5f5)"
                      : "#fff",
                  transform: filtro === "pendientes" ? "scale(1.03)" : "scale(1)",
                  boxShadow: filtro === "pendientes" ? 4 : 1,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <PaymentsIcon color="error" />
                  <Box>
                    <Typography fontSize={12} color="text.secondary">
                      Pendientes
                    </Typography>
                    <Typography fontWeight={800} fontSize={18} color="error.main">
                      {metrics.totalPendientes}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Box>

          </Box>

          {/* Facturas */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)", // 🔥 8 columnas fijas
              gap: 1.5,
            }}
          >    {ventasPagina.map((venta) => (
            <Box key={venta.id_venta}>
              <motion.div whileHover={{ scale: 1.03 }}>
                <Card
                  sx={{
                    borderRadius: 4,
                    p: 2,
                    cursor: "pointer",
                    background: "linear-gradient(180deg,#ffffff,#fafafa)",
                    border: "1px solid #eee",
                    transition: "all .2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }
                  }}
                  onClick={() => abrirDetalle(venta)}
                >
                  <Stack spacing={1.5}>

                    {/* HEADER */}
                    <Stack direction="row" alignItems="center">
                      <Avatar sx={{ width: 28, height: 28 }}>
                        <Box
                          sx={{
                            bgcolor: "#e3f2fd",
                            borderRadius: 2,
                            p: 0.7,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <ReceiptLongIcon sx={{ color: "#1976d2", fontSize: 18 }} />
                        </Box>
                      </Avatar>

                      <Box ml={1}>
                        <Typography fontWeight={700} fontSize={11}>
                          {venta.numero_factura}
                        </Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {venta.fecha}
                        </Typography>
                          <Typography fontSize={11} color="text.secondary">
                          {venta.mesa|| 'Sin mesa'}
                        </Typography>
                      </Box>



                    </Stack>

                    <Chip
                      label={venta.estado_pago ? "Pagado" : "Pendiente"}
                      size="small"
                      color={venta.estado_pago ? "success" : "warning"}
                    />
                    <Divider />

                    {/* TOTAL */}
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontSize={12} color="text.secondary">
                        Total
                      </Typography>
                      <Typography fontWeight={800} color="primary">
                        {formatCOP(venta.venta_total)}
                      </Typography>
                    </Stack>

                  </Stack>
                </Card>
              </motion.div>
            </Box>
          ))}
          </Box>

          {/* Paginación */}
          <Box mt={4} display="flex" justifyContent="center">
            <Pagination count={totalPaginas} page={pagina} onChange={(_event: React.ChangeEvent<unknown>, value: number) => setPagina(value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid #eee" }}>
          <Stack direction="row" spacing={2} ml="auto">
            <Paper sx={{ px: 3, py: 1, bgcolor: "#ffebee" }}><Typography color="error.main" fontWeight={700}>Por cobrar: {formatCOP(metrics.pendiente_pago)}</Typography></Paper>
            <Paper sx={{ px: 3, py: 1, bgcolor: "#e8f5e9" }}><Typography color="success.main" fontWeight={700}>Vendido: {formatCOP(metrics.totalVentas)}</Typography></Paper>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* ================= DETALLE FACTURA ================= */}
      <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 420, maxWidth: "95%", overflow: "hidden" } }}>
        <Box sx={{ background: "linear-gradient(135deg,#1976d2,#42a5f5)", color: "#fff", p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}><ReceiptLongIcon /></Avatar>
              <Box>
                <Typography fontWeight={800}>Factura</Typography>
                <Typography fontSize={12}>#{ventaSeleccionada?.numero_factura}</Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setDetalleOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
          </Stack>
        </Box>
        <DialogContent sx={{ background: "#fafafa" }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, borderRadius: 3, background: "#fff", mb: 2 }}>
            <Avatar src={ventaSeleccionada?.cliente_imagen} sx={{ width: 46, height: 46 }}><PersonIcon /></Avatar>
            <Box>
              <Typography fontSize={12} color="text.secondary">Cliente</Typography>
              <Typography fontWeight={700}>{ventaSeleccionada?.nombre_completo}</Typography>
            </Box>
            <Box flex={1} />
            <Chip label={ventaSeleccionada?.estado_pago === true ? "Pagado" : "Pendiente"} color={ventaSeleccionada?.estado_pago === true ? "success" : "warning"} size="small" />
          </Stack>

          <Box sx={{ maxHeight: 260, overflowY: "auto", px: 1 }}>
            {loadingDetalle ? (
              <Box py={4} textAlign="center"><CircularProgress size={26} /></Box>
            ) : (
              <Stack spacing={1}>
                {productosDetalle.map((p: any) => (
                  <Card key={p.id_producto} sx={{ p: 1, borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar src={p.url_imagen} variant="rounded" sx={{ width: 40, height: 40 }} />
                    <Box flex={1}>
                      <Typography fontSize={13} fontWeight={600}>{p.nombre}</Typography>
                      <Typography fontSize={12} color="text.secondary">Cantidad: {p.cantidad}</Typography>
                    </Box>
                    <Typography fontWeight={700} fontSize={13}>{formatCOP(p.subtotal)}</Typography>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ p: 2, borderRadius: 3, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography fontWeight={700}>TOTAL</Typography>
            <Typography fontWeight={900} fontSize={22} color="primary">{formatCOP(ventaSeleccionada?.venta_total)}</Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Stack spacing={1} width="100%">
            {ventaSeleccionada?.estado_pago === false && (
              <Button fullWidth variant="contained" color="success" size="large" startIcon={<PaymentsIcon />} sx={{ borderRadius: 3, fontWeight: 700 }} onClick={() => setOpenPago(true)}>Finalizar Venta</Button>
            )}
            <Button
              fullWidth
              startIcon={<PrintIcon />}
              variant="contained"
              color="primary"
              sx={{ borderRadius: 3, fontWeight: 700 }}
              onClick={imprimirPOS}
            >
              Imprimir Ticket
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* ================= MODAL DE PAGO ================= */}
      <Dialog open={openPago} onClose={() => setOpenPago(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={800}>Finalizar Venta</Typography>
            <IconButton onClick={() => setOpenPago(false)}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Typography mb={1} fontWeight={700}>Total a pagar</Typography>
          <Typography fontSize={24} fontWeight={900} color="primary">{formatCOP(ventaSeleccionada?.venta_total)}</Typography>

          <TextField select fullWidth label="Método de Pago" size="small" sx={{ mt: 3 }} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <MenuItem value="EFECTIVO">💵 Efectivo</MenuItem>
            <MenuItem value="TRANSFERENCIA">🏦 Transferencia</MenuItem>
            <MenuItem value="TARJETA">💳 Tarjeta</MenuItem>
            <MenuItem value="PENDIENTE">⏳ Pendiente de Pago</MenuItem>
          </TextField>

          {metodoPago === "EFECTIVO" && (
            <>
              <TextField fullWidth autoFocus label="Monto recibido" size="small" sx={{ mt: 2 }}
                value={montoRecibido === "" ? "" : formatCOP(montoRecibido)}
                onChange={(e) => setMontoRecibido(Number(e.target.value.replace(/\D/g, "")))}
              />
              <Typography sx={{ mt: 2, fontWeight: 800 }} color={cambio < 0 ? "error.main" : "success.main"}>
                Cambio: {formatCOP(cambio)}
              </Typography>
            </>
          )}

        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button fullWidth variant="contained" color="success" disabled={metodoPago === "EFECTIVO" && cambio < 0} startIcon={<AddShoppingCartIcon />} onClick={handleFinalizarVenta} sx={{ borderRadius: 3, fontWeight: 700 }}>
            PAGAR FACTURA
          </Button>
        </DialogActions>
      </Dialog>

{/* RENDER DE FACTURA POST*/}
<div style={{ display: "none" }}>

  <FacturaPOS
    ref={ticketRef}
    venta={ventaSeleccionada}
    productos={productosDetalle}
  />

</div>

    </>
  );
}