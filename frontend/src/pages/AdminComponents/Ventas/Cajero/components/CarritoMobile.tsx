import React, { useState } from "react";
import {
  Box,
  Drawer,
  Fab,
  Badge,
  Typography,
  IconButton,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  Divider,
} from "@mui/material";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";

import type { ProductoCajero } from "../../../../../types/cajero";

type Props = {
  carrito: (ProductoCajero & { cantidad: number; precio_venta: number })[];
  onRemove: (id: number) => void;
  onAdd: (id: number) => void;
  onSub: (id: number) => void;
  onFinalizar: () => void;
};

export const CarritoMobile: React.FC<Props> = ({
  carrito,
  onRemove,
  onAdd,
  onSub,
  onFinalizar,
}) => {
  const [open, setOpen] = useState(false);

  const total = carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);

  return (
    <>
      {/* --- Floating FAB (solo en móviles) --- */}
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 5000,
          display: { xs: "flex", md: "none" },
        }}
      >
        <Badge badgeContent={carrito.length} color="error">
          <Fab
            color="primary"
            onClick={() => setOpen(true)}
            sx={{ boxShadow: 6 }}
          >
            <ShoppingCartIcon />
          </Fab>
        </Badge>
      </Box>

      {/* --- Drawer inferior tipo WhatsApp --- */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: "80vh",
            p: 2,
          },
        }}
      >
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight="bold">
            Carrito
          </Typography>

          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider />

        {/* Lista de productos */}
        <Box sx={{ overflowY: "auto", flex: 1, mt: 1 }}>
          {carrito.length === 0 ? (
            <Typography color="text.secondary" align="center" mt={4}>
              No hay productos agregados.
            </Typography>
          ) : (
            <List>
              {carrito.map((item) => (
                <ListItem
                  key={item.id}
                  alignItems="flex-start"
                  sx={{ py: 1 }}
                  secondaryAction={
                    <IconButton onClick={() => onRemove(item.id)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      src={item.imagen}
                      alt={item.nombre}
                      variant="rounded"
                      sx={{ width: 48, height: 48, mr: 1 }}
                    />
                  </ListItemAvatar>

                  <ListItemText
                    primary={<Typography fontWeight={600}>{item.nombre}</Typography>}
                    secondary={
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 30 }}
                            onClick={() => onSub(item.id)}
                          >
                            -
                          </Button>

                          <Typography fontWeight="bold">{item.cantidad}</Typography>

                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 30 }}
                            onClick={() => onAdd(item.id)}
                          >
                            +
                          </Button>
                        </Stack>

                        <Typography color="primary">
                          Subtotal: ${(item.precio_venta * item.cantidad).toLocaleString()}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Divider sx={{ my: 1 }} />

        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography fontWeight="bold">Total</Typography>
          <Typography fontWeight="bold" color="success.main">
            ${total.toLocaleString()}
          </Typography>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          color="success"
          onClick={onFinalizar}
          disabled={carrito.length === 0}
        >
          Finalizar Venta
        </Button>
      </Drawer>
    </>
  );
};
