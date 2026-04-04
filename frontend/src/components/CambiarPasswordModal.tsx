import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
  LinearProgress,
  Box,
} from "@mui/material";

import LockResetIcon from "@mui/icons-material/LockReset";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Swal from "sweetalert2";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
}

const CambiarPasswordModal: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<any>({});

  // 🔥 CALCULAR FUERZA
  const passwordStrength = useMemo(() => {
    let score = 0;

    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) score++;
    if (!/(123456|abcdef|qwerty)/i.test(newPassword)) score++;

    return score; // 0 - 5
  }, [newPassword]);

  const strengthLabel = ["Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"];

  const strengthColor = [
    "error",
    "error",
    "warning",
    "info",
    "success",
  ] as const;

  // 🔥 VALIDACIÓN EN TIEMPO REAL
  const validar = () => {
    const newErrors: any = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Requerida";
    }

    if (newPassword.length < 8) {
      newErrors.newPassword = "Mínimo 8 caracteres";
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = "Debe tener una mayúscula";
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = "Debe tener un número";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      newErrors.newPassword = "Debe tener un carácter especial";
    }

    if (confirmPassword && confirmPassword !== newPassword) {
      newErrors.confirmPassword = "No coinciden";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // 🔄 VALIDAR EN TIEMPO REAL
  React.useEffect(() => {
    validar();
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSubmit = async () => {
    if (!validar()) return;

    try {
      await onSubmit({ currentPassword, newPassword });

      Swal.fire({
        icon: "success",
        title: "Contraseña actualizada",
        confirmButtonColor: "#1d4ed8",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.error || "Error al cambiar contraseña",
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <LockResetIcon />
        Cambiar contraseña
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {/* ACTUAL */}
          <TextField
            label="Contraseña actual"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* NUEVA */}
          <TextField
            label="Nueva contraseña"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNew(!showNew)}>
                    {showNew ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* 🔥 BARRA DE SEGURIDAD */}
          {newPassword && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={(passwordStrength / 5) * 100}
                color={strengthColor[passwordStrength - 1] || "error"}
                sx={{ height: 8, borderRadius: 5 }}
              />
              <Typography variant="caption">
                Seguridad: {strengthLabel[passwordStrength - 1] || "Muy débil"}
              </Typography>
            </Box>
          )}

          {/* CONFIRMAR */}
          <TextField
            label="Confirmar contraseña"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="caption" color="text.secondary">
            Usa mínimo 8 caracteres, mayúsculas, números y símbolos.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={Object.keys(errors).length > 0}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CambiarPasswordModal;