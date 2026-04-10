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
  CardMedia,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Pagination,
  MenuItem,
  InputAdornment,
  Stack,
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
import Inventory2Icon from "@mui/icons-material/Inventory2";
import QrCodeIcon from "@mui/icons-material/QrCode";
import LabelIcon from "@mui/icons-material/Label";
import DescriptionIcon from "@mui/icons-material/Description";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import PublicIcon from "@mui/icons-material/Public";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ImageIcon from "@mui/icons-material/Image";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import { useTheme, useMediaQuery } from "@mui/material";

import { inventario } from "./../../../api/productos";

interface Props {
  id: number;
  onBack: () => void;
}

const AdminProductos: React.FC<Props> = ({ id, onBack }) => {
  const [productos, setProductos] = useState<(Producto & { showDesc?: boolean })[]>([]);
  const [form, setForm] = useState<Producto>({
    codigo_barra: "",
    nombre: "",
    descripcion: "",
    unidad_medida: "",
    imagenes: [],
    usa_receta: false,
    inventario_id: null,
  });


  const [editingId, setEditingId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [imgIndices, setImgIndices] = useState<{ [key: number]: number }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [inventarios, setInventarios] = useState([]);
  const defaultImage =ProductosImg
   const [receta, setReceta] = useState([
  {
    inventario_id: 0,
    nombre: "",
    unidad: "",
    cantidad: 0
  }
]);
  const [openRecetaModal, setOpenRecetaModal] = useState(false);

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


  const fetchInventario = async (tipo: string) => {
  try {
  const  payload = { id, tipo };
    const res = await inventario(payload); // asegúrate que tu API reciba ?tipo=
    setInventarios(res.data || res);
  } catch (error) {
    console.error("Error cargando inventario", error);
  }
};

useEffect(() => {
  if (openModal) {
    if (form.usa_receta) {
      fetchInventario("INSUMO");
    } else {
      fetchInventario("PRODUCTO");
    }
  }
}, [form.usa_receta, openModal]);


const handleChangeUsaReceta = (value: boolean) => {
  setForm({
    ...form,
    usa_receta: value,
    inventario_id: null, // 🔥 limpia selección anterior
  });
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
      estado:true, // por defecto
      publicacion_web: false, // por defecto
      usa_receta: false, 
      inventario_id: null, 
      precios: { id_producto: 0, precio_venta: 0, precio_costo: 0 },
      imagenes: [],
    });
    setEditingId(null);
     setReceta([]);
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
      estado: form.estado,
      publicacion_web: form.publicacion_web,
      usa_receta: form.usa_receta,
      inventario_id: form.usa_receta ? null : form.inventario_id
    },
    productos_precios: form.precios ? [{ ...form.precios }] : [],
    productos_imagenes: form.imagenes ? [...form.imagenes] : [],
    receta: form.usa_receta
    ? receta.map(r => ({
        inventario_id: r.inventario_id,
        cantidad: r.cantidad
      }))
    : []

  }as any;

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

const handleEdit = (producto: any) => {
  setForm(producto);
  setEditingId(producto.id!);

  if (producto.usa_receta && producto.receta) {
    setReceta(
      producto.receta.map((r: any) => ({
        inventario_id: r.inventario_id,
        nombre: r.inventario_nombre,
        unidad: r.unidad,
        cantidad: r.cantidad
      }))
    );
  } else {
    setReceta([]);
  }

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
    <Box p={0} ml={0}>
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
        onClick={() => handleOpenModal()} // ✅ envolvemos la función
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

  {/* Grid productos reemplazado por Box */}
<Box display="flex" flexWrap="wrap" gap={3}>
  {paginated.map((p) => {
    const imgIndex = imgIndices[p.id!] ?? 0;

    return (
      <Box
        key={p.id}
        flex="1 1 calc(100% - 24px)" // xs: full width
        sx={{
          '@media (min-width:600px)': { flex: '1 1 calc(50% - 24px)' },  // sm: 2 por fila
          '@media (min-width:900px)': { flex: '1 1 calc(25% - 24px)' },  // md: 4 por fila
          maxWidth: 200, // opcional: ancho máximo para las tarjetas
        }}
      >
        <Card
          sx={{
            width: "100%",
            height: 320,
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
      top: 10,
      right: 10,
      px: 1.5,
      py: 0.4,
      zIndex: 1,
      borderRadius: 2,
      fontSize: 12,
      fontWeight: 600,
      color: "#fff",
      bgcolor: (() => {
        if (p.estado === true) return "success.main";
        if (p.estado === false) return "warning.main";
        if (p.estado === 2) return "error.main";
        return "grey.500";
      })(),
    }}
  >
    {(() => {
      if (p.estado === true) return "Activo";
      if (p.estado === false) return "Inactivo";
      if (p.estado === 2) return "Descontinuado";
      return "Sin estado";
    })()}
  </Box>
)}

          {/* CARRUSEL DE IMÁGENES */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 150,
              minWidth:10,
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
                minWidth: 80,
                background: "#f5f5f5",
                borderRadius: 1,
                maxHeight: 90,
                overflowY: "auto",
                fontSize: 13,
              }}
            >
              <Typography variant="body2" fontWeight={700} noWrap>
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
      </Box>
    );
  })}
</Box>

      {/* Paginación */}
        {totalPages > 1 && (
              <Stack alignItems="center" mt={3}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_e: React.ChangeEvent<unknown>, value: number) => setPage(value)}
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

      {/* Modal */}
     <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
  
  {/* HEADER */}
  <DialogTitle sx={{ p: 0 }}>
    <Box px={3} py={2} sx={{ bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
      <Typography fontWeight={600} fontSize={18}>
        {editingId ? "Editar Producto" : "Crear Producto"}
      </Typography>
      <Typography fontSize={13} color="text.secondary">
        Configura la información del producto
      </Typography>
    </Box>
  </DialogTitle>

  {/* CONTENIDO */}
  <DialogContent sx={{ py: 3 }}>
    <Box display="flex" flexDirection="column" gap={3}>

      {/* ========================= */}
      {/* INFORMACIÓN GENERAL */}
      {/* ========================= */}
      <Box>
        <Typography fontWeight={600} mb={1} display="flex" gap={1} alignItems="center">
          <Inventory2Icon color="primary" fontSize="small" />
          Información general
        </Typography>

        <Box display="grid" gridTemplateColumns="repeat(2,1fr)" gap={2}>
          <TextField
            label="Código"
            value={form.codigo_barra}
            onChange={(e) => setForm({ ...form, codigo_barra: e.target.value })}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QrCodeIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LabelIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            size="small"
            multiline
            rows={2}
            fullWidth
            sx={{ gridColumn: "span 2" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DescriptionIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

  
        {/* ================= IZQUIERDA ================= */}
        <Box
        >
          <TextField
            select
            fullWidth
            label="Modo de control"
            size="small"
            value={form.usa_receta ? "receta" : "directo"}
            onChange={(e) => handleChangeUsaReceta(e.target.value === "receta")}
          >
            <MenuItem value="directo">PRODUCTO</MenuItem>
            <MenuItem value="receta">PRODCUTO CON ISUMO</MenuItem>
          </TextField>


        </Box>

        {/* ================= DERECHA ================= */}
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 1
          }}
        >
          {!form.usa_receta ? (
            <>
              <Typography fontWeight={600} fontSize={15}>
                Inventario asociado
              </Typography>

           <Autocomplete
            options={inventarios}
            value={
              inventarios.find((i: any) => i.id === form.inventario_id) || null
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            getOptionLabel={(option: any) =>
              `${option.nombre} • ${option.stock} ${option.unidad}`
            }
            onChange={(_, value) =>
              setForm({ ...form, inventario_id: value?.id || null })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar inventario"
                size="small"
                fullWidth
              />
            )}
          />

            </>
          ) : (
            <>
              <Typography fontWeight={600} fontSize={15}>
                Receta del producto
              </Typography>

              <Button
                variant="contained"
                onClick={() => setOpenRecetaModal(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1
                }}
              >
                Configurar receta
              </Button>

              <Box
                sx={{
                  borderRadius: 2,
                  bgcolor: "#f9fafb",
                  border: "1px dashed #d1d5db",
                  p: 1.5,
                  maxHeight: 140,
                  overflow: "auto"
                }}
              >
                {receta.length > 0 ? (
                  receta.map((r, i) => (
                    <Typography key={i} fontSize={13}>
                      • {r.nombre} — {r.cantidad} {r.unidad}
                    </Typography>
                  ))
                ) : (
                  <Typography fontSize={12} color="text.secondary">
                    No hay insumos configurados
                  </Typography>
                )}
              </Box>

              <Typography fontSize={12} color="text.secondary">
                El stock se calculará en base a los insumos definidos en la receta.
              </Typography>
            </>
          )}
        </Box>
        


        </Box>
      </Box>

    
      {/* ========================= */}
      {/* ESTADO */}
      {/* ========================= */}
      <Box display="grid" gridTemplateColumns="repeat(2,1fr)" gap={2}>
        <TextField
          select
          label="Estado"
          size="small"
          value={form.estado ? "true" : "false"}
          onChange={(e) =>
            setForm({ ...form, estado: e.target.value === "true" })
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ToggleOnIcon color="primary" />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="true">Activo</MenuItem>
          <MenuItem value="false">Inactivo</MenuItem>
        </TextField>

        <TextField
          select
          label="Publicación Web"
          size="small"
          value={form.publicacion_web ? "true" : "false"}
          onChange={(e) =>
            setForm({ ...form, publicacion_web: e.target.value === "true" })
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PublicIcon color="primary" />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="true">Sí</MenuItem>
          <MenuItem value="false">No</MenuItem>
        </TextField>
      </Box>

      {/* ========================= */}
      {/* PRECIOS */}
      {/* ========================= */}
      <Box>
        <Typography fontWeight={600} mb={1} display="flex" gap={1}>
          <AttachMoneyIcon color="primary" fontSize="small" />
          Precios
        </Typography>

        <Box display="grid" gridTemplateColumns="repeat(2,1fr)" gap={2}>
          <TextField
            label="Costo"
            type="number"
            size="small"
            value={form.precios?.precio_costo || ""}
            onChange={(e) =>
              setForm({
                ...form,
                precios: { ...form.precios!, precio_costo: Number(e.target.value) },
              })
            }
          />

          <TextField
            label="Venta"
            type="number"
            size="small"
            value={form.precios?.precio_venta || ""}
            onChange={(e) =>
              setForm({
                ...form,
                precios: { ...form.precios!, precio_venta: Number(e.target.value) },
              })
            }
          />
        </Box>
      </Box>

      {/* ========================= */}
      {/* IMÁGENES */}
      {/* ========================= */}
     
      <Box>
        <Typography fontWeight={600} mb={1} display="flex" gap={1}>
          <ImageIcon color="primary" fontSize="small" />
          Imágenes
        </Typography>

              {(form.imagenes ?? []).map((img, index) => (
          <TextField
            key={index}
            label={`Imagen ${index + 1}`}
            size="small"
            value={img.url}
            onChange={(e) => {
              const imgs = [...(form.imagenes ?? [])];
              imgs[index].url = e.target.value;
              setForm({ ...form, imagenes: imgs });
            }}
            fullWidth
            sx={{ mb: 1 }}
          />
        ))}

        <Button
          startIcon={<AddPhotoAlternateIcon />}
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
          Agregar imagen
        </Button>
      </Box>

    </Box>
  </DialogContent>

  {/* FOOTER */}
  <DialogActions sx={{ px: 3, py: 2 }}>
    <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
    <Button variant="contained" onClick={handleSubmit}>
      {editingId ? "Actualizar" : "Crear"}
    </Button>
  </DialogActions>
</Dialog>


{/*modal de insumos  */}

<Dialog
  open={openRecetaModal}
  onClose={() => setOpenRecetaModal(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    Configurar receta
  </DialogTitle>

  <DialogContent>
    <Box display="flex" flexDirection="column" gap={2} mt={1}>

      {/* SELECTOR INSUMOS */}
      <Autocomplete
        options={inventarios}
        getOptionLabel={(option: any) =>
          `${option.nombre} (${option.unidad})`
        }
        onChange={(_, value) => {
          if (!value) return;

          const existe = receta.find(r => r.inventario_id === value.id);
          if (existe) return;

          setReceta([
            ...receta,
            {
              inventario_id: value.id,
              nombre: value.nombre,
              unidad: value.unidad,
              cantidad: 0
            }
          ]);
        }}
        renderInput={(params) => (
          <TextField {...params} label="Agregar insumo" size="small" />
        )}
      />

      {/* LISTADO */}
      <Box display="flex" flexDirection="column" gap={1}>
        {receta.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              borderRadius: 2,
              border: "1px solid #eee"
            }}
          >
            <Box>
              <Typography fontWeight={600}>
                {item.nombre}
              </Typography>
              <Typography fontSize={12} color="text.secondary">
                {item.unidad}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <TextField
                type="number"
                size="small"
                label="Cantidad"
                value={item.cantidad}
                onChange={(e) => {
                  const newReceta = [...receta];
                  newReceta[index].cantidad = Number(e.target.value);
                  setReceta(newReceta);
                }}
                sx={{ width: 100 }}
              />

              <IconButton
                color="error"
                onClick={() =>
                  setReceta(receta.filter((_, i) => i !== index))
                }
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

    </Box>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setOpenRecetaModal(false)}>
      Cancelar
    </Button>
    <Button
      variant="contained"
      onClick={() => setOpenRecetaModal(false)}
    >
      Guardar receta
    </Button>
  </DialogActions>
</Dialog>

    </Box>
  );
};

export default AdminProductos;
