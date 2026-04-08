import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Avatar,
  Stack,
  Card,
  Button,
  Dialog,
  Tooltip,
  IconButton,
  TextField,
  DialogContent,
  CircularProgress,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { motion } from "framer-motion";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import PaymentsIcon from "@mui/icons-material/Payments";
import SearchIcon from "@mui/icons-material/Search";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import type { Venta } from "../../../types/ventas";
import { productosPorVenta, imprimircomanda, imprimirfactura,apiArqueoCaja} from "../../../api/cajero";
import Swal from "sweetalert2";
import { Pagination } from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import { ArqueoCajaModal } from "./Cajero/components/Estados_dasboard/ArqueoCaja";
interface Props {
  ventas: Venta[];
  fecha: string;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

const VentasDelDia: React.FC<Props> = ({ ventas, fecha }) => {

  const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [productosDetalle, setProductosDetalle] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 16;
  const id_negocio = localStorage.getItem("id_negocio");
  const nombreuser = localStorage.getItem("nombre");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [openArqueo, setOpenArqueo] = useState(false);
  const [, setLoadingArqueo] = useState(false);
  const [arqueoInfo, setArqueoInfo] = useState<any | null>(null);

  const ventasDelDia = useMemo(() => {
    return ventas.filter((v) => {
      if (!v.fecha) return false;
      const normal = v.fecha.includes("T") ? v.fecha.split("T")[0] : v.fecha;
      return normal === fecha;
    });
  }, [ventas, fecha]);  

  const stats = useMemo(() => {
    if (!ventasDelDia.length) {
      return { cantidad: 0, totalDinero: 0, promedio: 0, ventaMayor: 0 };
    }

  const totalDinero = ventasDelDia
  .filter(v => v.estado_venta !== "cancelado" && v.estado_pago === true)
  .reduce((sum, v) => sum + Number(v.venta_total || 0), 0);
    const ventaMayor = Math.max(
      ...ventasDelDia.map((v) => Number(v.venta_total || 0))
    );

    return {
      cantidad: ventasDelDia.length,
      totalDinero,
      promedio: totalDinero / ventasDelDia.length,
      ventaMayor,
    };
  }, [ventasDelDia]);

  const statsArray = [
    {
      label: "Ventas",
      value: stats.cantidad,
      bg: "linear-gradient(135deg,#1976d2,#42a5f5)",
    },
    {
      label: "Total del día",
      value: formatCOP(stats.totalDinero),
      bg: "linear-gradient(135deg,#2e7d32,#66bb6a)",
    },
    {
      label: "Promedio",
      value: formatCOP(stats.promedio),
      bg: "linear-gradient(135deg,#6a1b9a,#ab47bc)",
    },
    {
      label: "Venta mayor",
      value: formatCOP(stats.ventaMayor),
      bg: "linear-gradient(135deg,#d32f2f,#ef5350)",
    },
  ];

  const abrirDetalle = async (venta: any) => {
    setVentaSeleccionada(venta);
    setDetalleOpen(true);
    setLoadingDetalle(true);
    const { data } = await productosPorVenta({ id_venta: venta.id });
    if (data?.ok) setProductosDetalle(data.result);
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

    return { totalPagadas, totalPendientes, totalVentas, pendiente_pago, facturas_canceladas, totalCancelado};
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

     if (filtro === "vendedor") {
      data = data.filter(v => v.nombre_vendedor );
    }

    if (busqueda) {
      data = data.filter(v =>
        v.numero_factura?.toLowerCase().includes(busqueda.toLowerCase())
        || v.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase())
        || v.nombre_vendedor?.toLowerCase().includes(busqueda.toLowerCase())
        || String(v.venta_total)?.toLowerCase().includes(busqueda.toLowerCase())
        || v.metodo_pago?.toLowerCase().includes(busqueda.toLowerCase())

      );
    }

    return data;
  }, [ventas, filtro, busqueda]);
  const totalPaginas = Math.ceil(ventasFiltradas.length / porPagina);
  const ventasPagina = ventasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina);



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

  const imprimirFactura = async (estado_impresion: String) => {
    try {
      if (!ventaSeleccionada) return;
      const payload = {
        id_negocio: id_negocio,
        id_mesa: ventaSeleccionada.id_mesa,
        mesa: ventaSeleccionada.mesa,
        idUsuario: ventaSeleccionada.id_mesa,
        nombre_vendedor: ventaSeleccionada.nombre_vendedor,
        nota: ventaSeleccionada.nota,
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

      if (estado_impresion == 'comanda') {
        await imprimircomanda(payload);
      } else if (estado_impresion == 'factura') {
        await imprimirfactura(payload);
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

const abrirArqueo = async (caja:any) => {
  try {
    setOpenArqueo(true);
    setLoadingArqueo(true);
     const { data } = await apiArqueoCaja({ id_caja: caja.id_caja });
   if (data?.ok) setArqueoInfo(data.result);
  } catch (error) {
    console.error(error);
  } finally {
    setLoadingArqueo(false);
  }
};

const cajasData = ventas
  .filter(v => v.estado_venta !== "cancelado" && v.estado_pago === true)
  .reduce((acc, v) => {
    const key = `${v.nombre_vendedor}-${v.id_caja}`;

    if (!acc[key]) {
      acc[key] = {
        nombre: v.nombre_vendedor || "Sin nombre",
        id_caja: v.id_caja,
        total: 0,
        cantidad: 0,
        monto_inicial: v.monto_inicial || 0,
        dinero_esperado: 0,
        monto_final: 0,
        base_caja: v.base_caja || 0,
        venta_libre: 0,
        diferencia: 0,
        estado: v.estado_caja ,
        fecha_apertura: v.fecha_apertura,
        fecha_cierre: v.fecha_cierre,
        nota: "",
      };
    }

    acc[key].total += Number(v.venta_total || 0);
    acc[key].cantidad += 1;
    acc[key].venta_libre += Number(v.venta_total || 0);

    return acc;
  }, {} as Record<string, any>);

  const cajasArray = Object.values(cajasData).map((caja: any) => {
  caja.dinero_esperado = caja.base_caja + caja.venta_libre-arqueoInfo;
  caja.monto_final = caja.total; // o el valor real si lo tienes
  caja.diferencia = caja.monto_final - caja.dinero_esperado;

  return caja;
});

  return (
    <>
      <Box>
        {/* ================= HEADER ================= */}
        <Box mb={3}>
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
                Gestión de facturación  {fecha}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* ================= STATS ================= */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          {statsArray.map((stat, i) => (
            <Box key={i} sx={{ flex: "1 1 180px" }}>
              <Paper
                sx={{
                  p: 1,
                  borderRadius: 4,
                  color: "#fff",
                  background: stat.bg,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                }}
              >
                <Typography fontSize={12} sx={{ opacity: 0.9 }}>
                  {stat.label}
                </Typography>

                <Typography fontSize={20} fontWeight={800}>
                  {stat.value}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

             {/* cajeros */}
<Box
  sx={{
    display: "grid",
    gridTemplateColumns: {
      xs: "repeat(2, 1fr)",
      sm: "repeat(3, 1fr)",
      md: "repeat(4, 1fr)",
      lg: "repeat(6, 1fr)",
    },
    gap: 1.5,
    mb: 3,
  }}
>
  {cajasArray.map((caja, index) => (
    <Card
      key={index}
      onClick={() => abrirArqueo(caja)}
      sx={{
        p: 1.2,
        borderRadius: 3,
        cursor: "pointer",
        border: "1px solid #eee",
        transition: "all .2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: 3,
        },
      }}
    >
      <Stack spacing={0.5}>
        
        {/* Nombre + caja */}
        <Typography fontSize={11} fontWeight={700} noWrap>
          {caja.nombre}
        </Typography>

        <Typography fontSize={10} color="text.secondary">
          Caja #{caja.id_caja}
        </Typography>

        {/* Métricas */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mt={0.5}
        >
          <Typography fontSize={10}>
            {caja.cantidad} ventas
          </Typography>

          <Typography fontSize={11} fontWeight={800} color="success.main">
            {formatCOP(caja.total)}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  ))}
</Box>


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
        </Box>


        <Divider sx={{ my: 2 }} />

        {/* ================= FACTURAS ================= */}
        <Typography fontWeight={800} mb={2}>
          Facturas del día
        </Typography>

        {!ventasDelDia.length && (
          <Typography color="text.secondary">
            No hay ventas este día.
          </Typography>
        )}


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
              <Box key={venta.id}>
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
                                color: "#0d4993"
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
        
     {totalPaginas > 1 && (
        <Stack alignItems="center" mt={3}>
          <Pagination
            count={totalPaginas}
            page={pagina}
            onChange={(_e: React.ChangeEvent<unknown>, value) => setPagina(value)}
            color="primary"
            shape="rounded"
            size={isMobile ? "small" : "medium"}  
            siblingCount={isMobile ? 0 : 1}        
            boundaryCount={isMobile ? 1 : 2}
            showFirstButton={!isMobile}           
            showLastButton={!isMobile}

          />
        </Stack>
      )}
      </Box>

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

              {ventaSeleccionada?.estado_venta != 'cancelado' && (
                <Tooltip title="Cancelar factura" arrow>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                  //    setOpenCancel(true);
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
           { /*
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
          */}

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


                <ArqueoCajaModal
                  open={openArqueo}
                  onClose={() => setOpenArqueo(false)}
                  arqueoInfo={arqueoInfo}
                  esAdmin={true}
                />

</>


  );
};

export default VentasDelDia;
