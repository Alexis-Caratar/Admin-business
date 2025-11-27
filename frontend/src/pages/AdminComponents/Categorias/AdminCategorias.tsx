import React, { useEffect, useState, useMemo } from "react";
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
  Pagination,
} from "@mui/material";

import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
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
import AdminProductos from "../productos/AdminProductos"; 

const AdminCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const [showProductos, setShowProductos] = useState(false);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);

  const cleanForm = () => {
    setForm({
      nombre: "",
      descripcion: "",
      imagen: "",
      activo: 1,
    });
  };

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    imagen: "",
    activo: 1,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const fetchData = async () => {
    const id_negocio = localStorage.getItem("id_negocio") || "";
    const data = await getCategorias(id_negocio);
    setCategorias(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // FILTRO
  const filtered = useMemo(() => {
    return categorias.filter((c: any) =>
      c.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }, [categorias, search]);

  // PAGINACIÓN
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const handleSubmit = async () => {
    const id_negocio = localStorage.getItem("id_negocio") || "";

    if (editingId) {
      await actualizarCategoria(editingId, form);
    } else {
      await crearCategoria({ ...form, id_negocio });
    }

    cleanForm();
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

  const handleOpenProductos = (id: number) => {
    setSelectedCategoriaId(id);
    setShowProductos(true);
  };

  const handleBack = () => {
    setShowProductos(false);
    setSelectedCategoriaId(null);
  };

  return (
    <Box p={3}>

      {showProductos && selectedCategoriaId !== null ? (
        <AdminProductos id={selectedCategoriaId} onBack={handleBack} />
      ) : (
        <>
          {/* HEADER */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <CategoryIcon fontSize="large" sx={{ color: "#1976d2" }} />
              <Typography variant="h5" fontWeight={700}>
                Administrar Categorías
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                cleanForm();
                setEditingId(null);
                setOpenModal(true);
              }}
              sx={{ borderRadius: 3 }}
            >
              Crear Categoría
            </Button>
          </Box>

          {/* BUSCADOR */}
          <Box mb={3}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                background: "#f1f3f4",
                px: 2,
                borderRadius: 5,
                width: 450,
                height: 38,
              }}
            >
              <SearchIcon sx={{ opacity: 0.6, mr: 1 }} />
              <TextField
                variant="standard"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ disableUnderline: true }}
                fullWidth
              />
            </Box>
          </Box>

          {/* GRID CATEGORIAS */}
          <Grid container spacing={3}>
            {paginated.map((c: any) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card
                  sx={{
                    transition: "transform .2s, box-shadow .2s",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <div onClick={() => handleOpenProductos(c.id)}>
                    <CardMedia
                      component="img"
                      height="150"
                      image={c.imagen || "https://via.placeholder.com/150"}
                      sx={{ objectFit: "cover" }}
                    />
                  </div>

                  <CardContent>
                    <Typography variant="h6">{c.nombre}</Typography>
                    <Typography variant="body2">{c.descripcion}</Typography>

                    <Box mt={1} display="flex" gap={1}>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(c.id);

                          setForm({
                            nombre: c.nombre || "",
                            descripcion: c.descripcion || "",
                            imagen: c.imagen || "",
                            activo: c.activo ?? 1,
                          });

                          setOpenModal(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* PAGINACIÓN */}
          <Box mt={4} display="flex" justifyContent="center">
            <Pagination
              count={Math.ceil(filtered.length / itemsPerPage)}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
            />
          </Box>

          {/* MODAL */}
          <Dialog
            open={openModal}
            onClose={() => {
              setOpenModal(false);
              setEditingId(null);
              cleanForm();
            }}
            PaperProps={{ sx: { borderRadius: 4, p: 1, width: 450 } }}
          >
            <DialogTitle sx={{ fontWeight: 700, textAlign: "center", pb: 1 }}>
              {editingId ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>

            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Nombre"
                fullWidth
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />

              <TextField
                label="Descripción"
                fullWidth
                multiline
                rows={2}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />

              <TextField
                label="URL Imagen"
                fullWidth
                value={form.imagen}
                onChange={(e) => setForm({ ...form, imagen: e.target.value })}
              />
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button
                sx={{ borderRadius: 3 }}
                onClick={() => {
                  setOpenModal(false);
                  setEditingId(null);
                  cleanForm();
                }}
              >
                Cancelar
              </Button>

              <Button
                variant="contained"
                sx={{ borderRadius: 3 }}
                onClick={handleSubmit}
              >
                {editingId ? "Actualizar" : "Crear"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default AdminCategorias;
