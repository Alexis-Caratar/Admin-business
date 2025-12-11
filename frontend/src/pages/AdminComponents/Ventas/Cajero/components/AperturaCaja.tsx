/* ---------- /src/components/modales/AperturaCaja.tsx ---------- */
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Typography,
  Box
} from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
  monto: string;
  setMonto: (v: string) => void;
  onAbrir: () => void;
};

export const AperturaCajaModal: React.FC<Props> = ({
  open,
  onClose,
  monto,
  setMonto,
  onAbrir,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          textAlign: "center",
          pb: 1,
          fontSize: "1.3rem",
        }}
      >
        Apertura de Caja
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 2 }}
        >
          Ingrese el monto inicial para iniciar la jornada.
        </Typography>

       <Box>
  <TextField
    fullWidth
    label="Monto inicial"
    value={new Intl.NumberFormat("es-CO").format(Number(monto) || 0)}
    onChange={(e) => {
      const raw = e.target.value.replace(/\D/g, ""); // Solo números
      setMonto(raw); // Guarda el número sin formato
    }}
    InputProps={{
      startAdornment: (
        <span style={{ marginRight: 6, fontWeight: 600 }}>$</span>
      ),
    }}
    sx={{
      mt: 1,
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
      },
    }}
  />
</Box>

      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, textTransform: "none" }}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={onAbrir}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            fontWeight: 600,
          }}
        >
          Abrir Caja
        </Button>
      </DialogActions>
    </Dialog>
  );
};
