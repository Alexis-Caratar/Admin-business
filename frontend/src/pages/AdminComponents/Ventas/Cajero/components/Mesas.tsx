import React, { useState } from "react";
import {
  Card,
  Typography,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import type { Mesa } from "./../../../../../types/cajero";
import { apidetallesMesa, actualiza_venta, liberar_mesa } from "../../../../../api/cajero";
import Swal from "sweetalert2";
import ChairIcon from "@mui/icons-material/Chair";

type Props = {
  idUsuario: number|null;
  id_negocio: number|null;
  mesas: Mesa[];
  mesaSeleccionada: Mesa | null;
  onSelect?: (m: Mesa | null) => void;
};

export const Mesas: React.FC<Props> = ({ idUsuario, id_negocio, mesas,mesaSeleccionada, onSelect }) => {
  const [mesaOrden, setMesaOrden] = useState<Mesa | null>(null);
  const [openOrden, setOpenOrden] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState<any | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState<number | "">("");
  const [, setHabilitarPago] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const getEstadoConfig = (estado: Mesa["estado"]) => {
    switch (estado) {
      case "Disponible":
        return { chipColor: "linear-gradient(135deg, #079150, #006837)" as const, iconBg: "#1196b7", icon: <ChairIcon /> };
      case "Ocupada":
        return { chipColor: "linear-gradient(135deg, #fe3e00, #cd3706)" as const, iconBg: "#221d1d", icon: <RestaurantIcon /> };
      case "Reservada":
        return { chipColor: "linear-gradient(135deg, #f7971e, #ffd200)" as const, iconBg: "#ef6c00", icon: <EventSeatIcon /> };
      default:
        return { chipColor: "#616161" as const, iconBg: "#616161", icon: <EventSeatIcon /> };
    }
  };

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);

  const cambio = (Number(montoRecibido) || 0) - (detalleVenta?.venta_total || 0);
  const cambioSeguro = Math.max(cambio, 0);

  const handleClickMesa = async (mesa: Mesa) => {
    if (mesa.estado === "Disponible") {
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


  const handleLiberarMesa = async () => {
    try {
      // Aquí llamas tu API para liberar la mesa
      await liberar_mesa(mesaOrden?.id, id_negocio);

            Swal.fire({
        icon: "success",
        title: "Mesa liberada",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2800,
        timerProgressBar: true
      });
      onSelect?.(null);
      setOpenOrden(false);
      setDetalleVenta(null);
    } catch (error) {
      console.error(error);
      alert("❌ Error al liberar mesa");
    }
  };

  const handleFinalizarVenta = async () => {
    if (!detalleVenta) return;

    const payload = {
      idUsuario: idUsuario,
      id_negocio: id_negocio,
      id_venta: detalleVenta.id_pago,
      id_mesa: mesaOrden?.id,
      metodo_pago: metodoPago,
      monto_recibido: montoRecibido,
      cambio: cambioSeguro,
    };

    try {
      const { data } = await actualiza_venta(payload);
      // Reiniciar modal
        if (data?.ok) {
      // 🔥 limpiar mesa seleccionada
      onSelect?.(null);
    }
      setDetalleVenta(null);
      setHabilitarPago(false);
      setMontoRecibido("");
      setMetodoPago("EFECTIVO");
      setOpenOrden(false);

      Swal.fire({
        title: "Venta registrada",
        html: `
        <b style="font-size:18px;color:#16a34a">
          ✅ Operación exitosa
        </b>
        <br/><br/>
        La venta se guardó correctamente
    `,
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#16a34a",
        showClass: {
          popup: "animate__animated animate__zoomIn"
        },
        hideClass: {
          popup: "animate__animated animate__zoomOut"
        }
      });

    } catch (err) {
      console.error("Error al actualizar venta:", err);

      Swal.fire({
        icon: "error",
        title: "Error al registrar la venta",
        text: "Ocurrió un problema al guardar la venta. Intente nuevamente.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#d32f2f",
        background: "#ffffff",
        color: "#1e293b"
      });
    }
  };

  return (
  <Box width="100%">
  <Typography fontWeight={700} mb={1} sx={{ fontSize: { xs: 16, md: 22 } }}>
    Mesas del Restaurante
  </Typography>

  {/* MESAS EN FLEXBOX */}
  <Box
    sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: 2, // espacio entre cards
    }}
  >
    {mesas.map((mesa) => {
      const config = getEstadoConfig(mesa.estado);
      const isSelected = mesaSeleccionada?.id === mesa.id;

      return (
        <Box
          key={mesa.id}
          sx={{
            flex: { xs: "1 1 45%", sm: "1 1 150px" },
            maxWidth: { xs: "45%", sm: 320 },
          }}
        >
          <Card
            onClick={() => handleClickMesa(mesa)}
            sx={{
              position: "relative",
              p: { xs: 2, sm: 5 },
              borderRadius: 3,
              minHeight: { xs: 130, sm: 160 },
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: isSelected
                ? "linear-gradient(135deg, rgba(25,118,210,.08), rgba(25,118,210,.02))"
                : "#fff",
              border: isSelected ? "2px solid" : "1px solid rgba(0,0,0,0.08)",
              borderColor: isSelected ? "primary.main" : "rgba(0,0,0,0.08)",
              boxShadow: isSelected
                ? "0 0 0 3px rgba(25,118,210,.25)"
                : { xs: "0 4px 12px rgba(0,0,0,0.08)", md: "0 10px 25px rgba(0,0,0,0.08)" },
              transition: "all .25s ease",
              "&:hover": {
                transform: { xs: "none", md: "translateY(-6px)" },
              },
            }}
          >
            <Chip
              label={mesa.estado}
              size="small"
              sx={{
                position: "absolute",
                top: 11,
                right: 20,
                fontWeight: 700,
                height: 24,
                px: 3,
                borderRadius: 2,
                background: config.chipColor,
                color: "#fff",
              }}
            />

            <Box
              sx={{
                mt: { xs: 3, sm: 4 },
                width: { xs: 38, sm: 48 },
                height: { xs: 38, sm: 48 },
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${config.iconBg})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
              }}
            >
              {config.icon}
            </Box>

            <Box textAlign="center">
              <Typography fontWeight={800} sx={{ fontSize: { xs: 12, sm: 18 } }} noWrap>
                {mesa.nombre}
              </Typography>
              <Typography sx={{ fontSize: { xs: 12, sm: 15 } }} color="text.secondary">
                Cap: {mesa.capacidad} pers
              </Typography>
            </Box>

            <Box flexGrow={0} />

            {isSelected && (
              <Chip
                label={isMobile ? "select.." : "Seleccionada"}
                color="primary"
                size="small"
                sx={{ fontWeight: 700, borderRadius: 2, mb: 0.1 }}
              />
            )}
          </Card>
        </Box>
      );
    })}
  </Box>


      {/* Modal Orden */}
      <Dialog open={openOrden} onClose={() => setOpenOrden(false)} maxWidth="sm" fullWidth>
     <DialogTitle
          sx={{
            fontWeight: 700,
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 6, // espacio para el botón cerrar
          }}
        >
          {/* IZQUIERDA */}
          <Box>
            <Typography fontWeight={700} fontSize={18}>
              🧾 Orden - {mesaOrden?.nombre}
            </Typography>

            <Typography fontSize={12} color="text.secondary">
              Estado de la factura
            </Typography>
          </Box>

          {/* ESTADO PRO */}
          <Box
            sx={{
              px: 2,
              py: 0.7,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 0.5,
              display: "flex",
              alignItems: "center",
              gap: 1,

              background:
                detalleVenta?.estado_pago_bool === true
                  ? "linear-gradient(135deg,#16a34a,#22c55e)"
                  : detalleVenta?.estado_pago_bool === false
                  ? "linear-gradient(135deg,#dc2626,#ef4444)"
                  : "#e5e7eb",

              color:
                detalleVenta?.estado_pago_bool == null
                  ? "#374151"
                  : "#fff",

              boxShadow:
                detalleVenta?.estado_pago_bool != null
                  ? "0 4px 12px rgba(0,0,0,0.25)"
                  : "none",
            }}
          >
            {detalleVenta?.estado_pago_bool === true && "✔ FACTURA PAGADA"}
            {detalleVenta?.estado_pago_bool === false && " FACTURA PENDIENTE PAGO"}
            {detalleVenta?.estado_pago_bool == null && "SIN VENTA"}
          </Box>

          {/* BOTÓN CERRAR */}
          <IconButton
            onClick={() => setOpenOrden(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: "#f8fafc" }}>
          {!loadingDetalle && detalleVenta && (
            <>
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 3,
                  bgcolor: "#fff",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                {/* Cliente */}
                <Box>
                  <Typography fontWeight={700}>
                    {detalleVenta.nombre_completo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Documento: {detalleVenta.identificacion_cliente}
                  </Typography>
                </Box>

                {/* Numero factura */}
                <Box
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.6, sm: 0.8 },
                    borderRadius: { xs: 1.5, sm: 2 },
                    background: "linear-gradient(135deg,#1e293b,#111827)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
                    letterSpacing: { xs: 0.5, sm: 1 },
                    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                    textAlign: "center",
                    maxWidth: "100%",
                    whiteSpace: "nowrap",
                  }}
                >
                  {detalleVenta.numero_factura}
                </Box>
              </Box>

              <Typography fontWeight={600} mb={1}>Detalle de Productos</Typography>
              <Box sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e5e7eb", bgcolor: "#fff" }}>
                {detalleVenta.productos.map((prod: any) => (
                  <Box key={prod.id_producto} sx={{ display: "flex", justifyContent: "space-between", p: 0.8, gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                      <Box component="img" src={prod.url_imagen || "/no-image.png"} alt={prod.nombre} sx={{ width: 30, height: 30, objectFit: "cover", borderRadius: 2, border: "1px solid #e5e7eb" }} />
                      <Box>
                        <Typography fontWeight={500}>{prod.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">Cantidad: {prod.cantidad}</Typography>
                      </Box>
                    </Box>
                    <Typography fontWeight={600}>${Number(prod.subtotal).toLocaleString()}</Typography>
                  </Box>
                ))}
              </Box>

              {detalleVenta.nota && (
                    <Box
                      sx={{
                        p: 2,                        // padding interno
                        mt: 2,                       // margen superior
                        borderRadius: 2,              // bordes redondeados
                        bgcolor: "#f5f5f5",           // fondo gris claro
                        border: "1px solid #e0e0e0", // borde sutil
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)", // sombra suave
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography fontWeight={700} fontSize={14} color="text.primary">
                        📝 Nota:
                      </Typography>
                      <Typography fontSize={14} color="text.secondary" sx={{ wordBreak: "break-word" }}>
                        {detalleVenta.nota}
                      </Typography>
                    </Box>
                  )}

              <Box sx={{ mt: 2, p: 1, borderRadius: 3, background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography fontWeight={600}>Total</Typography>
                <Typography variant="h6" fontWeight={700}>${Number(detalleVenta.venta_total).toLocaleString()}</Typography>
              </Box>

         
              {detalleVenta.estado_pago != "PENDIENTE" && (
                <Box
                  onClick={handleLiberarMesa}
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #3d82a7, #0060e6)",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none",
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                    transition: "all 0.25s ease",
                    position: "relative",
                    overflow: "hidden",

                    // Hover
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 10px 25px rgba(0, 96, 230, 0.45)",
                    },

                    // Click
                    "&:active": {
                      transform: "scale(0.96)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    },

                    // Brillo animado premium
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background:
                        "linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent)",
                      transition: "0.6s",
                    },
                    "&:hover::after": {
                      left: "100%",
                    },
                  }}
                >
                  <Typography fontWeight={700}>
                    LIBERAR MESA
                  </Typography>
                </Box>
              )}


              {detalleVenta.estado_pago == "PENDIENTE" && (
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
                  <MenuItem value="TRANSFERENCIA">🔁 Transferencia</MenuItem>
                  <MenuItem value="TARJETA">💳 Tarjeta</MenuItem>
                  <MenuItem value="NEQUI">📲 Nequi</MenuItem>
                  <MenuItem value="DAVIPLATA">📲 DaviPlata</MenuItem>
                  <MenuItem value="TIQUERERA">🎟️ Tiquetera</MenuItem>
                  </TextField>

                  {metodoPago === "EFECTIVO" && (
                    <TextField
                      fullWidth
                      autoFocus
                      label="Monto recibido"
                      size="small"
                      type="text"
                      inputProps={{
                        inputMode: "numeric",
                        pattern: "[0-9]*"
                      }}
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




                  <Box
                    onClick={!(metodoPago === "EFECTIVO" && cambio < 0) ? handleFinalizarVenta : undefined}                    sx={{
                      mt: 3,
                      p: 2,
                      borderRadius: 3,
                      background:
                        metodoPago === "EFECTIVO" && cambio < 0
                          ? "#9e9e9e"
                          : "linear-gradient(135deg, #09a58e, #2e7d32)",
                      color: "#fff",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 1,
                      cursor: metodoPago === "EFECTIVO" && cambio < 0 ? "not-allowed" : "pointer",
                      userSelect: "none",
                      fontWeight: 700,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                      transition: "all 0.25s ease",

                      width: "90%",

                      // Responsive
                      fontSize: {
                        xs: "0.9rem",
                        sm: "1rem"
                      },

                      // Hover solo si está habilitado
                      "&:hover": metodoPago === "EFECTIVO" && cambio < 0
                        ? {}
                        : {
                          transform: "translateY(-4px)",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.35)"
                        },

                      "&:active": {
                        transform: "scale(0.97)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
                      }
                    }}
                  >
                    <AddShoppingCartIcon />
                    <Typography fontWeight={700} letterSpacing={0.5}>
                      PAGAR FACTURA
                    </Typography>
                  </Box>
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