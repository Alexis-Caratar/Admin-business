import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Pagination,
  Stack,
  Paper,
} from "@mui/material";

import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme, useMediaQuery } from "@mui/material";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../../../api/categorias";

import Swal from "sweetalert2";
import AdminProductos from "../Productos/AdminProductos";
import type { Categoria } from "../../../types/categorias";

const AdminCategorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
      await crearCategoria({ ...form, id_negocio: Number(id_negocio) });
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

  const totalPaginas = Math.ceil(categorias.length / itemsPerPage);


  return (
    <Box p={3}>

      {showProductos && selectedCategoriaId !== null ? (
        <AdminProductos id={selectedCategoriaId} onBack={handleBack} />
      ) : (
        <>
          {/* HEADER */}
            <Box
              sx={{
                mb: 3,
                display: "flex",
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                justifyContent: "space-between",
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                gap: 2,
              }}
            >
              {/* TÍTULO */}
              <Box
                display="flex"
                alignItems="center"
                gap={1.5}
              >
                <CategoryIcon
                  sx={{
                    fontSize: {
                      xs: 30,
                      md: 34,
                    },
                    color: "#2563EB",
                  }}
                />

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: {
                        xs: 22,
                        md: 28,
                      },
                      color: "#0F172A",
                      lineHeight: 1.2,
                    }}
                  >
                    Administrar Categorías
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.3,
                      fontSize: 13,
                      color: "#64748B",
                    }}
                  >
                    Gestione las categorías disponibles para organizar los productos.
                  </Typography>
                </Box>
              </Box>

              {/* BOTÓN */}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  cleanForm();
                  setEditingId(null);
                  setOpenModal(true);
                }}
                sx={{
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                  minWidth: {
                    sm: 200,
                  },
                  height: 46,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  background: "linear-gradient(135deg,#2563EB,#3B82F6)",
                  boxShadow: "0 8px 18px rgba(37,99,235,.20)",

                  "&:hover": {
                    background: "linear-gradient(135deg,#1D4ED8,#2563EB)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 12px 24px rgba(37,99,235,.28)",
                  },
                }}
              >
                Crear Categoría
              </Button>
            </Box>

        {/* BUSCADOR */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              maxWidth: { xs: "100%", sm: 420, md: 450 },
              height: 44,
              px: 2,
              borderRadius: 3,
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              transition: ".25s",

              "&:hover": {
                borderColor: "#CBD5E1",
              },

              "&:focus-within": {
                borderColor: "#2563EB",
                boxShadow: "0 0 0 3px rgba(37,99,235,.10)",
              },
            }}
          >
            <SearchIcon
              sx={{
                color: "#64748B",
                mr: 1.5,
                fontSize: 20,
              }}
            />

            <TextField
              variant="standard"
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                disableUnderline: true,
              }}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: 14,
                  color: "#0F172A",
                },
              }}
            />
          </Box>
        </Box>

          {/* GRID CATEGORIAS */}
          {paginated.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 6,
                borderRadius: 4,
                border: "1px dashed #CBD5E1",
                bgcolor: "#F8FAFC",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  bgcolor: "#EFF6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
                }}
              >
                <SearchOffOutlinedIcon
                  sx={{
                    fontSize: 46,
                    color: "#3B82F6",
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#0F172A",
                  mb: 1,
                }}
              >
                No se encontraron registros
              </Typography>

              <Typography
                sx={{
                  maxWidth: 520,
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: "#64748B",
                  mb: 3,
                }}
              >
                No se encontraron categorías registradas. En este momento no hay información disponible para mostrar.
                Crea tu primera categoría para empezar a clasificar los productos y facilitar la administración del
                inventario y del catálogo de tu negocio.
              </Typography>

              <Button


                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  cleanForm();
                  setEditingId(null);
                  setOpenModal(true);
                }}
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: 30,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Crear categoria
              </Button>
            </Paper>
          ) : (
             <Box display="flex" flexWrap="wrap" gap={3}>
           { paginated.map((c: any) => (
             
                <Box
                  key={c.id}
                  sx={{
                    flex: {
                      xs: "  0 100%",
                      sm: "0 0 calc(50% - 24px)",
                      md: "0 0 calc(33.33% - 24px)",
                      lg: "0 0 calc(25% - 24px)",
                      xl: "0 0 calc(20% - 24px)",
                    },
                    minWidth: 0,
                  }}
                >
                  <Card
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
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
                      <Typography variant="body2" fontWeight={700}>
                        {c.nombre}
                      </Typography>
                      <Typography variant="caption">{c.descripcion}</Typography>

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
                </Box>
           

            ))}
   </Box>

          )}

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <Stack alignItems="center" mt={3}>
              <Pagination
                count={totalPaginas}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
                shape="rounded"
                size={isMobile ? "small" : "medium"}
                siblingCount={isMobile ? 0 : 1}
                boundaryCount={isMobile ? 1 : 2}
                showFirstButton={!isMobile}
                showLastButton={!isMobile}

              />
            </Stack>
          )}
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
