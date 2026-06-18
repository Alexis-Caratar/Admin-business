import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box
} from '@mui/material';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { apiEliminarCaja } from '../../../../api/cajero';

interface EliminarCajaProps {
  id_caja: number;
  onSuccess?: () => void;
}
export default function EliminarCaja({id_caja,onSuccess}: EliminarCajaProps) {

  const [open, setOpen] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const textoConfirmacion = 'borrar de forma permanente';

const handleEliminar = async () => {
  try {
    const { data } = await apiEliminarCaja({id_caja,});

    if (data.ok) {
      Swal.fire({
        icon: "success",
        title: "Caja eliminada correctamente",
      });

      setConfirmacion("");
      setOpen(false);
    onSuccess?.();
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar la caja",
    });
  }
};
  return (
    <>
    <Box
  sx={{
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  }}
>
  <Tooltip title="Eliminar Caja" arrow>
    <IconButton
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setOpen(true);
      }}
      sx={{
        bgcolor: "rgba(211,47,47,0.08)",
        color: "error.main",
        border: "1px solid rgba(211,47,47,0.15)",
        transition: "all .2s ease",
        "&:hover": {
          bgcolor: "error.main",
          color: "#fff",
          transform: "scale(1.08)",
          boxShadow: "0 6px 16px rgba(211,47,47,.35)",
        },
      }}
    >
      <DeleteForeverIcon fontSize="small" />
    </IconButton>
  </Tooltip>
</Box>

    <Dialog
    open={open}
    onClose={() => setOpen(false)}
    maxWidth="sm"
    fullWidth
    onClick={(e) => e.stopPropagation()}
    PaperProps={{
        sx: {
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,.25)"
        }
    }}
    >
  {/* HEADER */}
  <DialogTitle
    sx={{
      bgcolor: "#d32f2f",
      color: "#fff",
    }}
  >
    <Box display="flex" alignItems="center" gap={2}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22
        }}
      >
        ⚠️
      </Box>

      <Box>
        <Typography fontWeight={800} fontSize={18}>
          Eliminar Caja
        </Typography>

        <Typography fontSize={12} sx={{ opacity: 0.9 }}>
          Esta acción no puede deshacerse
        </Typography>
      </Box>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ p: 3, mt: 1 }}>
    {/* MENSAJE */}
    <Typography
      variant="body1"
      sx={{
        mb: 2,
        fontWeight: 600,
      }}
    >
      Está a punto de eliminar esta caja de forma permanente.
    </Typography>

    {/* ALERTA */}
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "#fff5f5",
        border: "1px solid #ffcdd2",
        mb: 3
      }}
    >
      <Typography
        color="error"
        fontWeight={700}
        fontSize={14}
      >
        Tenga en cuenta que:
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        mt={1}
      >
        • Se eliminarán todos los registros asociados.
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
        • La información no podrá recuperarse.
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
        • Esta acción es irreversible.
      </Typography>
    </Box>

    {/* CONFIRMACION */}
    <Typography
      fontWeight={600}
      mb={1}
    >
      Para continuar escriba:
    </Typography>

    <Box
      sx={{
        bgcolor: "#f4f6f8",
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        p: 1.5,
        fontFamily: "monospace",
        fontSize: 14,
        fontWeight: 700,
        mb: 2
      }}
    >
      borrar de forma permanente
    </Box>

    <TextField
      fullWidth
      autoFocus
      label="Confirmación requerida"
      placeholder="Escriba el texto exactamente"
      value={confirmacion}
      onChange={(e) => setConfirmacion(e.target.value)}
    />
  </DialogContent>

  <DialogActions
    sx={{
      px: 3,
      py: 2,
      borderTop: "1px solid #eee"
    }}
  >
    <Button
      variant="outlined"
      onClick={() => {
        setConfirmacion("");
        setOpen(false);
      }}
    >
      Cancelar
    </Button>

    <Button
      variant="contained"
      color="error"
      size="large"
      disabled={
        confirmacion.trim().toLowerCase() !==
        textoConfirmacion.toLowerCase()
      }
      onClick={handleEliminar}
      sx={{
        fontWeight: 700,
        minWidth: 190
      }}
      startIcon={<DeleteForeverIcon />}
    >
      Eliminar definitivamente
    </Button>
  </DialogActions>
</Dialog>
    </>
  );
}