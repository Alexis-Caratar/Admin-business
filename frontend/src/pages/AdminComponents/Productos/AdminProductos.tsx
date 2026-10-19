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
  Avatar,
  Paper,
  Alert,
  createFilterOptions,
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
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import { inventario } from "./../../../api/productos";

interface Props {
  id: number;
  onBack: () => void;
}

type InventarioItem = { id: number; nombre: string; stock_actual: number; unidad: string };
type OpcionInventario = InventarioItem | { crear: true; nombre: string };

const filtroInventario = createFilterOptions<OpcionInventario>();
const normalizarNombre = (t = "") => t.trim().replace(/\s+/g, " ").toLowerCase();

const AdminProductos: React.FC<Props> = ({ id, onBack }) => {
  const [productos, setProductos] = useState<(Producto & { showDesc?: boolean })[]>([]);
  const [form, setForm] = useState<Producto>({
    codigo_barra: "",
    nombre: "",
    descripcion: "",
    unidad_medida: "",
    imagenes: [],
    tipo_control: "producto",
    es_complemento: false,
    inventario_id: null,
    hora_inicio: "07:00",
    hora_fin: "16:00"
  });


  const [editingId, setEditingId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 18;
  const [imgIndices, setImgIndices] = useState<{ [key: number]: number }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [inventarios, setInventarios] = useState<InventarioItem[]>([]);
  // Inventario del PRODUCTO FINAL: nombre si se crea nuevo, unidades a cargar y stock mínimo
  const [invNombreNuevo, setInvNombreNuevo] = useState("");
  const [invCantidad, setInvCantidad] = useState("");
  const [invStockMinimo, setInvStockMinimo] = useState("");
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
const [productos_complementos, setproductos_complementos] = useState<any[]>([]);

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


const resetInventarioForm = () => {
  setInvNombreNuevo("");
  setInvCantidad("");
  setInvStockMinimo("");
};

// Si no se eligió un inventario, se usa el nombre del producto; si ya existe uno igual se toma ese
const nombreInventarioNuevo = invNombreNuevo || form.nombre || "";
const inventarioCoincidente = !form.inventario_id
  ? inventarios.find((i) => normalizarNombre(i.nombre) === normalizarNombre(nombreInventarioNuevo))
  : undefined;
const inventarioSeleccionado =
  inventarios.find((i) => i.id === form.inventario_id) || inventarioCoincidente || null;

const handleChangeTipoControl = (value: string) => {
  setForm({
    ...form,
    tipo_control: value,
    inventario_id: null,
  });

  if (value !== "receta") {
    setReceta([]);
  }
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
      tipo_control: "producto",
      inventario_id: null,
      hora_inicio: "07:00",
      hora_fin: "16:00",
      precios: { id_producto: 0, precio_venta: 0, precio_costo: 0 },
      imagenes: [],
    });
    setEditingId(null);
     setReceta([]);
  }
  resetInventarioForm();
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
    es_complemento: form.es_complemento,
    estado: form.estado,
    publicacion_web: form.publicacion_web,
    inventario_id:form.tipo_control === "producto"? form.inventario_id: null,
    controla_inventario:form.tipo_control != "sin_inventario"? true: false,
    usa_receta:form.tipo_control === "receta",
    hora_inicio: form.hora_inicio,
    hora_fin: form.hora_fin
  },
  productos_precios: form.precios
    ? [{ ...form.precios }]
    : [],

  productos_imagenes: form.imagenes
    ? [...form.imagenes]
    : [],
  // El backend crea el inventario si no existe y registra la entrada de stock
  inventario:
    form.tipo_control === "producto"
      ? {
          inventario_id: form.inventario_id ?? inventarioCoincidente?.id ?? null,
          nombre: nombreInventarioNuevo,
          unidad: "UND",
          stock_minimo: Number(invStockMinimo) || 0,
          cantidad: Number(invCantidad) || 0,
        }
      : undefined,
  receta:
    form.tipo_control === "receta"
      ? receta.map((r) => ({
          inventario_id: r.inventario_id,
          cantidad: r.cantidad
        }))
      : [],

      productos_complementos: productos_complementos
} as any;

  try {
    if (editingId) {
      await actualizarProducto(editingId, payload);
    } else {
      await crearProducto(payload);
    }

    setOpenModal(false);
    resetInventarioForm();

    const data = await getProductos(id);
    setProductos(data);
  } catch (error: any) {
    console.error("Error al guardar producto:", error);
    Swal.fire({
      icon: "error",
      title: "No se pudo guardar",
      text: error?.response?.data?.error || "Error al guardar el producto",
    });
  }
};

const handleEdit = (producto: any) => {
  setForm(producto);
  setEditingId(producto.id!);
  resetInventarioForm();

  if (producto.productos_complementos) {
  setproductos_complementos(
    producto.productos_complementos.map((p: any) => ({
      id_producto_complemento: p.id_producto_complemento,
      obligatorio: p.obligatorio ?? false,
      tipo_seleccion: p.tipo_seleccion ?? "opcional"
    }))
  );
} else {
  setproductos_complementos([]);
}

if (producto.tipo_control === "receta" && producto.receta) {
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
        {/* TÍTULO + DESCRIPCIÓN */}
        <Box>
          <Typography
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              fontWeight: 700,
              fontSize: {
                xs: 22,
                md: 28,
              },
              color: "#0F172A",
            }}
          >
            <ShoppingBagIcon
              sx={{
                fontSize: {
                  xs: 28,
                  md: 32,
                },
                color: "#2563EB",
              }}
            />
            Administrar Productos
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              ml: { xs: 0, sm: 5.5 }, // Alinea el texto con el título (después del icono)
              fontSize: 13,
              color: "#64748B",
            }}
          >
            Gestione los productos registrados en el sistema.
          </Typography>
        </Box>

        {/* BOTÓN */}
        <Button
          variant="contained"
          startIcon={<ShoppingBagIcon />}
          onClick={() => handleOpenModal()}
          sx={{
            width: {
              xs: "100%",
              sm: "auto",
            },
            minWidth: {
              sm: 190,
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
          Crear Producto
        </Button>
      </Box>
      {/* Buscador */}
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
            transition: "all .25s ease",

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
              fontSize: 20,
              mr: 1.5,
            }}
          />

          <TextField
            variant="standard"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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

{/* Grid productos */}
    <Box display="flex" flexWrap="wrap" gap={3}>
      {paginated.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            minHeight: "calc(100vh - 260px)",
            borderRadius: 4,
            border: "1px dashed #CBD5E1",
            bgcolor: "#F8FAFC",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 4,
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
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
                fontSize: 50,
                color: "#2563EB",
              }}
            />
          </Box>

          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 700,
              color: "#0F172A",
              mb: 1,
            }}
          >
            No se encontraron productos
          </Typography>

          <Typography
            sx={{
              maxWidth: 650,
              fontSize: 15,
              lineHeight: 1.8,
              color: "#64748B",
              mb: 4,
            }}
          >
            Actualmente no existen productos registrados o ninguno coincide con los
            criterios de búsqueda aplicados. Agrega un nuevo producto o modifica los
            filtros para visualizar la información disponible.
          </Typography>

          <Button
            variant="contained"
          startIcon={<ShoppingBagIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              px: 4,
              py: 1.2,
              borderRadius: 30,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Agregar producto
          </Button>
        </Paper>
      ) : (
        paginated.map((p) => {
          const imgIndex = imgIndices[p.id!] ?? 0;

        return (
        <Box
            key={p.id}
            sx={{
              flex: {
                xs: "0 0 calc(50% - 12px)", // 2 tarjetas en móvil
                sm: "0 0 calc(50% - 12px)", // 2 tarjetas
                md: "0 0 calc(25% - 18px)", // 4 tarjetas
                lg: "0 0 calc(20% - 20px)", // 5 tarjetas
                xl: "0 0 calc(16.66% - 20px)", // 6 tarjetas
              },
              minWidth: 0,
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
        })
      )}
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
          value={form.tipo_control || "producto"}
          onChange={(e) => handleChangeTipoControl(e.target.value)}
        >
          <MenuItem value="producto">PRODUCTO FINAL</MenuItem>
          <MenuItem value="receta">PRODUCTO CON INSUMO</MenuItem>
          <MenuItem value="sin_inventario">SIN INVENTARIO</MenuItem>
        </TextField>


        </Box>

        <Box>
  <TextField
    select
    fullWidth
    label="Tipo de producto"
    size="small"
    value={form.es_complemento ? "true" : "false"}
    onChange={(e) =>
      setForm({
        ...form,
        es_complemento: e.target.value === "true",
      })
    }
  >
    <MenuItem value="false">
      PRODUCTO PRINCIPAL
    </MenuItem>

    <MenuItem value="true">
      PRODUCTO COMPLEMENTARIO
    </MenuItem>
  </TextField>
</Box>


        {/* ================= DERECHA ================= */}
        {form.tipo_control != "sin_inventario"&&(
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
            {form.tipo_control === "producto" ? (
              <>
              <Typography fontWeight={600} fontSize={15}>
                Inventario del producto
              </Typography>

              <Autocomplete<OpcionInventario>
                options={inventarios}
                value={
                  inventarioSeleccionado ??
                  (invNombreNuevo ? { crear: true as const, nombre: invNombreNuevo } : null)
                }
                isOptionEqualToValue={(option, value) =>
                  "id" in option && "id" in value
                    ? option.id === value.id
                    : "crear" in option && "crear" in value
                }
                filterOptions={(options, params) => {
                  const filtrados = filtroInventario(options, params);
                  const texto = params.inputValue.trim();
                  const existe = options.some(
                    (o) => normalizarNombre(o.nombre) === normalizarNombre(texto)
                  );
                  if (texto && !existe) filtrados.push({ crear: true, nombre: texto });
                  return filtrados;
                }}
                getOptionLabel={(option) =>
                  "crear" in option ? option.nombre : `${option.nombre} • ${option.stock_actual} ${option.unidad}`
                }
                renderOption={(props, option) => (
                  <li {...props} key={"crear" in option ? "crear" : option.id}>
                    {"crear" in option
                      ? `➕ Crear "${option.nombre}" en inventario`
                      : `${option.nombre} • ${option.stock_actual} ${option.unidad}`}
                  </li>
                )}
                onChange={(_, value) => {
                  if (value && "crear" in value) {
                    setInvNombreNuevo(value.nombre);
                    setForm({ ...form, inventario_id: null });
                  } else {
                    setInvNombreNuevo("");
                    setForm({ ...form, inventario_id: value?.id || null });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar o crear inventario"
                    placeholder={form.nombre || "Ej: Coca-Cola 1.5"}
                    size="small"
                    fullWidth
                  />
                )}
              />

              {inventarioSeleccionado ? (
                <Alert severity="success" sx={{ py: 0 }}>
                  {form.inventario_id ? "Vinculado a" : "Ya existe en inventario, se usará"}{" "}
                  <b>{inventarioSeleccionado.nombre}</b> — stock actual{" "}
                  {inventarioSeleccionado.stock_actual} {inventarioSeleccionado.unidad}
                </Alert>
              ) : nombreInventarioNuevo.trim() ? (
                <Alert severity="info" sx={{ py: 0 }}>
                  Se creará <b>{nombreInventarioNuevo.trim()}</b> en inventario al guardar
                </Alert>
              ) : (
                <Typography fontSize={12} color="text.secondary">
                  Escribe el nombre del producto o elige un inventario existente.
                </Typography>
              )}

              <Stack direction="row" spacing={1}>
                <TextField
                  label={inventarioSeleccionado ? "Agregar unidades" : "Stock inicial"}
                  type="number"
                  size="small"
                  fullWidth
                  value={invCantidad}
                  onChange={(e) => setInvCantidad(e.target.value)}
                  inputProps={{ min: 0 }}
                  helperText={
                    inventarioSeleccionado && Number(invCantidad) > 0
                      ? `Quedará en ${Number(inventarioSeleccionado.stock_actual) + Number(invCantidad)}`
                      : "Opcional"
                  }
                />
                {!inventarioSeleccionado && (
                  <TextField
                    label="Stock mínimo"
                    type="number"
                    size="small"
                    fullWidth
                    value={invStockMinimo}
                    onChange={(e) => setInvStockMinimo(e.target.value)}
                    inputProps={{ min: 0 }}
                    helperText="Para alertas"
                  />
                )}
              </Stack>
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
        )}


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

        <Box>
          <Typography fontWeight={600} mb={1}>
            Horario de disponibilidad
          </Typography>

          <Box display="grid" gridTemplateColumns="repeat(2,1fr)" gap={2}>
            <TextField
              label="Hora inicio"
              type="time"
              size="small"
              value={form.hora_inicio || ""}
              onChange={(e) =>
                setForm({ ...form, hora_inicio: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Hora fin"
              type="time"
              size="small"
              value={form.hora_fin || ""}
              onChange={(e) =>
                setForm({ ...form, hora_fin: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Box>
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
          value={form.precios?.precio_costo === 0 ? "" : form.precios?.precio_costo}
          onChange={(e) =>
            setForm({
              ...form,
              precios: {
                ...form.precios!,
                precio_costo: e.target.value === "" ? 0 : Number(e.target.value),
              },
            })
          }
        />

          <TextField
            label="Venta"
            type="number"
            size="small"
            value={form.precios?.precio_venta === 0 ? "" : form.precios?.precio_venta}
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
   
{/* PRODUCTOS COMPLEMENTARIOS*/}

{form.es_complemento === false && (
  <Box
  sx={{
    p: 2.5,
    borderRadius: 3,
    border: "1px solid #e5e7eb",
    bgcolor: "#fff",
  }}
>
  {/* HEADER */}
  <Box mb={2}>
    <Typography fontWeight={700} fontSize={15}>
      Productos complementarios
    </Typography>
    <Typography fontSize={12} color="text.secondary">
      Administra productos incluidos y opcionales
    </Typography>
  </Box>

  {/* SELECTOR */}
  <Autocomplete
    multiple
    options={productos.filter((p) => p.id !== form.id)}
    getOptionLabel={(option: any) => option.nombre}
    value={productos.filter((p) =>
      productos_complementos.some(
        (r) => r.id_producto_complemento === p.id
      )
    )}
    onChange={(_, values) => {
      setproductos_complementos(
        values.map((v: any) => ({
          id_producto_complemento: v.id,
          obligatorio: true,
          tipo_seleccion: "unico",
        }))
      );
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Buscar productos"
        size="small"
      />
    )}
  />

  {/* GRID CARDS */}
  <Box
    mt={2}
    display="grid"
    gridTemplateColumns="repeat(auto-fill, minmax(220px, 1fr))"
    gap={1.5}
  >
    {productos_complementos.map((item, index) => {
      const producto = productos.find(
        (p) => p.id === item.id_producto_complemento
      );

      return (
        <Box
          key={index}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            bgcolor: "#fafafa",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            transition: "0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              bgcolor: "#fff",
            },
          }}
        >
          {/* PRODUCT NAME */}
          <Typography fontWeight={700} fontSize={13} noWrap>
            {producto?.imagenes && producto.imagenes.length > 0 ? (
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar src={producto.imagenes[0].url} alt={producto.nombre} sx={{ width: 24, height: 24 }} />
                {producto.nombre}
              </Box>
            ) : (
              <Typography fontWeight={700} fontSize={13} noWrap>
                {producto?.nombre}
              </Typography>
            )}
          </Typography>

          {/* SWITCH SIMPLE */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mt={1}
          >
            <Typography fontSize={12}>
              {item.obligatorio ? "Incluido" : "Opcional"}
            </Typography>

            <Box
              onClick={() => {
                const copia = [...productos_complementos];
                copia[index].obligatorio = !copia[index].obligatorio;
                setproductos_complementos(copia);
              }}
              sx={{
                width: 42,
                height: 22,
                borderRadius: 10,
                bgcolor: item.obligatorio ? "#22c55e" : "#cbd5e1",
                position: "relative",
                cursor: "pointer",
                transition: "0.2s",
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  bgcolor: "#fff",
                  position: "absolute",
                  top: 2,
                  left: item.obligatorio ? 22 : 2,
                  transition: "0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}
              />
            </Box>
          </Box>
        </Box>
      );
    })}
  </Box>

  {/* EMPTY STATE */}
  {productos_complementos.length === 0 && (
    <Box
      mt={2}
      sx={{
        py: 4,
        textAlign: "center",
        border: "1px dashed #d1d5db",
        borderRadius: 3,
        bgcolor: "#fafafa",
      }}
    >
      <Typography fontSize={12} color="text.secondary">
        Aún no hay productos complementarios
      </Typography>
    </Box>
  )}
</Box>
)}
   

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
