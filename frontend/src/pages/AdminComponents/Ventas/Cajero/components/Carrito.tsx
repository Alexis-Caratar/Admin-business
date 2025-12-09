import React from "react";
import {
  Card,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Stack,
  Typography,
  Divider,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import type { ProductoCajero } from "../../../../../types/cajero";

type Props = {
  carrito: (ProductoCajero & { cantidad: number; precio_venta: number })[];
  onRemove: (id: number) => void;
  onAdd: (id: number) => void;
  onSub: (id: number) => void;
  onFinalizar: () => void;
};

export const Carrito: React.FC<Props> = ({ carrito, onRemove, onAdd, onSub, onFinalizar }) => {
  const total = carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);

  return (
    <div>
      <Typography variant="h6" fontWeight="bold" mb={1}>
        CARRITO VENTAS
      </Typography>

      <Card sx={{ p: 1, borderRadius: 2, boxShadow: 3 }}>
        {carrito.length === 0 ? (
          <Typography color="text.secondary" px={1} py={4} align="center">
            No hay productos.
          </Typography>
        ) : (
          <>
            <List dense>
              {carrito.map((item) => (
                <ListItem
                  key={item.id}
                  alignItems="flex-start"
                  secondaryAction={
                    <IconButton edge="end" onClick={() => onRemove(item.id)}>
                      <DeleteIcon color="error" fontSize="small" />
                    </IconButton>
                  }
                  sx={{
                    py: 1,
                    "&:hover": { backgroundColor: "#f5f5f5", borderRadius: 1 },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={item.imagen} // Suponiendo que el producto tiene campo 'imagen'
                      alt={item.nombre}
                      variant="rounded"
                      sx={{ width: 50, height: 50, mr: 1 }}
                    />
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Typography fontSize={14} fontWeight={600}>
                        {item.nombre}
                      </Typography>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onSub(item.id)}
                            sx={{ minWidth: 24, padding: "2px" }}
                          >
                            -
                          </Button>

                          <Typography fontSize={14} fontWeight={600}>
                            {item.cantidad}
                          </Typography>

                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onAdd(item.id)}
                            sx={{ minWidth: 24, padding: "2px" }}
                          >
                            +
                          </Button>

                          <Typography fontSize={13} color="text.secondary" ml={1}>
                            x ${item.precio_venta.toLocaleString()}
                          </Typography>
                        </Stack>

                        <Typography fontSize={13} fontWeight="bold" color="primary">
                          Subtotal: ${(item.cantidad * item.precio_venta).toLocaleString()}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight="bold" fontSize={16}>
                Total
              </Typography>
              <Typography fontWeight="bold" color="success.main" fontSize={16}>
                ${total.toLocaleString()}
              </Typography>
            </Stack>

            <Button
              fullWidth
              variant="contained"
              color="success"
              sx={{ mt: 2 }}
              startIcon={<AddShoppingCartIcon />}
              onClick={onFinalizar}
            >
              Finalizar Venta
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};
