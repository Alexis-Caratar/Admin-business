import React, { useEffect, useState } from "react";
import {Card,Typography,Box,Chip,Dialog,DialogTitle,DialogContent,IconButton,TextField,
  MenuItem,
  Button,
  Stack,
  Avatar,} from "@mui/material";
  import PrintIcon from "@mui/icons-material/Print";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CloseIcon from "@mui/icons-material/Close";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import type { Mesa } from "./../../../../../types/cajero";
import { apidetallesMesa, actualiza_venta, liberar_mesa, imprimircomanda } from "../../../../../api/cajero";
import Swal from "sweetalert2";
import ChairIcon from "@mui/icons-material/Chair";
import { apibuscar_cliente } from "../../../../../api/cajero";
import { CrearClienteModal } from "./CrearClienteModal";
import { PagoTiqueteraDialog } from "./Tiqueteras/PagoTiqueteraDialog";
import { resumenConsumo } from "./Tiqueteras/tiqueterasUtil";
import { ventaCobrada } from "../../../../../components/impresion/factura";
import type { Consumo } from "../../../../../api/tiqueteras";
import { apiComanda, apiPasarACobro, errorDe as errorComanda, type ComandaDetalle } from "../../../../../api/comandas";
import { usePermisos } from "../../../../../hooks/usePermisos";
import { Encabezado, Seccion } from "../../../../../components/pedidos/DisenoPedidos";
import { sxBotonPrincipal } from "../../../../../components/pedidos/pedidosUtil";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import PagoDividido from "../../../../../components/pagos/PagoDividido";
import { estadoPago, lineasIniciales, paraEnviar, type LineaPago } from "../../../../../components/pagos/pagoDivididoUtil";


type Props = {
  idUsuario: number|null;
  id_negocio: number|null;
  mesas: Mesa[];
  mesaSeleccionada: Mesa | null;
  onSelect?: (m: Mesa | null) => void;
  abrirMesaId?: number | null;      // abrir una mesa desde fuera (p. ej. el panel de comandas)
  onAbierta?: () => void;
};

type Cliente = {
  id: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
};

export const Mesas: React.FC<Props> = ({ idUsuario, id_negocio, mesas,mesaSeleccionada, onSelect, abrirMesaId, onAbierta }) => {
  const { tiene } = usePermisos();
  // Comanda de un mesero en la mesa (aún sin venta): se muestra y se pasa a cobro
  const [comandaMesa, setComandaMesa] = useState<ComandaDetalle | null>(null);
  const [pasando, setPasando] = useState(false);
  const [mesaOrden, setMesaOrden] = useState<Mesa | null>(null);
  const [openOrden, setOpenOrden] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState<any | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [montoRecibido, setMontoRecibido] = useState<number | "">("");
  const [, setHabilitarPago] = useState(false);
  const [clienteBuscado, setClienteBuscado] = useState("");
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
  useState<Cliente | null>(null);
const [modoEditarCliente, setModoEditarCliente] = useState(false);
const [openCrearModal, setOpenCrearModal] = useState(false);
const [pagoTiquetera, setPagoTiquetera] = useState<number | null>(null);


const handleBuscarCliente = async (term: string) => {
  setClienteBuscado(term);

  if (term.trim().length < 2) {
    setResultados([]);
    return;
  }

  const res = await apibuscar_cliente({
    id_cliente: term,
  });

  setResultados(res.data.result);
};

const seleccionarCliente = (cli: Cliente) => {
  setClienteSeleccionado(cli);
  setResultados([]);
  setClienteBuscado("");
};

const getEstadoConfig = (estado: Mesa["estado"]) => {
  switch (estado) {
    case "Disponible":
      return {
        chipBg: "#DCFCE7",
        chipColor: "#166534",
        chipBorder: "#BBF7D0",
        gradient: "linear-gradient(135deg, #079150, #006837)",
        iconBg: "#1196b7",
        icon: <ChairIcon />,
      };

    case "Ocupada":
      return {
        chipBg: "#FEE2E2",
        chipColor: "#991B1B",
        chipBorder: "#FECACA",
        gradient: "linear-gradient(135deg, #fe3e00, #cd3706)",
        iconBg: "#221d1d",
        icon: <RestaurantIcon />,
      };

    case "Reservada":
      return {
        chipBg: "#FEF3C7",
        chipColor: "#92400E",
        chipBorder: "#FDE68A",
        gradient: "linear-gradient(135deg, #f7971e, #ffd200)",
        iconBg: "#ef6c00",
        icon: <EventSeatIcon />,
      };

    default:
      return {
        chipBg: "#F1F5F9",
        chipColor: "#475569",
        chipBorder: "#CBD5E1",
        gradient: "linear-gradient(135deg,#94A3B8,#64748B)",
        iconBg: "#64748B",
        icon: <EventSeatIcon />,
      };
  }
};

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);

  const cambio = (Number(montoRecibido) || 0) - (detalleVenta?.venta_total || 0);
  const cambioSeguro = Math.max(cambio, 0);
  // Pago dividido (p. ej. Nequi + efectivo) contra el total de la cuenta
  const totalCuenta = Number(detalleVenta?.venta_total || 0);
  const [lineasPago, setLineasPago] = useState<LineaPago[]>([]);
  useEffect(() => { if (metodoPago === "MIXTO") setLineasPago(lineasIniciales(totalCuenta)); }, [metodoPago, totalCuenta]);
  const bloqueado = (metodoPago === "EFECTIVO" && cambio < 0) || (metodoPago === "MIXTO" && !estadoPago(lineasPago, totalCuenta).valido);

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
      setComandaMesa(null);
      // Comanda abierta de un mesero: la mesa aún no tiene venta, se muestra la comanda
      if (mesa.id_comanda && mesa.estado_comanda === "ABIERTA") {
        setDetalleVenta(null);
        setComandaMesa(await apiComanda(mesa.id_comanda).catch(() => null));
        return;
      }
      const { data } = await apidetallesMesa({ id_negocio, mesaId: mesa.id });
      if (!data?.ok || !Array.isArray(data.result) || data.result.length === 0) {
        setDetalleVenta(null);
        if (mesa.id_comanda) setComandaMesa(await apiComanda(mesa.id_comanda).catch(() => null));
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


  // La caja toma la comanda: se crea la venta pendiente de la mesa y sigue el cobro de siempre
  const pasarACobro = async () => {
    if (!comandaMesa || !mesaOrden) return;
    setPasando(true);
    try {
      await apiPasarACobro(comandaMesa.id);
      // Ya tiene venta: se abre el cobro de siempre (la lista de mesas aún puede traer el estado anterior)
      await handleClickMesa({ ...mesaOrden, estado_comanda: "EN_COBRO" });
    } catch (e) {
      const er = errorComanda(e);
      Swal.fire({ icon: "warning", title: "No se pudo pasar a cobro", text: er.mensaje });
      if (er.id_venta) await handleClickMesa({ ...mesaOrden, estado_comanda: "EN_COBRO" });   // otra caja ya la tomó: se muestra su venta
    } finally {
      setPasando(false);
    }
  };

  useEffect(() => {
    if (!abrirMesaId) return;
    const m = mesas.find((x) => x.id === abrirMesaId);
    if (m) handleClickMesa(m);
    onAbierta?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirMesaId]);

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
      Swal.fire({ icon: "warning", title: "No se liberó la mesa", text: errorComanda(error).mensaje });
    }
  };

  const reiniciarCobro = () => {
    setDetalleVenta(null);
    setHabilitarPago(false);
    setMontoRecibido("");
    setMetodoPago("EFECTIVO");
    setOpenOrden(false);
  };

  const pagadoConTiquetera = (r: Consumo) => {
    setPagoTiquetera(null);
    onSelect?.(null);
    reiniciarCobro();
    ventaCobrada([r.venta.id_venta, ...(r.venta_resto && r.venta_resto.metodo_pago !== "PENDIENTE" ? [r.venta_resto.id_venta] : [])], { title: "Pagado con tiquetera", html: resumenConsumo(r) });
  };

  const handleFinalizarVenta = async () => {
    if (!detalleVenta) return;
    // Tiquetera: el servidor descuenta los almuerzos y cobra aparte lo demás
    if (metodoPago === "TIQUERERA") { setPagoTiquetera(detalleVenta.id_venta); return; }

    const payload = {
      idUsuario: idUsuario,
      id_negocio: id_negocio,
      id_venta: detalleVenta.id_venta,
      id_mesa: mesaOrden?.id,
      metodo_pago: metodoPago,
      monto_recibido: montoRecibido,
      cambio: metodoPago === "MIXTO" ? estadoPago(lineasPago, totalCuenta).cambio : cambioSeguro,
      ...(metodoPago === "MIXTO" ? { pagos: paraEnviar(lineasPago) } : {}),
      id_cliente:clienteSeleccionado?.id ||detalleVenta.id_cliente,

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

      // Cuenta pagada: aviso y factura (opcional, según Configuración → Factura e impresión)
      if (data?.ok) await ventaCobrada([payload.id_venta], { html: "<b style=\"font-size:18px;color:#16a34a\">✅ Operación exitosa</b><br/><br/>La venta se guardó correctamente" });

    } catch (err) {
      console.error("Error al actualizar venta:", err);

      Swal.fire({
        icon: "error",
        title: "Error al registrar la venta",
        text: errorComanda(err).status ? errorComanda(err).mensaje : "Ocurrió un problema al guardar la venta. Intente nuevamente.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#d32f2f",
        background: "#ffffff",
        color: "#1e293b"
      });
    }
  };



   const imprimirFactura = async (estado_impresion:String) => {
    try {
     
      const payload = {
        id_negocio:id_negocio,
        id_mesa:mesaSeleccionada?.id,
        mesa:mesaSeleccionada?.nombre,
        idUsuario:idUsuario,
        nombre_vendedor:detalleVenta.nombre_vendedor,
        nota:detalleVenta.nota,
        venta: {
          numero_factura: detalleVenta.numero_factura,
          fecha_completa: detalleVenta.fecha_completa,
          fecha_impresion: detalleVenta.fecha_impresion,
          nombre_vendedor: idUsuario,
          identificacion_cliente: detalleVenta.identificacion_cliente,
          nombre_completo: detalleVenta.nombre_completo,
          telefono: detalleVenta.telefono,
          email: detalleVenta.email,
          venta_total: detalleVenta.venta_total,
          descuento: 0,
          metodo_pago: detalleVenta.estado_pago,
          monto_recibido: detalleVenta.monto_recibido,
          cambio: detalleVenta.cambio
        },
        productos: detalleVenta.productos.map((p:any) => ({
          id_producto: p.id_producto,
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio_unitario: p.precio_unitario,
          subtotal: p.subtotal
        }))
      };
  
      if(estado_impresion=='comanda'){
        await imprimircomanda(payload);
      }else if(estado_impresion=='factura'){
  //       await imprimirfactura(payload );
      }
        
      Swal.fire({
        icon: "success",
        title: "Enviado a impresión",
        text: " Espere un momento se está imprimiendo...",
        timer: 1500,
        showConfirmButton: false
      });
  
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo imprimir", "error");
    }
  };

  return (
  <Box width="100%">
  <Typography fontWeight={700} mb={1} sx={{ fontSize: { xs: 12, md: 18 } }}>
    Mesas Disponibles
  </Typography>

  {/* MESAS EN FLEXBOX */}
  <Box
    sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: 1,
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
              overflow: "hidden",
              p: 2.2,
              borderRadius: "22px",
              minHeight: { xs: 145, sm: 175 },
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",

              bgcolor: "#fff",

              border: isSelected
                ? "2px solid #2563EB"
                : "1px solid rgba(15,23,42,.06)",

              boxShadow: isSelected
                ? "0 0 0 3px rgba(37,99,235,.12)"
                : "0 8px 24px rgba(15,23,42,.05)",

              transition: ".25s ease",

              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 14px 35px rgba(15,23,42,.09)",
              },
            }}
          >
            {/* Decoración */}
            <Box
              sx={{
                position: "absolute",
                top: -35,
                right: -35,
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${config.iconBg})`,
                opacity: .08,
              }}
            />

            {/* Estado */}
            <Chip
              label={mesa.estado}
              size="small"
              sx={{
                position: "absolute",
                top: 14,
                right: 14,

                height: 28,
                px: 1.2,

                bgcolor: config.chipBg,
                color: config.chipColor,
                border: `1px solid ${config.chipBorder}`,

                borderRadius: "10px",
                fontWeight: 700,
                fontSize: 11,

                boxShadow: "0 2px 8px rgba(15,23,42,.06)",
              }}
            />

            {/* Icono */}
            <Avatar
              sx={{
                mt: 3,
                mb: 1.5,
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${config.iconBg})`,
                boxShadow: "0 10px 20px rgba(0,0,0,.10)",

                "& svg": {
                  fontSize: 28,
                },
              }}
            >
              {config.icon}
            </Avatar>

            {/* Nombre */}
            <Typography
              sx={{
                fontSize: { xs: 15, sm: 18 },
                fontWeight: 800,
                color: "#0F172A",
                textAlign: "center",
              }}
              noWrap
            >
              {mesa.nombre}
            </Typography>

            {/* Capacidad */}
            <Typography
              sx={{
                mt: .5,
                fontSize: 12,
                color: "#64748B",
              }}
            >
              Capacidad: {mesa.capacidad} personas
            </Typography>
            {mesa.id_comanda && (
              <Typography sx={{ mt: .5, fontSize: 12, fontWeight: 700, color: mesa.estado_comanda === "EN_COBRO" ? "#1E40AF" : "#92400E" }} noWrap>
                Comanda #{mesa.numero_comanda} · {mesa.estado_comanda === "EN_COBRO" ? "en cobro" : mesa.mesero}
              </Typography>
            )}

            <Box flexGrow={1} />

            {/* Seleccionada */}
            {isSelected && (
              <Chip
                label="Seleccionada"
                size="small"
                sx={{
                  mt: 2,
                  bgcolor: "#EFF6FF",
                  color: "#2563EB",
                  border: "1px solid #BFDBFE",
                  fontWeight: 700,
                  borderRadius: "8px",
                }}
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
    pr: 6,
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

  {/* DERECHA (ESTADO + BOTÓN) */}
  <Stack direction="row" spacing={1.5} alignItems="center">

    {/* BOTÓN IMPRIMIR 🔥 */}
    <Button
      size="small"
      startIcon={<PrintIcon />}
      variant="contained"
      sx={{
        borderRadius: 2,
        fontWeight: 700,
        textTransform: "none",
        background: "linear-gradient(135deg,#0d47a1,#1976d2)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
        "&:hover": {
          background: "linear-gradient(135deg,#0b3c91,#1565c0)",
        }
      }}
      onClick={() => imprimirFactura("comanda")}
    >
      Comanda
    </Button>

    {/* ESTADO */}
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
      {detalleVenta?.estado_pago_bool === false && "FACTURA PENDIENTE"}
      {detalleVenta?.estado_pago_bool == null && "SIN VENTA"}
    </Box>
  </Stack>

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
    mb: 2.5,
    borderRadius: 4,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    background:
      "linear-gradient(180deg,#ffffff 0%, #f8fafc 100%)",
    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
  }}
>
  {/* HEADER FACTURA */}
  <Box
    sx={{
      px: 2,
      py: 1.5,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background:
        "linear-gradient(135deg,#0f172a,#1e293b)",
      color: "#fff",
    }}
  >
    <Stack direction="row" spacing={1.2} alignItems="center">
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          background: "rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        🧾
      </Box>

      <Box>
        <Typography
          fontWeight={800}
          sx={{ fontSize: { xs: 14, sm: 16 } }}
        >
          Factura Numero
        </Typography>

        <Typography
          sx={{
            fontSize: 11,
            opacity: 0.75,
          }}
        >
          Información del cliente y venta
        </Typography>
      </Box>
    </Stack>

    {/* NUMERO FACTURA */}
    <Box
      sx={{
        px: 2,
        py: 0.8,
        borderRadius: 2,
        background:
          "linear-gradient(135deg,#22c55e,#16a34a)",
        boxShadow: "0 4px 14px rgba(34,197,94,.35)",
        fontWeight: 800,
        letterSpacing: 1,
        fontSize: {
          xs: "0.72rem",
          sm: "0.82rem",
        },
      }}
    >
      {detalleVenta.numero_factura}
    </Box>
  </Box>

  {/* CUERPO */}
  <Box sx={{ p: 2 }}>
    {/* CLIENTE */}
    <Box
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      {/* IZQUIERDA */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ minWidth: 0 }}
      >
        {/* AVATAR */}
            <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg,#0ea5e9,#2563eb)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                     {(clienteSeleccionado?.nombres ||
            detalleVenta.nombre_completo ||
            "C")[0]}
                  </Box>


        {/* INFO */}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            fontWeight={800}
            noWrap
            sx={{
              fontSize: {
                xs: 13,
                sm: 15,
              },
            }}
          >
            {clienteSeleccionado?.nombres ||
              detalleVenta.nombre_completo}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              fontSize: 12,
            }}
          >
            Documento:{" "}
            {clienteSeleccionado?.identificacion ||
              detalleVenta.identificacion_cliente}
          </Typography>
        </Box>
      </Stack>

      {/* BOTONES */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
      >
        {detalleVenta.estado_pago_bool === false &&
        !modoEditarCliente ? (
          <Button
            size="small"
            variant="contained"
            onClick={() => setModoEditarCliente(true)}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 700,
              px: 2,
              background:
               "linear-gradient(135deg,#0ea5e9,#2563eb)",

              "&:hover": {
                background:
                  "linear-gradient(135deg,#1d4ed8,#1e40af)",
              },
            }}
          >
            ✏️ Cambiar
          </Button>
        ) : (
          <Button
            size="small"
            color="inherit"
            variant="outlined"
            onClick={() => {
              setModoEditarCliente(false);
              setClienteBuscado("");
              setResultados([]);
            }}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 700,
            }}
          >
            Cancelar
          </Button>
        )}
      </Stack>
    </Box>

    {/* MODO EDICIÓN */}
    {modoEditarCliente && (
      <Box mt={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar cliente por nombre o documento..."
          value={clienteBuscado}
          onChange={(e) =>
            handleBuscarCliente(e.target.value)
          }
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: "#fff",
            },
          }}
        />

        {/* RESULTADOS */}
        {resultados.length > 0 && (
          <Box
            sx={{
              mt: 1,
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              background: "#fff",
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {resultados.map((cli) => (
              <Box
                key={cli.id}
                onClick={() => {
                  seleccionarCliente(cli);
                  setModoEditarCliente(false);
                }}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  transition: "all .2s ease",
                  borderBottom:
                    "1px solid rgba(226,232,240,.7)",

                  "&:hover": {
                    background:
                      "linear-gradient(135deg,#eff6ff,#f8fafc)",
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg,#0ea5e9,#2563eb)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {cli.nombres[0]}
                  </Box>

                  <Box>
                    <Typography
                      fontWeight={700}
                      fontSize={13}
                    >
                      {cli.nombres} {cli.apellidos}
                    </Typography>

                    <Typography
                      fontSize={11}
                      color="text.secondary"
                    >
                      {cli.identificacion}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Box>
        )}

        {/* BOTONES */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          mt={2}
        >
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setOpenCrearModal(true)}
            sx={{
              borderRadius: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            + Crear Cliente / Empresa
          </Button>
        </Stack>

        {/* MODAL */}
        <CrearClienteModal
          open={openCrearModal}
          onClose={() => setOpenCrearModal(false)}
          onCreated={(nuevo: any) => {
            const clienteFinal: Cliente = {
              ...nuevo,
            };

            setClienteSeleccionado(clienteFinal);
            setModoEditarCliente(false);
            setOpenCrearModal(false);
          }}
        />
      </Box>
    )}
  </Box>
</Box>
              <Typography fontWeight={600} mb={1}>Detalle de Productos</Typography>
              <Box sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e5e7eb", bgcolor: "#fff" }}>
                {detalleVenta.productos.map((prod: any, k: number) => (
                  <Box key={`${prod.id_producto}-${k}`} sx={{ display: "flex", justifyContent: "space-between", p: 0.8, gap: 2 }}>
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
                  <MenuItem value="TIQUERERA">🎟️ Tiquetera (almuerzos prepagados)</MenuItem>
                  <MenuItem value="MIXTO">🔀 Pago dividido (varios medios)</MenuItem>
                  </TextField>

                  {metodoPago === "MIXTO" && <PagoDividido total={totalCuenta} lineas={lineasPago} onChange={setLineasPago} />}

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
                    onClick={!bloqueado ? handleFinalizarVenta : undefined}                    sx={{
                      mt: 3,
                      p: 2,
                      borderRadius: 3,
                      background:
                        bloqueado
                          ? "#9e9e9e"
                          : "linear-gradient(135deg, #09a58e, #2e7d32)",
                      color: "#fff",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 1,
                      cursor: bloqueado ? "not-allowed" : "pointer",
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
                      "&:hover": bloqueado
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

          {!loadingDetalle && !detalleVenta && comandaMesa && (
            <Stack spacing={2}>
              <Encabezado icono={<RoomServiceIcon />} color="ambar" titulo={`Comanda #${comandaMesa.numero}`}
                subtitulo={`${comandaMesa.mesero} · ${new Date(comandaMesa.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}${comandaMesa.tandas > 1 ? ` · ${comandaMesa.tandas - 1} adición(es)` : ""}`} />
              <Seccion titulo="Productos de la comanda" icono={<RestaurantIcon />}>
                {comandaMesa.items.map((i) => (
                  <Box key={i.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", py: 1, borderBottom: "1px solid #EEF2F7", "&:last-of-type": { borderBottom: "none" } }}>
                    <Box sx={{ minWidth: 32, height: 32, borderRadius: 2, bgcolor: "#FEF3C7", color: "#92400E", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i.cantidad}</Box>
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={600} color="#0F172A" fontSize={14}>{i.nombre}{i.tanda > 1 ? ` · adición ${i.tanda - 1}` : ""}</Typography>
                      {i.nota && <Typography fontSize={12} color="#64748B">* {i.nota}</Typography>}
                    </Box>
                    <Typography fontWeight={600} color="#334155" fontSize={14}>${Math.round(i.precio_unitario * i.cantidad).toLocaleString("es-CO")}</Typography>
                  </Box>
                ))}
                {comandaMesa.nota && (
                  <Box sx={{ mt: 1.5, p: 1.2, borderRadius: 3, bgcolor: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 13, color: "#92400E" }}>
                    <b>Observación:</b> {comandaMesa.nota}
                  </Box>
                )}
              </Seccion>
              <Box sx={{ p: 1.5, borderRadius: "18px", background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography fontWeight={600}>Total</Typography>
                <Typography variant="h6" fontWeight={800}>${Math.round(comandaMesa.total).toLocaleString("es-CO")}</Typography>
              </Box>
              {tiene("cajero.cobrar") ? (
                <Button fullWidth variant="contained" disabled={pasando} onClick={pasarACobro} sx={{ ...sxBotonPrincipal, height: 48 }}>
                  {pasando ? "Pasando a cobro…" : "Pasar a cobro"}
                </Button>
              ) : <Typography color="#64748B" fontSize={13}>Tu perfil no permite cobrar.</Typography>}
            </Stack>
          )}
          {!loadingDetalle && !detalleVenta && !comandaMesa && (
            <Box textAlign="center" py={3}>
              <Typography color="text.secondary">No hay venta activa para esta mesa.</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      <PagoTiqueteraDialog
        open={pagoTiquetera !== null}
        idVenta={pagoTiquetera ?? undefined}
        busquedaInicial={(() => { const doc = clienteSeleccionado?.identificacion ?? detalleVenta?.identificacion; return doc && !String(doc).includes("22222222") ? String(doc) : undefined; })()}
        onClose={() => setPagoTiquetera(null)}
        onExito={pagadoConTiquetera}
      />
    </Box>
  );
};