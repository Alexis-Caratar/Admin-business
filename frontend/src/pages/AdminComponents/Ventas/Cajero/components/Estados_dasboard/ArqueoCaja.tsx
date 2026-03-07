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
} from "@mui/material";

import SavingsIcon from "@mui/icons-material/Savings";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

type Props = {
  open: boolean;
  onClose: () => void;
  arqueoInfo: any | null;
};

export const ArqueoCajaModal: React.FC<Props> = ({ open, onClose, arqueoInfo }) => {
  const totalEnCaja =
    arqueoInfo
      ? Number(arqueoInfo.monto_inicial) + Number(arqueoInfo.total_ventas)-Number(arqueoInfo.total_egresos)
      : 0;

        const formatCOP = (value: number | "") => {
      if (!value) return "";
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(Number(value));
    };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          <Stack spacing={3}>
            {/* --- Monto Inicial --- */}
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 50, height: 50 }}>
                  <SavingsIcon fontSize="large" />
                </Avatar>

                <Box>
                  <Typography fontSize={14} color="text.secondary">
                    Monto Inicial - BASE
                  </Typography>
                  <Typography fontSize={22} fontWeight="bold">
                    ${Number(arqueoInfo.monto_inicial).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* --- Ventas Totales --- */}
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "success.main", width: 50, height: 50 }}>
                  <PointOfSaleIcon fontSize="large" />
                </Avatar>

                <Box>
                  <Typography fontSize={14} color="text.secondary">
                    Ventas Totales
                  </Typography>
                  <Typography fontSize={22} fontWeight="bold" color="success.main">
                    ${Number(arqueoInfo.total_ventas).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Divider />

             {/* --- Egresos Totales --- */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              p: 2,
              background: "linear-gradient(135deg, #fff 0%, #f9fafb 100%)",
              border: "1px solid",
              borderColor: "divider",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: 4,
              },
            }}
          >
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: "8px !important" }}>
              
              <Avatar
                sx={{
                  bgcolor: "error.light",
                  color: "error.main",
                  width: 56,
                  height: 56,
                }}
              >
                <PointOfSaleIcon fontSize="medium" />
              </Avatar>

              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Egresos Diarios
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: "error.main", mt: 0.5 }}
                >
                  {formatCOP(arqueoInfo.total_egresos)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

            <Divider />

            {/* --- Total en Caja --- */}
            <Card elevation={4} sx={{ borderRadius: 3, bgcolor: "#e8f5e9" }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "success.dark", width: 50, height: 50 }}>
                  <AttachMoneyIcon fontSize="large" />
                </Avatar>

                <Box>
                  <Typography fontSize={14} color="text.secondary">
                    Total en Caja
                  </Typography>
                  <Typography fontSize={24} fontWeight="bold" color="success.dark">
                    ${totalEnCaja.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
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
