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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";

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
  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaCajero | null>(categoria ?? null);
  const [productos, setProductos] = useState<ProductoCajero[]>([]);

  const filteredPlatos =
    productos.filter((prod) =>
      (prod.nombre ?? "").toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  // ⭐ Ajuste para evitar unión de productos entre categorías
  useEffect(() => {
    // Limpiar los productos cuando cambie la categoría activa
    if (categoria) {
      setCategoriaActiva(categoria);
      setSearch(""); // Limpiar búsqueda cuando cambie la categoría
      setProductos(categoria.platos); // Cargar productos de la nueva categoría
    } else if (categorias.length > 0) {
      setCategoriaActiva(categorias[0]); // Seleccionar la primera categoría
      setProductos(categorias[0].platos); // Cargar productos de la primera categoría
    }
  }, [open, categoria, categorias]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, height: "90vh" } }}
    >
      {/* Header */}
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography fontWeight={700}>Seleccionar Productos</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ height: "100%", display: "flex", gap: 2 }}>
        {/* =============== CATEGORÍAS =============== */}
        <Box
          sx={{
            width: { xs: "25%", md: "20%" },
            borderRight: "1px solid #e0e0e0",
            overflowY: "auto",
            pr: 1,
          }}
        >
          <Typography fontWeight={600} mb={1}>
            Categorías
          </Typography>

          <List dense>
            {categorias.map((cat) => (
              <ListItemButton
                key={cat.id}
                selected={categoriaActiva?.id === cat.id}
                onClick={() => {
                  // 💥 Limpia la categoría activa para evitar mezcla
                  setCategoriaActiva(null);

                  // Limpia el buscador
                  setSearch("");

                  // Activa la nueva categoría sin mezclar
                  setTimeout(() => {
                    setCategoriaActiva(cat);
                    setProductos(cat.platos); // Cargar los productos de la nueva categoría
                  }, 0);
                }}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                }}
              >
                <ListItemText
                  primary={cat.categoria}
                  primaryTypographyProps={{
                    fontWeight: categoriaActiva?.id === cat.id ? 700 : 500,
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* ================== PRODUCTOS ================= */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {/* Nombre categoría */}
          <Typography fontWeight={700} fontSize={18} mb={1}>
            {categoriaActiva?.categoria ?? "Seleccione una categoría"}
          </Typography>

          {/* Cantidad */}
          <Typography variant="caption" color="text.secondary" mb={2} display="block">
            {categoriaActiva ? `${productos.length} productos disponibles` : ""}
          </Typography>

          {/* Buscador */}
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Grid productos */}
          <Grid container spacing={2}>
            {filteredPlatos.length > 0 ? (
              filteredPlatos.map((prod) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={prod.id}>
                  <Card
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      borderRadius: 2,
                      transition: "0.25s",
                      "&:hover": { boxShadow: 6, transform: "translateY(-4px)" },
                    }}
                  >
                    {prod.imagen_plato ? (
                      <CardMedia
                        component="img"
                        height={120}
                        image={prod.imagen_plato}
                        alt={prod.nombre}
                        sx={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        height={120}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        sx={{ background: "#f5f5f5" }}
                      >
                        <Avatar sx={{ width: 56, height: 56 }}>
                          {prod.nombre?.[0] ?? "P"}
                        </Avatar>
                      </Box>
                    )}

                    <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                      <Typography fontWeight={600} noWrap>
                        {prod.nombre}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" mt={0.5}>
                        ${Number(prod.precio_venta).toLocaleString()}
                      </Typography>

                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<AddShoppingCartIcon />}
                        sx={{ mt: "auto" }}
                        onClick={() =>
                          onAgregar({
                            ...prod,
                            precio_venta: Number(prod.precio_venta ?? 0),
                          })
                        }
                      >
                        Agregar
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography color="text.secondary">
                  No hay productos que coincidan con la búsqueda.
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
