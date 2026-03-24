import  { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  InputAdornment,
  Divider,
  Box,
} from "@mui/material";

import { apicrear_cliente } from "../../../../../api/cajero";

import BadgeIcon from "@mui/icons-material/Badge";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotesIcon from "@mui/icons-material/Notes";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export const CrearClienteModal = ({ open, onClose, onCreated }: any) => {
  const [form, setForm] = useState({
    tipo_identificacion: "CC",
    identificacion: "",
    nombres: "",
    apellidos: "",
    tipo: "Cliente",
    email: "",
    telefono: "",
    direccion: "",
    nota: "",
  });

  const [alertOpen, setAlertOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        tipoIdentificacion: form.tipo_identificacion,
        numeroIdentificacion: form.identificacion,
        nombres: form.nombres,
        apellidos: form.apellidos,
        tipoCliente: form.tipo,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        nota: form.nota,
      };

      const response = await apicrear_cliente(payload);

      if (!response.data.ok) {
        setMensaje(response.data.message || "Error al crear el cliente");
        setAlertOpen(true);
        return;
      }

      onCreated(response.data.result);
      onClose();
    } catch (error) {
      setMensaje("Error inesperado al crear el cliente");
      setAlertOpen(true);
    }
  };

  return (
    <>
      {/* 🧩 MODAL PRINCIPAL */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Crear Cliente / Empresa
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completa la información
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            
            {/* 🔹 IDENTIFICACIÓN */}
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Identificación
              </Typography>

              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Tipo"
                  value={form.tipo_identificacion}
                  onChange={(e) =>
                    handleChange("tipo_identificacion", e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="CC">Cédula</MenuItem>
                  <MenuItem value="CE">Cédula Extranjera</MenuItem>
                  <MenuItem value="NIT">NIT</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  size="small"
                  label="Número"
                  value={form.identificacion}
                  onChange={(e) =>
                    handleChange("identificacion", e.target.value)
                  }
                />
              </Box>
            </Box>

            <Divider />

            {/* 🔹 INFORMACIÓN */}
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Información
              </Typography>

              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nombres"
                  value={form.nombres}
                  onChange={(e) => handleChange("nombres", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Apellidos"
                  value={form.apellidos}
                  onChange={(e) => handleChange("apellidos", e.target.value)}
                />
              </Box>

              <Box mt={2} width="50%">
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Tipo Cliente"
                  value={form.tipo}
                  onChange={(e) => handleChange("tipo", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="Cliente">Cliente</MenuItem>
                  <MenuItem value="Empresa">Empresa</MenuItem>
                </TextField>
              </Box>
            </Box>

            <Divider />

            {/* 🔹 CONTACTO */}
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Contacto
              </Typography>

              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Teléfono"
                  value={form.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box mt={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Dirección"
                  value={form.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            <Divider />

            {/* 🔹 NOTA */}
            <TextField
              fullWidth
              size="small"
              label="Nota"
              multiline
              rows={2}
              value={form.nota}
              onChange={(e) => handleChange("nota", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <NotesIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🚨 ALERTA */}
      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Advertencia
        </DialogTitle>

        <DialogContent>
          <Typography>{mensaje}</Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setAlertOpen(false)}
            variant="contained"
            color="warning"
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};