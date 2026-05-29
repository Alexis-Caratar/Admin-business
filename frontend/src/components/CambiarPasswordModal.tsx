import React, { useState, useMemo } from "react";
import {
  Dialog,
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
  Avatar,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
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
  <Dialog
  open={open}
  onClose={onClose}
  fullWidth
  maxWidth="sm"
  PaperProps={{
    sx: {
      borderRadius: "24px",
      overflow: "hidden",
      background:
        "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
      boxShadow: "0 25px 60px rgba(15,23,42,.18)",
    },
  }}
>
  {/* HEADER */}
  <Box
    sx={{
      px: 3,
      py: 2.5,
      background:
        "linear-gradient(135deg,#0f172a,#1e293b)",
      color: "#fff",
      position: "relative",
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar
        sx={{
          bgcolor: "rgba(255,255,255,.12)",
          width: 52,
          height: 52,
        }}
      >
        <LockResetIcon />
      </Avatar>

      <Box>
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          Cambiar contraseña
        </Typography>

        <Typography
          sx={{
            opacity: 0.8,
            fontSize: 13,
            mt: 0.3,
          }}
        >
          Protege tu cuenta con una contraseña segura
        </Typography>
      </Box>
    </Stack>
  </Box>

  {/* CONTENT */}
  <DialogContent sx={{ p: 3 }}>
    <Stack spacing={2.5} mt={1}>
      
      {/* ACTUAL */}
      <TextField
        label="Contraseña actual"
        placeholder="Ingresa tu contraseña actual"
        type={showCurrent ? "text" : "password"}
        value={currentPassword}
        onChange={(e) =>
          setCurrentPassword(e.target.value)
        }
        error={!!errors.currentPassword}
        helperText={errors.currentPassword}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockResetIcon
                sx={{ color: "#64748b" }}
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() =>
                  setShowCurrent(!showCurrent)
                }
              >
                {showCurrent ? (
                  <VisibilityOff />
                ) : (
                  <Visibility />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "16px",
            bgcolor: "#fff",
          },
        }}
      />

      {/* NUEVA */}
      <TextField
        label="Nueva contraseña"
        placeholder="Ingresa tu nueva contraseña"
        type={showNew ? "text" : "password"}
        value={newPassword}
        onChange={(e) =>
          setNewPassword(e.target.value)
        }
        error={!!errors.newPassword}
        helperText={errors.newPassword}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SettingsIcon
                sx={{ color: "#64748b" }}
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() =>
                  setShowNew(!showNew)
                }
              >
                {showNew ? (
                  <VisibilityOff />
                ) : (
                  <Visibility />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "16px",
            bgcolor: "#fff",
          },
        }}
      />

      {/* SEGURIDAD */}
      {newPassword && (
        <Box
          sx={{
            p: 2,
            borderRadius: "18px",
            bgcolor: "#f8fafc",
            border:
              "1px solid rgba(148,163,184,.18)",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            mb={1}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Seguridad de contraseña
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                color:
                  passwordStrength >= 4
                    ? "#16a34a"
                    : passwordStrength >= 3
                    ? "#f59e0b"
                    : "#dc2626",
              }}
            >
              {strengthLabel[
                passwordStrength - 1
              ] || "Muy débil"}
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={(passwordStrength / 5) * 100}
            color={
              strengthColor[
                passwordStrength - 1
              ] || "error"
            }
            sx={{
              height: 10,
              borderRadius: 999,
            }}
          />

          <Typography
            sx={{
              mt: 1.2,
              fontSize: 12,
              color: "#64748b",
            }}
          >
            Usa mínimo 8 caracteres,
            mayúsculas, números y símbolos.
          </Typography>
        </Box>
      )}

      {/* CONFIRMAR */}
      <TextField
        label="Confirmar contraseña"
        placeholder="Confirma tu nueva contraseña"
        type={showConfirm ? "text" : "password"}
        value={confirmPassword}
        onChange={(e) =>
          setConfirmPassword(e.target.value)
        }
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockResetIcon
                sx={{ color: "#64748b" }}
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() =>
                  setShowConfirm(!showConfirm)
                }
              >
                {showConfirm ? (
                  <VisibilityOff />
                ) : (
                  <Visibility />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "16px",
            bgcolor: "#fff",
          },
        }}
      />
    </Stack>
  </DialogContent>

  {/* FOOTER */}
  <DialogActions
    sx={{
      px: 3,
      pb: 3,
      pt: 1,
      justifyContent: "space-between",
    }}
  >
    <Button
      onClick={onClose}
      sx={{
        borderRadius: "14px",
        px: 3,
        py: 1,
        color: "#475569",
        fontWeight: 700,
        textTransform: "none",
      }}
    >
      Cancelar
    </Button>

    <Button
      variant="contained"
      onClick={handleSubmit}
      disabled={Object.keys(errors).length > 0}
      sx={{
        borderRadius: "14px",
        px: 4,
        py: 1.1,
        fontWeight: 800,
        textTransform: "none",
        background:
          "linear-gradient(135deg,#0ea5e9,#2563eb)",
        boxShadow:
          "0 10px 25px rgba(37,99,235,.35)",
      }}
    >
      Guardar cambios
    </Button>
  </DialogActions>
</Dialog>
  );
};

export default CambiarPasswordModal;