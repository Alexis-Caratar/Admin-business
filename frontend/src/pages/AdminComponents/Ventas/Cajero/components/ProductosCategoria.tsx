import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  TextField,
  List,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";
import toastr from "toastr";
import "toastr/build/toastr.min.css";
import InputAdornment from "@mui/material/InputAdornment";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import QrCodeIcon from '@mui/icons-material/QrCode';
import Tooltip from "@mui/material/Tooltip";
import Inventory2Icon from "@mui/icons-material/Inventory2";

toastr.options = {
  positionClass: "toast-top-right",
  timeOut: 2000,
  progressBar: true,
  closeButton: false,
};
import type { CategoriaCajero, ProductoCajero } from "../../../../../types/cajero";

type Props = {
  open: boolean;
  onClose: () => void;
  categoria?: CategoriaCajero | null;
  categorias: CategoriaCajero[];
  onAgregar: (p: ProductoCajero) => void;
  animarAlCarrito?: (img: string, rect: DOMRect) => void;
};


export const ProductosCategoriaModal: React.FC<Props> = ({
  open,
  onClose,
  categoria,
  categorias,
  onAgregar
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] =
    useState<CategoriaCajero | null>(null);
  const [productos, setProductos] = useState<ProductoCajero[]>([]);
  const [animItem, setAnimItem] = useState<{ img: string; start: DOMRect; } | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoCajero | null>(null);
  const [openExtras, setOpenExtras] = useState(false);
  const [, setExtrasSeleccionados] = useState<ProductoCajero[]>([]);


  /* ========= INIT ========= */
  useEffect(() => {
    if (categoria) {
      setCategoriaActiva(categoria);
      setProductos(categoria.platos);
    } else if (categorias.length > 0) {
      setCategoriaActiva(categorias[0]);
      setProductos(categorias[0].platos);
    }
    setSearch("");
  }, [open, categoria, categorias]);

  const filtered = productos.filter((p) =>
    p.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  const animarAlCarrito = (img: string, rect: DOMRect) => {
    setAnimItem({ img, start: rect });

    setTimeout(() => {
      setAnimItem(null);
    }, 700);
  };


  const handleAgregar = (
    prod: ProductoCajero,
    event?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>
  ) => {

    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      animarAlCarrito(
        prod.imagen_plato ?? "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
        rect
      );
    }

    onAgregar({
      ...prod,
      precio_venta: Number(prod.precio_venta ?? 0),
    });

  };


  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            height: isMobile ? "100%" : "90vh",
            zIndex: 1200,
          },
        }} sx={{
          zIndex: 1200,
        }}
      >
        {/* ================= HEADER ================= */}
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 1, md: 2 },
            py: { xs: 0.5, md: 1.5 }, // 👈 menos alto en móvil
            borderBottom: "1px solid #eee",
          }}
        >
          <Box display="flex" alignItems="center" gap={{ xs: 0.5, md: 1 }}>
            <AddShoppingCartIcon sx={{ fontSize: { xs: 18, md: 24 } }} />

            <Typography
              fontWeight={800}
              sx={{ fontSize: { xs: 14, md: 18 } }} // 👈 texto más pequeño en móvil
            >
              Seleccionar Productos
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            sx={{ p: { xs: 0.5, md: 1 } }} // 👈 botón más compacto
          >
            <CloseIcon sx={{ fontSize: { xs: 25, md: 24 } }} />
          </IconButton>
        </DialogTitle>

        {/* ================= BODY ================= */}
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            p: { xs: 0.5, md: 0 }, // 👈 menos espacio en móvil
          }}
        >
          {/* ================= CATEGORÍAS ================= */}
          <Box
            sx={{
              width: isMobile ? "100%" : 260,
              borderRight: isMobile ? "none" : "1px solid #eee",
              borderBottom: isMobile ? "1px solid #eee" : "none",
              overflowX: isMobile ? "auto" : "hidden",
              p: 1,
            }}
          >
            <Typography
              fontWeight={600}
              display="flex"
              alignItems="center"
              gap={1}
              mb={1}
            >
              <CategoryIcon fontSize="small" />
              Categorías
            </Typography>

            <List
              dense
              sx={{
                display: isMobile ? "flex" : "block",
                gap: 0,
              }}
            >
              {categorias.map((cat) => {
                const active = categoriaActiva?.id === cat.id;

                return (
                  <ListItemButton
                    key={cat.id}
                    onClick={() => {
                      setCategoriaActiva(cat);
                      setProductos(cat.platos);
                      setSearch("");
                    }}
                    selected={active}
                    sx={{
                      borderRadius: 2,
                      minWidth: isMobile ? 150 : "auto",
                      mb: isMobile ? 0 : 0.5,
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "black",
                      },
                      bgcolor: active ? "primary.main" : "primary.secondary",
                    }}
                  >
                    <Box sx={{ width: "100%" }}>

                      {/* 🔹 FILA SUPERIOR: imagen + nombre */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar
                          src={cat.imagen || undefined}
                          alt={cat.categoria}
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: active ? "black" : "primary.main",
                            color: active ? "primary.main" : "black",
                            fontWeight: 600,
                          }}
                        >
                          {!cat.imagen && cat.categoria?.[0]}
                        </Avatar>

                        <Typography
                          fontWeight={700}
                          noWrap
                          sx={{
                            fontSize: { xs: 10, sm: 11, md: 12, lg: 13 },
                          }}
                        >
                          {cat.categoria}
                        </Typography>
                      </Box>

                      {/* 🔹 ABAJO: cantidad */}
                      <Typography
                        fontSize={10}
                        mt={0.5}
                        color={active ? "black" : "text.secondary"}
                      >
                        {cat.platos.length} platos
                      </Typography>

                    </Box>
                  </ListItemButton>
                );
              })}
            </List>
          </Box>

          {/* ================= PRODUCTOS ================= */}
          <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
            <Typography fontWeight={600} fontSize={18}>
              {categoriaActiva?.categoria}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              mb={1}
              display="block"
            >
              {filtered.length} productos disponibles
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* PRODUCTOS EN FLEXBOX */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: { xs: 1, sm: 2, md: 4 }
              }}
            >
              {filtered.map((prod) => (
                <Box
                  key={prod.id}
                  sx={{
                    flex: "1 1 120px",
                    maxWidth: { xs: 100, sm: 200, md: 200 }
                  }}
                >
                <Card
                      onClick={() => {
                        const tieneComplementos =
                          prod.productos_complementos &&
                          prod.productos_complementos.length > 0;
                        if (!tieneComplementos) {
                          const plato = {
                            id: prod.id,
                            codigo_barra: prod.codigo_barra,
                            nombre: prod.nombre,
                            imagen: prod.imagen_plato ?? null,
                            precio_venta: prod.precio_venta,
                            stock_actual:prod.stock_actual,
                            cantidad: 1,
                            tipo: "plato",
                          };

                          onAgregar(plato as any);
                          return;
                        }

                        setProductoSeleccionado(prod);
                        setExtrasSeleccionados([]);
                        setOpenExtras(true);
                      }}
                     sx={{
                      cursor: "pointer",
                      height: { xs: 160, sm: 220, md: 260 }, // altura fija para todas
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: 3,
                      overflow: "hidden",
                      transition: "0.2s",
                      boxShadow: 2,
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 5,
                      },
                    }}
                  >
                    {/* ICONO */}

                    <Box
                      sx={{
                        position: "relative",
                        height: { xs: 80, sm: 90, md: 120 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#f6f6f6",
                        borderRadius: 2,
                      }}
                    >
                      {/* STOCK EN ESQUINA */}
                      <Tooltip title="Stock disponible actualmente" arrow>
                        <Chip
                          icon={<Inventory2Icon sx={{ fontSize: 14 }} />}
                          label={String(prod.stock_actual || 999)}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            height: 24,
                            px: 0.5,
                            bgcolor: "#0b3d2e",
                            color: "#fff",
                            borderRadius: "8px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                            backdropFilter: "blur(4px)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.05)",
                              boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
                            },
                            "& .MuiChip-icon": {
                              color: "#4ade80",
                            },
                          }}
                        />
                      </Tooltip>
                      {/* ICONO */}
                      <Avatar
                        sx={{
                          width: { xs: 36, sm: 40, md: 60 },
                          height: { xs: 36, sm: 40, md: 60 },
                          bgcolor: "#e0e0e0",
                        }}
                      >
                        <RestaurantIcon
                          sx={{
                            fontSize: { xs: 20, sm: 24, md: 32 },
                            color: "#1196b7",
                          }}
                        />
                      </Avatar>
                    </Box>

                    {/* CONTENIDO */}
                    <CardContent
                      sx={{
                        flex: 1,          // ocupa el espacio restante
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between", // botón siempre abajo
                        p: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <QrCodeIcon sx={{ fontSize: 20, color: "#d3830b" }} />
                          <Typography
                            fontWeight={700}
                            fontSize={{ xs: 12, sm: 14 }}
                            noWrap
                            sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
                          >
                            {prod.codigo_barra}
                          </Typography>

                        </Stack>
                        <Typography
                          fontWeight={700}
                          fontSize={{ xs: 9, sm: 12 }}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2, // máximo 2 líneas
                            WebkitBoxOrient: "vertical",
                            wordBreak: "break-word", // para cortar palabras largas
                          }}
                        >
                          {prod.nombre}
                        </Typography>
                        <Typography
                          fontSize={{ xs: 12, sm: 13 }}
                          color="success.main"
                          fontWeight={800}
                        >
                          ${Number(prod.precio_venta).toLocaleString()}
                        </Typography>
                      </Box>

                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        startIcon={<AddShoppingCartIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAgregar(prod, e);
                        }}
                        sx={{
                          mt: 1,
                          py: 0.8,
                          borderRadius: 2.5,

                          background: "linear-gradient(135deg,#f76917,#ff9800)",
                          color: "#fff",

                          fontSize: { xs: 11, sm: 12 },
                          fontWeight: 700,
                          letterSpacing: 0.3,

                          boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                          transition: "all 0.25s ease",

                          "&:hover": {
                            background: "linear-gradient(135deg,#e65c0f,#fb8c00)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 10px 22px rgba(0,0,0,0.3)",
                          },

                          "&:active": {
                            transform: "scale(0.97)",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                          },
                        }}
                      >
                        Agregar
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>

          </Box>
        </DialogContent>

        <Divider />

        {/* ================= FOOTER ================= */}
        <DialogActions
          sx={{
            py: { xs: 0.5, md: 1 },
            px: 2,
            justifyContent: "center",
            borderTop: "1px solid #eee",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: 13, md: 16 },
              textAlign: "center",
            }}
          >
            Selecciona los productos
          </Typography>
        </DialogActions>

        {/* ANIMACIÓN */}
        {animItem && (
          <Box
            component="img"
            src={animItem.img}
            sx={{
              position: "fixed",
              left: animItem.start.left,
              top: animItem.start.top,
              width: 60,
              height: 60,
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 9999,
              animation: "flyToCart 0.7s ease-in-out forwards",
              "@keyframes flyToCart": {
                "0%": {
                  transform: "scale(1)",
                  opacity: 1,
                },
                "100%": {
                  transform: "translate(500px, 300px) scale(0.2)",
                  opacity: 0,
                },
              },
            }}
          />
        )}
      </Dialog>



      {/* ================= MODAL ADICIONALES ================= */}

      <Dialog open={openExtras} onClose={() => setOpenExtras(false)}>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            bgcolor: "#f8fafc",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RestaurantIcon sx={{ color: "#1196b7", fontSize: 22 }} />

            <Box>
              <Typography fontWeight={800} fontSize={16}>
                Seleccionar productos
              </Typography>

              <Typography fontSize={12} color="text.secondary">
                {productoSeleccionado?.nombre}
              </Typography>
            </Box>
          </Box>

          <Chip
            label="Complementos"
            size="small"
            sx={{
              bgcolor: "#0b3d2e",
              color: "#fff",
              fontWeight: 700,
              fontSize: 11,
              borderRadius: "8px",
            }}
          />
        </DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(1, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 1.5,
            }}
          >
            {productoSeleccionado?.productos_complementos?.map((c: any) => {
              return (
                <Card
                  key={c.id_producto_complemento}
                  onClick={() => {

                    const extra = {
                      id: c.id_producto_complemento,
                      nombre: c.nombre,
                      imagenes: c.imagenes[0],
                      precio_venta: c.precio_venta,
                      stock_actual:c.stock_actual,
                      cantidad: 1,
                      tipo: "extra",
                      parent_id: productoSeleccionado?.id,
                    };

                    const plato = {
                      id: productoSeleccionado.id,
                      codigo_barra: productoSeleccionado.codigo_barra,
                      nombre: productoSeleccionado.nombre,
                      imagenes: productoSeleccionado.imagenes[0],
                      precio_venta: productoSeleccionado.precio_venta,
                      stock_actual:productoSeleccionado.stock_actual,
                      cantidad: 1,
                      tipo: "plato",
                    };

                    onAgregar(plato as any);
                    onAgregar(extra as any);
                    setOpenExtras(false);
                  }}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid #eee",
                    transition: "all 0.25s ease",
                    transform: "scale(1)",

                    "&:hover": {
                      transform: "scale(1.04) translateY(-6px)",
                      boxShadow: "0 12px 25px rgba(0,0,0,0.15)",
                      border: "1px solid rgba(17,150,183,0.3)",
                    },

                    "&:active": {
                      transform: "scale(0.98)",
                      boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  {/* ICON AREA */}
                  <Box
                    sx={{
                      position: "relative",
                      height: { xs: 80, sm: 90, md: 120 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "#f6f6f6",
                    }}
                  >
                    <Chip
                      label={`+ $${Number(c.precio_venta).toLocaleString()}`}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        height: 24,
                        px: 0.5,
                        bgcolor: "#0b3d2e",
                        color: "#fff",
                        borderRadius: "8px",
                      }}
                    />

                    <Avatar
                      sx={{
                        width: { xs: 36, sm: 40, md: 60 },
                        height: { xs: 36, sm: 40, md: 60 },
                        bgcolor: "#e0e0e0",
                      }}
                    >
                      <RestaurantIcon
                        sx={{
                          fontSize: { xs: 20, sm: 24, md: 32 },
                          color: "#1196b7",
                        }}
                      />
                    </Avatar>
                  </Box>

                  {/* NOMBRE */}
                  <Box sx={{ p: 1 }}>
                    <Typography
                      fontWeight={700}
                      fontSize={12}
                      sx={{
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.nombre}
                    </Typography>
                  </Box>
                </Card>
              );
            })}
          </Box>
        </DialogContent>

      </Dialog>
    </>


  );
};
