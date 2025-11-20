import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InventoryIcon from "@mui/icons-material/Inventory";
import DevicesIcon from "@mui/icons-material/Devices";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";


import Swal from "sweetalert2";
import { motion } from "framer-motion";

import {
  crearInventario,
  getInventarios,
  deleteInventario,
  
} from "../../../api/inventarios";

import type { InventarioFisico } from "../../../types/inventario";
import InventarioDetalles from "./DetalleInventario";

const AdminInventario: React.FC = () => {
  const idNegocio = localStorage.getItem("id_negocio") || "";
  const idPersona = localStorage.getItem("id_persona") || "";
  const [inventarios, setInventarios] = useState<InventarioFisico[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [detalleId, setDetalleId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    tipo: "PRODUCTOS",
    id_negocio: idNegocio,
    id_persona: idPersona,
  });

  // Obtener inventarios
  const fetchData = async () => {
    const data = await getInventarios();
    setInventarios(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Crear inventario
  const handleSubmit = async () => {
    await crearInventario(form);
    setOpenModal(false);
    setForm({ nombre: "", tipo: "PRODUCTOS", id_negocio: idNegocio, id_persona: idPersona });
    fetchData();
  };

  // Eliminar inventario
  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar inventario?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
    });

    if (result.isConfirmed) {
      await deleteInventario(id);
      fetchData();
      Swal.fire({ icon: "success", title: "Inventario eliminado", timer: 1500 });
    }
  };

  // Icono según tipo
  const iconoTipo = (tipo: string) => {
    if (tipo === "PRODUCTOS") return <ShoppingCartIcon sx={{ fontSize: 32, color: "#19786aff" }} />;
    if (tipo === "ACTIVOS") return <DevicesIcon sx={{ fontSize: 32, color: "#184384ff" }} />;
    return <InventoryIcon sx={{ fontSize: 32, color: "#176291ff" }} />;
  };

  const tituloTipo = (tipo: string) => {
    if (tipo === "PRODUCTOS") return "Productos";
    if (tipo === "ACTIVOS") return " Activos";
    return " Otros";
  };

  if (detalleId) {
    return <InventarioDetalles id={detalleId} onBack={() => setDetalleId(null)} />;
  }

  return (
    <Box p={2}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center" gap={1}>
          <InventoryIcon /> Inventario Físico
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ background: "#0D47A1" }}
        >
          Crear Inventario
        </Button>
      </Box>

      {/* LISTA INVENTARIOS */}
      <Grid container spacing={2}>
        {inventarios.map((inv) => (
          <Grid key={inv.id} item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                onClick={() => setDetalleId(inv.id)}     // 👈 ABRIR DETALLES AL HACER CLICK
                sx={{
                  borderRadius: 3,
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                  cursor: "pointer",                     // 👈 MOUSE POINTER
                  transition: "0.2s",
                  "&:hover": {
                    boxShadow: "0px 6px 18px rgba(0,0,0,0.18)",
                    transform: "translateY(-3px)",
                  },
                  position: "relative",
                }}
              >
                <CardContent>
                  {/* Icono + Tipo */}
                  <Box display="flex" alignItems="center" gap={1}>
                    {iconoTipo(inv.tipo)}
                    <Typography variant="h6">{tituloTipo(inv.tipo)}</Typography>
                  </Box>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {inv.nombre}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Fecha: {new Date(inv.fecha).toLocaleString()}
                  </Typography>

                  {/* Botones */}
                  <Stack direction="row" spacing={1} mt={2}>
                    {/* ❗️EVITAR QUE EL CLICK DEL BOTÓN ACTIVE EL CLICK DE LA TARJETA */}
                  

                    <IconButton
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation(); // 🔒 EVITA QUE SE ABRA LA TARJETA
                        handleDelete(inv.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>

                      <IconButton
                      onClick={(e) => {
                        e.stopPropagation(); // 🔒 EVITA QUE SE ABRA LA TARJETA
                        setDetalleId(inv.id);
                      }}
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                    
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>


      {/* MODAL CREAR INVENTARIO */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo Inventario Físico</DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nombre del inventario"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />

          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={form.tipo}
              label="Tipo"
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <MenuItem value="PRODUCTOS">Productos</MenuItem>
              <MenuItem value="ACTIVOS">Activos</MenuItem>
              <MenuItem value="OTROS">Otros</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button variant="contained" sx={{ background: "#0D47A1" }} onClick={handleSubmit}>
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminInventario;
