/* ---------- /src/pages/CajeroDashboard.tsx ---------- */
import React, { useEffect, useState } from "react";
import LectorCodigo from "./components/LectorCodigo";
import { Box, Typography, Stack, Chip, Button, Drawer, Fab, useTheme, useMediaQuery, Badge, Dialog, DialogContent, Paper, DialogActions, Avatar, Divider } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import type { ProductoCajero, CategoriaCajero, Caja, Mesa } from "../../../../types/cajero";
import { apiListarProductos, apiAbrirCaja, apiArqueoCaja, apiCerrarCaja, estado_caja, finalizar_venta } from "../../../../api/cajero";
import { Mesas } from "./components/Mesas";
import { Carrito } from "./components/Carrito";
import { AperturaCajaModal } from "./components/AperturaCaja";
import { ArqueoCajaModal } from "./components/Estados_dasboard/ArqueoCaja";
import { CierreCajaModal } from "./components/Estados_dasboard/CierreCaja";
import { ProductosCategoriaModal } from "./components/ProductosCategoria";
import { Categorias } from "./components/Categorias";
import { CarritoMobile } from "./components/CarritoMobile";
import Egresos from "./components/Estados_dasboard/Egresos";
import PersonIcon from '@mui/icons-material/Person';
import { motion } from "framer-motion";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VentasDetalles from "./components/Estados_dasboard/ventasDetalles";
import CajaPanel from "./components/Estados_dasboard/CajaPanel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PanelPedidosCaja from "../../../../components/pedidos/PanelPedidosCaja";
import { usePedidosEnCurso } from "../../../../components/pedidos/pedidosUtil";
import Loader from "../../../../components/Loader";
import toastr from "toastr";
import { PagoTiqueteraDialog } from "./components/Tiqueteras/PagoTiqueteraDialog";
import { resumenConsumo } from "./components/Tiqueteras/tiqueterasUtil";
import { imprimirFacturas, preferenciaFactura, ventaCobrada } from "../../../../components/impresion/factura";
import { TiqueterasCajaDialog } from "./components/Tiqueteras/TiqueterasCajaDialog";
import PanelComandasCaja from "../../../../components/comandas/PanelComandasCaja";
import { useComandasPendientes } from "../../../../components/comandas/useComandas";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import type { Consumo, VentaCarrito } from "../../../../api/tiqueteras";
import "toastr/build/toastr.min.css";

interface AnimItem {
  img: string;
  start: { left: number; top: number };
}

export const CajeroDashboard: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaCajero[]>([]);
  const [caja, setCaja] = useState<Caja | null>(null);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [montoApertura, setMontoApertura] = useState("");
  const [idCaja, setIdCaja] = useState<number | null>(null);
  const [, setVentas] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<(ProductoCajero & { cantidad: number; precio_venta: number })[]>([]);
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalArqueo, setModalArqueo] = useState(false);
  const [arqueoInfo, setArqueoInfo] = useState<any | null>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaCajero | null>(null);
  const [modalProductosOpen, setModalProductosOpen] = useState(false);
  const [openCarrito, setOpenCarrito] = useState(false);
  const [openEgresos, setOpenEgresos] = useState(false);
  // Pedidos web: se gestionan desde la caja, con aviso en vivo
  const [openPedidos, setOpenPedidos] = useState(false);
  const pedidosWeb = usePedidosEnCurso();
  const { aviso: avisoPedidos, cerrarAviso: cerrarAvisoPedidos } = pedidosWeb;
  useEffect(() => {
    if (!avisoPedidos) return;
    toastr.info(avisoPedidos);
    cerrarAvisoPedidos();
  }, [avisoPedidos, cerrarAvisoPedidos]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [openVentaRegistrada, setOpenVentaRegistrada] = useState(false);
  const [ventaPayload, setVentaPayload] = useState<any>(null);
  const [showStats, setShowStats] = useState(true); // por defecto muestra
  const idUsuario = localStorage.getItem("id_usuario");
  const id_negocio = localStorage.getItem("id_negocio");
  const nombreuser = localStorage.getItem("nombre");
  const [openVentasDetalles, setOpenVentasDetalles] = useState(false);
  const [animItem, ] = useState<AnimItem | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  // Tiqueteras: venta/consulta desde la caja y pago de almuerzos con tiquetera
  const [openTiqueteras, setOpenTiqueteras] = useState(false);
  // Comandas de meseros: llegan en vivo y se cobran desde la mesa
  const comandasMeseros = useComandasPendientes();
  const [openComandas, setOpenComandas] = useState(false);
  const [abrirMesaId, setAbrirMesaId] = useState<number | null>(null);
  useEffect(() => {
    if (!comandasMeseros.aviso) return;
    toastr.info(comandasMeseros.aviso);
    comandasMeseros.limpiarAviso();
  }, [comandasMeseros]);
  const [pagoTiquetera, setPagoTiquetera] = useState<{ venta: VentaCarrito; busqueda?: string } | null>(null);
  const abrirCarrito = () => {
    setOpenCarrito(true);
  };
  const cerrarCarrito = () => setOpenCarrito(false);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    ws.onopen = () => {
      const token = localStorage.getItem("token");
      ws.send(JSON.stringify({ tipo: "suscribirse_mesas", id_negocio, token }));
      ws.send(JSON.stringify({ tipo: "suscribirse_caja", id_usuario: idUsuario, token }));
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // MESAS
      if (msg.tipo === "mesas") { setMesas(msg.mesas); }
      // CAJA
      if (msg.tipo === "actualizar_caja") {
        const c = msg.caja;
        if (!c) return;
        setCaja(c);
        setCajaAbierta(c.estado === "ABIERTA");
        setIdCaja(c.id);
        if (msg.tipo === "actualizar_caja") {
          const c = msg.caja;
          if (!c) return;
          setCaja(c);
          setCajaAbierta(c.estado === "ABIERTA");
          setIdCaja(c.id);
          if (c.estado === "ABIERTA") {
            setMontoApertura(String(c.monto_inicial));
          } else {
            setMontoApertura("");
          }
        }
      }
    };
    ws.onclose = () => console.log("WS cerrado");
    return () => ws.close();
  }, [id_negocio, idUsuario]);

  const checkCaja = async () => {
    try {
      const idUsuario = localStorage.getItem("id_usuario");
      const { data } = await estado_caja({ id_usuario: idUsuario });

      if (data?.ok && data.estado.length > 0) {
        setCajaAbierta(true);
        setCaja(data.estado[0]);
        setIdCaja(data.estado[0].id);
        setMontoApertura(data.estado[0].monto_inicial.toString());
      } else {
        setModalApertura(true);
      }
    } catch (err) {
      console.error("Error consultando estado de caja:", err);
      setModalApertura(true);
    }
  };

  useEffect(() => {
    checkCaja();
  }, []);



  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await cargarCategorias();
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoadingCategorias(true);
      const res = await apiListarProductos(id_negocio);
      let data: any[] = [];

      if (res && res.data) {
        if (Array.isArray(res.data)) data = res.data;
        else if (res.data.ok && res.data.productos) data = res.data.productos;
        else if (res.data.productos) data = res.data.productos;
      }
      setCategorias(data || []);
    } catch (err) {
      console.error("Error cargando categorías y productos:", err);
    } finally {
      setLoadingCategorias(false);
    }
  };


  // `unidades` > 1 llega desde el lector de códigos ("3*código"); por defecto suma 1
  const addCart = (p: ProductoCajero, unidades = 1) => {
    setCarrito((prev) => {
      const item = prev.find((x) => x.id === p.id);
      const stock = Number(p.stock_actual ?? 999);
      const cantidadActual = item?.cantidad ?? 0;
      const suma = Math.min(unidades, stock - cantidadActual);

      if (suma <= 0) {
        toastr.error(`No hay más unidades disponibles de "${p.nombre}".`); return prev;
      } else if (suma < unidades) {
        toastr.warning(`Solo había ${suma} unidad(es) de "${p.nombre}".`);
      } else {
        toastr.success(`${unidades > 1 ? `${unidades} × ` : ""}${p.nombre} agregado`);
      }

      if (item) {
        return prev.map((x) =>
          x.id === p.id
            ? { ...x, cantidad: x.cantidad + suma }
            : x
        );
      }
      return [...prev, { ...p, cantidad: suma }];
    });
  };
  const sumarCantidad = (id: number) => {
    setCarrito((prev) => {
      const item = prev.find((x) => x.id === id);
      if (!item) return prev;

      const stock = Number(item.stock_actual ?? 0);

      if (item.cantidad >= stock) {
        toastr.error(`No hay más unidades disponibles de "${item.nombre}".`);
        return prev;
      }

      return prev.map((x) =>
        x.id === id
          ? { ...x, cantidad: x.cantidad + 1 }
          : x
      );
    });
  };

  const restarCantidad = (id: number) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };


  const removeItem = (id: number) => {
    setCarrito((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const clearCarrito = () => {
    setCarrito([]);
  };
  const clearMesa = () => {
    setMesaSeleccionada(null);
  };

  //Finalizar venta
  const finalizarVenta = async (cliente: any, datos_adicionales: any) => {
    if (carrito.length === 0) return;
    setLoadingCategorias(true);
    const subtotal = carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);
    const descuento = 0;
    const impuesto = 0;
    const total = subtotal - descuento + impuesto;

    const payload = {
      idUsuario: idUsuario,
      nombre_vendedor: nombreuser,
      id_negocio: id_negocio,
      id_cliente: cliente ? cliente : 25,
      id_caja: idCaja,
      id_mesa: mesaSeleccionada?.id,
      mesa: mesaSeleccionada?.nombre,
      subtotal,
      descuento,
      descuento_porcentaje: 0,
      impuesto,
      total,
      estado: "activa",
      nota: datos_adicionales.nota,
      metodo_pago: datos_adicionales.metodo_pago,
      monto_pagado: total,
      monto_recibido: Number(datos_adicionales.monto_recibido || 0),
      cambio: datos_adicionales.cambio,
      pagos: datos_adicionales.pagos,   // pago dividido (metodo_pago = "MIXTO")
      productos: carrito.map((p) => ({
        id_producto: p.id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio_unitario: p.precio_venta,
        descuento: 0,
        descuento_porcentaje: 0,
        impuesto: 0,
        subtotal: p.precio_venta * p.cantidad,
      })),
    };

    // Tiquetera: se elige la del cliente y el servidor registra venta y consumo juntos
    if (datos_adicionales.metodo_pago === "TIQUERERA") {
      setLoadingCategorias(false);
      const doc = clienteSeleccionado?.identificacion;
      setPagoTiquetera({
        venta: { ...payload, id_cliente: cliente || null } as VentaCarrito,
        busqueda: doc && !String(doc).includes("22222222") ? String(doc) : undefined,
      });
      return;
    }

    try {
      const { data } = await finalizar_venta(payload);
      // La comanda sale sola; si el punto de venta no la imprimió, se avisa
      if (data.ok && data.impresion && !data.impresion.ok) toastr.warning(`Comanda no impresa: ${data.impresion.mensaje}`);
      if (data.ok) {
        setVentas((prev) => [...prev, { ...payload }]);
        setCarrito([]);
        setMesaSeleccionada(null);
        checkCaja();
        // Factura (aparte de la comanda): solo si quedó pagada; según Configuración → Factura e impresión
        const pagada = payload.metodo_pago !== "PENDIENTE";
        const pref = pagada ? await preferenciaFactura() : "nunca";
        setVentaPayload({ ...payload, id_venta: data.result?.id_venta, pagada, pref_factura: pref });
        if (pagada && pref === "siempre" && data.result?.id_venta) imprimirFacturas([data.result.id_venta]);
        closeCategoria();
        cargarCategorias();
        setOpenVentaRegistrada(true);
      }
    } catch (err) {
      console.error("Error finalizando venta:", err);
    } finally {
      setLoadingCategorias(false);
    }
  };
  const pagadoConTiquetera = (r: Consumo & { impresion?: { ok: boolean; mensaje?: string } }) => {
    setPagoTiquetera(null);
    if (r.impresion && !r.impresion.ok) toastr.warning(`Comanda no impresa: ${r.impresion.mensaje}`);
    setCarrito([]);
    setMesaSeleccionada(null);
    setClienteSeleccionado(null);
    closeCategoria();
    cargarCategorias();
    checkCaja();
    ventaCobrada([r.venta.id_venta, ...(r.venta_resto && r.venta_resto.metodo_pago !== "PENDIENTE" ? [r.venta_resto.id_venta] : [])], { title: "Pagado con tiquetera", html: resumenConsumo(r) });
  };

  //aperturar la caja 
  const abrirCajaReal = async (payload: any) => {
    try {
      const { data } = await apiAbrirCaja({
        id_usuario: idUsuario,
        monto_inicial: payload.monto_inicial,
        inventario: payload.inventario
      });

      if (data?.ok) {
        setCajaAbierta(true);
        setCaja(data.result);
        setIdCaja(data.result.id);
      }

    } catch (err) {
      console.error("Error abrirCajaReal:", err);
    }
  };




  const cargarArqueo = async (id_caja_param?: number) => {
    try {
      const { data } = await apiArqueoCaja({ id_caja: id_caja_param ?? idCaja });
      if (data?.ok) setArqueoInfo(data.result);
    } catch (err) {
      console.error("Error arqueo:", err);
    }
  };

  const cerrarCajaReal = async (cierreData: any) => {
    if (!idCaja) {
      console.error("No hay una caja abierta para cerrar.");
      return;
    }

    try {
      const { dinero_esperado, dinero_contado, diferencia, base_caja, venta_libre, observacion } = cierreData;

      const { data } = await apiCerrarCaja({
        id_caja: idCaja,
        monto_final: dinero_contado,
        dinero_esperado,
        base_caja,
        venta_libre,
        diferencia,
        nota: observacion,
        estado: "CERRADA"
      });

      if (data?.ok) {
        // Limpiar estados locales
        setCajaAbierta(false);
        setVentas([]);
        setCarrito([]);
        setMontoApertura("");
        setIdCaja(null);
        setModalCierre(false);
        checkCaja(); // refresca la información
      }

    } catch (err) {
      console.error("Error cerrarCajaReal:", err);
    }
  };
  const openCategoria = (categoria: CategoriaCajero) => {
    setCategoriaSeleccionada(categoria);
    setModalProductosOpen(true);
  };
  const closeCategoria = () => {
    setCategoriaSeleccionada(null);
    setModalProductosOpen(false);
  };


  // utils/format.ts
  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  if (loadingCategorias) {
    return <Loader text="Cargando ..." />;
  }
  return (

    <Box >

      <Box
        onClick={() => setShowStats((prev) => !prev)}
        sx={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 0.5,
          mb:1,
          borderRadius: "22px",
          bgcolor: "#fff",
          border: "1px solid rgba(15,23,42,.06)",
          boxShadow: "0 8px 24px rgba(15,23,42,.05)",
          cursor: "pointer",
          transition: ".25s",

          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 14px 35px rgba(15,23,42,.09)",
          },
        }}
      >
        {/* Decoración */}
        <Box
          sx={{
            position: "absolute",
            top: -45,
            right: -45,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: cajaAbierta
              ? "linear-gradient(135deg,#16A34A,#4ADE80)"
              : "linear-gradient(135deg,#DC2626,#F87171)",
            opacity: .08,
          }}
        />

        {/* Información */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ zIndex: 2 }}
        >
          <Avatar
            sx={{
              width: 52,
              height: 52,
              background: cajaAbierta
                ? "linear-gradient(135deg,#16A34A,#4ADE80)"
                : "linear-gradient(135deg,#DC2626,#F87171)",
              boxShadow: "0 10px 20px rgba(0,0,0,.10)",
            }}
          >
            <PersonIcon />
          </Avatar>

          <Box>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: .6,
              }}
            >
              Cajero
            </Typography>

            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: 1.2,
              }}
            >
              Perfil del Cajero
            </Typography>


            <Typography
              sx={{
                mt: .4,
                fontSize: 12,
                color: "#text.secondary",
              }}
            >
              {cajaAbierta
                ? "Caja activa • Click para ver información"
                : "Caja cerrada • Click para ver información"}
            </Typography>
          </Box>
        </Stack>

        {/* Estado + Acción */}
        <Stack
          spacing={1}
          alignItems="flex-end"
          sx={{ zIndex: 2 }}
        >
          <Chip
            size="small"
            label={cajaAbierta ? "CAJA ABIERTA" : "CAJA CERRADA"}
            sx={{
              fontWeight: 700,
              borderRadius: "8px",
              bgcolor: cajaAbierta ? "#DCFCE7" : "#FEE2E2",
              color: cajaAbierta ? "#166534" : "#991B1B",
            }}
          />

          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: "#F8FAFC",
              color: "#64748B",
              transition: ".2s",

              "&:hover": {
                bgcolor: "#EFF6FF",
                color: "#2563EB",
              },
            }}
          >
            {showStats ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </Avatar>
        </Stack>
      </Box>

      {/* === PANEL SUPERIOR DE CAJA === */}
      {cajaAbierta && (
        <CajaPanel
          showStats={showStats}
          cajaAbierta={cajaAbierta}
          caja={caja}
          formatCOP={formatCOP}
          onVentas={() => setOpenVentasDetalles(true)}
          onEgresos={() => setOpenEgresos(true)}
          onArqueo={() => {
            setModalArqueo(true);
            cargarArqueo();
          }}
          onCerrar={() => {
            setModalCierre(true)
            cargarArqueo();
          }
          }
        />
      )}
      {/* === TIQUETERAS (con la caja abierta) y PEDIDOS WEB (solo si el negocio tiene activo el módulo Pedidos) === */}
      {(cajaAbierta || pedidosWeb.disponible) && <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
        {cajaAbierta && comandasMeseros.disponible && (
          <Badge badgeContent={comandasMeseros.comandas.filter((c) => c.estado === "ABIERTA").length} color="error">
            <Button
              variant="contained"
              startIcon={<RoomServiceIcon />}
              onClick={() => setOpenComandas(true)}
              sx={{ borderRadius: 3, fontWeight: 700, textTransform: "none", px: 2.5, height: 44 }}
            >
              Comandas{comandasMeseros.comandas.length ? ` · ${comandasMeseros.comandas.length}` : ""}
            </Button>
          </Badge>
        )}
        {cajaAbierta && (
          <Button
            variant="outlined"
            startIcon={<ConfirmationNumberIcon />}
            onClick={() => setOpenTiqueteras(true)}
            sx={{ borderRadius: 3, fontWeight: 700, textTransform: "none", px: 2.5, height: 44 }}
          >
            Tiqueteras
          </Button>
        )}
        {pedidosWeb.disponible && <Badge badgeContent={pedidosWeb.porConfirmar} color="error" overlap="rectangular">
          <Button
            variant="contained"
            startIcon={<ReceiptLongIcon />}
            onClick={() => setOpenPedidos(true)}
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              textTransform: "none",
              px: 2.5,
              height: 44,
              background: pedidosWeb.porConfirmar > 0 ? "linear-gradient(135deg,#d97706,#fbbf24)" : "linear-gradient(135deg,#2563EB,#3B82F6)",
              boxShadow: pedidosWeb.porConfirmar > 0 ? "0 8px 20px rgba(217,119,6,.25)" : "0 8px 20px rgba(37,99,235,.20)",
              "&:hover": { background: pedidosWeb.porConfirmar > 0 ? "linear-gradient(135deg,#b45309,#d97706)" : "linear-gradient(135deg,#1D4ED8,#2563EB)" },
              ...(pedidosWeb.porConfirmar > 0 && {
                animation: "pulsoPedidos 1.6s ease-in-out infinite",
                "@keyframes pulsoPedidos": {
                  "0%, 100%": { boxShadow: "0 0 0 0 rgba(217,119,6,.45)" },
                  "50%": { boxShadow: "0 0 0 8px rgba(217,119,6,0)" },
                },
              }),
            }}
          >
            {pedidosWeb.porConfirmar > 0 ? `${pedidosWeb.porConfirmar} pedido(s) por confirmar` : "Pedidos web"}{pedidosWeb.pedidos.length ? ` · ${pedidosWeb.pedidos.length} en curso` : ""}
          </Button>
        </Badge>}
      </Stack>}

      <Divider
        sx={{
          my: 2,
          color: "#94A3B8",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",

          "&::before, &::after": {
            borderColor: "rgba(15,23,42,.08)",
          },
        }}
      >
        Panel de ventas
      </Divider>
      {/* Lector de códigos de barras (minimarket, tiendas…): escanear = agregar al carrito */}
      {cajaAbierta && categorias.length > 0 && (
        <LectorCodigo categorias={categorias} onAgregar={addCart} onConOpciones={openCategoria} />
      )}
      {/* === CONTENIDO PRINCIPAL === */}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0}}>
        {mesas.length > 0 ? (
          <>
            {/* === Categorías === */}
            <Box
              sx={{
                width: { xs: "35%", sm: "35%", md: "30%" },
                borderRight: { xs: "none", md: "1px solid #e0e0e0" },
                pr: { xs: 0, md: 1 },
                mb: { xs: 2, md: 2 },
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                maxHeight: "100%",
              }}
            >
              <Categorias
                categorias={categorias}
                loading={loadingCategorias}
                onOpen={openCategoria}
                modo="dashboard"
              />
            </Box>

            {/* === Mesas === */}
            <Box
              sx={{
                width: { xs: "100%", md: "80%" },
                px: 1,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              <Mesas
                abrirMesaId={abrirMesaId}
                onAbierta={() => setAbrirMesaId(null)}
                idUsuario={Number(idUsuario) || 0}
                id_negocio={Number(id_negocio) || 0}
                mesas={mesas}
                mesaSeleccionada={mesaSeleccionada}
                onSelect={(m) =>
                  setMesaSeleccionada((prev) =>
                    prev?.id === m?.id ? null : m
                  )
                }
              />
            </Box>
          </>
        ) : (

          <ProductosCategoriaModal
            modo="page"
            open={modalProductosOpen}
            onClose={closeCategoria}
            categoria={categoriaSeleccionada}
            categorias={categorias}
            onAgregar={addCart}
          />

        )}

        {/* === BOTÓN ABRIR CARRITO EN DESKTOP === */}
        {!openCarrito && !isMobile && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 1400,
            }}
          >
            <Fab
              color="primary"
              variant="extended"
              onClick={abrirCarrito}
              sx={{ position: "relative" }}
            >
              <Badge
                badgeContent={carrito.reduce((total, item) => total + item.cantidad, 0)}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    fontWeight: "bold",
                  },
                }}
              >
                <ShoppingCartIcon sx={{ mr: 1 }} />
              </Badge>
              Ver Carrito
            </Fab>

          </Box>
        )}

        {!openCarrito && isMobile && (
          <Box
            sx={{
              position: "fixed",
              bottom: 20,
              right: 20,
              zIndex: 1400,
            }}
          >
            <Badge badgeContent={carrito.reduce((total, item) => total + item.cantidad, 0)}
              color="error">
              <Fab color="primary" onClick={abrirCarrito}>
                <ShoppingCartIcon />
              </Fab>
            </Badge>
          </Box>
        )}

        {/* === DRAWER / CARRITO ESCRITORIO === */}
        <Drawer
          anchor="right"
          open={openCarrito && !isMobile}
          onClose={() => setOpenCarrito(false)}
          sx={{
            "& .MuiDrawer-paper": { width: 400, p: 2, boxSizing: "border-box" },
          }}
        >
          <Carrito
            carrito={carrito}
            onRemove={removeItem}
            onClear={clearCarrito}
            onAdd={sumarCantidad}
            onSub={restarCantidad}
            onFinalizar={(c, p) => { finalizarVenta(c, p); setOpenCarrito(false); }}
            mesaSeleccionada={mesaSeleccionada}
            onClearMesa={clearMesa}
            categorias={categorias}
            onOpenCategoria={(categoria) => { setOpenCarrito(false); openCategoria(categoria); }}
            loadingCategorias={loadingCategorias}
            clienteSeleccionado={clienteSeleccionado}
            setClienteSeleccionado={setClienteSeleccionado}
          />
        </Drawer>

        {/* === CARRITO MÓVIL === */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          {isMobile && (
            <CarritoMobile
              open={openCarrito}
              onClose={cerrarCarrito}
              carrito={carrito}
              onRemove={removeItem}
              onClear={clearCarrito}
              onAdd={sumarCantidad}
              onSub={restarCantidad}
              onFinalizar={(c, p) => { finalizarVenta(c, p); setOpenCarrito(false); }}
              mesaSeleccionada={mesaSeleccionada}
              onClearMesa={clearMesa}
              categorias={categorias}
              onOpenCategoria={(categoria) => { setOpenCarrito(false); openCategoria(categoria); }}
              loadingCategorias={loadingCategorias}
              clienteSeleccionado={clienteSeleccionado}
              setClienteSeleccionado={setClienteSeleccionado}
            />
          )}
        </Box>
      </Box>

      {/* === MODALES === */}
      <AperturaCajaModal open={modalApertura} onClose={() => setModalApertura(false)} monto={montoApertura} setMonto={setMontoApertura} onAbrir={abrirCajaReal} id_negocio={Number(id_negocio)} />
      <ArqueoCajaModal open={modalArqueo} onClose={() => setModalArqueo(false)} arqueoInfo={arqueoInfo} />
      <CierreCajaModal open={modalCierre} onClose={() => setModalCierre(false)} arqueoInfo={arqueoInfo} formatCOP={formatCOP} onCerrar={cerrarCajaReal} />
      <ProductosCategoriaModal modo="dialog" open={modalProductosOpen} onClose={closeCategoria} categoria={categoriaSeleccionada} categorias={categorias} onAgregar={addCart} />
      <Egresos open={openEgresos} onClose={() => setOpenEgresos(false)} idUsuario={idUsuario != null ? Number(idUsuario) : null} id_negocio={id_negocio != null ? Number(id_negocio) : null} id_caja={idCaja} />
      <VentasDetalles open={openVentasDetalles} onClose={() => setOpenVentasDetalles(false)} id_caja={idCaja} />
      {/* === DIALOG VENTA REGISTRADA === */}
      <Dialog
        open={openVentaRegistrada}
        onClose={() => setOpenVentaRegistrada(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            minWidth: 380,
            maxWidth: 420,
            boxShadow: "0 15px 40px rgba(0,0,0,0.12)"
          }
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            background: "linear-gradient(135deg,#16a34a,#22c55e)",
            color: "white",
            py: 3,
            px: 2,
            textAlign: "center"
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 48 }} />
          <Typography variant="h6" fontWeight="bold">
            Venta registrada con éxito
          </Typography>
        </Box>


        {/* CONTENIDO */}
        <DialogContent sx={{ textAlign: "center", py: 3 }}>
          {ventaPayload && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                background: "#f8fafc",
                border: "1px solid #e2e8f0"
              }}
            >
              <Stack spacing={1} alignItems="center">

                <Typography fontSize={13} color="text.secondary">
                  Total de la venta
                </Typography>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color="success.main"
                >
                  ${ventaPayload.total.toLocaleString()}
                </Typography>

                <Chip
                  label={`Pago: ${ventaPayload.metodo_pago}`}
                  color="success"
                  size="small"
                  sx={{ fontWeight: 500 }}
                />

              </Stack>
            </Paper>
          )}
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            justifyContent: "center",
            pb: 3,
            gap: 1,
          }}
        >
          {ventaPayload?.pagada && ventaPayload?.id_venta && ventaPayload?.pref_factura !== "nunca" && (
            <Button
              variant="outlined"
              startIcon={<ReceiptLongIcon />}
              onClick={() => { const id = ventaPayload.id_venta; setOpenVentaRegistrada(false); imprimirFacturas([id]); }}
              sx={{ borderRadius: 3, px: 3, py: 1, textTransform: "none", fontWeight: "bold" }}
            >
              {ventaPayload.pref_factura === "siempre" ? "Reimprimir factura" : "Imprimir factura"}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => setOpenVentaRegistrada(false)}
            sx={{
              borderRadius: 3,
              px: 5,
              py: 1,
              textTransform: "none",
              fontWeight: "bold",
              background: "linear-gradient(90deg,#16a34a,#22c55e)",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
            }}
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>

      {/* 👇 AQUÍ VA LA ANIMACIÓN */}
      {animItem && (
        <Box
          component="img"
          src={animItem.img}
          sx={{
            position: "fixed",
            left: animItem.start.left,
            top: animItem.start.top,
            width: 60,
            height: 60,
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 2000,
            animation: "flyToCart 0.7s ease-in-out forwards",
            "@keyframes flyToCart": {
              "0%": {
                transform: "scale(1)",
                opacity: 1,
              },
              "100%": {
                transform: "translate(-600px, 500px) scale(0.2)",
                opacity: 0,
              },
            },
          }}
        />
      )}

      {/* === PEDIDOS WEB (panel de caja) === */}
      <Dialog open={openPedidos} onClose={() => setOpenPedidos(false)} fullScreen={isMobile} fullWidth maxWidth="xl"
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, bgcolor: "#F8FAFC" } }}>
        <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
          <PanelPedidosCaja datos={pedidosWeb} cajaAbierta={cajaAbierta} onAviso={(m) => toastr.success(m)} onCerrar={() => setOpenPedidos(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={openComandas} onClose={() => setOpenComandas(false)} fullScreen={isMobile} fullWidth maxWidth="md"
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, bgcolor: "#F8FAFC" } }}>
        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          <PanelComandasCaja comandas={comandasMeseros.comandas} error={comandasMeseros.error} recarga={comandasMeseros.recarga}
            onCerrar={() => setOpenComandas(false)}
            onCobrar={(c) => { setOpenComandas(false); setMesaSeleccionada(null); closeCategoria(); setAbrirMesaId(c.id_mesa); }} />
        </DialogContent>
      </Dialog>
      <TiqueterasCajaDialog open={openTiqueteras} onClose={() => setOpenTiqueteras(false)} onVendida={checkCaja} />
      <PagoTiqueteraDialog
        open={!!pagoTiquetera}
        venta={pagoTiquetera?.venta}
        busquedaInicial={pagoTiquetera?.busqueda}
        onClose={() => setPagoTiquetera(null)}
        onExito={pagadoConTiquetera}
      />
    </Box>
  );
};

export default CajeroDashboard;
