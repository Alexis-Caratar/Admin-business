import React, { useEffect, useState } from "react";
import type { Producto } from "../../../types/index";
import {
  getProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../../../api/productos";
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
  Autocomplete,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import StraightenIcon from "@mui/icons-material/Straighten";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";





const AdminProductos: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState<Producto>({
    codigo: "",
    nombre: "",
    descripcion: "",
    unidad_medida: "",
    imagen: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const unidades = ["kg", "litro", "pieza", "unidad"];
  const defaultImage =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQde1Zuns3SWsvZyR31zNW6hWWyf8N20bmBFA&s";

  const fetchProductos = async () => {
    const data = await getProductos();
    setProductos(data);
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleSubmit = async () => {
    const id_negocio = localStorage.getItem("id_negocio") || "";
    const payload = { ...form, id_negocio };

    try {
      if (editingId) {
        await actualizarProducto(editingId, payload);
      } else {
        await crearProducto(payload);
      }
      setForm({ codigo: "", nombre: "", descripcion: "", unidad_medida: "", imagen: "" });
      setEditingId(null);
      setOpenModal(false);
      fetchProductos();
    } catch (error) {
      console.error("Error al guardar producto:", error);
    }
  };

  const handleEdit = (producto: Producto) => {
    setForm(producto);
    setEditingId(producto.id!);
    setOpenModal(true);
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
        await eliminarProducto(id);
        fetchProductos();
        Swal.fire("Eliminado", "El producto ha sido eliminado.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el producto.", "error");
        console.error(error);
      }
    }
  };

  const handleOpenModal = () => {
    setForm({ codigo: "", nombre: "", descripcion: "", unidad_medida: "", imagen: "" });
    setEditingId(null);
    setOpenModal(true);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
     <Typography variant="h5" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
  <ShoppingBagIcon sx={{ fontSize: 28 }} />
  Administrar Productos
</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
        >
          Crear Producto
        </Button>
      </Box>

      {/* GRID DE TARJETAS */}
      <Grid container spacing={3}>
        {productos.map((p) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
 

 <Card
  sx={{
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: 3,
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    },
  }}
>
  {/* IMAGEN */}
  <CardMedia
    component="img"
    height="150"
    image={p.imagen || defaultImage}
    alt={p.nombre}
    sx={{
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      objectFit: "cover",
    }}
  />

  <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
    
    {/* CÓDIGO */}
    <Typography
      variant="subtitle2"
      color="textSecondary"
      noWrap
      sx={{ display: "flex", alignItems: "center", gap: 0.7 }}
    >
      <QrCode2Icon fontSize="small" sx={{ color: "#fb8c00" }} />
      Código: {p.codigo}
    </Typography>

    {/* PRODUCTO */}
    <Typography
      variant="body1"
      fontWeight={700}
      noWrap
      sx={{ display: "flex", alignItems: "center", gap: 0.7 }}
    >
      <Inventory2Icon fontSize="small" sx={{ color: "#7e57c2" }} />
      {p.nombre}
    </Typography>

    {/* UNIDAD */}
    <Box display="flex" alignItems="center" gap={0.5}>
      <StraightenIcon fontSize="small" sx={{ color: "#08670a" }} />
      <Typography variant="body2">Unidad: {p.unidad_medida || "N/A"}</Typography>
    </Box>

    {/* DESCRIPCIÓN DESPLEGABLE */}
    <Box mt={1}>
      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        sx={{ cursor: "pointer" }}
        onClick={() =>
          setProductos((prev) =>
            prev.map((x) => (x.id === p.id ? { ...x, showDesc: !x.showDesc } : x))
          )
        }
      >
        <ExpandMoreIcon
          sx={{
            transition: "0.3s",
            transform: p.showDesc ? "rotate(180deg)" : "rotate(0deg)",
            color: "#1976d2",
          }}
        />
        <Typography variant="body2" fontWeight={600} color="primary">
          Descripción
        </Typography>
      </Box>

      {/* TEXTO QUE SE DESPLIEGA */}
      {p.showDesc && (
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            p: 1,
            width:250,
            background: "#f5f5f5",
            borderRadius: 1,
            maxHeight: 90,
            overflowY: "auto",
            fontSize: 13,
          }}
        >
          {p.descripcion || "Sin descripción"}
        </Typography>
      )}
    </Box>
  </CardContent>

  {/* BOTONES */}
  <CardActions sx={{ justifyContent: "flex-end", pb: 1 }}>
    <IconButton color="primary" onClick={() => handleEdit(p)}>
      <EditIcon />
    </IconButton>
    <IconButton color="error" onClick={() => handleDelete(p.id)}>
      <DeleteIcon />
    </IconButton>
  </CardActions>
</Card>

          </Grid>
        ))}
      </Grid>

      {/* MODAL PARA CREAR/EDITAR */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Editar Producto" : "Crear Producto"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Código"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="URL Imagen"
            value={form.imagen || ""}
            onChange={(e) => setForm({ ...form, imagen: e.target.value })}
            fullWidth
          />
          <Autocomplete
            freeSolo
            options={unidades}
            value={form.unidad_medida || ""}
            onChange={(event, newValue) => setForm({ ...form, unidad_medida: newValue || "" })}
            onInputChange={(event, newInputValue) => setForm({ ...form, unidad_medida: newInputValue })}
            renderInput={(params) => (
              <TextField {...params} label="Unidad de medida" placeholder="Ej: kg, litro, pieza" fullWidth />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {editingId ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProductos;
