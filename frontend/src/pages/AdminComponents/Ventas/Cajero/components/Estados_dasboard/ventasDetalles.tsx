import { useEffect, useState, useMemo } from "react";
import {
  Box, Card, Typography,Stack, Avatar, Chip, Dialog, DialogTitle, DialogContent, TextField, Pagination, IconButton, Paper, DialogActions, InputAdornment, Button, MenuItem, CircularProgress,
  Tooltip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import PaymentsIcon from "@mui/icons-material/Payments";
import SearchIcon from "@mui/icons-material/Search";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import RefreshIcon from "@mui/icons-material/Refresh";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { facturaPorCaja, productosPorVenta,cancelarFactura, actualiza_venta,imprimircomanda,imprimirfactura } from "../../../../../../api/cajero";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

export default function VentasDetalles({ open, onClose, id_caja }: any) {

  const [ventas, setVentas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState("todas");
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);
  const [productosDetalle, setProductosDetalle] = useState<any[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState<any>("");
  const [cambio, setCambio] = useState<number>(0);
  const idUsuario = localStorage.getItem("id_usuario");
  const id_negocio = localStorage.getItem("id_negocio");
  const nombreuser = localStorage.getItem("nombre");
  const [openVentaRegistrada, setOpenVentaRegistrada] = useState(false);
  const porPagina = 16;
  const cambioaux = montoRecibido - ventaSeleccionada?.venta_total || 0;
  const cambioSeguro = Math.max(cambioaux, 0);
  const [ventaPayload, setVentaPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (open && id_caja) cargarVentas();
  }, [open, id_caja]);

  useEffect(() => {
    if (metodoPago !== "EFECTIVO" || !ventaSeleccionada) {
      setCambio(0);
      return;
    }
    const total = Number(ventaSeleccionada.venta_total || 0);
    const recibido = Number(montoRecibido || 0);

    setCambio(recibido - total);
  }, [montoRecibido, metodoPago, ventaSeleccionada]);

const cargarVentas = async () => {
  try {
    setLoading(true);
    const { data } = await facturaPorCaja({ id_caja });
    if (data?.ok) setVentas(data.result);
  } finally {
    setLoading(false);
  }
};

const getEstadoChip = (venta: any) => {
   if (!venta || typeof venta !== "object") {
    return { label: "", color: "#ccc", icon: "" };
  }
  
  if (venta.estado_venta === "cancelado") {
    return {
      label: "Cancelada",
      color: "#d32f2f",
      icon: "❌"
    };
  }

  if (venta.estado_pago) {
    return {
      label: "Pagado",
      color: "#2e7d32",
      icon: "✔️"
    };
  }

  return {
    label: "Pendiente",
    color: "#ed6c02",
    icon: "⏳"
  };
};

const estado = ventaSeleccionada? getEstadoChip(ventaSeleccionada): null;

const getMetodoPagoIcon = (metodo:any) => {
  switch (metodo) {
    case "PENDIENTE":
      return <HourglassTopIcon sx={{ fontSize: 14, color: "#d32f2f" }} />;

    case "EFECTIVO":
      return <PaymentsIcon sx={{ fontSize: 14, color: "#2e7d32" }} />;

    case "TRANSFERENCIA":
      return <SyncAltIcon sx={{ fontSize: 14, color: "#1565c0" }} />;

    case "TARJETA":
      return <CreditCardIcon sx={{ fontSize: 14, color: "#6a1b9a" }} />;

    case "NEQUI":
    case "DAVIPLATA":
      return <PhoneIphoneIcon sx={{ fontSize: 14, color: "#00838f" }} />;

    case "TIQUERERA":
      return <ConfirmationNumberIcon sx={{ fontSize: 14, color: "#ef6c00" }} />;

    default:
      return <CreditCardIcon sx={{ fontSize: 14 }} />;
  }
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
    const totalPendientes = ventas.filter(v => v.estado_pago === false&& v.estado_venta!='cancelado').length;
    const totalCancelado = ventas.filter(v =>  v.estado_venta==='cancelado').length;

    const totalVentas = ventas
      .filter(v => v.estado_pago === true)
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

    const pendiente_pago = ventas
      .filter(v => v.estado_pago === false&&v.estado_venta==='activa')
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

         const facturas_canceladas = ventas
      .filter(v => v.estado_venta==='cancelado')
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

    return { totalPagadas, totalPendientes, totalVentas, pendiente_pago,facturas_canceladas,totalCancelado};
  }, [ventas]);

  /* ================= FILTROS ================= */
  const ventasFiltradas = useMemo(() => {
    let data = [...ventas];

    if (filtro === "pagadas") {
      data = data.filter(v => v.estado_pago === true);
    }

    if (filtro === "pendientes") {
      data = data.filter(v => v.estado_pago === false&& v.estado_venta!='cancelado');
    }
      if (filtro === "cancelado") {
      data = data.filter(v => v.estado_venta==='cancelado');
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
      id_mesa: ventaSeleccionada.id_mesa || 0,
      total_pago: ventaSeleccionada.venta_total
    };
    try {
      const { data } = await actualiza_venta(payload);
      if (data?.ok) {
        setVentaPayload(payload);
        setDetalleOpen(false);
        setOpenVentaRegistrada(true);
        setVentaSeleccionada(null);
        setMontoRecibido("");
        setMetodoPago("EFECTIVO");
        cargarVentas();
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

 const imprimirFactura = async (estado_impresion:String) => {
  try {
    if (!ventaSeleccionada) return;    
    const payload = {
      id_negocio:id_negocio,
      id_mesa:ventaSeleccionada.id_mesa,
      mesa:ventaSeleccionada.mesa,
      idUsuario:ventaSeleccionada.id_mesa,
      nombre_vendedor:ventaSeleccionada.nombre_vendedor,
      nota:ventaSeleccionada.nota,
      venta: {
        numero_factura: ventaSeleccionada.numero_factura,
        fecha_completa: ventaSeleccionada.fecha_completa,
        fecha_impresion: ventaSeleccionada.fecha_impresion,
        nombre_vendedor: nombreuser,
        identificacion_cliente: ventaSeleccionada.identificacion_cliente,
        nombre_completo: ventaSeleccionada.nombre_completo,
        telefono: ventaSeleccionada.telefono,
        email: ventaSeleccionada.email,
        venta_total: ventaSeleccionada.venta_total,
        descuento: 0,
        metodo_pago: ventaSeleccionada.metodo_pago,
        monto_recibido: ventaSeleccionada.monto_recibido,
        cambio: ventaSeleccionada.cambio
      },
      productos: productosDetalle.map((p) => ({
        id_producto: p.id_producto,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        subtotal: p.subtotal
      }))
    };

    if(estado_impresion=='comanda'){
      await imprimircomanda(payload);
    }else if(estado_impresion=='factura'){
       await imprimirfactura(payload );
    }
      
    Swal.fire({
      icon: "success",
      title: "Enviado a impresión",
      text: " Espere un momento se está imprimiendo...",
      timer: 1500,
      showConfirmButton: false
    });

  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo imprimir", "error");
  }
};

  return (
    <>
      {/* ================= LISTADO VENTAS ================= */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" PaperProps={{
        sx: {
          zIndex: 1200,
        },
      }} sx={{
        zIndex: 1200,
      }}>
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
                  <PaymentsIcon color="warning" />
                  <Box>
                    <Typography fontSize={12} color="text.secondary">
                      Pendientes
                    </Typography>
                    <Typography fontWeight={800} fontSize={18} color="#ed6c02">
                      {metrics.totalPendientes}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Box>

             {/* FACTURAS CANCELADAS */}
            <Box flex="1 1 200px">
              <Card
                onClick={() => setFiltro("cancelado")}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  border: filtro === "cancelado" ? "2px solid #d32f2f" : "1px solid #eee",
                  background:
                    filtro === "cancelado"
                      ? "linear-gradient(135deg,#ffebee,#fff5f5)"
                      : "#fff",
                  transform: filtro === "cancelado" ? "scale(1.03)" : "scale(1)",
                  boxShadow: filtro === "cancelado" ? 4 : 1,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <PaymentsIcon color="error" />
                  <Box>
                    <Typography fontSize={12} color="text.secondary">
                      canceladas
                    </Typography>
                    <Typography fontWeight={800} fontSize={18} color="#ed0202">
                      {metrics.totalCancelado}
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Box>


              <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Refrescar ventas" arrow>
              <IconButton
                onClick={cargarVentas}
                sx={{
                  borderRadius: 2,
                  bgcolor: "#f5f5f5",
                  border: "1px solid #e0e0e0",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "#e3f2fd",
                    transform: "rotate(90deg)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={18} />
                ) : (
                  <RefreshIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
          </Box>

          {/* Facturas */}
         <Box
  sx={{
    display: "grid",
    gridTemplateColumns: {
      xs: "repeat(2, 1fr)",
      sm: "repeat(3, 1fr)",
      md: "repeat(4, 1fr)",
      lg: "repeat(6, 1fr)",
      xl: "repeat(8, 1fr)",
    },
    gap: { xs: 1.2, md: 1.8 },
  }}
>
  {ventasPagina.map((venta) => {
    const isPagado = venta.estado_pago;
    const estado = getEstadoChip(venta); 
    return (
      <Box key={venta.id_venta}>
        <motion.div whileHover={{ scale: 1.04 }}>
          <Card
            sx={{
              borderRadius: 4,
              p: 1.5,
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              background:
                venta.estado_venta === "cancelado"
                  ? "linear-gradient(135deg,#ffebee,#ffffff)"
                  : isPagado
                  ? "linear-gradient(135deg,#e8f5e9,#ffffff)"
                  : "linear-gradient(135deg,#fff3e0,#ffffff)",
              border: "1px solid #eee",
              transition: "all .25s ease",
              "&:hover": {
                transform: "translateY(-6px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.12)"
              }
            }}
            onClick={() => abrirDetalle(venta)}
          >

            {/* BARRA SUPERIOR COLOR */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: 4,
                bgcolor:
                venta.estado_venta === "cancelado"
                  ? "#d32f2f"
                  : isPagado
                  ? "#2e7d32"
                  : "#ed6c02"
                            }}
            />

            <Stack spacing={1.2}>

              {/* HEADER */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: isPagado ? "#c8e6c9" : "#ffe0b2"
                    }}
                  >
                    <ReceiptLongIcon
                      sx={{
                        fontSize: 18,
                        color:"#0d4993" 
                      }}
                    />
                  </Avatar>

                  <Box>
                    <Typography fontWeight={700} fontSize={10}>
                      {venta.numero_factura}
                    </Typography>
                    <Typography fontSize={10} color="text.secondary">
                      {venta.fecha}
                    </Typography>
                  </Box>
                </Stack>
                  <Chip
            label={`${estado.icon} ${estado.label}`}
            size="small"
            sx={{
              fontSize: 10,
              fontWeight: 700,
              bgcolor: estado.color,
              color: "#fff",
              borderRadius: 2,
              px: 0.5,
              letterSpacing: 0.3,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
            }}
          />
            
              </Stack>

              {/* CLIENTE */}
              <Box>
                <Typography fontSize={11} fontWeight={600} noWrap>
                  {venta.nombre_completo}
                </Typography>
                <Typography fontSize={10} color="text.secondary" noWrap>
                  {venta.identificacion_cliente}
                </Typography>
              </Box>

              {/* TOTAL DESTACADO */}
              <Box
                sx={{
                  borderRadius: 2,
                  p: 1,
                  textAlign: "center",
                       background:
                venta.estado_venta === "cancelado"
                  ? "linear-gradient(135deg,#ed0202,#f85b5b)"
                  : isPagado
                   ? "linear-gradient(135deg,#2e7d32,#66bb6a)"
                    : "linear-gradient(135deg,#ed6c02,#ff9800)",
                  color: "#fff"
                }}
              >
                <Typography fontSize={10}>Total</Typography>
                <Typography fontWeight={700} fontSize={14}>
                  {formatCOP(venta.venta_total)}
                </Typography>
              </Box>

              {/* INFO EXTRA */}
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{
                  bgcolor: "#f9f9f9",
                  borderRadius: 2,
                  px: 1,
                  py: 0.5
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                {getMetodoPagoIcon(venta.metodo_pago)}
                <Typography fontSize={10} color="text.secondary">
                  {venta.metodo_pago}
                </Typography>
              </Stack>

                <Typography fontSize={10}>
                  🍽 {venta.mesa || "Sin mesa"}
                </Typography>
              </Stack>

              {/* FOOTER */}
              <Typography fontSize={9.5} color="text.secondary" noWrap>
                👤 {venta.nombre_vendedor}
              </Typography>

            </Stack>
          </Card>
        </motion.div>
      </Box>
    );
  })}
</Box>

          {/* Paginación */}
          <Box mt={4} display="flex" justifyContent="center">
            <Pagination count={totalPaginas} page={pagina} onChange={(_event: React.ChangeEvent<unknown>, value: number) => setPagina(value)} />
          </Box>
        </DialogContent>
        <DialogActions
  sx={{
    borderTop: "1px solid #eee",
    justifyContent: "center"
  }}
>
  <Stack direction="row" spacing={2}>
    <Paper sx={{ px: 3, py: 1, bgcolor: "#ffebee" }}>
      <Typography color="error.main" fontWeight={700}>
        Facturas canceladas: {formatCOP(metrics.facturas_canceladas)}
      </Typography>
    </Paper>
    <Paper sx={{ px: 3, py: 1, bgcolor: "#ffffeb" }}>
      <Typography color="warning" fontWeight={700}>
        Por cobrar: {formatCOP(metrics.pendiente_pago)}
      </Typography>
    </Paper>

    <Paper sx={{ px: 3, py: 1, bgcolor: "#e8f5e9" }}>
      <Typography color="success.main" fontWeight={700}>
        Vendido: {formatCOP(metrics.totalVentas)}
      </Typography>
    </Paper>
  </Stack>
</DialogActions>
      </Dialog>

      {/* ================= DETALLE FACTURA ================= */}
    <Dialog
  open={detalleOpen}
  onClose={() => setDetalleOpen(false)}
  PaperProps={{
    sx: {
      borderRadius: 4,
      width: 420,
      maxWidth: "95%",
      overflow: "hidden"
    }
  }}
>
  {/* HEADER */}
 <Box
  sx={{
    background: "linear-gradient(135deg,#1976d2,#42a5f5)",
    color: "#fff",
    px: 2.5,
    py: 2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  }}
>
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
  >
    {/* IZQUIERDA */}
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Avatar
        sx={{
          width: 42,
          height: 42,
          bgcolor: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(6px)"
        }}
      >
        <ReceiptLongIcon />
      </Avatar>

      <Box>
        <Typography fontWeight={800} fontSize={16}>
          Factura
        </Typography>

        <Typography fontSize={12} sx={{ opacity: 0.9 }}>
          #{ventaSeleccionada?.numero_factura}
        </Typography>
      </Box>
    </Stack>

    {/* DERECHA (ACCIONES) */}
    <Stack direction="row" spacing={1}>
      
      {/* CANCELAR */}
     
     {ventaSeleccionada?.estado_venta!='cancelado'&& ventaSeleccionada?.estado_pago===false&& (
  <Tooltip title="Cancelar factura" arrow>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setOpenCancel(true);
          }}
          sx={{
            color: "#fff",
            bgcolor: "rgba(255,82,82,0.2)",
            transition: "all .2s ease",
            "&:hover": {
              bgcolor: "#d32f2f",
              transform: "scale(1.1)"
            }
          }}
        >
          <CancelOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

     )}
    

      {/* CERRAR */}
      <Tooltip title="Cerrar" arrow>
        <IconButton
          onClick={() => setDetalleOpen(false)}
          sx={{
            color: "#fff",
            bgcolor: "rgba(255,255,255,0.15)",
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.3)"
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>

    </Stack>
  </Stack>
</Box>

  {/* CLIENTE */}
  <Box sx={{ p: 2, bgcolor: "#fff", borderBottom: "1px solid #eee" }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar src={ventaSeleccionada?.cliente_imagen} sx={{ width: 46, height: 46 }}>
        <PersonIcon />
      </Avatar>

      <Box>
        <Typography fontSize={11} color="text.secondary">
          Cliente
        </Typography>

        <Typography fontWeight={700} fontSize={14} noWrap>
          {ventaSeleccionada?.nombre_completo}
        </Typography>

        <Typography fontSize={11} color="text.secondary">
          {ventaSeleccionada?.identificacion_cliente}
        </Typography>
      </Box>

      <Box flex={1} />

     <Chip
        label={estado?.label}
        size="small"
        sx={{
          bgcolor: estado?.color,
          color: "#fff",
          fontWeight: 700,
          borderRadius: 2,
          px: 1,
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
        }}
      />
    </Stack>
  </Box>

  {/* CONTENIDO CON SCROLL */}
 <DialogContent
  sx={{
    p: 0,
    display: "flex",
    flexDirection: "column",
    minHeight: 150, 
    maxHeight: "60vh",
    background: "#fafafa"
  }}
>
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        px: 2,
        py: 1,

        "&::-webkit-scrollbar": {
          width: 6
        },
        "&::-webkit-scrollbar-thumb": {
          background: "#ccc",
          borderRadius: 10
        }
      }}
    >
      {loadingDetalle ? (
        <Box py={4} textAlign="center">
          <CircularProgress size={26} />
        </Box>
      ) : (
        <Stack spacing={1.2}>
          {productosDetalle.map((p) => (
            <Card
              key={p.id_producto}
              sx={{
                p: 1.2,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                border: "1px solid #eee",
                boxShadow: "none"
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" flex={1}>
                <Avatar
                  src={p.url_imagen}
                  variant="rounded"
                  sx={{ width: 42, height: 42 }}
                />

                <Box>
                  <Typography fontSize={12.5} fontWeight={600} noWrap>
                    {p.nombre}
                  </Typography>

                  <Typography fontSize={11} color="text.secondary">
                    x{p.cantidad}
                  </Typography>
                </Box>
              </Stack>

              <Typography fontWeight={700} fontSize={12.5}>
                {formatCOP(p.subtotal)}
              </Typography>
            </Card>
          ))}
        </Stack>
      )}

      {/* NOTA */}
      {ventaSeleccionada?.nota && (
        <Box
          sx={{
            p: 1,
            mt: 2,
            borderRadius: 2,
            bgcolor: "#f9fafb",
            border: "1px dashed #d1d5db"
          }}
        >
          <Typography fontSize={11} color="text.secondary">
            📝 {ventaSeleccionada.nota}
          </Typography>
        </Box>
      )}
    </Box>
  </DialogContent>

  {/* FOOTER */}
  <DialogActions sx={{ p: 2 }}>
    <Stack spacing={1} width="100%">

      {/* TOTAL */}
      <Box
        sx={{
          p: 1.2,
          borderRadius: 3,
          background: "linear-gradient(135deg,#111827,#1f2937)",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Typography fontWeight={600}>Total</Typography>
        <Typography fontWeight={800}>
          {formatCOP(ventaSeleccionada?.venta_total)}
        </Typography>
      </Box>

      {/* FORM PAGO */}
      { ventaSeleccionada?.estado_venta!='cancelado'&&ventaSeleccionada?.estado_pago === false && (
        <>
          <TextField
            select
            fullWidth
            label="Método de Pago"
            size="small"
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            <MenuItem value="EFECTIVO">💵 Efectivo</MenuItem>
            <MenuItem value="TRANSFERENCIA">🔁 Transferencia</MenuItem>
            <MenuItem value="TARJETA">💳 Tarjeta</MenuItem>
            <MenuItem value="NEQUI">📲 Nequi</MenuItem>
            <MenuItem value="DAVIPLATA">📲 DaviPlata</MenuItem>
            <MenuItem value="TIQUERERA">🎟️ Tiquetera</MenuItem>
          </TextField>

          {metodoPago === "EFECTIVO" && (
            <>
              <TextField
                fullWidth
                label="Monto recibido"
                size="small"
                type="text"
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                sx={{ mt: 1 }}
                value={montoRecibido === "" ? "" : formatCOP(montoRecibido)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setMontoRecibido(raw === "" ? "" : Number(raw));
                }}
              />

              {montoRecibido !== "" && cambio < 0 && (
                <Typography color="error" variant="caption">
                  El monto recibido es menor al total
                </Typography>
              )}

              <Typography
                sx={{ mt: 1, fontWeight: 800 }}
                color={cambio < 0 ? "error.main" : "success.main"}
              >
                Cambio: {formatCOP(cambioSeguro)}
              </Typography>
            </>
          )}

          <Button
            fullWidth
            variant="contained"
            color="success"
            disabled={metodoPago === "EFECTIVO" && cambio < 0}
            startIcon={<AddShoppingCartIcon />}
            onClick={handleFinalizarVenta}
            sx={{ borderRadius: 3, fontWeight: 700 }}
          >
            PAGAR FACTURA
          </Button>
        </>
      )}

      {/*  IMPRESIONES COMANDA O FACTURA */}

 {ventaSeleccionada?.estado_pago === false && (
  <Button
          fullWidth
          startIcon={<PrintIcon />}
          variant="contained"
          color="primary"
          sx={{ borderRadius: 3, fontWeight: 700 }}
          onClick={() => imprimirFactura("comanda")}
        >
          Imprimir Comanda
        </Button>
 )}
    
     {ventaSeleccionada?.estado_pago === true && (
      <Button
        fullWidth
        startIcon={<PrintIcon />}
        variant="contained"
        color="primary"
        sx={{ borderRadius: 3, fontWeight: 700 }}
        onClick={() => imprimirFactura("factura")}
      >
        Imprimir Factura
      </Button>

     )}
    

    </Stack>
  </DialogActions>
</Dialog>

      {/* === DIALOG VENTA REGISTRADA === */}
      <Dialog
        open={openVentaRegistrada}
        onClose={() => setOpenVentaRegistrada(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            minWidth: 380,
            maxWidth: 420,
            boxShadow: "0 15px 40px rgba(0,0,0,0.12)"
          }
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            background: "linear-gradient(135deg,#16a34a,#22c55e)",
            color: "white",
            py: 3,
            px: 2,
            textAlign: "center"
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 48 }} />
          <Typography variant="h6" fontWeight="bold">
            Venta registrada con éxito
          </Typography>
        </Box>


        {/* CONTENIDO */}
        <DialogContent sx={{ textAlign: "center", py: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              background: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
          >
            <Stack spacing={1} alignItems="center">

              <Typography fontSize={13} color="text.secondary">
                Total de la venta
              </Typography>

              <Typography
                variant="h5"
                fontWeight="bold"
                color="success.main"
              >
                {formatCOP(ventaPayload?.total_pago ?? 0)}
              </Typography>

              <Chip
                label={`Pago: ${formatCOP(ventaPayload?.total_pago ?? 0)}`}
                color="success"
                size="small"
                sx={{ fontWeight: 500 }}
              />

            </Stack>
          </Paper>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            justifyContent: "center",
            pb: 3
          }}
        >
          <Button
            variant="contained"
            onClick={() => setOpenVentaRegistrada(false)}
            sx={{
              borderRadius: 3,
              px: 5,
              py: 1,
              textTransform: "none",
              fontWeight: "bold",
              background: "linear-gradient(90deg,#16a34a,#22c55e)",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
            }}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>


      {/*Modal elegante */}

      <Dialog
        open={openCancel}
        onClose={() => setOpenCancel(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden"
          }
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            background: "linear-gradient(135deg,#d32f2f,#ef5350)",
            color: "#fff",
            p: 2.5
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)" }}>
              ⚠️
            </Avatar>

            <Box>
              <Typography fontWeight={800} fontSize={18}>
                Cancelar factura
              </Typography>
              <Typography fontSize={12} sx={{ opacity: 0.9 }}>
                Esta acción no se puede deshacer
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* CONTENIDO */}
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>

            {/* INFO FACTURA */}
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "#f9fafb",
                border: "1px solid #eee"
              }}
            >
              <Typography fontSize={12} color="text.secondary">
                Factura
              </Typography>

              <Typography fontWeight={700}>
                #{ventaSeleccionada?.numero_factura}
              </Typography>

              <Typography fontSize={13} color="text.secondary">
                Cliente: {ventaSeleccionada?.nombre_completo}
              </Typography>
            </Box>

            {/* INPUT */}
            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={5}
              label="Motivo de cancelación"
              placeholder="Ej: Error en pedido, cliente desistió, etc..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />

            {/* ALERTA */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "#fff3e0",
                border: "1px dashed #ff9800"
              }}
            >
              <Typography fontSize={12} color="#e65100">
                ⚠️ La factura será marcada como cancelada y no afectará los reportes de venta.
              </Typography>
            </Box>

          </Stack>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 1
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            width="100%"
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setOpenCancel(false)}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 600
              }}
            >
              Volver
            </Button>

            <Button
              fullWidth
              color="error"
              variant="contained"
              disabled={!motivo}
              onClick={async () => {
                await cancelarFactura({
                  id_venta: ventaSeleccionada.id_venta,
                  nota: motivo
                });

                setOpenCancel(false);
                setDetalleOpen(false);
                cargarVentas();
              }}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(211,47,47,0.4)",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(211,47,47,0.6)"
                }
              }}
            >
              Confirmar cancelación
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}