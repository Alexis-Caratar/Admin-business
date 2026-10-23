import { useEffect, useState, useMemo } from "react";
import { avisarImpresion } from "../../../../../../components/impresion/ticket";
import {
  Box, Card, Typography, Stack, Avatar, Chip, Dialog, DialogTitle, DialogContent, TextField, Pagination, IconButton, Paper, DialogActions, InputAdornment, Button, MenuItem, CircularProgress,
  Tooltip,
  Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import SearchIcon from "@mui/icons-material/Search";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { facturaPorCaja, productosPorVenta, cancelarFactura, actualiza_venta, imprimircomanda, imprimirfactura, apibuscar_cliente } from "../../../../../../api/cajero";
import { useTheme, useMediaQuery } from "@mui/material";
import { CrearClienteModal } from "../CrearClienteModal";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import BlockIcon from "@mui/icons-material/Block";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";


type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
};


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
  const porPagina = 32;
  const cambioaux = montoRecibido - ventaSeleccionada?.venta_total || 0;
  const cambioSeguro = Math.max(cambioaux, 0);
  const [ventaPayload, setVentaPayload] = useState<any>(null);
  const [, setLoading] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [motivo, setMotivo] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [clienteBuscado, setClienteBuscado] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);
  const [modoEditarCliente, setModoEditarCliente] = useState(false);
  const [openCrearModal, setOpenCrearModal] = useState(false);


  const handleBuscarCliente = async (term: string) => {
    setClienteBuscado(term);

    if (term.trim().length < 2) {
      setResultados([]);
      return;
    }

    const res = await apibuscar_cliente({
      id_cliente: term,
    });

    setResultados(res.data.result);
  };

  const seleccionarCliente = (cli: Cliente) => {
    setClienteSeleccionado(cli);
    setResultados([]);
    setClienteBuscado("");
  };

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

  const estado = ventaSeleccionada ? getEstadoChip(ventaSeleccionada) : null;

  const getMetodoPagoIcon = (metodo: any) => {
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
    setModoEditarCliente(false);
    setLoadingDetalle(false);
  };


  /* ================= METRICAS ================= */
  const metrics = useMemo(() => {
    const totalPagadas = ventas.filter(v => v.estado_pago === true).length;
    const totalPendientes = ventas.filter(v => v.estado_pago === false && v.estado_venta != 'cancelado').length;
    const totalCancelado = ventas.filter(v => v.estado_venta === 'cancelado').length;

    const totalVentas = ventas
      .filter(v => v.estado_pago === true)
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

    const pendiente_pago = ventas
      .filter(v => v.estado_pago === false && v.estado_venta === 'activa')
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

    const facturas_canceladas = ventas
      .filter(v => v.estado_venta === 'cancelado')
      .reduce((acc, v) => acc + Number(v.venta_total || 0), 0);

    return { totalPagadas, totalPendientes, totalVentas, pendiente_pago, facturas_canceladas, totalCancelado };
  }, [ventas]);

  /* ================= FILTROS ================= */
  const ventasFiltradas = useMemo(() => {
    let data = [...ventas];

    if (filtro === "pagadas") {
      data = data.filter(v => v.estado_pago === true);
    }

    if (filtro === "pendientes") {
      data = data.filter(v => v.estado_pago === false && v.estado_venta != 'cancelado');
    }
    if (filtro === "cancelado") {
      data = data.filter(v => v.estado_venta === 'cancelado');
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
      id_venta: ventaSeleccionada.id_venta,
      metodo_pago: metodoPago,
      monto_recibido: montoRecibido,
      cambio: cambio,
      id_mesa: ventaSeleccionada.id_mesa || 0,
      total_pago: ventaSeleccionada.venta_total,
      id_cliente: clienteSeleccionado?.id || ventaSeleccionada.id_cliente,
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

  const imprimirFactura = async (estado_impresion: String) => {
    try {
      if (!ventaSeleccionada) return;
      const payload = {
        id_venta: ventaSeleccionada.id_venta,
        id_negocio: id_negocio,
        id_mesa: ventaSeleccionada.id_mesa,
        mesa: ventaSeleccionada.mesa,
        idUsuario: idUsuario,
        nombre_vendedor: ventaSeleccionada.nombre_vendedor,
        nota: ventaSeleccionada.nota,
        venta: {
          numero_factura: ventaSeleccionada.numero_factura,
          fecha_completa: ventaSeleccionada.fecha_completa,
          fecha_impresion: ventaSeleccionada.fecha_impresion,
          nombre_vendedor: nombreuser, //revisar este estado esta duplicado en el payload
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

      // El servidor responde si el punto de venta imprimió; si no, se puede imprimir aquí
      const { data } = estado_impresion == 'comanda' ? await imprimircomanda(payload) : await imprimirfactura(payload);
      await avisarImpresion(data, estado_impresion == 'comanda' ? "La comanda" : "La factura");

    } catch (error) {
      console.error(error);
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      Swal.fire("No se imprimió", msg ?? "No se pudo imprimir", msg ? "warning" : "error");
    }
  };


    const cards = [
      {
        id: "todas",
        title: "Facturas",
        value: ventas.length,
        icon: <ReceiptLongIcon />,
        color: "#2563EB",
        bg: "#EFF6FF",
      },
      {
        id: "pagadas",
        title: "Pagadas",
        value: metrics.totalPagadas,
        icon: <PaymentsIcon />,
        color: "#16A34A",
        bg: "#F0FDF4",
      },
      {
        id: "pendientes",
        title: "Pendientes",
        value: metrics.totalPendientes,
        // icon: <AccessTimeRoundedIcon />,
        color: "#D97706",
        bg: "#FFF7ED",
      },
      {
        id: "cancelado",
        title: "Canceladas",
        value: metrics.totalCancelado,
        //icon: <CancelRoundedIcon />,
        color: "#DC2626",
        bg: "#FEF2F2",
      },
    ];
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <Avatar
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: 3,
                  background: "linear-gradient(135deg,#2563EB,#60A5FA)",
                  boxShadow: "0 10px 20px rgba(37,99,235,.25)",

                  "& svg": {
                    fontSize: 28,
                  },
                }}
              >
                <PointOfSaleIcon />
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 20, md: 28 },
                    fontWeight: 800,
                    color: "#0F172A",
                    lineHeight: 1.1,
                  }}
                >
                  Ventas
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    fontSize: { xs: 12, md: 13 },
                    color: "#64748B",
                    fontWeight: 500,
                  }}
                >
                  Gestión y seguimiento de las ventas
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<RefreshRoundedIcon />}
              onClick={cargarVentas}
              sx={{
                borderRadius: 3,
                px: 2.5,
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg,#2563EB,#3B82F6)",

                "&:hover": {
                  background: "linear-gradient(135deg,#1D4ED8,#2563EB)",
                },
              }}
            >
              Actualizar ventas
            </Button>
          </Box>
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

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2,1fr)",
                sm: "repeat(2,1fr)",
                md: "repeat(4,1fr)",
              },
              gap: 2,
              mb: 3,
            }}
          >
            {cards.map((card) => {
              const active = filtro === card.id;

              return (
                <Card
                  key={card.id}
                  onClick={() => setFiltro(card.id)}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    borderRadius: "20px",
                    p: 2,
                    bgcolor: "#FFFFFF",
                    border: active
                      ? "1px solid #93C5FD"
                      : "1px solid rgba(15,23,42,.06)",

                    boxShadow: active
                      ? "0 10px 24px rgba(37,99,235,.12)"
                      : "0 4px 18px rgba(15,23,42,.05)",

                    transition: ".25s",

                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 14px 30px rgba(15,23,42,.10)",
                    },
                  }}
                >
                  {/* Decoración */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: -30,
                      right: -30,
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      background: card.color,
                      opacity: .08,
                    }}
                  />

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ position: "relative", zIndex: 2 }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#64748B",
                          textTransform: "uppercase",
                        }}
                      >
                        {card.title}
                      </Typography>

                      <Typography
                        sx={{
                          mt: .4,
                          fontSize: {
                            xs: 20,
                            md: 24,
                          },
                          fontWeight: 800,
                          color: "#0F172A",
                          lineHeight: 1,
                        }}
                      >
                        {card.value}
                      </Typography>
                    </Box>

                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: card.bg,
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                  </Stack>

                  {active && (
                    <Box
                      sx={{
                        mt: 1.5,
                        height: 4,
                        borderRadius: 10,
                        bgcolor: card.color,
                      }}
                    />
                  )}
                </Card>
              );
            })}
          </Box>


          {/* Facturas */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))", // 📱 2 tarjetas
                sm: "repeat(3, minmax(0, 1fr))", // Tablet
                md: "repeat(4, minmax(0, 1fr))", // Desktop
                lg: "repeat(5, minmax(0, 1fr))",
                xl: "repeat(6, minmax(0, 1fr))",
              },
              gap: {
                xs: 1,
                sm: 1.5,
                md: 2,
              },
              width: "100%",
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

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          spacing={1}
                        >
                          {/* IZQUIERDA */}
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flex={1}
                            minWidth={0}
                          >
                        

                            <Box minWidth={0}>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <ReceiptLongIcon
                                  sx={{
                                    fontSize: {
                                      xs: 10,
                                      md: 13,
                                    },
                                    color: "#25b3eb",
                                  }}
                                />

                                <Typography
                                  noWrap
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: {
                                      xs: 7.5,
                                      md: 12,
                                    },
                                    color: "#0F172A",
                                  }}
                                >
                                  {venta.numero_factura}
                                </Typography>
                              </Stack>

                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                mt={0.2}
                              >
                                <ScheduleIcon
                                  sx={{
                                    fontSize: {
                                      xs: 9,
                                      md: 12,
                                    },
                                    color: "#64748B",
                                  }}
                                />

                                <Typography
                                  noWrap
                                  sx={{
                                    fontSize: {
                                      xs: 8,
                                      md: 10,
                                    },
                                    color: "#64748B",
                                  }}
                                >
                                  {venta.fecha}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>

                          {/* CHIP */}
                          <Chip
                            label={`${estado.icon} ${estado.label}`}
                            size="small"
                            sx={{
                              flexShrink: 0,
                              alignSelf: "flex-start",

                              height: {
                                xs: 15,
                                md: 25,
                              },

                              "& .MuiChip-label": {
                                px: {
                                  xs: 0.8,
                                  md: 1.2,
                                },
                                fontSize: {
                                  xs: 5,
                                  md: 10,
                                },
                                fontWeight: 700,
                              },

                              bgcolor: estado.color,
                              color: "#fff",
                              borderRadius: 2,
                              boxShadow: "0 2px 6px rgba(0,0,0,.12)",
                            }}
                          />
                        </Stack>
                        <Divider sx={{ my: 1, borderColor: "#0a8dff31" }} />

                        {/* CLIENTE */}
                        <Box minWidth={0}>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <PersonIcon
                              sx={{
                                fontSize: {
                                  xs: 10,
                                  md: 13,
                                },
                                color: "#258beb",
                              }}
                            />

                            <Typography
                              noWrap
                              sx={{
                                fontWeight: 600,
                                fontSize: {
                                  xs: 8,
                                  sm: 9,
                                  md: 11,
                                },
                                color: "#0F172A",
                              }}
                            >
                              {venta.nombre_completo}
                            </Typography>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                            mt={0.2}
                          >
                            <BadgeIcon
                              sx={{
                                fontSize: {
                                  xs: 9,
                                  md: 12,
                                },
                                color: "#64748B",
                              }}
                            />

                            <Typography
                              noWrap
                              sx={{
                                fontSize: {
                                  xs: 7,
                                  sm: 8,
                                  md: 10,
                                },
                                color: "#64748B",
                              }}
                            >
                              {venta.identificacion_cliente}
                            </Typography>
                          </Stack>
                        </Box>

                        {/* TOTAL DESTACADO */}
                       <Box
                        sx={{
                            mt:1.5,
                            borderRadius:3,
                            bgcolor:"#F8FAFC",
                            border:"1px solid #E2E8F0",
                            py:1.2,
                            textAlign:"center"
                        }}
                    ><Typography
                        fontSize={10}
                        color="text.secondary"
                    >
                    Total venta
                    </Typography>

                    <Typography
                        fontWeight={800}
                        sx={{
                            fontSize:{xs:14,md:18},
                            color:"#0F172A"
                        }}
                    >
                        {formatCOP(venta.venta_total)}
                    </Typography>
                    </Box>

                        {/* INFO EXTRA */}
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{
                            bgcolor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            borderRadius: 2,
                            px: {
                              xs: 0.8,
                              md: 1,
                            },
                            py: {
                              xs: 0.4,
                              md: 0.7,
                            },
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={{
                              xs: 0.3,
                              md: 0.6,
                            }}
                            minWidth={0}
                          >
                            {getMetodoPagoIcon(venta.metodo_pago)}

                            <Typography
                              noWrap
                              sx={{
                                fontSize: {
                                  xs: 7,
                                  sm: 8,
                                  md: 10,
                                },
                                color: "#64748B",
                                fontWeight: 500,
                              }}
                            >
                              {venta.detalle_pago ?? venta.metodo_pago}
                            </Typography>
                          </Stack>

                          <Typography
                            noWrap
                            sx={{
                              fontSize: {
                                xs: 7,
                                sm: 8,
                                md: 10,
                              },
                              color: "#475569",
                              fontWeight: 600,
                            }}
                          >
                            🍽 {venta.mesa || "-"}
                          </Typography>
                        </Stack>

                        {/* FOOTER */}
                        <Box
                          sx={{
                            mt: 1.5,
                            pt: 1,
                            borderTop: "1px dashed #E2E8F0",
                          }}
                        >

                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >

                            <Typography
                              fontSize={11}
                              color="#64748B"
                              noWrap
                            >
                              👤 {venta.nombre_vendedor}
                            </Typography>

                          </Stack>

                        </Box>

                      </Stack>
                    </Card>
                  </motion.div>
                </Box>
              );
            })}
          </Box>

          {/* Paginación */}
          <Box mt={4} display="flex" justifyContent="center">

            {totalPaginas > 1 && (
              <Stack alignItems="center" mt={3}>
                <Pagination
                  count={totalPaginas}
                  page={pagina}
                  onChange={(_event: React.ChangeEvent<unknown>, value: number) => setPagina(value)}
                  color="primary"
                  shape="rounded"
                  size={isMobile ? "small" : "medium"}   // 👈 más compacto en móvil
                  siblingCount={isMobile ? 0 : 1}        // 👈 menos botones en móvil
                  boundaryCount={isMobile ? 1 : 2}
                  showFirstButton={!isMobile}            // 👈 ocultar en móvil
                  showLastButton={!isMobile}

                />
              </Stack>
            )}

          </Box>



        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 1, sm: 2, md: 3 },
            py: 2,
            borderTop: "1px solid #E2E8F0",
            bgcolor: "#F8FAFC",
          }}
        >
          <Stack
            direction="row"
            spacing={{ xs: 1, sm: 2 }}
            width="100%"
            justifyContent="space-between"
          >
            {/* CANCELADAS */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 0,
                p: { xs: 1, sm: 2 },
                borderRadius: 3,
                border: "1px solid #FECACA",
                bgcolor: "#FEF2F2",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 9, sm: 11, md: 12 },
                  fontWeight: 600,
                  color: "#991B1B",
                  whiteSpace: "nowrap",
                }}
              >
                Canceladas
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: { xs: 11, sm: 15, md: 18 },
                  fontWeight: 700,
                  color: "#DC2626",
                }}
              >
                {formatCOP(metrics.facturas_canceladas)}
              </Typography>
            </Paper>

            {/* POR COBRAR */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 0,
                p: { xs: 1, sm: 2 },
                borderRadius: 3,
                border: "1px solid #FDE68A",
                bgcolor: "#FFFBEB",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 9, sm: 11, md: 12 },
                  fontWeight: 600,
                  color: "#92400E",
                  whiteSpace: "nowrap",
                }}
              >
                Por cobrar
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: { xs: 11, sm: 15, md: 18 },
                  fontWeight: 700,
                  color: "#D97706",
                }}
              >
                {formatCOP(metrics.pendiente_pago)}
              </Typography>
            </Paper>

            {/* VENDIDO */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 0,
                p: { xs: 1, sm: 2 },
                borderRadius: 3,
                border: "1px solid #BFDBFE",
                bgcolor: "#EFF6FF",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: 9, sm: 11, md: 12 },
                  fontWeight: 600,
                  color: "#1E40AF",
                  whiteSpace: "nowrap",
                }}
              >
                Vendido
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: { xs: 11, sm: 15, md: 18 },
                  fontWeight: 700,
                  color: "#2563EB",
                }}
              >
                {formatCOP(metrics.totalVentas)}
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
                <Typography fontWeight={800} sx={{ opacity: 0.9,fontSize:{xs:14,md:18} }}>
                  Factura
                </Typography>

                <Typography  sx={{ opacity: 0.9,fontSize:{xs:9,md:14} }}>
                  #{ventaSeleccionada?.numero_factura}
                </Typography>
              </Box>
            </Stack>

            {/* DERECHA (ACCIONES) */}
            <Stack direction="row" spacing={1}>


              <Chip
                label={estado?.label}
                size="small"
                sx={{
                  bgcolor: estado?.color,
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 1,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  fontSize:{xs:8,md:14} 
                }}
              />


              {/* CANCELAR */}

              {ventaSeleccionada?.estado_venta != 'cancelado' && ventaSeleccionada?.estado_pago == false && (
                <Tooltip title="Cancelar factura" arrow>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenCancel(true);
                    }}
                    sx={{
                      color: "#ede0e0",
                      bgcolor: "rgba(237, 237, 237, 0.2)",
                      transition: "all .2s ease",
                      "&:hover": {
                        bgcolor: "#ffffff",
                        transform: "scale(1.1)"
                      }
                    }}
                  >
                    <BlockIcon sx={{color: "#DC2626",fontSize: 20}}
                  />
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



        <Box
     
        >




          {/* CUERPO */}
          <Box sx={{ p: 2 }}>
            {/* CLIENTE */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              {/* IZQUIERDA */}
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >

                {/* AVATAR */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg,#0ea5e9,#2563eb)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {(clienteSeleccionado?.nombres ||
                    ventaSeleccionada?.nombre_completo ||
                    "C")[0]}
                </Box>


                {/* INFO */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    fontWeight={800}
                    noWrap
                    sx={{
                      fontSize: {
                        xs: 13,
                        sm: 15,
                      },
                    }}
                  >
                    {clienteSeleccionado?.nombres ||
                      ventaSeleccionada?.nombre_completo}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{
                      fontSize: 12,
                    }}
                  >
                    Documento:{" "}
                    {clienteSeleccionado?.identificacion ||
                      ventaSeleccionada?.identificacion_cliente}
                  </Typography>
                </Box>
              </Stack>

              {/* BOTONES */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
              >
                {ventaSeleccionada?.estado_pago === false && !modoEditarCliente ? (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => setModoEditarCliente(true)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontWeight: 700,
                      px: 2,
                      background:
                        "linear-gradient(135deg,#0ea5e9,#2563eb)",

                      "&:hover": {
                        background:
                          "linear-gradient(135deg,#1d4ed8,#1e40af)",
                      },
                    }}
                  >
                    ✏️ Cambiar
                  </Button>
                ) : (
                  <Button
                    size="small"
                    color="inherit"
                    variant="outlined"
                    onClick={() => {
                      setModoEditarCliente(false);
                      setClienteBuscado("");
                      setResultados([]);
                    }}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontWeight: 700,
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </Stack>
            </Box>

            {/* MODO EDICIÓN */}
            {modoEditarCliente && (
              <Box mt={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar cliente por nombre o documento..."
                  value={clienteBuscado}
                  onChange={(e) =>
                    handleBuscarCliente(e.target.value)
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: "#fff",
                    },
                  }}
                />

                {/* RESULTADOS */}
                {resultados.length > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      maxHeight: 240,
                      overflowY: "auto",
                    }}
                  >
                    {resultados.map((cli) => (
                      <Box
                        key={cli.id}
                        onClick={() => {
                          seleccionarCliente(cli);
                          setModoEditarCliente(false);
                        }}
                        sx={{
                          p: 1.5,
                          cursor: "pointer",
                          transition: "all .2s ease",
                          borderBottom:
                            "1px solid rgba(226,232,240,.7)",

                          "&:hover": {
                            background:
                              "linear-gradient(135deg,#eff6ff,#f8fafc)",
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg,#0ea5e9,#2563eb)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 14,
                            }}
                          >
                            {cli.nombres[0]}
                          </Box>

                          <Box>
                            <Typography
                              fontWeight={700}
                              fontSize={13}
                            >
                              {cli.nombres} {cli.apellidos}
                            </Typography>

                            <Typography
                              fontSize={11}
                              color="text.secondary"
                            >
                              {cli.identificacion}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* BOTONES */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  mt={2}
                >
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setOpenCrearModal(true)}
                    sx={{
                      borderRadius: 3,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    + Crear Cliente / Empresa
                  </Button>
                </Stack>

                {/* MODAL */}
                <CrearClienteModal
                  open={openCrearModal}
                  onClose={() => setOpenCrearModal(false)}
                  onCreated={(nuevo: any) => {
                    const clienteFinal: Cliente = {
                      ...nuevo,
                    };

                    setClienteSeleccionado(clienteFinal);
                    setModoEditarCliente(false);
                    setOpenCrearModal(false);
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>



        {/* CONTENIDO CON SCROLL */}
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: "auto",
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
            {ventaSeleccionada?.estado_venta != 'cancelado' && ventaSeleccionada?.estado_pago === false && (
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
                  <MenuItem value="TIQUERERA" disabled={!clienteSeleccionado} >🎟️ Tiquetera</MenuItem>
                  {(!clienteSeleccionado ||
                    clienteSeleccionado.identificacion?.toLowerCase().includes("22222222")) && (
                      <Typography
                        mt={1}
                        fontSize={12}
                        color="warning.main"
                        fontWeight={600}
                      >
                        ⚠️ Debes seleccionar un cliente válido para usar tiquetera
                      </Typography>
                    )}              </TextField>

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

            {/*  IMPRESIONES: pendiente → solo comanda; pagada → comanda o factura; anulada → nada */}
            {ventaSeleccionada?.estado_venta !== "cancelado" ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%" }}>
                <Button
                  fullWidth
                  startIcon={<PrintIcon />}
                  variant={ventaSeleccionada?.estado_pago === true ? "outlined" : "contained"}
                  color="primary"
                  sx={{ borderRadius: 3, fontWeight: 700, textTransform: "none" }}
                  onClick={() => imprimirFactura("comanda")}
                >
                  Imprimir comanda
                </Button>
                {ventaSeleccionada?.estado_pago === true && (
                  <Button
                    fullWidth
                    startIcon={<ReceiptLongIcon />}
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: 3, fontWeight: 700, textTransform: "none", background: "linear-gradient(135deg,#2563EB,#3B82F6)" }}
                    onClick={() => imprimirFactura("factura")}
                  >
                    Imprimir factura
                  </Button>
                )}
              </Stack>
            ) : (
              <Typography sx={{ width: "100%", textAlign: "center", fontSize: 13, color: "#64748B" }}>Factura anulada: no se imprime</Typography>
            )}
            {ventaSeleccionada?.estado_venta !== "cancelado" && ventaSeleccionada?.estado_pago !== true && (
              <Typography sx={{ width: "100%", textAlign: "center", fontSize: 12, color: "#64748B" }}>La factura se imprime cuando la cuenta esté pagada</Typography>
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