import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TableRow,
  TableCell,
  TableHead,
  Table,
  TableBody,
  TextField,
  TablePagination,
  Paper
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SavingsIcon from "@mui/icons-material/Savings";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import InventoryIcon from '@mui/icons-material/Inventory';
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";

type Props = {
  open: boolean;
  onClose: () => void;
  arqueoInfo: any | null;
  esAdmin?: boolean;
};

export const ArqueoCajaModal: React.FC<Props> = ({ open, onClose, arqueoInfo, esAdmin }) => {

  const [buscarProducto, setBuscarProducto] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const inventarioFiltrado =
    arqueoInfo?.inventario?.filter((p: any) =>
      p.nombre?.toLowerCase().includes(buscarProducto.toLowerCase())
    ) || [];

  const inventarioPaginado = inventarioFiltrado.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const toNumber = (val: any) => Number(val) || 0;

  const getTotalByMetodo = (metodo: string) => {
    return toNumber(
      arqueoInfo?.ventas_metodos?.find((m: any) => m.metodo_pago === metodo)?.total
    );
  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(toNumber(value));

  //const total_efectivo = getTotalByMetodo("EFECTIVO");
  const total_targeta = getTotalByMetodo("TARJETA");
  const total_trasferencia = getTotalByMetodo("TRANSFERENCIA");
  const total_nequi = getTotalByMetodo("NEQUI");
  const total_daviplata = getTotalByMetodo("DAVIPLATA");
  const total_tiquteras = getTotalByMetodo("TIQUERERA");

  const totalDigital =
    total_targeta +
    total_trasferencia +
    total_nequi +
    total_daviplata +
    total_tiquteras;

  const totalEnCaja = arqueoInfo
    ? toNumber(arqueoInfo.monto_inicial) +
    toNumber(arqueoInfo.total_ventas) -
    toNumber(arqueoInfo.total_egresos) -
    totalDigital
    : 0;

  /** Agrupar productos por categoría */
  const productosPorCategoria = arqueoInfo?.productos?.reduce((acc: any, item: any) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {});


  const MiniKPI = ({ titulo, valor, color, icon }: any) => (
    <Paper
      variant="outlined"
      sx={{
        p: 1.2,
        borderRadius: 2,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">

        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: `${color}15`,
            color,
          }}
        >
          {icon}
        </Avatar>

        <Box>

          <Typography
            fontSize={10}
            color="text.secondary"
          >
            {titulo}
          </Typography>

          <Typography
            fontWeight={700}
            fontSize={13}
          >
            {formatCOP(valor)}
          </Typography>

        </Box>

      </Stack>
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: "bold", textAlign: "center", pb: 1 }}>
        Informe Arqueo de Caja
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {!arqueoInfo ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <CircularProgress size={45} />
            <Typography mt={2} color="text.secondary">
              Cargando datos del arqueo...
            </Typography>
          </Box>
        ) : (

          <Stack spacing={1.5}>

            {/* DATOS SOLO PARA EL ADMINISTRADOR DESDE EL MENU VENTAS ADMIN */}

            {esAdmin && (
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  p: 2,
                }}
              >

                {/* HEADER */}

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >

                  <Stack direction="row" spacing={1.5} alignItems="center">

                    <Avatar
                      sx={{
                        width: 42,
                        height: 42,
                        bgcolor:
                          arqueoInfo.estado_caja === "CERRADA"
                            ? "#ECFDF5"
                            : "#FFF7ED",
                        color:
                          arqueoInfo.estado_caja === "CERRADA"
                            ? "#059669"
                            : "#EA580C",
                      }}
                    >
                      <StorefrontOutlinedIcon fontSize="small" />
                    </Avatar>

                    <Box>

                      <Typography fontWeight={700}>
                        Caja #{arqueoInfo.id_caja}
                      </Typography>

                      <Typography
                        fontSize={12}
                        color="text.secondary"
                      >
                        {arqueoInfo.nombre}
                      </Typography>

                    </Box>

                  </Stack>

                  <Chip
                    size="small"
                    color={
                      arqueoInfo.estado_caja === "CERRADA"
                        ? "success"
                        : "warning"
                    }
                    label={arqueoInfo.estado_caja}
                  />

                </Stack>

                {/* FECHAS */}

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  mb={2}
                >

                  <Typography fontSize={12}>
                    Apertura: <b>{arqueoInfo.fecha_apertura}</b>
                  </Typography>

                  <Typography fontSize={12}>
                    Cierre: <b>{arqueoInfo.fecha_cierre || "-"}</b>
                  </Typography>

                </Stack>

                {/* KPIS */}

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 1,
                  }}
                >

                  <MiniKPI
                    titulo="Inicial"
                    valor={arqueoInfo.monto_inicial}
                    color="#2563EB"
                    icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />}
                  />

                  <MiniKPI
                    titulo="Ventas"
                    valor={arqueoInfo.total_ventas}
                    color="#16A34A"
                    icon={<TrendingUpOutlinedIcon fontSize="small" />}
                  />

                  <MiniKPI
                    titulo="Egresos"
                    valor={arqueoInfo.total_egresos}
                    color="#DC2626"
                    icon={<TrendingDownOutlinedIcon fontSize="small" />}
                  />

                  <MiniKPI
                    titulo="Caja"
                    valor={arqueoInfo.monto_final}
                    color="#0891B2"
                    icon={<AttachMoneyOutlinedIcon fontSize="small" />}
                  />

                  <MiniKPI
                    titulo="Base"
                    valor={arqueoInfo.base_caja}
                    color="#7C3AED"
                    icon={<Inventory2OutlinedIcon fontSize="small" />}
                  />

                  <MiniKPI
                    titulo="Libre"
                    valor={arqueoInfo.venta_libre}
                    color="#D97706"
                    icon={<PointOfSaleOutlinedIcon fontSize="small" />}
                  />

                </Box>

                {/* DIFERENCIA */}

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={2}
                >

                  <Typography fontWeight={700}>
                    Diferencia
                  </Typography>

                  <Chip
                    label={formatCOP(arqueoInfo.diferencia)}
                    color={
                      arqueoInfo.diferencia >= 0
                        ? "success"
                        : "error"
                    }
                    sx={{
                      fontWeight: 700,
                    }}
                  />

                </Stack>

                {arqueoInfo.nota_caja && (

                  <Typography
                    mt={2}
                    fontSize={12}
                    color="text.secondary"
                  >
                    {arqueoInfo.nota_caja}
                  </Typography>

                )}

              </Card>
            )}


            {/* MONTO INICIAL */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                bgcolor: "#fff",
                transition: "all .25s ease",
                "&:hover": {
                  boxShadow: "0 10px 28px rgba(15,23,42,.08)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2.5,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: "#EEF2FF",
                      color: "#4F46E5",
                    }}
                  >
                    <SavingsIcon />
                  </Avatar>

                  <Box>
                    <Typography
                      fontSize={12}
                      fontWeight={600}
                      color="#0F172A"
                      textTransform="uppercase"
                      letterSpacing={0.8}
                    >
                      Monto Inicial
                    </Typography>

                    <Typography
                      fontSize={12}
                      color="text.secondary"
                    >
                      Base de apertura de caja
                    </Typography>
                  </Box>
                </Stack>

                <Box textAlign="right">
                  <Typography
                    fontWeight={700}
                    fontSize={24}
                    color="#0F172A"
                  >
                    {formatCOP(arqueoInfo.monto_inicial)}
                  </Typography>

                  <Chip
                    label="Base"
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: "#F8FAFC",
                      color: "#475569",
                      border: "1px solid #E2E8F0",
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* VENTAS */}
            <Accordion
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 10px rgba(15,23,42,.05)",
                "&:before": { display: "none" },
                 transition: "all .25s ease",
                "&:hover": {
                  boxShadow: "0 10px 28px rgba(15,23,42,.08)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 3,
                  py: 1,
                  bgcolor: "#FAFBFC",
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  width="100%"
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: "#ECFDF5",
                        color: "#059669",
                      }}
                    >
                      <PointOfSaleIcon />
                    </Avatar>

                       <Box flex={1}>
                    <Typography
                      fontWeight={700}
                      fontSize={16}
                    >
                      Ventas del dia
                    </Typography>

                    <Typography
                      fontSize={12}
                      color="text.secondary"
                    >
                      Distribución por método de pago
                    </Typography>
                  </Box>
                  </Stack>

                  <Typography
                    fontWeight={800}
                    fontSize={24}
                    color="#0F766E"
                  >
                    {formatCOP(arqueoInfo.total_ventas)}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 2 }}>
                <Stack spacing={0.1}>
                  {arqueoInfo?.ventas_metodos?.map((v: any) => {
                    const total = Number(arqueoInfo.total_ventas || 0);

                    const porcentaje = total
                      ? (Number(v.total) / total) * 100
                      : 0;

                    const getIcon = (metodo: string) => {
                      switch (metodo) {
                        case "EFECTIVO":
                          return <PaymentsOutlinedIcon fontSize="small" />;
                        case "TARJETA":
                          return <CreditCardOutlinedIcon fontSize="small" />;
                        case "TRANSFERENCIA":
                          return <AccountBalanceOutlinedIcon fontSize="small" />;
                        case "NEQUI":
                        case "DAVIPLATA":
                          return <PhoneAndroidOutlinedIcon fontSize="small" />;
                        case "TIQUERERA":
                          return <ConfirmationNumberOutlinedIcon fontSize="small" />;
                        default:
                          return <PendingActionsOutlinedIcon fontSize="small" />;
                      }
                    };

                    const getColor = (metodo: string) => {
                      switch (metodo) {
                        case "EFECTIVO":
                          return "#16A34A";

                        case "TARJETA":
                          return "#2563EB";

                        case "TRANSFERENCIA":
                          return "#7C3AED";

                        case "NEQUI":
                          return "#DB2777";

                        case "DAVIPLATA":
                          return "#EA580C";

                        case "TIQUERERA":
                          return "#0891B2";

                        default:
                          return "#64748B";
                      }
                    };

                    return (
                      <Card
                        key={v.metodo_pago}
                        elevation={0}
                        sx={{
                          border: "1px solid #EDF2F7",
                          borderRadius: 3,
                          transition: ".2s",
                          "&:hover": {
                            boxShadow: "0 4px 16px rgba(0,0,0,.06)",
                          },
                        }}
                      >
                        <CardContent sx={{ py: 0.5 }}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar
                                sx={{
                                  width: 20,
                                  height: 20,
                                  bgcolor: `${getColor(v.metodo_pago)}15`,
                                  color: getColor(v.metodo_pago),
                                }}
                              >
                                {getIcon(v.metodo_pago)}
                              </Avatar>

                              <Box>
                                <Typography
                                  fontWeight={700}
                                  fontSize={10}
                                >
                                  {v.metodo_pago}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {porcentaje.toFixed(1)}% del total vendido
                                </Typography>
                              </Box>
                            </Stack>

                            <Typography
                              fontWeight={700}
                              fontSize={14}
                            >
                              {formatCOP(v.total)}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              mt: 0.5,
                              height: 5,
                              borderRadius: 20,
                              bgcolor: "#F1F5F9",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${porcentaje}%`,
                                height: "60%",
                                bgcolor: getColor(v.metodo_pago),
                                borderRadius: 20,
                                transition: ".5s",
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* EGRESOS */}
            <Accordion
              elevation={0}
              sx={{
                mt: 2,
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid #E5E7EB",
                boxShadow: "0 6px 18px rgba(15,23,42,.05)",
                "&:before": {
                  display: "none",
                },
                 transition: "all .25s ease",
                "&:hover": {
                  boxShadow: "0 10px 28px rgba(15,23,42,.08)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: "#FCFCFD",
                  py: .5,
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  width="100%"
                >
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: "#FEF2F2",
                      color: "#DC2626",
                    }}
                  >
                    <TrendingDownRoundedIcon />
                  </Avatar>

                  <Box flex={1}>
                    <Typography
                      fontWeight={700}
                      fontSize={16}
                    >
                      Egresos de Caja
                    </Typography>

                    <Typography
                      fontSize={12}
                      color="text.secondary"
                    >
                      Salidas de dinero registradas
                    </Typography>
                  </Box>

                  <Typography
                    fontWeight={800}
                    fontSize={20}
                    color="#DC2626"
                  >
                    {formatCOP(arqueoInfo.total_egresos)}
                  </Typography>
                </Stack>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 2 }}>

                <Stack spacing={1.5}>

                  {arqueoInfo?.egresos?.length === 0 && (
                    <Box
                      sx={{
                        py: 6,
                        textAlign: "center"
                      }}
                    >

                      <TrendingDownRoundedIcon
                        sx={{
                          fontSize: 50,
                          color: "#CBD5E1",
                          mb: 1
                        }}
                      />

                      <Typography
                        fontWeight={600}
                      >
                        No existen egresos registrados
                      </Typography>

                      <Typography
                        fontSize={12}
                        color="text.secondary"
                      >
                        Los egresos aparecerán aquí cuando se registren.
                      </Typography>

                    </Box>
                  )}
                </Stack>

                {arqueoInfo?.egresos?.map((e: any) => {
                  const fecha = new Date(e.created_at).toLocaleString("es-CO");

                  return (

                    <Box
                      key={e.id}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        borderRadius: 3,
                        bgcolor: "#fff",
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 2px 8px rgba(15,23,42,.04)",
                        transition: ".25s",

                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 20px rgba(15,23,42,.08)",
                        },
                      }}
                    >

                      {/* HEADER */}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >

                        <Box>

                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >

                            <ReceiptLongOutlinedIcon
                              sx={{
                                color: "#64748B",
                                fontSize: 18
                              }}
                            />

                            <Typography
                              fontWeight={700}
                            >
                              {e.descripcion}
                            </Typography>

                          </Stack>

                          <Typography
                            mt={0.5}
                            fontSize={12}
                            color="text.secondary"
                          >
                            Egreso #{e.numero_egreso}
                          </Typography>

                        </Box>

                        <Typography
                          fontWeight={800}
                          fontSize={18}
                          color="#DC2626"
                        >
                          - {formatCOP(e.monto)}
                        </Typography>

                      </Stack>

                      {/* METODO Y OBSERVACION */}
                      <Stack
                        direction="row"
                        spacing={3}
                        mt={1.5}
                        flexWrap="wrap"
                      >

                        <Stack
                          direction="row"
                          spacing={.5}
                          alignItems="center"
                        >

                          <CalendarTodayOutlinedIcon
                            sx={{
                              fontSize: 15,
                              color: "#94A3B8"
                            }}
                          />

                          <Typography
                            fontSize={12}
                            color="text.secondary"
                          >
                            {fecha}
                          </Typography>

                        </Stack>

                        <Stack
                          direction="row"
                          spacing={.5}
                          alignItems="center"
                        >

                          <PaymentsOutlinedIcon
                            sx={{
                              fontSize: 15,
                              color: "#94A3B8"
                            }}
                          />

                          <Typography
                            fontSize={12}
                            color="text.secondary"
                          >
                            {e.metodo_pago}
                          </Typography>

                        </Stack>

                        {e.observacion && (

                          <Stack
                            direction="row"
                            spacing={.5}
                            alignItems="center"
                          >

                            <NotesOutlinedIcon
                              sx={{
                                fontSize: 15,
                                color: "#94A3B8"
                              }}
                            />

                            <Typography
                              fontSize={12}
                              color="text.secondary"
                            >
                              {e.observacion}
                            </Typography>

                          </Stack>

                        )}
                      </Stack>
                    </Box>

                  );

                })}



              </AccordionDetails>

            </Accordion>

            {/* TOTAL EN CAJA */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #E5E7EB",
                bgcolor: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
                transition: "all .25s ease",
                "&:hover": {
                  boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2.5,
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: "#ECFDF5",
                      color: "#059669",
                    }}
                  >
                    <AttachMoneyIcon sx={{ fontSize: 30 }} />
                  </Avatar>

                  <Box flex={1}>
                    <Typography
                      fontSize={12}
                      fontWeight={600}
                      color="#64748B"
                      textTransform="uppercase"
                      letterSpacing={1}
                    >
                      Total en Caja
                    </Typography>

                    <Typography
                      fontSize={28}
                      fontWeight={800}
                      color="#0F172A"
                    >
                      {formatCOP(totalEnCaja)}
                    </Typography>
                    <Typography
                      fontSize={12}
                      color="text.secondary"
                    >
                      Disponible al cierre de caja
                    </Typography>
                  </Box>                  
                </Box>

                <Chip
                  label="Actual"
                  size="small"
                  sx={{
                    bgcolor: "#ECFDF5",
                    color: "#059669",
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                />
              </CardContent>
            </Card>


            {/* TOTAL INVENTARIO */}
            <Accordion
              elevation={0}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid #E2E8F0",
                boxShadow: "0 8px 25px rgba(15,23,42,.08)",
                "&:before": {
                  display: "none",
                },
                
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 3,
                  py: 1,
                  background:
                    "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      width: 50,
                      height: 50,
                      bgcolor: "#EEF2FF",
                      color: "#2563EB",
                    }}
                  >
                    <InventoryIcon />
                  </Avatar>

                  <Box>
                    <Typography fontWeight={800} fontSize={17}>
                      Inventario 
                    </Typography>

                    <Typography
                      fontSize={12}
                      color="text.secondary"
                    >
                      Resumen de movimientos del inventario durante la caja
                    </Typography>
                  </Box>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>

                {(!arqueoInfo?.inventario ||
                  arqueoInfo.inventario.length === 0) && (
                    <Box
                      sx={{
                        py: 6,
                        textAlign: "center",
                      }}
                    >
                      <InventoryIcon
                        sx={{
                          fontSize: 55,
                          color: "#CBD5E1",
                          mb: 1,
                        }}
                      />

                      <Typography color="text.secondary">
                        No existen movimientos de inventario.
                      </Typography>
                    </Box>
                  )}

                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar producto..."
                  value={buscarProducto}
                  onChange={(e) => setBuscarProducto(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    p: 2,
                    mb: 1,
                    maxWidth: 350,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: "#fff",
                    },
                  }}
                />

                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">

                    <TableHead>

                      <TableRow
                        hover
                        sx={{
                          "&:hover": {
                            bgcolor: "#FAFAFA",
                          },
                        }}
                      >
                        <TableCell><b>Producto</b></TableCell>

                        <TableCell align="center">
                          <b>Inicial</b>
                        </TableCell>

                        <TableCell align="center">
                          <b>Entradas</b>
                        </TableCell>

                        <TableCell align="center">
                          <b>Total</b>
                        </TableCell>

                        <TableCell align="center">
                          <b>Ventas</b>
                        </TableCell>

                        <TableCell align="center">
                          <b>Final</b>
                        </TableCell>

                      </TableRow>

                    </TableHead>

                    <TableBody>


                      {inventarioPaginado.map((p: any) => {

                        const inicial = Number(p.stock_apertura || 0);
                        const entradas = Number(p.ingresos || 0);
                        const ventas = Number(p.ventas || 0);
                        const total = inicial + entradas;
                        const final = total - ventas;

                        return (
                          <TableRow
                            hover
                            key={p.id_producto}
                            sx={{
                              "&:last-child td": {
                                borderBottom: 0,
                              },
                            }}
                          >
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: "#F8FAFC",
                                    color: "#475569",
                                  }}
                                >
                                  <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />
                                </Avatar>

                                <Typography
                                  fontWeight={600}
                                  fontSize={13}
                                >
                                  {p.nombre}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell align="center">
                              <Typography
                                fontWeight={600}
                                color="#475569"
                              >
                                {inicial}
                              </Typography>
                            </TableCell>

                            <TableCell align="center">
                              <Typography
                                fontWeight={600}
                                color="#15803D"
                              >
                                +{entradas}
                              </Typography>
                            </TableCell>

                            <TableCell align="center">
                              <Typography fontWeight={700}>
                                {total}
                              </Typography>
                            </TableCell>

                            <TableCell align="center">
                              <Typography
                                fontWeight={600}
                                color="#D97706"
                              >
                                {ventas}
                              </Typography>
                            </TableCell>

                            <TableCell align="center">
                              <Typography
                                fontWeight={700}
                                color={final > 0 ? "#0F766E" : "#DC2626"}
                              >
                                {final}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                    </TableBody>

                  </Table>
                  <TablePagination
                    component="div"
                    count={inventarioFiltrado.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                    rowsPerPageOptions={[10, 20, 50, 100]}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Divider />

            {/* PRODUCTOS VENDIDOS */}
            <Box>
              <Typography
                fontWeight="bold"
                fontSize={18}
                mb={2}
                display="flex"
                alignItems="center"
                gap={1}
              >
                <ShoppingBagRoundedIcon sx={{ color: "#2563eb" }} />
                Productos Vendidos
              </Typography>

              {productosPorCategoria &&
                Object.keys(productosPorCategoria).map((categoria) => {

                  const productos = productosPorCategoria[categoria];

                  const totalCategoria = productos.reduce(
                    (acc: number, p: any) => acc + Number(p.total_vendido),
                    0
                  );

                  return (
                    <Accordion
                      key={categoria}
                      sx={{
                        mb: 0.5,
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                        "&:before": { display: "none" }
                      }}
                    >
                      {/* HEADER CATEGORIA */}
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: "#1D4ED8" }} />}
                        sx={{
                          background: "linear-gradient(135deg, #F8FBFF, #EDF5FF)",
                          color: "#0F172A",
                          borderBottom: "1px solid #D6E4FF",
                          px: 2,
                          py: 1.2,
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          width="100%"
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <CategoryRoundedIcon
                              sx={{
                                fontSize: 18,
                                color: "#475569",
                              }}
                            />

                            <Typography fontWeight="bold" fontSize={15}>
                              {categoria}
                            </Typography>
                          </Box>

                          <Chip
                            label={formatCOP(totalCategoria)}
                            size="small"
                            sx={{
                              bgcolor: "white",
                              color: "primary.main",
                              fontWeight: "bold"
                            }}
                          />
                        </Box>
                      </AccordionSummary>

                      {/* PRODUCTOS */}
                      <AccordionDetails sx={{ p: 0 }}>
                        {productos.map((prod: any, index: number) => (
                          <Box
                            key={prod.id_producto}
                            sx={{
                              px: 2,
                              py: 1.2,
                              display: "grid",
                              gridTemplateColumns: "1fr 80px 120px",
                              alignItems: "center",
                              borderBottom:
                                index !== productos.length - 1
                                  ? "1px solid #eee"
                                  : "none",
                              "&:hover": {
                                bgcolor: "#f7f9fc",
                              }
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <LocalOfferRoundedIcon
                                sx={{
                                  fontSize: 16,
                                  color: "#64748B"
                                }}
                              />

                              <Typography fontSize={14}>
                                {prod.producto}
                              </Typography>
                            </Stack>

                            <Typography
                              fontWeight="bold"
                              textAlign="center"
                              sx={{
                                bgcolor: "#eef2ff",
                                color: "primary.main",
                                borderRadius: 2,
                                px: 1,
                                py: 0.3,
                                fontSize: 13,
                                width: "fit-content",
                                mx: "auto"
                              }}
                            >
                              <Chip
                                icon={<SellRoundedIcon />}
                                label={`${prod.cantidad_vendida} vendidos`}
                                size="small"
                                sx={{
                                  bgcolor: "#EEF6FF",
                                  color: "#2563EB",
                                  fontWeight: 700,
                                  "& .MuiChip-icon": {
                                    color: "#2563EB"
                                  }
                                }}
                              />
                            </Typography>

                            <Typography
                              fontWeight={600}
                              textAlign="right"
                              color="success.main"
                            >
                              {formatCOP(prod.total_vendido)}
                            </Typography>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
            </Box>


          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ pb: 2, px: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          sx={{
            py: 1,
            fontWeight: "bold",
            borderRadius: 2,
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};