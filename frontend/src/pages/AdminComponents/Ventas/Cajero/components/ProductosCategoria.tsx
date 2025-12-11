import React, { useState } from "react";
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
  Stack,
  Typography,
  Box,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import type { CategoriaCajero, ProductoCajero } from "../../../../../types/cajero";

type Props = {
  open: boolean;
  onClose: () => void;
  categoria?: CategoriaCajero | null;
  onAgregar: (p: ProductoCajero) => void;
};

export const ProductosCategoriaModal: React.FC<Props> = ({ open, onClose, categoria, onAgregar }) => {
  const [search, setSearch] = useState("");
  
  // Filtrar productos por nombre
  const filteredPlatos = categoria?.platos?.filter((prod) =>
    (prod.nombre ?? "").toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* Título */}
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography fontWeight={600}>{categoria?.categoria}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {categoria ? `${categoria.platos?.length ?? 0} platos disponibles` : ""}
          </Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Buscador */}
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Buscar plato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Grid de productos */}
        <Grid container spacing={2}>
          {filteredPlatos.length > 0 ? (
            filteredPlatos.map((prod) => (
              <Grid item xs={12} sm={6} md={4} key={prod.id}>
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
                  {/* Imagen */}
                  {prod.imagen_plato ? (
                    <CardMedia
                      component="img"
                      height={140}
                      image={prod.imagen_plato }
                      alt={prod.nombre}
                      sx={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Box height={140} display="flex" alignItems="center" justifyContent="center" sx={{ background: "#fafafa" }}>
                      <Avatar sx={{ width: 56, height: 56 }}>{prod.nombre?.[0] ?? "P"}</Avatar>
                    </Box>
                  )}

                  {/* Info y botón */}
                  <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={600} noWrap>{prod.nombre}</Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        ${Number(prod.precio_venta ).toLocaleString()}
                      </Typography>
                    </Stack>

                    <Box mt="auto">
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<AddShoppingCartIcon />}
                        onClick={() => onAgregar({ ...prod, precio_venta: Number(prod.precio_venta ?? 0) })}
                      >
                        Agregar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography color="text.secondary">No hay platos que coincidan con la búsqueda.</Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
