import React, { useEffect, useState } from "react";
import {
  getNegocios,
  crearNegocio,
  actualizarNegocio,
  eliminarNegocio,
} from "../../../api/negocios";
import type { Negocio } from "../../../types";
import Swal from "sweetalert2";

import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";

const AdminNegocios: React.FC = () => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState<Negocio>({
    nombre: "",
    direccion: "",
    telefono: "",
    descripcion: "",
    imagen: "", // agregar campo imagen
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchNegocios = async () => {
    const data = await getNegocios();
    setNegocios(data);
  };

  useEffect(() => {
    fetchNegocios();
  }, []);

  const openCreateModal = () => {
    setForm({ nombre: "", direccion: "", telefono: "", descripcion: "", imagen: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (negocio: Negocio) => {
    setForm(negocio);
    setEditingId(negocio.id!);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await actualizarNegocio(editingId, form);
        Swal.fire("Actualizado", "El negocio ha sido actualizado.", "success");
      } else {
        await crearNegocio(form);
        Swal.fire("Creado", "El negocio ha sido creado.", "success");
      }
      closeModal();
      fetchNegocios();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Hubo un problema al guardar el negocio.", "error");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await eliminarNegocio(id);
        fetchNegocios();
        Swal.fire("Eliminado", "El negocio ha sido eliminado.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el negocio.", "error");
        console.error(error);
      }
    }
  };

  return (
    <Box p={3}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Administración de Negocios
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddBusinessIcon />}
          onClick={openCreateModal}
        >
          Agregar Negocio
        </Button>
      </Box>

      {/* GRID DE TARJETAS */}
      <Grid container spacing={3}>
        {negocios.map((n) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={n.id}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 350,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                },
              }}
            >
              {/* IMAGEN */}
            <CardMedia
            component="img"
            height="150"
            image={n.imagen || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQde1Zuns3SWsvZyR31zNW6hWWyf8N20bmBFA&s"}
            alt={n.nombre}
          />


              {/* CONTENIDO */}
              <CardContent sx={{ flex: 1, overflow: "hidden" }}>
                <Typography variant="h6" fontWeight={600} noWrap>
                  {n.nombre}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{
                    mt: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {n.descripcion || "Sin descripción"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, fontSize: 14, opacity: 0.8 }}
                >
                  📍 {n.direccion}
                  <br />
                  📞 {n.telefono}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: "flex-end" }}>
                <IconButton color="primary" onClick={() => openEditModal(n)}>
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(n.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* MODAL */}
      <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Editar Negocio" : "Crear Negocio"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Dirección"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="URL de Imagen"
            value={form.imagen}
            onChange={(e) => setForm({ ...form, imagen: e.target.value })}
            fullWidth
            placeholder="https://ejemplo.com/imagen.jpg"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {editingId ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminNegocios;
