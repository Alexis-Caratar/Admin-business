import React, { useEffect, useState, useMemo } from "react";
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
  Pagination,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import SearchIcon from "@mui/icons-material/Search";
import StoreIcon from "@mui/icons-material/Store";



const AdminNegocios: React.FC = () => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState<Negocio>({
    nombre: "",
    direccion: "",
    telefono: "",
    descripcion: "",
    imagen: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  // 🔍 Buscador
  const [search, setSearch] = useState("");

  // 📄 Paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const fetchNegocios = async () => {
    const data = await getNegocios();
    setNegocios(data);
  };

  useEffect(() => {
    fetchNegocios();
  }, []);

  // Filtrar por buscador
  const filtered = useMemo(() => {
    return negocios.filter((n) =>
      n.nombre.toLowerCase().includes(search.toLowerCase()) ||
      n.direccion?.toLowerCase().includes(search.toLowerCase()) ||
      n.descripcion?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, negocios]);

  // Calcular paginación
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const negociosPaginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const openCreateModal = () => {
    setForm({
      nombre: "",
      direccion: "",
      telefono: "",
      descripcion: "",
      imagen: "",
    });
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
      Swal.fire("Error", "Hubo un problema al guardar el negocio.", "error");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await eliminarNegocio(id);
        fetchNegocios();
        Swal.fire("Eliminado", "El negocio ha sido eliminado.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar.", "error");
      }
    }
  };

  return (
    <Box p={3}>
      {/* HEADER */}
     {/* HEADER */}
{/* HEADER */}
<Box mb={3}>
  
  {/* FILA 1: TÍTULO CENTRADO + BOTÓN DERECHA */}
  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    mb={2}
  >
    {/* ESPACIO VACÍO PARA QUE EL TÍTULO QUEDE CENTRADO */}
    

    {/* TÍTULO Izquierda */}
    <Typography
  variant="h5"
  fontWeight={600}
  textAlign="left"
  flex={1}
  sx={{ display: "flex", alignItems: "center", gap: 1 }}
>
  <StoreIcon sx={{ fontSize: 30 }} />
  Administración de Negocios
</Typography>

<Box width="240px" />
    {/* BOTÓN DERECHA */}
    <Button
      variant="contained"
      color="primary"
      startIcon={<AddBusinessIcon />}
      onClick={openCreateModal}
      sx={{ height: 38 }}
    >
      Agregar Negocio
    </Button>
  </Box>

  {/* FILA 2: BUSCADOR ABAJO A LA IZQUIERDA */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      background: "#f1f3f4",
      px: 1.5,
      borderRadius: 5,
      width: "460px",
      height: 36,
      boxShadow: "inset 0 0 4px rgba(0,0,0,0.1)",
    }}
  >
    <SearchIcon sx={{ opacity: 0.6, fontSize: 20, mr: 1 }} />
    <TextField
      variant="standard"
      placeholder="Buscar..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      InputProps={{
        disableUnderline: true,
        style: { fontSize: 14 },
      }}
      fullWidth
    />
  </Box>

</Box>





      {/* GRID DE TARJETAS */}
      <Grid container spacing={3}>
        {negociosPaginated.map((n) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={n.id}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: 350,
                transition: "0.2s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                },
              }}
            >
              <CardMedia
                component="img"
                height="150"
                image={
                  n.imagen ||
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQde1Zuns3SWsvZyR31zNW6hWWyf8N20bmBFA&s"
                }
                alt={n.nombre}
              />

              <CardContent sx={{ flex: 1 }}>
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
                  }}
                >
                  {n.descripcion || "Sin descripción"}
                </Typography>

                <Typography variant="body2" sx={{ mt: 1, fontSize: 14 }}>
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

      {/* PAGINACIÓN */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          size="medium"
        />
      </Box>

      {/* MODAL */}
      <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Editar Negocio" : "Crear Negocio"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            fullWidth
          />
          <TextField
            label="Dirección"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            fullWidth
          />
          <TextField
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            fullWidth
          />
          <TextField
            label="Descripción"
            multiline
            rows={3}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            fullWidth
          />
          <TextField
            label="URL Imagen"
            value={form.imagen}
            onChange={(e) => setForm({ ...form, imagen: e.target.value })}
            fullWidth
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingId ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminNegocios;
