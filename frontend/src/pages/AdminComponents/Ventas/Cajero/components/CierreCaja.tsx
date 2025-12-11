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
  Divider,
  Avatar,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

type Props = {
  open: boolean;
  onClose: () => void;
  totalVentas: number;
  dineroTotal: number;
  onCerrar: () => void;
};

export const CierreCajaModal: React.FC<Props> = ({
  open,
  onClose,
  totalVentas,
  dineroTotal,
  onCerrar,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      {/* ---------- HEADER ---------- */}
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: "bold",
          pb: 1,
        }}
      >
        Cierre de Caja
      </DialogTitle>

      <DialogContent>
        <Box display="flex" justifyContent="center" mb={2}>
          <Avatar
            sx={{
              bgcolor: "error.light",
              width: 70,
              height: 70,
            }}
          >
            <LockIcon sx={{ fontSize: 40, color: "error.dark" }} />
          </Avatar>
        </Box>

        <Typography align="center" color="text.secondary" fontSize={14} mb={3}>
          Revisa la información antes de cerrar la caja.
        </Typography>

        {/* ---------- DATA CARD ---------- */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: "#f8f9fa",
            boxShadow: 1,
          }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography fontSize={13} color="text.secondary">
                Cantidad de Ventas:
              </Typography>
              <Typography fontSize={20} fontWeight={700} color="primary">
                {totalVentas}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography fontSize={13} color="text.secondary">
                Total Recaudado:
              </Typography>
              <Typography fontSize={22} fontWeight={700} color="success.main">
                ${dineroTotal.toLocaleString()}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      {/* ---------- ACTION BUTTONS ---------- */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button fullWidth onClick={onClose}>
          Cancelar
        </Button>

        <Button
          fullWidth
          color="error"
          variant="contained"
          sx={{ fontWeight: "bold" }}
          onClick={onCerrar}
        >
          Cerrar Caja
        </Button>
      </DialogActions>
    </Dialog>
  );
};
