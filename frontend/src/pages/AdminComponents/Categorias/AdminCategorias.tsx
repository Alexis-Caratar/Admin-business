import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Typography,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../../../api/categorias";
import Swal from "sweetalert2";

const AdminCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    imagen: "",
    activo: 1,
  });
  const [editingId, setEditingId] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const fetchData = async () => {
    const id_negocio = localStorage.getItem("id_negocio") || "";
    const data = await getCategorias(id_negocio);
    setCategorias(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    const id_negocio = localStorage.getItem("id_negocio") || "";

    if (editingId) {
      await actualizarCategoria(editingId, form);
    } else {
      await crearCategoria({ ...form, id_negocio });
    }

    setForm({ nombre: "", descripcion: "", imagen: "", activo: 1 });
    setEditingId(null);
    setOpenModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar categoría?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
    });

    if (result.isConfirmed) {
      await eliminarCategoria(id);
      fetchData();
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={600}>Administrar Categorías</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
        >
          Crear Categoría
        </Button>
      </Box>

      <Grid container spacing={3}>
        {categorias.map((c: any) => (
          <Grid item xs={12} sm={6} md={4} key={c.id}>
            <Card>
              <CardMedia
                component="img"
                height="150"
                image={c.imagen || "https://via.placeholder.com/150"}
              />
              <CardContent>
                <Typography variant="h6">{c.nombre}</Typography>
                <Typography variant="body2">{c.descripcion}</Typography>

                <Box mt={1} display="flex" gap={1}>
                  <IconButton onClick={() => { setEditingId(c.id); setForm(c); setOpenModal(true); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(c.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* MODAL */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>{editingId ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Nombre" fullWidth value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <TextField label="Descripción" fullWidth multiline rows={2}
            value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <TextField label="URL Imagen" fullWidth value={form.imagen}
            onChange={(e) => setForm({ ...form, imagen: e.target.value })} />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingId ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCategorias;
