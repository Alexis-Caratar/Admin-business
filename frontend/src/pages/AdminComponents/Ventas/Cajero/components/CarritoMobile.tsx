// CarritoMobile.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Stack,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  Divider,
  Paper,
  TextField,
  MenuItem,
  Chip,
  Card,
} from "@mui/material";

import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PaymentIcon from "@mui/icons-material/Payment";
import { motion, AnimatePresence } from "framer-motion";
import { CrearClienteModal } from "./CrearClienteModal";
import type { Mesa } from "../../../../../types/cajero"; // ajusta la ruta
import { Categorias } from "./Categorias";
import { apibuscar_cliente } from "../../../../../api/cajero";
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
} from "react-swipeable-list";

import "react-swipeable-list/dist/styles.css";

type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
  tipo: string;
};


type Props = {
  open: boolean;
  onClose: () => void;
  carrito: any[];
  onRemove: (id: number) => void;
  onClear: () => void;
  onAdd: (id: number) => void;
  onSub: (id: number) => void;
  onFinalizar: (
    idCliente: number | null,
    pago: {metodo_pago: string;monto_recibido: number | "";cambio: number;nota: string;}) => void;
  mesaSeleccionada: Mesa | null;
  onClearMesa: () => void;
  categorias: any[];
  onOpenCategoria: (categoria: any) => void;
  loadingCategorias: boolean;
  clienteSeleccionado: Cliente | null;
  setClienteSeleccionado: (c: Cliente | null) => void;
};

const slideVariants = {
  enter: (direction: number) => ({x: direction > 0 ? 160 : -160,opacity: 0,}),
  center: {x: 0,opacity: 1,},
  exit: (direction: number) => ({x: direction > 0 ? -160 : 160,opacity: 0,}),
};

export const CarritoMobile: React.FC<Props> = ({
  open,
  onClose,
  carrito,
  onRemove,
  onClear,
  onAdd,
  onSub,
  onFinalizar,
  mesaSeleccionada,
  onClearMesa,
  categorias,
  onOpenCategoria,
  loadingCategorias,
  clienteSeleccionado,
  setClienteSeleccionado
}) => {

  const [tab, setTab] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const [clienteBuscado, setClienteBuscado] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [openCrearModal, setOpenCrearModal] = useState(false);
  const [resetCliente, setResetCliente] = useState(0);
  const total = carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);
  const [metodoPago, setMetodoPago] = useState<string>("PENDIENTE");
  const [montoRecibido, setMontoRecibido] = useState<number>(0);
   const [nota, setNota] = useState("");
  const cambio = montoRecibido - total;
  const trailingActions = (id: number) => (
    <TrailingActions>
      <SwipeAction destructive onClick={() => onRemove(id)}>
        <Box
          sx={{
            height: "100%",
            background: "#e53935",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            borderRadius: 2,
          }}
        >
          <DeleteIcon />
        </Box>
      </SwipeAction>
    </TrailingActions>
  );



 
  useEffect(() => {
  if (carrito.length === 0) {
    setClienteSeleccionado(null);
    setMetodoPago("PENDIENTE");
    setMontoRecibido(0);
  }
}, [carrito]);


useEffect(() => {
  if (open) {
    setTab(0);
    setDirection(1);
  }
}, [open]);

useEffect(() => {
  if (open) {
    setTab(0);
    setDirection(1);
  }
}, [open]);
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
    if (carrito.length === 0) return;

    const pago = {
      metodo_pago: metodoPago,
      monto_recibido: montoRecibido,
      cambio: Math.max(cambio, 0),
      nota:nota
    };

    onFinalizar(clienteSeleccionado ? clienteSeleccionado.id : null, pago);
    onClear();
    setClienteSeleccionado(null);
    setClienteBuscado("");
    setResultados([]);
    setResetCliente(prev => prev + 1);
    setMetodoPago("EFECTIVO");
    setMontoRecibido(0);
    onClose();
    setTab(0);
    setDirection(1);
    setNota("");


  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <>

      {/* Drawer */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: false
        }}
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

        {/* CARRITO */}

        <Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <AddShoppingCartIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Carrito de Ventas
              </Typography>
            </Stack>

            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>

            {carrito.length > 0 && (
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={onClear}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600
                }}
              >
                Vaciar carrito
              </Button>
            )}
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

    {/* Contenedor Chip + X */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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

      <IconButton
        size="small"
        onClick={onClearMesa}
        sx={{
          bgcolor: "#f5f5f5",
          "&:hover": { bgcolor: "#e0e0e0" },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  </Card>
)}

          <Stack direction="row" spacing={1} alignItems="center" width="100%">
            <Button
              variant={tab === 0 ? "contained" : "outlined"}
              startIcon={<PersonIcon />}
              onClick={() => goToTab(0)}
              sx={{
                flex: 1,
                textTransform: "none",
                borderRadius: 2,
                py: 1,
                fontWeight: 500,
              }}
            >
              Cliente & Pedido
            </Button>

            <Button
              variant={tab === 1 ? "contained" : "outlined"}
              startIcon={<PaymentIcon />}
              onClick={() => goToTab(1)}
              sx={{
                flex: 1,
                textTransform: "none",
                borderRadius: 2,
                py: 1,
                fontWeight: 400,
              }}
            >
              Pago
            </Button>
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
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              style={{ position: "absolute", width: "100%", top: 0, left: 0 }}
              drag={tab === 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (tab === 1) handlePanEnd(_, info);
              }}
            >
              {/* ----- TAB 0: CLIENTE + PEDIDO ----- */}
              {tab === 0 && (
                <Box sx={{ px: 0.5 }}>
                  {/* Buscar cliente */}
                  <TextField
                      key={resetCliente}
                      fullWidth
                      placeholder="Buscar por identificación o nombres"
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
                  <Box sx={{ maxHeight: "38vh", overflowY: "auto", scrollbarWidth: "thin" }}>
                    {carrito.length === 0 ? (
                      <Box>
                        <Typography color="text.secondary" px={1} py={4} align="center">
                          No hay productos.
                        </Typography>
                        <Categorias
                          categorias={categorias}
                          loading={loadingCategorias}
                          onOpen={onOpenCategoria}
                          modo="carrito"
                        />
                      </Box>
                    ) : (
                      <SwipeableList threshold={0.25}>
                        {carrito.map((item) => (
                          <SwipeableListItem
                            key={item.id}
                            trailingActions={trailingActions(item.id)}
                          >
                            <ListItem sx={{ py: 0 }}>

                              <ListItemAvatar>
                                <Avatar
                                  src={item.imagenes[0]??undefined}
                                  variant="rounded"
                                  sx={{ width: 48, height: 48 }}
                                />
                              </ListItemAvatar>

                              <ListItemText
                                primary={<Typography fontWeight={600}>{item.nombre}</Typography>}
                                secondary={
                                  <Stack spacing={0}>
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
                          </SwipeableListItem>
                        ))}
                        
                      </SwipeableList>
                    )}
                  </Box>
                {carrito.length > 0 && (
                  <>
                  
                  <Box
                    sx={{

                      position: "sticky",
                      bottom: 0,
                      background: "#fff",
                      borderTop: "1px solid #eee",
                      pt: 1,
                      pb: 1,
                      mt:1,
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Ej: sin cebolla, término medio..."
                      onChange={(e) => setNota(e.target.value)}
                      sx={{
                        
                        "& .MuiInputBase-root": {
                          fontSize: 12,
                          borderRadius: 2,
                        },
                      }}
                    />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight="bold">Total</Typography>
                      <Typography fontWeight="bold" color="success.main">
                        {formatCOP(total)}
                      </Typography>
                    </Stack>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => goToTab(1)}
                      disabled={carrito.length === 0}
                      sx={{
                        mt: 1.2,
                        py: 1.4,
                        borderRadius: 3,
                        fontWeight: "bold",
                        fontSize: 15,
                        letterSpacing: 0.5,
                        textTransform: "none",
                        background: "linear-gradient(135deg, #09a58e, #2e7d32)",
                        boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
                        transition: "all .25s ease",
                        "&:hover": {
                          background: "linear-gradient(135deg, #0bb79d, #388e3c)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                        },
                        "&:active": {
                          transform: "scale(0.97)",
                        },
                        "&.Mui-disabled": {
                          background: "#cfcfcf",
                          color: "#888",
                          boxShadow: "none",
                        },
                      }}
                    >
                      Ir a Pago
                    </Button>
                  </Box>
                  </>
     )}
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
                    <MenuItem value="PENDIENTE">⏳ Pendiente de Pago</MenuItem>
                    <MenuItem value="EFECTIVO">💵 Efectivo</MenuItem>
                    <MenuItem value="TRANSFERENCIA">🔁 Transferencia</MenuItem>
                    <MenuItem value="TARJETA">💳 Tarjeta</MenuItem>
                    <MenuItem value="NEQUI">📲 Nequi</MenuItem>
                    <MenuItem value="DAVIPLATA">📲 DaviPlata</MenuItem>
                    <MenuItem value="TIQUERERA">🎟️ Tiquetera</MenuItem>
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
                    startIcon={<CheckCircleIcon />}
                    sx={{
                      mt: 3,
                      py: 1.5,
                      borderRadius: 3,
                      fontWeight: "bold",
                      fontSize: 16,
                      letterSpacing: 0.6,
                      textTransform: "none",
                      background: "linear-gradient(135deg, #09a58e, #2e7d32)",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                      transition: "all .25s ease",
                      "&:hover": {
                        background: "linear-gradient(135deg, #0bb79d, #388e3c)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 24px rgba(0,0,0,0.22)",
                      },
                      "&:active": {
                        transform: "scale(0.97)",
                      },
                      "&.Mui-disabled": {
                        background: "#d6d6d6",
                        color: "#888",
                        boxShadow: "none",
                      },
                    }}
                    disabled={
                      carrito.length === 0 ||
                      (metodoPago === "EFECTIVO" && cambio < 0)
                    }
                    onClick={handleFinalizar}
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
        onCreated={(nuevo:any) => {
          setClienteSeleccionado({ ...nuevo, id: Date.now() });
          setOpenCrearModal(false);
        }}
      />
    </>
  );
};
