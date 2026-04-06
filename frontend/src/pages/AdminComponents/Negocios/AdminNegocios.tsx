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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  Switch,
  MenuItem,
  Stack,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import SearchIcon from "@mui/icons-material/Search";
import StoreIcon from "@mui/icons-material/Store";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import ApartmentIcon from "@mui/icons-material/Apartment";
import CategoryIcon from "@mui/icons-material/Category";
import { useTheme, useMediaQuery } from "@mui/material";


const AdminNegocios: React.FC = () => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const tiposNegocio = [
  "Restaurante",
  "Cafetería",
  "Bar",
  "Tienda",
  "Supermercado",
  "Panadería",
  "Comida rápida",
  "Servicios",
  "Otros",
];

const [form, setForm] = useState<Negocio>({
  nit: "",
  nombre: "",
  direccion: "",
  telefono: "",
  descripcion: "",
  imagen: "",
  correo: "",
  ciudad: "",
  hora_apertura:"",
  hora_cierre:"",
  tipo: "",
  activo: true,
});

  const [editingId, setEditingId] = useState<number | null>(null);

  // 🔍 Buscador
  const [search, setSearch] = useState("");

  // 📄 Paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

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
   nit: "",
  nombre: "",
  direccion: "",
  telefono: "",
  descripcion: "",
  imagen: "",
  correo: "",
  ciudad: "",
  hora_apertura:"",
  hora_cierre:"",
  tipo: "",
  activo: true,
  
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
<Box display="flex" flexWrap="wrap" gap={3}>
  {negociosPaginated.map((n) => (
    <Box
      key={n.id}
      flex="1 1 calc(100% - 24px)" // xs: 1 por fila
      sx={{
        '@media (min-width:600px)': { flex: '1 1 calc(50% - 24px)' },  // sm: 2 por fila
        '@media (min-width:900px)': { flex: '1 1 calc(33.33% - 24px)' }, // md: 3 por fila
        '@media (min-width:1200px)': { flex: '1 1 calc(25% - 24px)' },  // lg: 4 por fila
        maxWidth: 350, // opcional: ancho máximo de la tarjeta
      }}
    >
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
    </Box>
  ))}
</Box>

      {/* PAGINACIÓN */}
 
    {totalPages > 1 && (
            <Stack alignItems="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
              onChange={(_, value) => setPage(value)}
                color="primary"
                shape="rounded"
                
                size={isMobile ? "small" : "medium"}   // 👈 más compacto en móvil
                
                siblingCount={isMobile ? 0 : 1}        // 👈 menos botones en móvil
                boundaryCount={isMobile ? 1 : 2}

                showFirstButton={!isMobile}            // 👈 ocultar en móvil
                showLastButton={!isMobile}

              />
            </Stack>
          )}

      {/* MODAL */}
     
<Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="md">
  <DialogTitle sx={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 1 }}>
    <BusinessIcon />
    {editingId ? "Editar Negocio" : "Crear Negocio"}
  </DialogTitle>

 <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 3 }}>
  <Box display="flex" flexWrap="wrap" gap={2}>
    {/* Primera columna */}
    <Box flex="1 1 45%" minWidth={250}>
      <TextField
        label="NIT"
        value={form.nit}
        onChange={(e) => setForm({ ...form, nit: e.target.value })}
        fullWidth
        InputProps={{ startAdornment: <BusinessIcon sx={{ mr: 1 }} /> }}
        sx={{ mt: 2 }} // <--- aumenta un poquito el margen superior
      />
        <TextField
          label="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          fullWidth
          InputProps={{ startAdornment: <ApartmentIcon sx={{ mr: 1 }} /> }}
          sx={{ mt: 1 }}
        />
        <TextField
          label="Dirección"
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          fullWidth
          sx={{ mt: 1 }}
          InputProps={{ startAdornment: <LocationOnIcon sx={{ mr: 1 }} /> }}
        />
        <TextField
          label="Ciudad"
          value={form.ciudad}
          onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
          fullWidth
          sx={{ mt: 1 }}
          InputProps={{ startAdornment: <LocationOnIcon sx={{ mr: 1 }} /> }}
        />
        <TextField
          label="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          fullWidth
          sx={{ mt: 1 }}
          InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1 }} /> }}
        />
      </Box>

      {/* Segunda columna */}
      <Box flex="1 1 45%" minWidth={250}>
        <TextField
          label="Correo Electrónico"
          value={form.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
          fullWidth
           sx={{ mt: 2 }}
          InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1 }} /> }}
        />
       <Box display="flex" gap={2}>
        <TextField
          label="Hora Apertura"
          type="time"
          value={form.hora_apertura || ""}
          onChange={(e) => setForm({ ...form, hora_apertura: e.target.value })}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="Hora Cierre"
          type="time"
          value={form.hora_cierre || ""}
          onChange={(e) => setForm({ ...form, hora_cierre: e.target.value })}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Box>
       
      <TextField
        select
        label="Tipo de negocio"
        value={form.tipo}
        onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        fullWidth
        sx={{ mt: 1 }}
        InputProps={{ startAdornment: <CategoryIcon sx={{ mr: 1 }} /> }}
      >
        {tiposNegocio.map((tipo) => (
          <MenuItem key={tipo} value={tipo}>
            {tipo}
          </MenuItem>
        ))}
      </TextField>
        <TextField
          label="URL Imagen"
          value={form.imagen}
          onChange={(e) => setForm({ ...form, imagen: e.target.value })}
          fullWidth
          sx={{ mt: 1 }}
          InputProps={{ startAdornment: <ImageIcon sx={{ mr: 1 }} /> }}
        />
      </Box>

      {/* Descripción */}
      <Box flex="1 1 100%">
        <TextField
          label="Descripción"
          multiline
          rows={3}
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          fullWidth
          sx={{ mt: 1 }}
          InputProps={{ startAdornment: <DescriptionIcon sx={{ mr: 1 }} /> }}
        />
      </Box>

      {/* Switch Activo */}
      <Box display="flex" alignItems="center" gap={1}>
        <Typography>Activo:</Typography>
        <Switch
          checked={form.activo}
          onChange={(e) => setForm({ ...form, activo: e.target.checked })}
          color="primary"
        />
      </Box>
    </Box>
  </DialogContent>

  <DialogActions>
    <Button onClick={closeModal}>Cancelar</Button>
    <Button onClick={handleSubmit} variant="contained" color="primary">
      {editingId ? "Actualizar" : "Crear"}
    </Button>
  </DialogActions>
</Dialog>
    </Box>
  );
};

export default AdminNegocios;
