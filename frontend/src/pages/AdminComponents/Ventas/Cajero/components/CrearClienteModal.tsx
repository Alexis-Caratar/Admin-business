import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (cliente: any) => void;
};

export const CrearClienteModal: React.FC<Props> = ({
  open,
  onClose,
  onCreated,
}) => {
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

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Aquí llamas tu API
    onCreated(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Crear Cliente / Empresa</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <TextField
            select
            label="Tipo Identificación"
            value={form.tipo_identificacion}
            onChange={(e) => handleChange("tipo_identificacion", e.target.value)}
          >
            <MenuItem value="CC">Cédula</MenuItem>
            <MenuItem value="CE">Cédula Extranjera</MenuItem>
            <MenuItem value="NIT">NIT</MenuItem>
          </TextField>

          <TextField
            label="Identificación"
            value={form.identificacion}
            onChange={(e) => handleChange("identificacion", e.target.value)}
          />

          <TextField
            label="Nombres"
            value={form.nombres}
            onChange={(e) => handleChange("nombres", e.target.value)}
          />

          <TextField
            label="Apellidos"
            value={form.apellidos}
            onChange={(e) => handleChange("apellidos", e.target.value)}
          />

          <TextField
            select
            label="Tipo"
            value={form.tipo}
            onChange={(e) => handleChange("tipo", e.target.value)}
          >
            <MenuItem value="Cliente">Cliente</MenuItem>
            <MenuItem value="Empresa">Empresa</MenuItem>
          </TextField>

          <TextField
            label="Email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          <TextField
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
          />

          <TextField
            label="Dirección"
            value={form.direccion}
            onChange={(e) => handleChange("direccion", e.target.value)}
          />

          <TextField
            label="Nota"
            multiline
            rows={2}
            value={form.nota}
            onChange={(e) => handleChange("nota", e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
