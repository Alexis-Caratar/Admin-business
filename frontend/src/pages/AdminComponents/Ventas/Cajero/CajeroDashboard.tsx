/* ---------- /src/pages/CajeroDashboard.tsx ---------- */
import React, { useEffect, useState } from "react";
import {  Box, Typography, Stack, Chip, Button, Drawer, Fab, useTheme, useMediaQuery, Badge, Dialog, DialogContent, Paper, DialogActions } from "@mui/material";
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
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [openVentaRegistrada, setOpenVentaRegistrada] = useState(false);
  const [ventaPayload, setVentaPayload] = useState<any>(null);
  const [showStats, setShowStats] = useState(false); // por defecto oculto
  const idUsuario = localStorage.getItem("id_usuario");
  const id_negocio = localStorage.getItem("id_negocio");
  const [openVentasDetalles, setOpenVentasDetalles] = useState(false);
  const [animItem, setAnimItem] = useState<AnimItem | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);

  const abrirCarrito = () => {
    setOpenCarrito(true);
  };
  const cerrarCarrito = () => setOpenCarrito(false);

  useEffect(() => {
  const ws = new WebSocket(import.meta.env.VITE_WS_URL);
  ws.onopen = () => {
    ws.send(JSON.stringify({
      tipo: "suscribirse_mesas",
      id_negocio
    }));

    ws.send(JSON.stringify({
      tipo: "suscribirse_caja",
      id_usuario: idUsuario
    }));
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    // MESAS
    if (msg.tipo === "mesas") {
//      console.log("Mesas actualizadas", msg.mesas);
      setMesas(msg.mesas);
    }
    // CAJA
    if (msg.tipo === "actualizar_caja") {
  // console.log("caja actualizadas", msg.caja);
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
 // ws.onerror = (err) => console.error("WS error", err);
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
    async function load() {
      try {
        setLoadingCategorias(true);
        const res = await apiListarProductos(id_negocio);
        let data: any[] = [];
        if (res && res.data) {
          if (Array.isArray(res.data)) data = res.data;
          else if (res.data.ok && res.data.productos) data = res.data.productos;
          else if (res.data.productos) data = res.data.productos;
        }
        if (mounted) setCategorias(data || []);
      } catch (err) {
        console.error("Error cargando categorías y productos:", err);
      } finally {
        if (mounted) setLoadingCategorias(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);
  const getPrecio = (p: Partial<ProductoCajero>) => Number(p.precio_venta ?? 0);
  const addCart = (p: ProductoCajero) => {
    const precio = getPrecio(p);
    setCarrito((prev) => {
      const existe = prev.find((x) => x.id === p.id);
      if (existe) {
        return prev.map((x) =>
          x.id === p.id ? { ...x, cantidad: x.cantidad + 1 } : x
        );
      }
      return [...prev, { ...p, cantidad: 1, precio_venta: precio }];
    });
  };

  const sumarCantidad = (id: number) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
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
    const subtotal = carrito.reduce((acc, v) => acc + v.precio_venta * v.cantidad, 0);
    const descuento = 0;
    const impuesto = 0;
    const total = subtotal - descuento + impuesto;

    const payload = {
      idUsuario:idUsuario,
      id_negocio: id_negocio,
      id_cliente: cliente ? cliente : 25,
      id_caja: idCaja,
      id_mesa: mesaSeleccionada?.id,
      fecha: new Date().toISOString(),
      subtotal,
      descuento,
      descuento_porcentaje: 0,
      impuesto,
      total,
      estado: "PENDIENTE",
      nota: datos_adicionales.nota,
      metodo_pago: datos_adicionales.metodo_pago,
      monto_pagado: total,
      monto_recibido: Number(datos_adicionales.monto_recibido || 0),
      cambio: datos_adicionales.cambio,
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

    try {
      const { data } = await finalizar_venta(payload);
      if (data.ok) {
        setVentas((prev) => [...prev, { ...payload }]);
        setCarrito([]);
        setMesaSeleccionada(null);
        checkCaja();
        setVentaPayload(payload);
        closeCategoria();
        setOpenVentaRegistrada(true);
      }
    } catch (err) {
      console.error("Error finalizando venta:", err);
    }
  };
  //aperturar la caja 
const abrirCajaReal = async () => {
  try {
    const { data } = await apiAbrirCaja({
      id_usuario: idUsuario,
      monto_inicial: Number(montoApertura)
    });

    if (data?.ok) {

      // limpiar estados anteriores
      setVentas([]);
      setCarrito([]);
      setMesaSeleccionada(null);
      setArqueoInfo(null);

      // nueva caja
      setCajaAbierta(true);
      setCaja(data.result);
      setIdCaja(data.result.id);

      setModalApertura(false);

      cargarArqueo(data.result.id);
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
    const { dinero_esperado, dinero_contado, diferencia, base_caja,venta_libre, observacion } = cierreData;

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

      
      const animarAlCarrito = (img: string, rect: DOMRect) => {
  setAnimItem({ img, start: rect });

  setTimeout(() => {
    setAnimItem(null);
  }, 700);
};

  return (
    
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", p: 0, ml: 0 }}>

    <Box
  onClick={() => setShowStats(prev => !prev)}
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 4,
    boxShadow: "0px 4px 20px rgba(0,0,0,0.12)",
    p: 1.5,
    backgroundColor: cajaAbierta ? "success.main" : "error.main",
    color: "white",
    cursor: "pointer",
    userSelect: "none",
    transition: "all 0.25s ease",

    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0px 8px 25px rgba(0,0,0,0.2)"
    }
  }}
>
  {/* Lado izquierdo */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center"
    }}
  >
    <PersonIcon sx={{ mr: 1 }} />
    <Typography variant="h6" fontWeight="bold">
      Perfil del Cajero
    </Typography>
  </Box>

  {/* Lado derecho */}
  {showStats ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
        onCerrar={() =>{ setModalCierre(true)
             cargarArqueo();
        }
        }
      />
 )}

      {/* === CONTENIDO PRINCIPAL === */}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* === Categorías === */}
        <Box
          sx={{
            width: { xs: "35%", sm: "35%", md: "30%" },
            borderRight: { xs: "none", md: "1px solid #e0e0e0" },
            pr: { xs: 0, md: 1 },
            mb: { xs: 2, md: 0 }, // margen inferior en móvil
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
        {/* === MESAS === */}
        <Box
          sx={{
            width: { xs: "100%", sm: "100%", md: "80%" }, // 🔥 MÓVIL 100% - ESCRITORIO 50%
            px: 1,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            maxHeight: "100%",
          }}
        >
          {/* MESAS */}
          <Box sx={{ flex: 1 }}>
            <Mesas
              idUsuario={Number(idUsuario) || 0}
             id_negocio={Number(id_negocio) || 0}
              mesas={mesas}
              mesaSeleccionada={mesaSeleccionada}
              onSelect={(m) =>
                setMesaSeleccionada((prev) => (prev?.id === m?.id ? null : m))
              }
            />
          </Box>
        </Box>

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
          onFinalizar={(c, p) => {finalizarVenta(c, p);setOpenCarrito(false);}}
          mesaSeleccionada={mesaSeleccionada}
          onClearMesa={clearMesa} 
          categorias={categorias}
          onOpenCategoria={(categoria) => {setOpenCarrito(false);openCategoria(categoria);}}
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
          onFinalizar={(c, p) => {finalizarVenta(c, p);setOpenCarrito(false);}}
          mesaSeleccionada={mesaSeleccionada}
          onClearMesa={clearMesa} 
          categorias={categorias}
          onOpenCategoria={(categoria) => {setOpenCarrito(false);openCategoria(categoria);}}
          loadingCategorias={loadingCategorias}
          clienteSeleccionado={clienteSeleccionado}
          setClienteSeleccionado={setClienteSeleccionado}
           />
          )}
        </Box>
      </Box>

      {/* === MODALES === */}
      <AperturaCajaModal open={modalApertura} onClose={() => setModalApertura(false)} monto={montoApertura} setMonto={setMontoApertura} onAbrir={abrirCajaReal} />
      <ArqueoCajaModal open={modalArqueo} onClose={() => setModalArqueo(false)} arqueoInfo={arqueoInfo} />
      <CierreCajaModal open={modalCierre} onClose={() => setModalCierre(false)} arqueoInfo={arqueoInfo} formatCOP={formatCOP} onCerrar={cerrarCajaReal}/>
      <ProductosCategoriaModal open={modalProductosOpen} onClose={closeCategoria} categoria={categoriaSeleccionada} categorias={categorias} onAgregar={addCart} animarAlCarrito={animarAlCarrito}/>
      <Egresos open={openEgresos} onClose={() => setOpenEgresos(false)}  idUsuario={idUsuario != null ? Number(idUsuario) : null} id_negocio={id_negocio != null ? Number(id_negocio) : null}  id_caja={idCaja} />
      <VentasDetalles open={openVentasDetalles} onClose={() => setOpenVentasDetalles(false)} id_caja={idCaja}/>
     
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
      pb: 3
    }}
  >
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
    </Box>
  );
};

export default CajeroDashboard;
