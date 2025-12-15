import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Grid,
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
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";

import type { CategoriaCajero, ProductoCajero } from "../../../../../types/cajero";

type Props = {
  open: boolean;
  onClose: () => void;
  categoria?: CategoriaCajero | null;
  categorias: CategoriaCajero[];
  onAgregar: (p: ProductoCajero) => void;
};

export const ProductosCategoriaModal: React.FC<Props> = ({
  open,
  onClose,
  categoria,
  categorias,
  onAgregar,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] =
    useState<CategoriaCajero | null>(null);
  const [productos, setProductos] = useState<ProductoCajero[]>([]);

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

  const handleAgregar = (prod: ProductoCajero) => {
    onAgregar({
      ...prod,
      precio_venta: Number(prod.precio_venta ?? 0),
    });
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
          py: 2,
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

          <Typography variant="caption" color="text.secondary" mb={1} display="block">
            {filtered.length} productos disponibles
          </Typography>

          <TextField
            fullWidth
            size="small"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1 }} />,
            }}
            sx={{ mb: 2 }}
          />

          {/* ===== GRID RESPONSIVE ===== */}
          <Grid container spacing={2}>
            {filtered.map((prod) => (
              <Grid
                item
                key={prod.id}
                xs={6}     // 📱 2 por fila
                md={3}     // 💻 4 por fila
              >
                <Card
                  onClick={() => handleAgregar(prod)}
                  sx={{
                    cursor: "pointer",
                    height: "100%",
                    borderRadius: 3,
                    overflow: "hidden",
                    transition: "0.25s",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  {prod.imagen_plato ? (
                    <CardMedia
                      component="img"
                      height={140}
                      image={prod.imagen_plato}
                      alt={prod.nombre}
                    />
                  ) : (
                    <Box
                      height={140}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bgcolor="#f5f5f5"
                    >
                      <Avatar sx={{ width: 56, height: 56 }}>
                        {prod.nombre?.[0]}
                      </Avatar>
                    </Box>
                  )}

                  <CardContent sx={{ p: 1.5 }}>
                    <Typography fontWeight={700} fontSize={14} noWrap>
                      {prod.nombre}
                    </Typography>

                    <Typography
                      fontSize={13}
                      color="success.main"
                      fontWeight={700}
                    >
                      ${Number(prod.precio_venta).toLocaleString()}
                    </Typography>

                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<AddShoppingCartIcon />}
                      sx={{ mt: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAgregar(prod);
                      }}
                    >
                      Agregar
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>

      <Divider />

      {/* ================= FOOTER ================= */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
