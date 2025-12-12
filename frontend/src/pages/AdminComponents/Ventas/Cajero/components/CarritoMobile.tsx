// CarritoMobile.tsx
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
  Paper,
  TextField,
  MenuItem,
} from "@mui/material";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PaymentIcon from "@mui/icons-material/Payment";
import { motion, AnimatePresence } from "framer-motion";
import { CrearClienteModal } from "./CrearClienteModal";
import { apibuscar_cliente } from "../../../../../api/cajero";

type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
  tipo: string;
};

type ProductoCarrito = {
  id: number;
  nombre: string;
  imagen: string;
  cantidad: number;
  precio_venta: number;
};

type Props = {
  carrito: ProductoCarrito[];
  onRemove: (id: number) => void;
  onAdd: (id: number) => void;
  onSub: (id: number) => void;
  onFinalizar: (
    idCliente: number | null,
    pago: {
      metodo_pago: string;
      monto_recibido: number;
      cambio: number;
    }
  ) => void;
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 160 : -160,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -160 : 160,
    opacity: 0,
  }),
};

export const CarritoMobile: React.FC<Props> = ({
  carrito,
  onRemove,
  onAdd,
  onSub,
  onFinalizar,
}) => {
  const [open, setOpen] = useState(false);
  // 0 = Cliente + Pedido, 1 = Pago
  const [tab, setTab] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);

  // CLIENTE
  const [clienteBuscado, setClienteBuscado] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [openCrearModal, setOpenCrearModal] = useState(false);

  // PAGO
  const total = carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);
  const [metodoPago, setMetodoPago] = useState<string>("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState<number>(0);
  const cambio = montoRecibido - total;

  // Buscar cliente (llamada a la API)
  const handleBuscar = async (term: string) => {
    setClienteBuscado(term);

    if (term.trim().length < 2) {
      setResultados([]);
      return;
    }

    try {
      const res = await apibuscar_cliente({ id_cliente: term });
      // ajustar según la forma en que tu API responde
      setResultados(res.data?.result ?? []);
    } catch (err) {
      console.error("Error buscar cliente:", err);
      setResultados([]);
    }
  };

  const seleccionarCliente = (cli: Cliente) => {
    setClienteSeleccionado(cli);
    setResultados([]);
    setClienteBuscado("");
  };

  // Cambiar tab con animación; dir = 1 (forward), -1 (back)
  const goToTab = (newTab: number) => {
    setDirection(newTab > tab ? 1 : -1);
    setTab(newTab);
  };

  // Manejo de "pan" (swipe) sobre el panel animado
  const handlePanEnd = (_: any, info: any) => {
    const offsetX = info.offset.x;
    if (offsetX < -80 && tab < 1) {
      goToTab(tab + 1);
    } else if (offsetX > 80 && tab > 0) {
      goToTab(tab - 1);
    }
  };

  // Finalizar: llamar al padre y resetear estados
  const handleFinalizar = () => {
    const pago = {
      metodo_pago: metodoPago,
      monto_recibido: montoRecibido,
      cambio: Math.max(cambio, 0),
    };

    onFinalizar(clienteSeleccionado ? clienteSeleccionado.id : null, pago);

    // Reset states
    setClienteSeleccionado(null);
    setClienteBuscado("");
    setResultados([]);
    setMetodoPago("EFECTIVO");
    setMontoRecibido(0);
    setOpen(false);
    setTab(0);
    setDirection(1);
  };

  return (
    <>
      {/* Floating FAB (visible solo en xs) */}
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 8000,
          display: { xs: "flex", md: "none" },
        }}
      >
        <Badge badgeContent={carrito.length} color="error">
          <Fab
            color="primary"
            onClick={() => {
              setOpen(true);
              setTab(0);
              setDirection(1);
            }}
            sx={{ boxShadow: 6 }}
          >
            <ShoppingCartIcon />
          </Fab>
        </Badge>
      </Box>

      {/* Drawer */}
    <Drawer
  anchor="bottom"
  open={open}
  onClose={() => setOpen(false)}
  sx={{
    //zIndex: 1800, // ⬅️ Más alto que cualquier modal/overlay normal
    "& .MuiBackdrop-root": {
      backgroundColor: "rgba(0,0,0,0.2)", // Más elegante
    },
  }}
  PaperProps={{
    sx: {
      zIndex: 1801, // ⬅️ El paper SIEMPRE debe estar por encima del backdrop
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      height: "87vh",
      p: 1.6,
      overflow: "hidden",
      boxShadow: "0px -4px 18px rgba(0,0,0,0.18)", // sombra superior profesional
      background: "#fff", // blanco limpio
    },
  }}
>

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography fontWeight="bold" fontSize={18}>
            Venta
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* tab buttons styled with icons */}
            <Button
              variant={tab === 0 ? "contained" : "outlined"}
              size="small"
              startIcon={<PersonIcon />}
              onClick={() => goToTab(0)}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 1.5,
                minWidth: 110,
              }}
            >
              Cliente & Pedido
            </Button>

            <Button
              variant={tab === 1 ? "contained" : "outlined"}
              size="small"
              startIcon={<PaymentIcon />}
              onClick={() => goToTab(1)}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 1.5,
                minWidth: 80,
              }}
            >
              Pago
            </Button>

            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 1 }} />

        {/* Animated container: handles swipe/pan */}
        <Box sx={{ position: "relative", height: "calc(85vh - 120px)" }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={tab}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ position: "absolute", width: "100%", top: 0, left: 0 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => handlePanEnd(_, info)}
              onPanEnd={(_, info) => handlePanEnd(_, info)}
            >
              {/* ----- TAB 0: CLIENTE + PEDIDO ----- */}
              {tab === 0 && (
                <Box sx={{ px: 0.5 }}>
                  {/* Buscar cliente */}
                  <TextField
                    fullWidth
                    placeholder="Buscar cliente por nombre o identificación..."
                    size="small"
                    value={clienteBuscado}
                    onChange={(e) => handleBuscar(e.target.value)}
                  />

                  {/* Resultados */}
                  {resultados.length > 0 && (
                    <Paper sx={{ mt: 1, maxHeight: 160, overflowY: "auto" }}>
                      {resultados.map((cli) => (
                        <Box
                          key={cli.id}
                          sx={{
                            p: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            cursor: "pointer",
                            "&:hover": { background: "#f4f7ff" },
                          }}
                          onClick={() => seleccionarCliente(cli)}
                        >
                          <PersonIcon sx={{ fontSize: 26, color: "primary.main" }} />

                          <Box>
                            <Typography fontSize={13} fontWeight={600}>
                              {cli.nombres} {cli.apellidos}
                            </Typography>

                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <BadgeIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption">{cli.identificacion}</Typography>
                            </Stack>
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                  )}

                  {/* Cliente seleccionado */}
                  {clienteSeleccionado && (
                    <Box
                      mt={2}
                      p={1.25}
                      sx={{
                        background: "#e8f5e9",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        border: "1px solid #c8e6c9",
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 30, color: "primary.main" }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography fontWeight={600} fontSize={13}>
                          {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
                        </Typography>

                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <BadgeIcon sx={{ fontSize: 14 }} />
                          <Typography fontSize={12}>{clienteSeleccionado.identificacion}</Typography>
                        </Stack>
                      </Box>

                      <CheckCircleIcon sx={{ fontSize: 28, color: "#2ecc71" }} />
                    </Box>
                  )}

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 2 }}
                    onClick={() => setOpenCrearModal(true)}
                  >
                    Crear Cliente / Empresa
                  </Button>

                  <Divider sx={{ my: 2 }} />

                  {/* Carrito list */}
                  <Box sx={{ maxHeight: "38vh", overflowY: "auto" }}>
                    {carrito.length === 0 ? (
                      <Typography align="center" color="text.secondary" mt={2}>
                        No hay productos.
                      </Typography>
                    ) : (
                      <List>
                        {carrito.map((item) => (
                          <ListItem
                            key={item.id}
                            secondaryAction={
                              <IconButton onClick={() => onRemove(item.id)}>
                                <DeleteIcon color="error" />
                              </IconButton>
                            }
                            sx={{ py: 1 }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                src={item.imagen}
                                variant="rounded"
                                sx={{ width: 48, height: 48 }}
                              />
                            </ListItemAvatar>

                            <ListItemText
                              primary={<Typography fontWeight={600}>{item.nombre}</Typography>}
                              secondary={
                                <Stack spacing={1}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => onSub(item.id)}
                                      sx={{ minWidth: 30 }}
                                    >
                                      -
                                    </Button>

                                    <Typography fontWeight="bold">{item.cantidad}</Typography>

                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => onAdd(item.id)}
                                      sx={{ minWidth: 30 }}
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

                  <Divider sx={{ my: 1 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight="bold">Total</Typography>
                    <Typography fontWeight="bold" color="success.main">
                      ${total.toLocaleString()}
                    </Typography>
                  </Stack>

                  {/* Quick button go to Pago */}
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => goToTab(1)}
                    disabled={carrito.length === 0}
                  >
                    Ir a Pago
                  </Button>
                </Box>
              )}

              {/* ----- TAB 1: PAGO ----- */}
              {tab === 1 && (
                <Box sx={{ px: 0.5 }}>
                  <Typography fontWeight={600} mb={1}>
                    Total a Pagar: ${total.toLocaleString()}
                  </Typography>

                  {/* MÉTODO PAGO */}
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Método de Pago"
                    value={metodoPago}
                    sx={{ mt: 1 }}
                    onChange={(e) => setMetodoPago(e.target.value)}
                  >
                       <MenuItem value="EFECTIVO">💵 Efectivo</MenuItem>
                  <MenuItem value="TRANSFERENCIA">🏦 Transferencia</MenuItem>
                  <MenuItem value="TARJETA">💳 Tarjeta</MenuItem>
                 <MenuItem value="PENDIENTE">⏳ Pendiente de Pago</MenuItem>
                  </TextField>

                  {/* MONTO RECIBIDO: mostrar vacío cuando es 0 */}
                  {metodoPago === "EFECTIVO" && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Monto recibido"
                      type="number"
                      sx={{ mt: 2 }}
                      value={montoRecibido === 0 ? "" : montoRecibido}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMontoRecibido(isNaN(val) ? 0 : val);
                      }}
                    />
                  )}

                  {/* CAMBIO */}
                  {metodoPago === "EFECTIVO" && (
                    <Typography
                      sx={{ mt: 1 }}
                      fontWeight="bold"
                      color={cambio < 0 ? "error.main" : "success.main"}
                    >
                      Cambio: ${Math.max(cambio, 0).toLocaleString()}
                    </Typography>
                  )}

                  {/* FINALIZAR */}
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    sx={{ mt: 3 }}
                    disabled={metodoPago === "EFECTIVO" && cambio < 0}
                    onClick={() => {
                      handleFinalizar();
                    }}
                  >
                    Finalizar Venta
                  </Button>
                </Box>
              )}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Drawer>

      {/* Crear Cliente Modal */}
      <CrearClienteModal
        open={openCrearModal}
        onClose={() => setOpenCrearModal(false)}
        onCreated={(nuevo) => {
          setClienteSeleccionado({ ...nuevo, id: Date.now() });
          setOpenCrearModal(false);
        }}
      />
    </>
  );
};
