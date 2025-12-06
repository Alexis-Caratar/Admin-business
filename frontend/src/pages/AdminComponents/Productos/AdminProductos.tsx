import React, { useEffect, useState } from "react";
import type { Producto, ProductoImagen } from "../../../types/index";
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
  Pagination,
  MenuItem,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ProductosImg from './../../../assets/img/Productos.png';


interface Props {
  id: number;
  onBack: () => void;
}

const AdminProductos: React.FC<Props> = ({ id, onBack }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState<Producto>({
    codigo_barra: "",
    nombre: "",
    descripcion: "",
    unidad_medida: "",
    imagenes: [],
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;
  const [imgIndices, setImgIndices] = useState<{ [key: number]: number }>({});

  const unidades = ["kg", "litro", "pieza", "unidad"];
  const defaultImage =ProductosImg

  // Fetch productos
  const fetchProductos = async () => {
    const data = await getProductos(id);
    setProductos(data);
  };

  useEffect(() => {
    fetchProductos();
  }, [id]);

  // Filtrado
  const filtered = productos.filter((p) =>
    (p.nombre + p.codigo_barra + p.descripcion + p.unidad_medida)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Carrusel de imágenes
  const prevImage = (productoId: number, total: number) => {
    setImgIndices((prev) => ({
      ...prev,
      [productoId]: (prev[productoId] ?? 0 - 1 + total) % total,
    }));
  };

  const nextImage = (productoId: number, total: number) => {
    setImgIndices((prev) => ({
      ...prev,
      [productoId]: ((prev[productoId] ?? 0) + 1) % total,
    }));
  };

  // CRUD
const handleOpenModal = (producto?: Producto) => {
  if (producto) {
    setForm(producto);
    setEditingId(producto.id!);
  } else {
    setForm({
      codigo_barra: "",
      nombre: "",
      descripcion: "",
      unidad_medida: "",
      tipo_producto: "producto_terminado", // valor por defecto
      stock_actual: 0,
      stock_minimo: 0,
      stock_maximo: 0,
      estado: "activo", // por defecto
      publicacion_web: "no", // por defecto
      precios: { id_producto: 0, precio_venta: 0, precio_costo: 0 },
      imagenes: [],
    });
    setEditingId(null);
  }
  setOpenModal(true);
};


const handleSubmit = async () => {
  const payload = {
    producto: {
      id_categoria: id,
      codigo_barra: form.codigo_barra,
      nombre: form.nombre,
      descripcion: form.descripcion,
      unidad_medida: form.unidad_medida,
      tipo_producto: form.tipo_producto,
      stock_actual: form.stock_actual,
      stock_minimo: form.stock_minimo,
      stock_maximo: form.stock_maximo,
      estado: form.estado,
      publicacion_web: form.publicacion_web,
    },
    productos_precios: form.precios ? [{ ...form.precios }] : [],
    productos_imagenes: form.imagenes ? [...form.imagenes] : [],
  };

  try {
    if (editingId) {
      await actualizarProducto(editingId, payload);
    } else {
      await crearProducto(payload);
    }

    setOpenModal(false);

    const data = await getProductos(id);
    setProductos(data);
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
      }
    }
  };


  return (
    <Box p={3}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mb: 2, fontWeight: "bold" }}
      >
        Volver
      </Button>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <ShoppingBagIcon sx={{ fontSize: 28 }} />
          Administrar Productos
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<ShoppingBagIcon />}
          onClick={handleOpenModal}
        >
          Crear Producto
        </Button>
      </Box>

      {/* Buscador */}
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
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            InputProps={{ disableUnderline: true }}
            fullWidth
          />
        </Box>
      </Box>

      {/* Grid productos */}
      <Grid container spacing={3}>
        {paginated.map((p) => {
          const imgs: string[] =
            p.imagenes && p.imagenes.length > 0
              ? p.imagenes.map((i) => i.url)
              : [defaultImage];
          const imgIndex = imgIndices[p.id!] ?? 0;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
              <Card
                sx={{
                  height: 400, // altura fija para todas las tarjetas
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  position: "relative",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",

                  },
                }}
              >
                {/* ESTADO */}
                {p.estado !== undefined && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      px: 1.5,
                      py: 0.5,
                      zIndex: 1,
                      borderRadius: 1,
                      bgcolor:
                        p.estado === 1
                          ? "success.main"
                          : p.estado === 2
                            ? "error.main"
                            : "grey.500",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {p.estado === 1
                      ? "Activo"
                      : p.estado === 2
                        ? "Descontinuado"
                        : "Inactivo"}
                  </Box>
                )}

                {/* CARRUSEL DE IMÁGENES */}
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: 150,
                    overflow: "hidden",
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                  }}
                >
                  <CardMedia
                    component="img"
                    image={p.imagenes && p.imagenes.length > 0 ? p.imagenes[imgIndex].url : defaultImage}
                    alt={p.nombre}
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {p.imagenes && p.imagenes.length > 1 && (
                    <>
                      <IconButton
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: 4,
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.3)",
                          color: "#fff",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
                        }}
                        size="small"
                        onClick={() => prevImage(p.id!, p.imagenes!.length)}
                      >
                        <ArrowBackIosNewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        sx={{
                          position: "absolute",
                          top: "50%",
                          right: 4,
                          transform: "translateY(-50%)",
                          bgcolor: "rgba(0,0,0,0.3)",
                          color: "#fff",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
                        }}
                        size="small"
                        onClick={() => nextImage(p.id!, p.imagenes!.length)}
                      >
                        <ArrowForwardIosIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>

                {/* CONTENIDO PRINCIPAL */}
                {/* CONTENIDO PRINCIPAL */}
                <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography variant="subtitle2" color="textSecondary" noWrap>
                    <QrCode2Icon fontSize="small" sx={{ color: "#fb8c00" }} />
                    Codigo:<b>{p.codigo_barra}</b>
                  </Typography>

                  <Box
                    sx={{
                      mt: 0.2,
                      p: 0.2,
                      width: "100%",
                      minWidth: 222,
                      background: "#f5f5f5",
                      borderRadius: 1,
                      maxHeight: 90,
                      overflowY: "auto",
                      fontSize: 13,
                    }}
                  >
                    <Typography variant="body1" fontWeight={700} noWrap>
                      {p.nombre}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    {p.stock_actual !== undefined && (
                      <Typography
                        variant="body2"
                        color={p.stock_actual <= 5 ? "error.main" : "textSecondary"}
                      >
                        Stock: {p.stock_actual}
                      </Typography>
                    )}
                    <Typography variant="body1" fontWeight={1000} color="success.main">
                      {p.precios?.precio_venta != null
                        ? new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 2,
                        }).format(Number(p.precios.precio_venta))
                        : "$0.00"}
                    </Typography>
                  </Box>

                  <Typography variant="body2">Unidad: {p.unidad_medida || "N/A"}</Typography>

                  {/* Descripción expandible */}
                  {p.descripcion && (
                    <Box mt={0.5}>
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
                      {p.showDesc && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1,
                            width: "100%",
                            maxWidth: 200,
                            background: "#f5f5f5",
                            borderRadius: 1,
                            maxHeight: 90,
                            overflowY: "auto",
                            fontSize: 13,
                          }}
                        >
                          {p.descripcion || "Sin descripción"}
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* ACCIONES SUBIDAS */}
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <IconButton color="primary" onClick={() => handleEdit(p)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(p.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>

              </Card>
            </Grid>

          );
        })}
      </Grid>

      {/* Paginación */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
          shape="rounded"
        />
      </Box>

      {/* Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
  <DialogTitle>{editingId ? "Editar Producto" : "Crear Producto"}</DialogTitle>

  <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>

    {/* Información principal */}
    <TextField
      label="Código"
      value={form.codigo_barra}
      onChange={(e) => setForm({ ...form, codigo_barra: e.target.value })}
      fullWidth
      required
    />

    <TextField
      label="Nombre"
      value={form.nombre}
      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
      fullFullWidth
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

    <Autocomplete
      freeSolo
      options={unidades}
      value={form.unidad_medida || ""}
      onChange={(event, newValue) => setForm({ ...form, unidad_medida: newValue || "" })}
      onInputChange={(event, newInputValue) => setForm({ ...form, unidad_medida: newInputValue })}
      renderInput={(params) => <TextField {...params} label="Unidad de medida" fullWidth />}
    />

    {/* Tipo de Producto */}
    <TextField
      select
      label="Tipo de Producto"
      value={form.tipo_producto || "producto_terminado"}
      onChange={(e) => setForm({ ...form, tipo_producto: e.target.value })}
      fullWidth
    >
      <MenuItem value="Producto">Producto</MenuItem>
      <MenuItem value="Producto_con_insumo">Producto con insumo</MenuItem>
      <MenuItem value="insumo">Insumo</MenuItem>
      <MenuItem value="servicio">Servicio</MenuItem>
      <MenuItem value="otro">Otro</MenuItem>
    </TextField>

    {/* Stock */}
    <Box display="flex" gap={1}>
      <TextField
        label="Stock Actual"
        type="number"
        value={form.stock_actual || 0}
        onChange={(e) => setForm({ ...form, stock_actual: Number(e.target.value) })}
        fullWidth
      />

      <TextField
        label="Stock Mínimo"
        type="number"
        value={form.stock_minimo || 0}
        onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })}
        fullWidth
      />

      <TextField
        label="Stock Máximo"
        type="number"
        value={form.stock_maximo || 0}
        onChange={(e) => setForm({ ...form, stock_maximo: Number(e.target.value) })}
        fullWidth
      />
    </Box>

    {/* Estado */}
    <TextField
      select
      label="Estado"
      value={form.estado ?? 1}
      onChange={(e) => setForm({ ...form, estado: Number(e.target.value) })}
      fullWidth
    >
      <MenuItem value={1}>Activo</MenuItem>
      <MenuItem value={0}>Inactivo</MenuItem>
    </TextField>

    {/* Publicación Web */}
    <TextField
      select
      label="Publicación Web"
      value={form.publicacion_web ?? 0}
      onChange={(e) => setForm({ ...form, publicacion_web: Number(e.target.value) })}
      fullWidth
    >
      <MenuItem value={0}>No</MenuItem>
      <MenuItem value={1}>Sí</MenuItem>
    </TextField>

    {/* Precios */}
    <Box display="flex" gap={1}>
      <TextField
        label="Precio Costo"
        type="number"
        value={form.precios?.precio_costo || ""}
        onChange={(e) =>
          setForm({
            ...form,
            precios: { ...form.precios!, precio_costo: Number(e.target.value) },
          })
        }
        fullWidth
      />

      <TextField
        label="Precio Venta"
        type="number"
        value={form.precios?.precio_venta || ""}
        onChange={(e) =>
          setForm({
            ...form,
            precios: { ...form.precios!, precio_venta: Number(e.target.value) },
          })
        }
        fullWidth
      />
    </Box>

    {/* Imágenes */}
    {form.imagenes?.map((img, index) => (
      <TextField
        key={index}
        label={`Imagen ${index + 1}`}
        value={img.url}
        onChange={(e) => {
          const imgs = [...(form.imagenes || [])];
          imgs[index].url = e.target.value;
          setForm({ ...form, imagenes: imgs });
        }}
        fullWidth
      />
    ))}

    <Button
      variant="outlined"
      onClick={() =>
        setForm({
          ...form,
          imagenes: [
            ...(form.imagenes || []),
            { id_producto: form.id!, url: "", orden: form.imagenes?.length || 0, activo: 1 },
          ],
        })
      }
    >
      Agregar Imagen
    </Button>
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
