import React, { useState } from "react";
import {
  Grid,
  Card,
  Typography,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import type { Mesa } from "./../../../../../types/cajero";
import { apidetallesMesa,actualiza_venta } from "../../../../../api/cajero";
import axios from "axios";

type Props = {
  id_negocio: bigint;
  mesas: Mesa[];
  onSelect?: (m: Mesa | null) => void;
};

export const Mesas: React.FC<Props> = ({ id_negocio, mesas, onSelect }) => {
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [mesaOrden, setMesaOrden] = useState<Mesa | null>(null);
  const [openOrden, setOpenOrden] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState<any | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState<number | "">("");
  const [habilitarPago, setHabilitarPago] = useState(false);

  console.log("measas",mesas);
  

  const getEstadoConfig = (estado: Mesa["estado"]) => {
    switch (estado) {
      case "Disponible":
        return { chipColor: "success" as const, iconBg: "#2e7d32", icon: <CheckCircleIcon /> };
      case "Ocupada":
        return { chipColor: "error" as const, iconBg: "#c62828", icon: <RestaurantIcon /> };
      case "Reservada":
        return { chipColor: "warning" as const, iconBg: "#ef6c00", icon: <EventSeatIcon /> };
      default:
        return { chipColor: "default" as const, iconBg: "#616161", icon: <EventSeatIcon /> };
    }
  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);

  const cambio = (Number(montoRecibido) || 0) - (detalleVenta?.venta_total || 0);
  const cambioSeguro = Math.max(cambio, 0);

  const handleClickMesa = async (mesa: Mesa) => {
    if (mesa.estado === "Disponible") {
      setMesaSeleccionada(prev => (prev?.id === mesa.id ? null : mesa));
      onSelect?.(mesa);
      return;
    }

    // Mesa Ocupada o Reservada
    setMesaOrden(mesa);
    setOpenOrden(true);
    setLoadingDetalle(true);
    try {
      const { data } = await apidetallesMesa({ id_negocio, mesaId: mesa.id });
      if (!data?.ok || !Array.isArray(data.result) || data.result.length === 0) {
        setDetalleVenta(null);
        setLoadingDetalle(false);
        return;
      }

      const venta = data.result[0];
      let productosParsed = [];
      try {
        productosParsed = typeof venta.productos === "string" ? JSON.parse(venta.productos) : venta.productos;
      } catch (error) {
        console.warn("Error parseando productos:", error);
      }

      setDetalleVenta({ ...venta, productos: productosParsed });
    } catch (err) {
      console.error("Error cargando detalles de mesa:", err);
      setDetalleVenta(null);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handlePagarFactura = () => {
    setHabilitarPago(true);
  };

  const handleFinalizarVenta = async () => {
    if (!detalleVenta) return;

    const payload = {
      id_venta: detalleVenta.id_pago,
      id_mesa:mesaOrden?.id,
      metodo_pago: metodoPago,
      monto_recibido: montoRecibido,
      cambio: cambioSeguro,
    };

    try {
        const { data } = await actualiza_venta(payload );
      // Reiniciar modal
      setDetalleVenta(null);
      setHabilitarPago(false);
      setMontoRecibido("");
      setMetodoPago("EFECTIVO");
      setOpenOrden(false);
      alert("✅ Venta registrada correctamente!");
    } catch (err) {
      console.error("Error al actualizar venta:", err);
      alert("❌ Error al registrar la venta.");
    }
  };

  return (
    <Box width="100%">
      <Typography fontWeight={700} mb={1} sx={{ fontSize: { xs: 16, md: 22 } }}>
        Mesas del Restaurante
      </Typography>

      <Grid container spacing={2}>
        {mesas.map(mesa => {
          const config = getEstadoConfig(mesa.estado);
          const isSelected = mesaSeleccionada?.id === mesa.id;
          return (
            <Grid item key={mesa.id} sx={{ flexBasis: "18%", maxWidth: "18%" }}>
              <Card
                onClick={() => handleClickMesa(mesa)}
                sx={{
                  position: "relative",
                  p: 2,
                  borderRadius: 4,
                  minHeight: 160,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: isSelected ? "linear-gradient(135deg, rgba(25,118,210,.08), rgba(25,118,210,.02))" : "#fff",
                  border: isSelected ? "2px solid" : "1px solid rgba(0,0,0,0.08)",
                  borderColor: isSelected ? "primary.main" : "rgba(0,0,0,0.08)",
                  boxShadow: isSelected ? "0 0 0 3px rgba(25,118,210,.25)" : "0 10px 25px rgba(0,0,0,0.08)",
                  transition: "all .25s ease",
                  "&:hover": { transform: { xs: "none", md: "translateY(-6px)" }, boxShadow: "0 14px 30px rgba(0,0,0,0.15)" },
                }}
              >
                <Chip label={mesa.estado} color={config.chipColor} size="small" sx={{ position: "absolute", top: 10, right: 10, fontWeight: 700, height: 24, px: 1.2, borderRadius: 2 }} />
                <Box sx={{ mt: 4, width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${config.iconBg})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                  {config.icon}
                </Box>
                <Box textAlign="center">
                  <Typography fontWeight={800} fontSize={14} noWrap>{mesa.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">Cap: · {mesa.capacidad} pers</Typography>
                </Box>
                <Box flexGrow={1} />
                {isSelected && <Chip label="Seleccionada" color="primary" size="small" sx={{ fontWeight: 700, borderRadius: 2, mb: 0.5 }} />}
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Modal Orden */}
      <Dialog open={openOrden} onClose={() => setOpenOrden(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          🧾 Orden - {mesaOrden?.nombre}
          <IconButton onClick={() => setOpenOrden(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#f8fafc" }}>
          {!loadingDetalle && detalleVenta && (
            <>
              <Box sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: "#fff", border: "1px solid #e5e7eb" }}>
                <Typography fontWeight={700}>{detalleVenta.nombre_completo}</Typography>
                <Typography variant="body2" color="text.secondary">Documento: {detalleVenta.identificacion_cliente}</Typography>
              </Box>

              <Typography fontWeight={600} mb={1}>Detalle de Productos</Typography>
              <Box sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e5e7eb", bgcolor: "#fff" }}>
                {detalleVenta.productos.map((prod: any) => (
                  <Box key={prod.id_producto} sx={{ display: "flex", justifyContent: "space-between", p: 1.5, gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                      <Box component="img" src={prod.url_imagen || "/no-image.png"} alt={prod.nombre} sx={{ width: 55, height: 55, objectFit: "cover", borderRadius: 2, border: "1px solid #e5e7eb" }} />
                      <Box>
                        <Typography fontWeight={500}>{prod.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">Cantidad: {prod.cantidad}</Typography>
                      </Box>
                    </Box>
                    <Typography fontWeight={600}>${Number(prod.subtotal).toLocaleString()}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 3, p: 2, borderRadius: 3, background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography fontWeight={600}>Total</Typography>
                <Typography variant="h6" fontWeight={700}>${Number(detalleVenta.venta_total).toLocaleString()}</Typography>
              </Box>

              <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }} onClick={handlePagarFactura}>Pagar Factura</Button>

              {habilitarPago && (
                <>
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

                  {metodoPago === "EFECTIVO" && (
                    <TextField
                      fullWidth
                      label="Monto recibido"
                      size="small"
                      type="text"
                      sx={{ mt: 2 }}
                      value={montoRecibido === "" ? "" : formatCOP(montoRecibido)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setMontoRecibido(raw === "" ? "" : Number(raw));
                      }}
                    />
                  )}

                  {metodoPago === "EFECTIVO" && (
                    <Typography sx={{ mt: 1, fontWeight: 800 }} color={cambio < 0 ? "error.main" : "success.main"}>
                      Cambio: {formatCOP(cambioSeguro)}
                    </Typography>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    sx={{ mt: 2 }}
                    startIcon={<AddShoppingCartIcon />}
                    disabled={metodoPago === "EFECTIVO" && cambio < 0}
                    onClick={handleFinalizarVenta}
                  >
                    Finalizar Venta
                  </Button>
                </>
              )}
            </>
          )}

          {!loadingDetalle && !detalleVenta && (
            <Box textAlign="center" py={3}>
              <Typography color="text.secondary">No hay venta activa para esta mesa.</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};