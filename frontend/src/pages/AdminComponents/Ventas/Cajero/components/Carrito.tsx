import React, { useState } from "react";
import {
  Card,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Stack,
  Typography,
  Divider,
  Button,
  TextField,
  Box,
  Paper,
  MenuItem,
  Chip,
} from "@mui/material";

import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from "react-swipeable-list";

import "react-swipeable-list/dist/styles.css";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ShoppingBasketOutlinedIcon from "@mui/icons-material/ShoppingBasketOutlined";
import { apibuscar_cliente } from "../../../../../api/cajero";

// Modal para crear cliente
import { CrearClienteModal } from "./CrearClienteModal";
import type{ Mesa } from "../../../../../types/cajero"; // ajusta la ruta

type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
  tipo: string;
};


type Props = {
  carrito: any[];
  onRemove: (id: number) => void;
  onAdd: (id: number) => void;
  onSub: (id: number) => void;
  onFinalizar: (
    idCliente: number | null,
    pago: {
      metodo_pago: string;
      monto_recibido: number | "";
      cambio: number;
    }
  ) => void;
  mesaSeleccionada: Mesa | null;
};


export const Carrito: React.FC<Props> = ({
  carrito,
  onRemove,
  onAdd,
  onSub,
  onFinalizar,
  mesaSeleccionada,
}) => {

  const [clienteBuscado, setClienteBuscado] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);

  const [openCrearModal, setOpenCrearModal] = useState(false);

  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState<number | "">("");

  const total = carrito.reduce(
    (acc, v) => acc + v.precio_venta * v.cantidad,
    0
  );

  const monto = Number(montoRecibido) || 0;
  const cambio = monto - total;

  const cambioSeguro = Math.max(cambio, 0);


  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);


  const handleBuscar = async (term: string) => {
    setClienteBuscado(term);

    if (term.trim().length < 2) {
      setResultados([]);
      return;
    }

    const res = await apibuscar_cliente({ id_cliente: term });
    setResultados(res.data.result);
  };

  const seleccionarCliente = (cli: Cliente) => {
    setClienteSeleccionado(cli);
    setResultados([]);
    setClienteBuscado("");
  };

  const trailingActions = (id: number) => (
    <TrailingActions>
      <SwipeAction destructive onClick={() => onRemove(id)}>
        <div
          style={{
            background: "#d32f2f",
            color: "white",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            height: "100%",
            fontWeight: "bold",
          }}
        >
          Eliminar
        </div>
      </SwipeAction>
    </TrailingActions>
  );

  return (
    <Box>
      <div>
        {/* CLIENTE */}
        <Card sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <PersonIcon color="primary" />
            <Typography fontWeight={700} fontSize={16}>
              Cliente
            </Typography>
          </Stack>

          {/* BUSCADOR */}
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar cliente..."
            value={clienteBuscado}
            onChange={(e) => handleBuscar(e.target.value)}
            InputProps={{
              startAdornment: (
                <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
          />


          {/* RESULTADOS */}
          {resultados.length > 0 && (
            <Paper sx={{ mt: 1, maxHeight: 150, overflowY: "auto" }}>
              {resultados.map((cli) => (
                <Box
                  key={cli.id}
                  sx={{
                    p: 1,
                    cursor: "pointer",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    "&:hover": { backgroundColor: "#f0f4ff" },
                  }}
                  onClick={() => seleccionarCliente(cli)}
                >
                  <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                    {cli.nombres[0]}
                  </Avatar>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontWeight={600} fontSize={11}>
                      {cli.nombres} {cli.apellidos}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <BadgeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">
                        {cli.identificacion}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}

          {/* CLIENTE SELECCIONADO */}
          {clienteSeleccionado && (
            <Box
              mt={2}
              p={1.5}
              sx={{
                background: "linear-gradient(135deg, #e8f5e9, #f1fff5)",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                border: "1px solid #c8e6c9",
              }}
            >

              <PersonIcon sx={{ fontSize: 30, color: "primary.main" }} />

              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={600} fontSize={12}>
                  {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <BadgeIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {clienteSeleccionado.identificacion}
                  </Typography>
                </Box>
              </Box>

              <CheckCircleIcon sx={{ fontSize: 30, color: "#2ecc71" }} />
            </Box>
          )}

          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setOpenCrearModal(true)}
          >
            Crear Cliente / Empresa
          </Button>
        </Card>

        {/* MODAL CREAR CLIENTE */}
        <CrearClienteModal
          open={openCrearModal}
          onClose={() => setOpenCrearModal(false)}
          onCreated={(nuevo) => {
            const clienteFinal: Cliente = {
              ...nuevo,
              id: Date.now(),
            };

            setClienteSeleccionado(clienteFinal);
            setOpenCrearModal(false);
          }}
        />

        {/* CARRITO */}
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <AddShoppingCartIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Carrito de Ventas
          </Typography>
        </Stack>

     {mesaSeleccionada && (
  <Card
    sx={{
      mb: 2,
      p: 1.5,
      borderRadius: 2,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      background: "linear-gradient(135deg, #e3f2fd, #f1f8ff)",
      border: "1px solid #bbdefb",
    }}
  >
    <Avatar
      sx={{
        bgcolor: "primary.main",
        width: 42,
        height: 42,
      }}
    >
      🪑
    </Avatar>

    <Box sx={{ flexGrow: 1 }}>
      <Typography fontWeight={700} fontSize={13}>
        Mesa seleccionada
      </Typography>
      <Typography fontSize={14} color="text.secondary">
        {mesaSeleccionada.nombre} · Capacidad {mesaSeleccionada.capacidad}
      </Typography>
    </Box>

    <Chip
      label={mesaSeleccionada.estado}
      color={
        mesaSeleccionada.estado === "Disponible"
          ? "success"
          : mesaSeleccionada.estado === "Ocupada"
          ? "error"
          : "warning"
      }
      size="small"
      sx={{ fontWeight: 600 }}
    />
  </Card>
)}


        <Card sx={{ p: 1, borderRadius: 2, boxShadow: 3 }}>
          {carrito.length === 0 ? (
            <Typography color="text.secondary" px={1} py={4} align="center">
              No hay productos.
            </Typography>
          ) : (
            <>

       

<Typography
  color="text.secondary"
  align="left"
  sx={{ display: "flex", alignItems: "center", gap: 1 }}
>
  <ShoppingBasketOutlinedIcon fontSize="small" />
  Productos
</Typography>   
            <SwipeableList>
                {carrito.map((item) => (
                  <SwipeableListItem
                    key={item.id}
                    trailingActions={trailingActions(item.id)}
                  >
                    <ListItem
                      sx={{
                        py: 1,
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                          borderRadius: 1,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={item.imagen}
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
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
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

                              <Typography fontSize={13} color="text.secondary">
                                💲 {item.precio_venta.toLocaleString()}
                              </Typography>

                            </Stack>

                            <Typography
                              fontSize={13}
                              fontWeight="bold"
                              color="primary"
                            >
                              Subtotal: $
                              {(item.cantidad * item.precio_venta).toLocaleString()}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  </SwipeableListItem>
                ))}
              </SwipeableList>

              <Divider sx={{ my: 1 }} />

              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight="bold" fontSize={16}>
                  Total
                </Typography>

                <Typography fontWeight="bold" color="success.main" fontSize={16}>
                  ${total.toLocaleString()}
                </Typography>
              </Stack>

              {/* MÉTODO DE PAGO */}
              <TextField
                select
                fullWidth
                label="Método de Pago"
                size="small"
                sx={{ mt: 2 }}
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <MenuItem value="EFECTIVO">💵 Efectivo</MenuItem>
                <MenuItem value="TRANSFERENCIA">🏦 Transferencia</MenuItem>
                <MenuItem value="TARJETA">💳 Tarjeta</MenuItem>
                <MenuItem value="PENDIENTE">⏳ Pendiente de Pago</MenuItem>
              </TextField>

              {/* MONTO RECIBIDO */}
              {metodoPago === "EFECTIVO" && (

                <TextField
                  fullWidth
                  label="Monto recibido"
                  size="small"
                  type="text"
                  sx={{ mt: 2 }}
                  value={montoRecibido === "" ? "" : formatCOP(montoRecibido)}
                  onChange={(e) => {
                    // Limpia todo excepto números
                    const raw = e.target.value.replace(/\D/g, "");
                    setMontoRecibido(raw === "" ? "" : Number(raw));
                  }}
                  InputProps={{
                    startAdornment: (
                      <Typography sx={{ mr: 1, fontWeight: 600 }}>

                      </Typography>
                    ),
                  }}
                />


              )}
              {montoRecibido !== "" && cambio < 0 && (
                <Typography color="error" variant="caption">
                  El monto recibido es menor al total
                </Typography>
              )}

              {/* CAMBIO */}
              {metodoPago === "EFECTIVO" && (
                <Typography
                  sx={{ mt: 1 }}
                  fontWeight={800}
                  color={cambio < 0 ? "error.main" : "success.main"}
                >
                  Cambio: {formatCOP(cambioSeguro)}
                </Typography>

              )}

              {/* FINALIZAR */}
              <Button
                fullWidth
                variant="contained"
                color="success"
                sx={{ mt: 2 }}
                startIcon={<AddShoppingCartIcon />}
                disabled={metodoPago === "EFECTIVO" && cambio < 0}
                onClick={() => {
                  onFinalizar(clienteSeleccionado?.id ?? null, {
                    metodo_pago: metodoPago,
                    monto_recibido: montoRecibido,
                    cambio: Math.max(cambio, 0),
                  });

                  setClienteSeleccionado(null);
                  setClienteBuscado("");
                  setResultados([]);
                  setMetodoPago("EFECTIVO");
                  setMontoRecibido(0);
                }}
              >
                Finalizar Venta
              </Button>


            </>
          )}
        </Card>
      </div>
    </Box>



  );
};
