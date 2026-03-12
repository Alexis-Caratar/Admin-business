import React from "react";
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
  Chip
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SavingsIcon from "@mui/icons-material/Savings";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

type Props = {
  open: boolean;
  onClose: () => void;
  arqueoInfo: any | null;
};

export const ArqueoCajaModal: React.FC<Props> = ({ open, onClose, arqueoInfo }) => {

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value || 0);

  const totalEnCaja =
    arqueoInfo
      ? Number(arqueoInfo.monto_inicial) +
      Number(arqueoInfo.total_ventas) -
      Number(arqueoInfo.total_egresos)
      : 0;

  /** Agrupar productos por categoría */
  const productosPorCategoria = arqueoInfo?.productos?.reduce((acc: any, item: any) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {});

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
        Arqueo de Caja
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

            {/* MONTO INICIAL */}
            <Card elevation={10} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 50, height: 50 }}>
                  <SavingsIcon />
                </Avatar>

                <Box>
                  <Typography fontSize={14} color="text.secondary">
                    Monto Inicial - BASE
                  </Typography>
                  <Typography fontSize={22} fontWeight="bold">
                    {formatCOP(arqueoInfo.monto_inicial)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

           {/* VENTAS */}
<Accordion
  sx={{
    borderRadius: 3,
    overflow: "hidden",
    border: "1px solid",
    borderColor: "divider",
    "&:before": { display: "none" }
  }}
>

  <AccordionSummary expandIcon={<ExpandMoreIcon />}>

    <CardContent
    
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        width: "100%"
      }}
    >

      <Avatar
        sx={{
          bgcolor: "success.main",
          width: 50,
          height: 50
        }}
      >
        <PointOfSaleIcon />
      </Avatar>

      <Box>

        <Typography fontSize={13} color="text.secondary">
          Ventas Totales
        </Typography>

        <Typography
          fontSize={24}
          fontWeight="bold"
          color="success.main"
        >
          {formatCOP(arqueoInfo.total_ventas)}
        </Typography>

      </Box>

    </CardContent>

  </AccordionSummary>

  <AccordionDetails>

    <Stack spacing={0.1}>

      {arqueoInfo?.ventas_metodos?.map((v: any) => {

        const total = arqueoInfo.total_ventas || 0;

        const porcentaje = total
          ? ((v.total / total) * 100).toFixed(1)
          : 0;

        const getColor = (metodo: string) => {
          switch (metodo) {
            case "EFECTIVO":
              return "#4caf50";
            case "TARJETA":
              return "#1976d2";
            case "TRANSFERENCIA":
              return "#6a1b9a";
            case "NEQUI":
              return "#ff4081";
            case "DAVIPLATA":
              return "#ff9800";
            case "PENDIENTE":
              return "#9e9e9e";
            default:
              return "#607d8b";
          }
        };

        const getIcon = (metodo: string) => {
          switch (metodo) {
            case "EFECTIVO":
              return "💵";
            case "TARJETA":
              return "💳";
            case "TRANSFERENCIA":
              return "🏦";
            case "NEQUI":
              return "💜";
            case "DAVIPLATA":
              return "📱";
            case "PENDIENTE":
              return "⏳";
            default:
              return "💰";
          }
        };

        return (

          <Box
            key={v.metodo_pago}
            sx={{
              p: 0.5,
              borderRadius: 2,
              border: "1px solid #eee",
              bgcolor: "#fafafa",
              transition: "all .2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 2
              }
            }}
          >

            {/* HEADER */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
             
            >

              <Box display="flex" alignItems="center" gap={1}>

                <Typography fontSize={12}>
                  {getIcon(v.metodo_pago)}
                </Typography>

                <Typography fontWeight={600}>
                  {v.metodo_pago}
                </Typography>

              </Box>

              <Box textAlign="right">

                <Typography
                  fontWeight="bold"
                  sx={{
                    color: getColor(v.metodo_pago)
                  }}
                >
                  {formatCOP(v.total)}
                </Typography>

                <Typography
                  fontSize={10}
                  color="text.secondary"
                >
                  {porcentaje} %
                </Typography>

              </Box>

            </Box>

            {/* BARRA */}
            <Box
              sx={{
                height: 6,
                borderRadius: 5,
                bgcolor: "#eee",
                overflow: "hidden"
              }}
            >

              <Box
                sx={{
                  width: `${porcentaje}%`,
                  height: "100%",
                  bgcolor: getColor(v.metodo_pago),
                  transition: "width .4s ease"
                }}
              />

            </Box>

          </Box>

        );

      })}

    </Stack>

  </AccordionDetails>

</Accordion>
          {/* EGRESOS */}
<Accordion
  sx={{
    borderRadius: 3,
    overflow: "hidden",
    border: "1px solid",
    borderColor: "divider",
    "&:before": { display: "none" }
  }}
>

  <AccordionSummary expandIcon={<ExpandMoreIcon />}>

    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>

      <Avatar sx={{ bgcolor: "error.main", width: 50, height: 50 }}>
        <AttachMoneyIcon />
      </Avatar>

      <Box>
        <Typography fontSize={13} color="text.secondary">
          Egresos Totales
        </Typography>

        <Typography fontSize={24} fontWeight="bold" color="error.main">
          {formatCOP(arqueoInfo.total_egresos)}
        </Typography>
      </Box>

    </CardContent>

  </AccordionSummary>

  <AccordionDetails>

    <Stack spacing={1.5}>

      {arqueoInfo?.egresos?.length === 0 && (
        <Typography color="text.secondary">
          No hay egresos registrados
        </Typography>
      )}

      {arqueoInfo?.egresos?.map((e: any) => {

        const getIcon = (metodo: string) => {
          switch (metodo) {
            case "EFECTIVO":
              return "💵";
            case "TARJETA":
              return "💳";
            case "TRANSFERENCIA":
              return "🏦";
            default:
              return "💰";
          }
        };

        const fecha = new Date(e.created_at).toLocaleString("es-CO");

        return (

          <Box
            key={e.id}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid #eee",
              bgcolor: "#fff7f7",
              transition: "all .2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: 2
              }
            }}
          >

            {/* HEADER */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={0.5}
            >

              <Box>

                <Typography fontWeight={600} fontSize={14}>
                  {e.descripcion}
                </Typography>

                <Typography fontSize={12}  color="text.secondary">
                 Egreso # {e.numero_egreso} • {fecha}
                </Typography>

              </Box>

              <Typography
                fontWeight="bold"
                color="error.main"
                fontSize={15}
              >
                - {formatCOP(e.monto)}
              </Typography>

            </Box>

            {/* METODO Y OBSERVACION */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={0.5}
            >

              <Typography fontSize={13} color="text.secondary">
                {getIcon(e.metodo_pago)} {e.metodo_pago}
              </Typography>

              {e.observacion && (
                <Typography
                  fontSize={12}
                  color="text.secondary"
                  sx={{
                    fontStyle: "italic"
                  }}
                >
                  {e.observacion}
                </Typography>
              )}

            </Box>

          </Box>

        );

      })}

    </Stack>

  </AccordionDetails>

</Accordion>

            {/* TOTAL EN CAJA */}
            <Card elevation={4} sx={{ borderRadius: 3, bgcolor: "#e8f5e9" }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "success.dark", width: 50, height: 50 }}>
                  <AttachMoneyIcon />
                </Avatar>

                <Box>
                  <Typography fontSize={14} color="text.secondary">
                    Total en Caja
                  </Typography>
                  <Typography fontSize={24} fontWeight="bold" color="success.dark">
                    {formatCOP(totalEnCaja)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

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
                <RestaurantMenuIcon /> Productos Vendidos
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
                        mb: 2,
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                        "&:before": { display: "none" }
                      }}
                    >
                      {/* HEADER CATEGORIA */}
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: "black" }} />}
                        sx={{
                          background: "linear-gradient(135deg, #09a58e, #2e7d32)",
                          color: "black",
                          px: 2,
                          py: 1.2
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          width="100%"
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <RestaurantMenuIcon fontSize="small" />

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
                            <Typography fontSize={14}>
                              {prod.producto}
                            </Typography>

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
                              x{prod.cantidad_vendida}
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