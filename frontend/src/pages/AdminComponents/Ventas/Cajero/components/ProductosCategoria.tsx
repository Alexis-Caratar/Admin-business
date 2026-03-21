import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  Typography,
  Box,
  TextField,
  List,
  ListItemButton,
  ListItemText,
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
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import QrCodeIcon from '@mui/icons-material/QrCode';
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
  const [animItem, setAnimItem] = useState<{
  img: string;
  start: DOMRect;
} | null>(null);

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
);  }

  onAgregar({
    ...prod,
    precio_venta: Number(prod.precio_venta ?? 0),
  });

  toastr.success(`${prod.nombre} agregado`);
};

  return (
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
          px: 3,
          py: 2,//
          borderBottom: "1px solid #eee",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <AddShoppingCartIcon color="primary" />
          <Typography fontWeight={800}>Seleccionar Productos</Typography>
        </Box>

        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* ================= BODY ================= */}
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          p: 0,
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
            fontWeight={700}
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
              gap: 1,
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
                    minWidth: isMobile ? 160 : "auto",
                    mb: isMobile ? 0 : 0.5,
                    "&.Mui-selected": {
                      backgroundColor: "primary.main",
                      color: "white",
                    },
                  }}
                >
                  <Avatar
                    src={cat.imagen || undefined}
                    alt={cat.categoria}
                    sx={{
                      width: 32,
                      height: 32,
                      mr: 1,
                      bgcolor: active ? "white" : "primary.main",
                      color: active ? "primary.main" : "white",
                      fontWeight: 700,
                    }}
                  >
                    {/* Fallback si no hay imagen */}
                    {!cat.imagen && cat.categoria?.[0]}
                  </Avatar>


                  <ListItemText
                    primary={cat.categoria}
                    secondary={`${cat.platos.length} platos`}
                    secondaryTypographyProps={{
                      fontSize: 11,
                      color: active ? "white" : "text.secondary",
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

 {/* ================= PRODUCTOS ================= */}
<Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
  <Typography fontWeight={800} fontSize={18}>
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
    gap: 2,
  }}
>
  {filtered.map((prod) => (
    <Box
      key={prod.id}
      sx={{
        flex: "1 1 150px",
        maxWidth: 220,
      }}
    >
      <Card
        onClick={(e) => handleAgregar(prod, e)}
        sx={{
          cursor: "pointer",
          height: { xs: 220, sm: 240, md: 260 }, // altura fija para todas
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
            height: { xs: 80, sm: 90, md: 120 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f6f6f6",
            borderRadius: 2,
          }}
        >
          <Avatar
            sx={{
              width: { xs: 36, sm: 40, md: 60 },
              height: { xs: 36, sm: 40, md: 60 },
              bgcolor: "#e0e0e0",
            }}
          >
            <LunchDiningIcon
              sx={{
                fontSize: { xs: 20, sm: 24, md: 32 },
                color: "#f76917",
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
                    <Chip
                      label={prod.codigo_barra}
                      size="small"
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        height: 20,
                        bgcolor: "#111827",
                        color: "#fff"
                      }}
                    />

                   
                  </Stack>

            <Typography
              fontWeight={700}
              fontSize={{ xs: 12, sm: 14 }}
              noWrap
              sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
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
            color="success"
            startIcon={<AddShoppingCartIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleAgregar(prod, e);
            }}
            sx={{
              mt: 1,
              fontSize: { xs: 11, sm: 12 },
              py: 0.5,
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
     <DialogActions sx={{ px: 3, py: 2 }}>
  <Button onClick={onClose}>Cerrar</Button>
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

    
  );
};
